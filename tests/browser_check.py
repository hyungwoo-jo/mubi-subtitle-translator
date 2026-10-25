"""Real Chromium checks with synthetic captions and a fake translation backend."""
import json
import io
import base64
from pathlib import Path
import shutil
import tempfile
import wave

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
TMP = ROOT / "tmp"
TMP.mkdir(exist_ok=True)
audio = io.BytesIO()
with wave.open(audio, 'wb') as wav:
    wav.setnchannels(1)
    wav.setsampwidth(2)
    wav.setframerate(8000)
    wav.writeframes(bytes(8000 * 2 * 10))

with tempfile.TemporaryDirectory(dir=TMP, prefix="browser-") as work:
    folder = Path(work)
    extension = folder / "extension"
    shutil.copytree(ROOT / "extension", extension)
    manifest = json.loads((extension / "manifest.json").read_text())
    manifest["host_permissions"] = ["http://127.0.0.1/*"]
    (extension / "manifest.json").write_text(json.dumps(manifest))
    with sync_playwright() as p:
        context = p.chromium.launch_persistent_context(
            str(folder / "profile"), headless=False,
            args=['--headless=new',f"--disable-extensions-except={extension}", f"--load-extension={extension}"])
        worker = context.service_workers[0] if context.service_workers else context.wait_for_event("serviceworker")
        extension_id = worker.url.split('/')[2]
        worker.evaluate("""() => {
            chrome.storage.local.set({uiLanguage:'ko',dataConsent:true,settings:{provider:'codex'}});
            globalThis.translationCalls=0;
            chrome.runtime.sendNativeMessage=async (_name, message)=> {
                globalThis.translationCalls++;
                return {ok:true, items:message.items.map(item=>({id:item.id,text:'번역: '+item.text}))};
            };
        }""")
        page = context.new_page()
        page.on('pageerror', lambda error: print('Page error:', error))
        worker.on('console', lambda message: print('Worker:', message.text))
        page.route("**/video", lambda route: route.fulfill(
            content_type="text/html", body='<html><body><video muted src="data:audio/wav;base64,'+base64.b64encode(audio.getvalue()).decode()+'" style="width:640px;height:360px"></video></body></html>'))
        page.goto("http://127.0.0.1:18947/video")
        page.evaluate("""async () => {
            const v=document.querySelector('video');
            v.playbackRate=0.1;
            v.currentTime=1;
            await v.play();
            const t=v.addTextTrack('subtitles','English','en');
            t.addCue(new VTTCue(0,3,'Hello world'));
            t.addCue(new VTTCue(3,7,'Second line'));
        }""")
        worker.evaluate("""async ({tabId})=> {
            await chrome.scripting.registerContentScripts([
                {id:'test-main',matches:['http://127.0.0.1/*'],js:['hook.js'],world:'MAIN',runAt:'document_start'},
                {id:'test-content',matches:['http://127.0.0.1/*'],js:['i18n.js','core.js','content.js'],runAt:'document_start'}
            ]);
            await chrome.scripting.executeScript({target:{tabId},files:['hook.js'],world:'MAIN'});
            await chrome.scripting.executeScript({target:{tabId},files:['i18n.js','core.js','content.js']});
        }""", {"tabId": worker.evaluate("async()=> (await chrome.tabs.query({url:'http://127.0.0.1/*'}))[0].id")})
        # Accessibility snapshots verify the text presented to the viewer.
        def visible_text():
            return json.dumps(page.accessibility.snapshot(), ensure_ascii=False)
        page.wait_for_timeout(1200)
        assert '번역: Hello world' in visible_text(), (visible_text(),worker.evaluate('translationCalls'),worker.evaluate('chrome.storage.local.get(null)'))
        assert worker.evaluate('translationCalls') == 1
        page.evaluate("document.querySelector('video').currentTime=4")
        page.wait_for_timeout(500)
        assert '번역: Second line' in visible_text(), (visible_text(),page.evaluate("document.querySelector('video').currentTime"))
        page.evaluate("document.querySelector('video').currentTime=1")
        page.wait_for_timeout(500)
        assert '번역: Hello world' in visible_text()
        assert worker.evaluate('translationCalls') == 1
        worker.evaluate("chrome.storage.local.set({settings:{language:'日本語',model:'gpt-6-luna',provider:'codex'}})")
        page.wait_for_timeout(900)
        assert worker.evaluate('translationCalls') == 2
        # A duplicate cue is dropped by normalization; the track must not be re-added on every poll.
        rebuilds = page.evaluate("""async () => {
            document.querySelector('video').textTracks[0].addCue(new VTTCue(0,3,'Hello world'));
            await new Promise(resolve=>setTimeout(resolve,400));
            const select=document.getElementById('hw-subtitle-overlay').shadowRoot.querySelector('select');
            let count=0;
            const observer=new MutationObserver(()=>count++);
            observer.observe(select,{childList:true});
            await new Promise(resolve=>setTimeout(resolve,1000));
            observer.disconnect();
            return count;
        }""")
        assert rebuilds == 0, rebuilds
        # Real DOMParser verifies TTML namespaces, ticks, line breaks and timing.
        tab_id = worker.evaluate("async()=> (await chrome.tabs.query({url:'http://127.0.0.1/*'}))[0].id")
        parsed = worker.evaluate("""async (tabId)=> {
            const [result]=await chrome.scripting.executeScript({target:{tabId},func:()=>HWSubs.parse(
                '<tt xmlns="http://www.w3.org/ns/ttml" xmlns:ttp="http://www.w3.org/ns/ttml#parameter" ttp:tickRate="1000"><body><div><p begin="1000t" end="3500t">Hello<br/>world</p></div></body></tt>')});
            return result.result;
        }""", tab_id)
        assert parsed == [{"start": 1, "end": 3.5, "text": "Hello\nworld"}], parsed
        options = context.new_page()
        options.goto(f"chrome-extension://{extension_id}/options.html")
        assert options.locator('#model').input_value() == 'gpt-6-luna'
        assert options.locator('#extension-id').inner_text() == extension_id
        options.locator('#provider').select_option('codex')
        options.locator('#test').click()
        options.wait_for_function("document.querySelector('#status').textContent.includes('진단:')")
        assert '진단:' in options.locator('#status').inner_text()
        worker.evaluate("""async(tabId)=>chrome.tabs.sendMessage(tabId,{type:'toggle',enabled:false})""", tab_id)
        page.wait_for_timeout(300)
        assert '번역: Hello world' not in visible_text()
        network = context.new_page()
        video_html = '<html><body><video muted src="data:audio/wav;base64,'+base64.b64encode(audio.getvalue()).decode()+'" style="width:640px;height:360px"></video></body></html>'
        network.route('**/network', lambda route: route.fulfill(content_type='text/html',body=video_html))
        network.route('**/captions.vtt', lambda route: route.fulfill(content_type='text/vtt',body='WEBVTT\n\n00:00.000 --> 00:09.000\nNetwork caption'))
        network.goto('http://127.0.0.1:18947/network')
        network.evaluate("""async()=> {
            const v=document.querySelector('video');v.playbackRate=0.1;await v.play();
            await fetch('/captions.vtt');
        }""")
        network.wait_for_timeout(1200)
        assert '번역: Network caption' in json.dumps(network.accessibility.snapshot(),ensure_ascii=False)
        dom = context.new_page()
        dom.route('**/dom', lambda route: route.fulfill(content_type='text/html',body=video_html+'<div class="ytp-caption-segment">DOM caption</div>'))
        dom.goto('http://127.0.0.1:18947/dom')
        dom.evaluate("async()=>{const v=document.querySelector('video');v.playbackRate=0.1;await v.play();}")
        dom.wait_for_timeout(1800)
        assert '번역: DOM caption' in json.dumps(dom.accessibility.snapshot(),ensure_ascii=False)
        # A delayed DOM result must not replace the current source cue.
        worker.evaluate("""()=> {
            chrome.runtime.sendNativeMessage=async (_name,message)=> {
                globalThis.translationCalls++;
                await new Promise(resolve=>setTimeout(resolve,1200));
                return {ok:true,items:message.items.map(item=>({id:item.id,text:'번역: '+item.text}))};
            };
        }""")
        dom.evaluate("document.querySelector('.ytp-caption-segment').textContent='Delayed first caption'")
        dom.wait_for_timeout(1100)
        dom.evaluate("document.querySelector('.ytp-caption-segment').textContent='Next caption'")
        dom.wait_for_timeout(1400)
        assert '번역: Delayed first caption' not in json.dumps(dom.accessibility.snapshot(),ensure_ascii=False)
        # Captions unknown to the adapter can be selected by clicking their text.
        custom=context.new_page()
        custom.route('**/custom',lambda route:route.fulfill(content_type='text/html',body=video_html+'<div class="unknown-caption" style="position:fixed;top:20px;left:20px">Selected subtitle</div>'))
        custom.goto('http://127.0.0.1:18947/custom')
        custom.evaluate("async()=>{const v=document.querySelector('video');v.playbackRate=0.1;await v.play();}")
        custom.wait_for_timeout(500)
        # Unknown player captions can be picked through the overlay controls.
        custom_id=worker.evaluate("async()=> (await chrome.tabs.query({url:'http://127.0.0.1/*'})).find(t=>t.url.endsWith('/custom')).id")
        assert custom.locator('#hw-subtitle-overlay').evaluate('(e)=>e.hidden')
        worker.evaluate("async(id)=>chrome.tabs.sendMessage(id,{type:'controls'})",custom_id)
        custom.get_by_role('button',name='자막 위치 선택').click()
        custom.locator('.unknown-caption').click()
        custom.wait_for_timeout(2600)
        assert '번역: Selected subtitle' in json.dumps(custom.accessibility.snapshot(),ensure_ascii=False)
        # A full timed track discovered after visible captions wins automatically.
        dom.route('**/full-captions.vtt',lambda route:route.fulfill(content_type='text/vtt',body='WEBVTT\n\n00:00.000 --> 00:09.000\nFull track caption'))
        dom.evaluate("fetch('/full-captions.vtt')")
        dom.wait_for_timeout(3000)
        assert '번역: Full track caption' in json.dumps(dom.accessibility.snapshot(),ensure_ascii=False)
        dom_tab=worker.evaluate("async()=> (await chrome.tabs.query({url:'http://127.0.0.1/*'})).find(t=>t.url.endsWith('/dom')).id")
        snapshot=worker.evaluate("""async(tabId)=>{
            const [result]=await chrome.scripting.executeScript({target:{tabId},func:()=>globalThis.__hwSubsDiagnostics()});
            return result.result;
        }""",dom_tab)
        assert snapshot['videos'] and snapshot['candidates']
        assert 'Full track caption' not in json.dumps(snapshot)
        assert 'Next caption' not in json.dumps(snapshot)
        # Reproduce MUBI: CastLabs HTML cues, zero native tracks, and a stale clock selector.
        worker.evaluate("""async()=>{
            await chrome.storage.local.set({siteSelectors:{'127.0.0.1':'.wrong-clock'}});
            globalThis.requestedTexts=[];
            chrome.runtime.sendNativeMessage=async(_name,message)=>{
                globalThis.requestedTexts.push(...message.items.map(item=>item.text));
                return {ok:true,items:message.items.map(item=>({id:item.id,text:'번역: '+item.text}))};
            };
        }""")
        castlabs=context.new_page()
        cast_html=video_html.replace('<video muted','<div class="clpp-container"><video muted').replace('</video>','</video><div class="clpp-text-container"><span class="clpp-text-cue">Merhaba, altyazi denemesi.</span></div></div>')
        cast_html+='<div class="wrong-clock">1:21:25</div><div data-testid="subtitles" role="menu">Audio Turkish English</div>'
        castlabs.route('**/castlabs',lambda route:route.fulfill(content_type='text/html',body=cast_html))
        castlabs.goto('http://127.0.0.1:18947/castlabs')
        castlabs.evaluate("async()=>{const v=document.querySelector('video');v.playbackRate=0.1;await v.play();}")
        castlabs.wait_for_timeout(1800)
        assert '번역: Merhaba, altyazi denemesi.' in json.dumps(castlabs.accessibility.snapshot(),ensure_ascii=False)
        assert worker.evaluate('requestedTexts')==['Merhaba, altyazi denemesi.']
        assert '127.0.0.1' not in worker.evaluate("async()=> (await chrome.storage.local.get('siteSelectors')).siteSelectors")
        castlabs.evaluate("document.querySelector('.clpp-text-container').replaceChildren()")
        for clock in ('1:21:26','1:21:27','1:21:28'):
            castlabs.locator('.wrong-clock').evaluate('(el,text)=>el.textContent=text',clock)
            castlabs.wait_for_timeout(400)
        assert worker.evaluate('requestedTexts')==['Merhaba, altyazi denemesi.']
        assert castlabs.locator('#hw-subtitle-overlay').evaluate('(e)=>e.hidden')
        cast_id=worker.evaluate("async()=> (await chrome.tabs.query({url:'http://127.0.0.1/*'})).find(t=>t.url.endsWith('/castlabs')).id")
        worker.evaluate("async(id)=>chrome.tabs.sendMessage(id,{type:'controls'})",cast_id)
        castlabs.get_by_role('button',name='자막 위치 선택').click()
        castlabs.locator('.wrong-clock').click()
        castlabs.wait_for_timeout(400)
        assert '127.0.0.1' not in worker.evaluate("async()=> (await chrome.storage.local.get('siteSelectors')).siteSelectors")
        # Recover a complete subtitle loaded before the extension hook was attached.
        worker.evaluate("chrome.scripting.unregisterContentScripts({ids:['test-main','test-content']})")
        recovered=context.new_page()
        recovered.on('pageerror',lambda error:print('Recovery page error:',error))
        recovered.route('**/recover',lambda route:route.fulfill(content_type='text/html',body=video_html))
        recovered.route('**/prefetched.srt',lambda route:route.fulfill(content_type='text/plain',body='1\n00:00:00,000 --> 00:00:03,000\nRecovered whole track\n\n2\n00:00:03,000 --> 00:00:09,000\nUpcoming caption'))
        recovered.goto('http://127.0.0.1:18947/recover')
        recovered.evaluate("async()=>{document.querySelector('video').currentTime=1;await (await fetch('/prefetched.srt')).text();}")
        recovered_id=worker.evaluate("async()=> (await chrome.tabs.query({url:'http://127.0.0.1/*'})).find(t=>t.url.endsWith('/recover')).id")
        worker.evaluate("""async(tabId)=>{
            await chrome.scripting.executeScript({target:{tabId},files:['hook.js'],world:'MAIN'});
            await chrome.scripting.executeScript({target:{tabId},files:['i18n.js','core.js','content.js']});
        }""",recovered_id)
        recovered.wait_for_timeout(1600)
        recovered_snapshot=worker.evaluate("""async(tabId)=>{
            const [r]=await chrome.scripting.executeScript({target:{tabId},func:()=>globalThis.__hwSubsDiagnostics()});return r.result;
        }""",recovered_id)
        assert '번역: Recovered whole track' in json.dumps(recovered.accessibility.snapshot(),ensure_ascii=False),(recovered.accessibility.snapshot(),recovered_snapshot,worker.evaluate('requestedTexts'))
        assert recovered_snapshot['state']['mode']=='network'
        assert recovered_snapshot['capture']['recoveryAttempts']>=1
        assert recovered.evaluate("document.querySelector('video').paused")
        # Binary XHR responses can still contain an ordinary SRT file.
        binary=context.new_page()
        binary.route('**/binary',lambda route:route.fulfill(content_type='text/html',body=video_html))
        binary.route('**/captions.bin',lambda route:route.fulfill(content_type='application/octet-stream',body='1\n00:00:00,000 --> 00:00:09,000\nBinary subtitle response'))
        binary.goto('http://127.0.0.1:18947/binary')
        binary_id=worker.evaluate("async()=> (await chrome.tabs.query({url:'http://127.0.0.1/*'})).find(t=>t.url.endsWith('/binary')).id")
        worker.evaluate("""async(tabId)=>{
            await chrome.scripting.executeScript({target:{tabId},files:['hook.js'],world:'MAIN'});
            await chrome.scripting.executeScript({target:{tabId},files:['i18n.js','core.js','content.js']});
        }""",binary_id)
        binary.evaluate("""()=>new Promise((resolve,reject)=>{
            const xhr=new XMLHttpRequest();xhr.open('GET','/captions.bin');xhr.responseType='arraybuffer';
            xhr.onload=()=>resolve();xhr.onerror=reject;xhr.send();
        })""")
        binary.wait_for_timeout(1200)
        assert '번역: Binary subtitle response' in json.dumps(binary.accessibility.snapshot(),ensure_ascii=False)
        # Playback JSON can point at an opaque subtitle URL without an extension.
        discovery=context.new_page()
        discovery.route('**/discovery',lambda route:route.fulfill(content_type='text/html',body=video_html))
        discovery.route('**/playback-info',lambda route:route.fulfill(content_type='application/json',body=json.dumps({'text_track_urls':[{'url':'/opaque-track','language':'en'}]})))
        discovery.route('**/opaque-track',lambda route:route.fulfill(content_type='application/octet-stream',body='WEBVTT\n\n00:00.000 --> 00:09.000\nDiscovered from playback JSON'))
        discovery.goto('http://127.0.0.1:18947/discovery')
        discovery_id=worker.evaluate("async()=> (await chrome.tabs.query({url:'http://127.0.0.1/*'})).find(t=>t.url.endsWith('/discovery')).id")
        worker.evaluate("""async(tabId)=>{
            await chrome.scripting.executeScript({target:{tabId},files:['hook.js'],world:'MAIN'});
            await chrome.scripting.executeScript({target:{tabId},files:['i18n.js','core.js','content.js']});
        }""",discovery_id)
        discovery.evaluate("fetch('/playback-info')")
        discovery.wait_for_timeout(1200)
        assert '번역: Discovered from playback JSON' in json.dumps(discovery.accessibility.snapshot(),ensure_ascii=False)
        # DASH sidecar BaseURLs resolve relative to their manifest and Period.
        discovery.route('**/manifest.mpd',lambda route:route.fulfill(content_type='application/dash+xml',body='<MPD><Period><BaseURL>/text/</BaseURL><AdaptationSet mimeType="text/vtt"><Representation><BaseURL>track</BaseURL></Representation></AdaptationSet></Period></MPD>'))
        discovery.route('**/text/track',lambda route:route.fulfill(content_type='text/plain',body='WEBVTT\n\n00:00.000 --> 00:09.000\nDASH sidecar caption'))
        discovery.evaluate("fetch('/manifest.mpd')")
        discovery.wait_for_timeout(900)
        worker.evaluate("async(id)=>chrome.tabs.sendMessage(id,{type:'controls'})",discovery_id)
        discovery.locator('select').select_option(label='수신 자막 2 (1개)')
        discovery.wait_for_timeout(900)
        assert '번역: DASH sidecar caption' in json.dumps(discovery.accessibility.snapshot(),ensure_ascii=False)
        # SegmentTimeline TTML chunks share one track and keep source times.
        segment=context.new_page()
        segment.route('**/segmented',lambda route:route.fulfill(content_type='text/html',body=video_html))
        segment.route('**/segmented.mpd',lambda route:route.fulfill(content_type='application/dash+xml',body='<MPD><Period><AdaptationSet id="subs" mimeType="application/ttml+xml"><SegmentTemplate timescale="1" media="/sub-$Number$.m4s"><SegmentTimeline><S t="0" d="3" r="2"/></SegmentTimeline></SegmentTemplate><Representation id="en"/></AdaptationSet></Period></MPD>'))
        def segment_response(route):
            number=int(route.request.url.rsplit('/sub-',1)[1].split('.')[0])
            # A TTML payload can be embedded in a binary media container.
            body=b'\x00\x00\x00\x08mdat'+f'<tt><body><div><p begin="0s" end="3s">Segment {number}</p></div></body></tt>'.encode()
            route.fulfill(content_type='application/mp4',body=body)
        segment.route('**/sub-*.m4s',segment_response)
        segment.goto('http://127.0.0.1:18947/segmented')
        segment_id=worker.evaluate("async()=> (await chrome.tabs.query({url:'http://127.0.0.1/*'})).find(t=>t.url.endsWith('/segmented')).id")
        worker.evaluate("""async(tabId)=>{
            await chrome.scripting.executeScript({target:{tabId},files:['hook.js'],world:'MAIN'});
            await chrome.scripting.executeScript({target:{tabId},files:['i18n.js','core.js','content.js']});
        }""",segment_id)
        segment.evaluate("fetch('/segmented.mpd')")
        segment.wait_for_timeout(1500)
        assert '번역: Segment 1' in json.dumps(segment.accessibility.snapshot(),ensure_ascii=False)
        segment.evaluate("document.querySelector('video').currentTime=4")
        segment.wait_for_timeout(500)
        assert '번역: Segment 2' in json.dumps(segment.accessibility.snapshot(),ensure_ascii=False)
        assert segment.locator('select option').count()==2
        # Identical source cues survive reload even when surrounding context changes.
        before=worker.evaluate('requestedTexts.length')
        reused=options.evaluate("""async()=>chrome.runtime.sendMessage({type:'translate',texts:['DASH sidecar caption'],context:'Changed context',scope:'http://127.0.0.1:18947/discovery|network:http://127.0.0.1:18947/text/track'})""")
        assert reused['ok'] and reused['cached'],reused
        assert worker.evaluate('requestedTexts.length')==before
        popup=context.new_page()
        popup.goto(f"chrome-extension://{extension_id}/popup.html")
        assert 'MUBI' in popup.locator('h1').inner_text()
        assert not popup.locator('details').evaluate('(e)=>e.open')
        popup.wait_for_function("document.querySelector('.brand img').naturalWidth>0")
        assert not popup.locator('#usage').is_visible()
        # Re-injection after an extension reload replaces the old overlay and disables its renderer.
        worker.evaluate("""async(tabId)=>{
            await chrome.scripting.executeScript({target:{tabId},func:()=>{globalThis.__hwSubsContent=false;}});
            await chrome.scripting.executeScript({target:{tabId},files:['content.js']});
        }""",binary_id)
        binary.wait_for_timeout(500)
        assert binary.locator('[id="hw-subtitle-overlay"]').count()==1
        # Two overlapping cues with the same dialogue must produce only one translated line.
        binary.evaluate("""()=>{
            const t=document.querySelector('video').addTextTrack('subtitles','Repeated source','en');
            t.mode='showing';t.addCue(new VTTCue(0,8,'Repeated overlap'));t.addCue(new VTTCue(.1,9,'Repeated overlap'));
        }""")
        binary.wait_for_timeout(1000)
        overlay=binary.locator('#hw-subtitle-overlay').locator('.translation')
        assert overlay.inner_text()=='번역: Repeated overlap',overlay.inner_text()
        binary.evaluate("""()=>{const native=document.createElement('div');native.className='ytp-caption-segment';native.textContent='번역: Repeated overlap';document.body.append(native);}""")
        binary.wait_for_timeout(400)
        assert binary.locator('#hw-subtitle-overlay').evaluate('(e)=>e.hidden')
        binary.locator('.ytp-caption-segment').evaluate('(e)=>e.remove()')
        binary.wait_for_timeout(300)
        assert overlay.inner_text()=='번역: Repeated overlap'
        assert binary.locator('[id="hw-subtitle-overlay"]').count()==1
        locales=json.loads((ROOT/'scripts/locale-metadata.json').read_text())
        assert options.locator('#uiLanguage option').count()==16
        connection=context.new_page()
        connection.goto(f'chrome-extension://{extension_id}/connect.html')
        for locale in locales:
            catalog=json.loads((ROOT/'extension/_locales'/locale['folder']/'messages.json').read_text())
            options.locator('#uiLanguage').select_option(locale['id'])
            popup.wait_for_function("expected=>document.querySelector('#enable').textContent===expected",arg=catalog['start']['message'])
            connection.wait_for_function("expected=>document.querySelector('#confirm').textContent===expected",arg=catalog['confirmPlan']['message'])
            assert connection.locator('html').get_attribute('dir')==('rtl' if locale['id']=='ar' else 'ltr')
            assert page.locator('html').get_attribute('dir')!='rtl'
        options.locator('#uiLanguage').select_option('en')
        popup.wait_for_function("document.querySelector('#enable').textContent==='Start on this site'")
        assert popup.locator('#consent').is_checked()
        preview=ROOT/'out'/'screenshots'
        preview.mkdir(parents=True,exist_ok=True)
        popup.set_viewport_size({'width':420,'height':760})
        popup.evaluate("""()=>{
            chrome.tabs.query=async()=>[{id:1,url:'https://mubi.com/en/films/demo/player'}];
            chrome.tabs.sendMessage=async()=>({video:true,active:true,mode:'timed',bufferSeconds:84,cues:1200,translated:80});
            refreshPlayback();
        }""")
        popup.wait_for_function("document.querySelector('#playback').textContent.includes('84')")
        popup.bring_to_front()
        popup.screenshot(path=str(preview/'popup-en.png'))
        context.close()
        print('Chromium: captions, timing, diagnostics, CastLabs, recovered tracks, paused prefetch and binary XHR passed.')
