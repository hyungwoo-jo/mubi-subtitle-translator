(() => {
  'use strict';
  if(globalThis.__hwSubsContent) return;
  globalThis.__hwSubsContent=true;
  const C=globalThis.HWSubs;
  const t=globalThis.CueI18N.t;
  const tracks=new Map();
  const translations=new Map();
  let selected='', video=null, enabled=true, busy=false, retryAt=0, epoch=0, lastPage=location.href;
  let settings={language:'English',showOriginal:false,fontSize:24,offset:0};
  let domText='', domStart=0, pickedSelector='', manualTrack=false, domSource='none';
  let domChangedAt=0;
  let diagnosticSent=false, ticks=0, controlsOpen=false, pollTimer=null;
  let timedDiagnosticSent=false;
  let captureState={};
  function diagnosticSnapshot(){
    const rect=element=>{const r=element.getBoundingClientRect();return {x:Math.round(r.x),y:Math.round(r.y),width:Math.round(r.width),height:Math.round(r.height)};};
    function describe(element){
      const css=getComputedStyle(element);
      return {tag:element.tagName,id:(element.id||'').slice(0,120),classes:[...element.classList].slice(0,8),
        testId:(element.getAttribute('data-testid')||'').slice(0,120),rect:rect(element),display:css.display,
        visibility:css.visibility,opacity:css.opacity,textLength:(element.textContent||'').length,
        directTextLength:[...element.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE).reduce((n,t)=>n+(t.textContent||'').trim().length,0),
        children:element.children.length,shadowRoot:!!element.shadowRoot};
    }
    const videos=[...document.querySelectorAll('video')];
    const candidates=[...document.querySelectorAll('[class*="subtitle" i],[class*="caption" i],[class*="clpp-text"],[data-testid*="subtitle" i],[data-testid*="caption" i],canvas')]
      .filter(e=>e!==host&&!host.contains(e)).slice(0,100).map(describe);
    const tree=[];
    if(video){
      let parent=video;
      for(let i=0;i<3&&parent.parentElement&&parent.parentElement!==document.body;i++) parent=parent.parentElement;
      const walk=(element,depth)=>{
        if(tree.length>=150||depth>5||element===host) return;
        tree.push({...describe(element),depth});
        for(const child of element.children) walk(child,depth+1);
      };
      walk(parent,0);
    }
    return {hostname:location.hostname,version:chrome.runtime.getManifest().version,
      state:{enabled,mode:selected.split(':')[0],domSource,pickedSelector,timedTracks:tracks.size,domTextLength:domText.length,translatedTexts:translations.size,busy,controlsOpen,bufferSeconds:bufferSeconds(),selectedCues:currentCues().length,overlayInstances:document.querySelectorAll('[id="hw-subtitle-overlay"]').length,activeCues:video?C.active(currentCues(),video.currentTime-Number(settings.offset||0)).length:0,uniqueActiveTranslations:video?new Set(C.active(currentCues(),video.currentTime-Number(settings.offset||0)).map(c=>translations.get(c.text)).filter(Boolean)).size:0},
      capture:captureState,
      videos:videos.slice(0,5).map(v=>({rect:rect(v),paused:v.paused,currentTime:v.currentTime,
        textTracks:[...v.textTracks].map(t=>({kind:t.kind,language:t.language,mode:t.mode,cues:t.cues?.length||0,activeCues:t.activeCues?.length||0}))})),
      candidates,tree,iframeHosts:[...document.querySelectorAll('iframe')].slice(0,10).map(f=>{try{return new URL(f.src).hostname;}catch{return '';}})};
  }
  globalThis.__hwSubsDiagnostics=diagnosticSnapshot;
  const host=document.createElement('div');
  host.id='hw-subtitle-overlay';host.hidden=true;
  // Extension reloads can leave an orphan overlay in the live page.
  for(const previous of document.querySelectorAll('[id="hw-subtitle-overlay"]'))previous.remove();
  document.documentElement?.append(host);
  const shadow=host.attachShadow({mode:'open'});
  const style=document.createElement('style');
  style.textContent=`:host{all:initial;position:fixed;z-index:2147483647;left:8%;right:8%;bottom:18%;pointer-events:none;text-align:center;font-family:Arial,sans-serif;color:white}:host([hidden]){display:none!important}
    .box{display:inline-block;max-width:100%;background:#10141cde;border-radius:8px;padding:8px 16px;line-height:1.45;white-space:pre-line;text-shadow:0 1px 3px black}
    .original{font-size:.72em;color:#d5d9e1}.translation{font-weight:600} .tools{pointer-events:auto;font-size:12px;margin-bottom:4px;opacity:.9}
    select,button{font:inherit;background:transparent;color:white;border:1px solid #ffffff40;border-radius:6px;padding:3px 8px;margin:2px;max-width:240px;cursor:pointer}button:hover{background:#ffffff1a}select option{color:black}
    .status{font-size:12px;color:#c6d7ee} [hidden]{display:none!important}`;
  const box=document.createElement('div');box.className='box';
  const tools=document.createElement('div');tools.className='tools';tools.hidden=true;
  const select=document.createElement('select');select.setAttribute('aria-label',t('track'));
  const original=document.createElement('div');original.dir='auto';original.className='original';
  const translation=document.createElement('div');translation.dir='auto';translation.className='translation';
  const status=document.createElement('div');status.className='status';
  const close=document.createElement('button');close.textContent=t('hide');
  const pick=document.createElement('button');pick.textContent=t('pick');
  const off=document.createElement('button');off.textContent=t('turnOff');
  close.onclick=()=>{controlsOpen=false;render();};
  off.onclick=()=>{enabled=false;host.hidden=true;epoch++;window.postMessage({source:'hw-subtitles-control',kind:'stop'},location.origin);};
  tools.append(select,pick,close,off);box.append(tools,original,translation,status);shadow.append(style,box);
  select.onchange=()=>{selected=select.value;manualTrack=true;retryAt=0;render();};
  function selectorFor(element){
    if(element.id) return '#'+CSS.escape(element.id);
    const path=[];
    let node=element;
    for(let depth=0;node&&depth<7;depth++,node=node.parentElement){
      let part=node.tagName.toLowerCase();
      const classes=[...node.classList].slice(0,4);
      if(classes.length) part+=classes.map(c=>'.'+CSS.escape(c)).join('');
      if(node.parentElement){
        const siblings=[...node.parentElement.children].filter(e=>e.tagName===node.tagName);
        if(siblings.filter(e=>e.matches(part)).length>1) part+=`:nth-of-type(${siblings.indexOf(node)+1})`;
      }
      path.unshift(part);
      if(document.querySelectorAll(path.join(' > ')).length===1) return path.join(' > ');
    }
    return '';
  }
  pick.onclick=()=>{
    status.textContent=t('pickHint');
    const cleanup=()=>{document.removeEventListener('click',choose,true);document.removeEventListener('keydown',cancel,true);};
    const cancel=event=>{if(event.key==='Escape'){cleanup();status.textContent=t('pickCancel');}};
    const choose=async event=>{
      if(event.composedPath().includes(host)) return;
      event.preventDefault();event.stopImmediatePropagation();cleanup();
      const element=event.target;
      const text=captionElementText(element);
      if(!text || text.length>1500 || ['VIDEO','CANVAS','BODY','HTML'].includes(element.tagName)){
        status.textContent=t('pickInvalid');return;
      }
      const selector=selectorFor(element);
      if(!selector){status.textContent=t('pickFailed');return;}
      pickedSelector=selector;selected='dom';manualTrack=true;select.value='dom';retryAt=0;
      const {siteSelectors={}}=await chrome.storage.local.get('siteSelectors');
      await chrome.storage.local.set({siteSelectors:{...siteSelectors,[location.hostname]:selector}});
      readDom();status.textContent=t('pickSaved');render();
    };
    setTimeout(()=>{document.addEventListener('click',choose,true);document.addEventListener('keydown',cancel,true);},0);
  };
  function mount(){
    const owner=document.getElementById(host.id);
    if(owner&&owner!==host){enabled=false;if(pollTimer)clearInterval(pollTimer);return false;}
    const parent=document.fullscreenElement || document.documentElement;
    if(parent && host.parentNode!==parent) parent.append(host);
    host.style.fontSize=`${settings.fontSize||24}px`;
    return true;
  }
  function refreshChoices(){
    const previous=selected;
    select.replaceChildren();
    for(const [id,track] of tracks) {
      const option=document.createElement('option');option.value=id;option.textContent=track.label;
      select.append(option);
    }
    const fallback=document.createElement('option');fallback.value='dom';fallback.textContent=t('visible');select.append(fallback);
    if(!selected || (selected!=='dom'&&!tracks.has(selected))) selected=tracks.keys().next().value || 'dom';
    if(!manualTrack && previous==='dom' && tracks.size) selected=tracks.keys().next().value;
    select.value=selected;
  }
  function addTrack(id,cues,label,merge=false,rawCount=0){
    if(!cues.length) return;
    const old=tracks.get(id);
    const next=merge&&old?C.normalize([...old.cues,...cues]):cues;
    tracks.set(id,{cues:next,label,rawCount});
    if(tracks.size>20) tracks.delete(tracks.keys().next().value);
    refreshChoices();
  }
  window.addEventListener('message',event=> {
    if(!enabled || event.source!==window || event.origin!==location.origin || event.data?.source!=='hw-subtitles') return;
    if(event.data.kind==='capture-state'){captureState=event.data.state||{};return;}
    if(event.data.kind!=='track') return;
    let cues=C.parse(event.data.body);
    const segment=event.data.segment;
    if(segment&&Number.isFinite(segment.start)&&Number.isFinite(segment.duration)&&segment.start>0&&cues.length&&cues.every(c=>c.end<=segment.duration+.1)&&cues[0].start<segment.start-.1){
      cues=C.normalize(cues.map(c=>({...c,start:c.start+segment.start,end:c.end+segment.start})));
    }
    const id='network:'+String(event.data.key||'').slice(0,2048);
    const label=t('received',{number:[...tracks.keys()].filter(k=>k.startsWith('network:')).indexOf(id)+1||tracks.size+1,count:cues.length});
    addTrack(id,cues,label,true);
  });
  function detectVideo(){
    const videos=[...document.querySelectorAll('video')];
    const next=videos.sort((a,b)=> {
      const score=v=>(v.paused?0:1e8)+v.clientWidth*v.clientHeight;
      return score(b)-score(a);
    })[0];
    if(next!==video) {
      if(video){tracks.clear();selected='';domText='';manualTrack=false;epoch++;refreshChoices();}
      video=next;
      video?.addEventListener('seeking',()=>{if(selected==='dom'){epoch++;domText='';}});
    }
  }
  function scanTracks(){
    if(!video) return;
    [...video.textTracks].forEach((track,index)=> {
      if(!['subtitles','captions'].includes(track.kind)) return;
      if(track.mode==='disabled') track.mode='hidden';
      const id='native:'+index;
      // Normalization drops empty or duplicate cues, so compare against the raw count.
      if(track.cues?.length && track.cues.length!==tracks.get(id)?.rawCount) {
        const cues=C.normalize([...track.cues].map(c=>({start:c.startTime,end:c.endTime,text:c.text})));
        addTrack(id,cues,track.label || track.language || t('nativeTrack',{number:index+1}),false,track.cues.length);
      }
      if(!manualTrack && track.mode==='showing' && tracks.has(id)){selected=id;select.value=id;}
    });
  }
  const selectors=[
    '.bmpui-ui-subtitle-label', '[data-testid="subtitle-text"]', '[data-testid="subtitle"]',
    '[data-testid="subtitles"]', '[data-test="subtitle"]',
    '.ytp-caption-segment', '.player-timedtext-text-container',
    '.atvwebplayersdk-captions-text', '.vjs-text-track-cue',
    '.jw-text-track-cue', '.shaka-text-container',
    '[data-testid="字幕"]', '.art-subtitle', '.dplayer-subtitle', '.plyr__captions .plyr__caption'
  ];
  function castlabsContainer(){return video?.closest('.clpp-container')?.querySelector('.clpp-text-container')||null;}
  function captionElementText(element){
    if(element.matches('button,input,select,[role="button"],[role="menuitem"],[role="slider"]') ||
       element.closest('[role="menu"],[role="listbox"]') ||
       element.querySelector('button,input,select,video,[role="slider"],[role="menu"],[data-testid$="-icon"]')) return '';
    const text=C.clean(element.innerText??element.textContent);
    return C.isCaptionText(text)?text:'';
  }
  function readDom(){
    let found='';domSource='none';
    const castlabs=castlabsContainer();
    if(castlabs){
      domSource='castlabs';found=captionElementText(castlabs);
      if(pickedSelector){
        const previous=document.querySelector(pickedSelector);
        if(!previous||!castlabs.contains(previous)){
          pickedSelector='';domText='';manualTrack=false;epoch++;
          chrome.storage.local.get('siteSelectors').then(({siteSelectors={}})=>{
            delete siteSelectors[location.hostname];return chrome.storage.local.set({siteSelectors});
          });
        }
      }
    }else{
      for(const selector of [...(pickedSelector?[pickedSelector]:[]),...selectors]){
        const nodes=[...document.querySelectorAll(selector)].filter(n=>n.getClientRects().length);
        const text=nodes.map(captionElementText).filter(Boolean).join('\n');
        if(text){found=text;domSource=selector===pickedSelector?'manual':'adapter';break;}
      }
    }
    if(found!==domText){
      domText=found;domStart=video?.currentTime || 0;domChangedAt=Date.now();
    }
  }
  function currentCues(){
    if(selected==='dom') return domText?[{start:domStart,end:Math.max(domStart+1,(video?.currentTime||0)+1),text:domText}]:[];
    return tracks.get(selected)?.cues || [];
  }
  async function request(cues,position){
    if(busy || Date.now()<retryAt || !enabled) return;
    const isDom=selected==='dom';
    const candidates=isDom?(domText&&Date.now()-domChangedAt>=250?[{start:domStart,text:domText}]:[]):C.upcoming(cues,position,200);
    const limit=isDom?1:bufferSeconds()>15?40:8;
    const pending=candidates.filter(c=>!translations.has(c.text)&&(!isDom||C.isCaptionText(c.text)));
    const texts=[];let characters=0;
    for(const text of new Set(pending.map(c=>c.text))){if(texts.length>=limit||characters+text.length>24000)break;texts.push(text);characters+=text.length;}
    if(!texts.length) return;
    busy=true;
    const generation=epoch;
    const context=cues.filter(c=>c.end<=position).slice(-5).map(c=>c.text).join('\n');
    status.textContent=t('translating',{language:settings.language});
    try {
      const result=await chrome.runtime.sendMessage({type:'translate',texts,context,scope:location.origin+location.pathname+'|'+selected});
      if(generation!==epoch) return;
      if(!result?.ok) throw new Error(result?.error||t('noHelper'));
      result.texts.forEach((text,i)=>translations.set(texts[i],text));
      if(translations.size>3000) translations.delete(translations.keys().next().value);
      status.textContent='';
      if(!isDom&&!timedDiagnosticSent&&(location.hostname==='mubi.com'||location.hostname.endsWith('.mubi.com'))){
        timedDiagnosticSent=true;
        chrome.runtime.sendMessage({type:'diagnostic',snapshot:diagnosticSnapshot()}).catch(()=>{});
      }
    } catch(error) {
      if(generation===epoch){status.textContent=error.message;retryAt=Date.now()+30000;}
    } finally {busy=false;render();}
  }
  function bufferSeconds(){
    if(!video||selected==='dom')return 0;
    const position=video.currentTime-Number(settings.offset||0);let ready=0;
    for(const cue of C.upcoming(currentCues(),position,200)){
      if(!translations.has(cue.text))break;
      ready=Math.max(ready,cue.end-position);
    }return Math.round(ready);
  }
  function placeOverlay(){
    const v=video.getBoundingClientRect();
    const native=castlabsContainer();
    const spans=native?[...native.querySelectorAll('.clpp-text-cue')].filter(e=>e.getClientRects().length&&e.textContent.trim()):[];
    const top=spans.length?Math.min(...spans.map(e=>e.getBoundingClientRect().top)):null;
    const bottom=top!==null?innerHeight-top+12:innerHeight-v.bottom+Math.max(64,v.height*.17);
    host.style.bottom=Math.max(16,bottom)+'px';
    host.style.left=Math.max(0,v.left+v.width*.05)+'px';
    host.style.right=Math.max(0,innerWidth-v.right+v.width*.05)+'px';
  }
  const displayKey=text=>String(text||'').normalize('NFKC').replace(/\s+/g,' ').trim();
  function render(){
    if(!enabled) return;
    if(!mount())return;
    if(!video){host.hidden=true;return;}
    const position=video.currentTime-Number(settings.offset||0);
    const cues=currentCues();
    const now=C.active(cues,position);
    const nativeVisible=!!domText;
    original.textContent=settings.showOriginal&&!nativeVisible?[...new Set(now.map(c=>c.text))].join('\n'):'';
    translation.textContent=[...new Set(now.map(c=>translations.get(c.text)||'').filter(Boolean))].join('\n');
    if(nativeVisible&&displayKey(translation.textContent)===displayKey(domText))translation.textContent='';
    // Results for a departed DOM cue are cached, never displayed over the next line.
    tools.hidden=!controlsOpen;status.hidden=!controlsOpen;
    host.hidden=!controlsOpen&&!translation.textContent;
    if(!cues.length) status.textContent=t('noTimeline');
    else if(selected==='dom') status.textContent=t('lagMode');
    else if(!busy&&Date.now()>=retryAt)status.textContent=t('ready',{seconds:bufferSeconds()});
    placeOverlay();request(cues,position);
  }
  chrome.storage.local.get(['settings','siteSelectors']).then(result=>{settings={...settings,...result.settings};pickedSelector=result.siteSelectors?.[location.hostname]||'';});
  chrome.storage.onChanged.addListener(changes=> {
    if(changes.uiLanguage){close.textContent=t('hide');off.textContent=t('turnOff');pick.textContent=t('pick');refreshChoices();}
    if(changes.settings){settings={...settings,...changes.settings.newValue};translations.clear();epoch++;retryAt=0;}
  });
  chrome.runtime.onMessage.addListener((message,_sender,respond)=> {
    if(document.getElementById(host.id)!==host)return;
    if(message.type==='status') respond({tracks:tracks.size,active:enabled,video:!!video,mode:selected==='dom'?'dom':'timed',bufferSeconds:bufferSeconds(),busy,detail:status.textContent,cues:currentCues().length,translated:translations.size});
    if(message.type==='controls'){controlsOpen=message.open!==false;render();if(message.pick)pick.click();respond({ok:true});}
    if(message.type==='toggle') {
      enabled=message.enabled;epoch++;host.hidden=!enabled;retryAt=0;
      window.postMessage({source:'hw-subtitles-control',kind:enabled?'start':'stop'},location.origin);
      respond({ok:true});
    }
  });
  document.addEventListener('fullscreenchange',mount);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&controlsOpen){controlsOpen=false;render();}});
  detectVideo();refreshChoices();
  CueI18N.ready.then(()=>{close.textContent=t('hide');off.textContent=t('turnOff');pick.textContent=t('pick');select.setAttribute('aria-label',t('track'));refreshChoices();});
  pollTimer=setInterval(()=> {
    if(!enabled) return;
    if(lastPage!==location.href){lastPage=location.href;tracks.clear();selected='';domText='';manualTrack=false;epoch++;refreshChoices();}
    detectVideo();scanTracks();readDom();render();
    ticks++;
    if(!diagnosticSent&&ticks>=50&&video&&(location.hostname==='mubi.com'||location.hostname.endsWith('.mubi.com'))){
      diagnosticSent=true;
      chrome.runtime.sendMessage({type:'diagnostic',snapshot:diagnosticSnapshot()}).catch(()=>{});
    }
  },100);
  window.postMessage({source:'hw-subtitles-control',kind:'replay'},location.origin);
})();
