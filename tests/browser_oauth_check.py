"""Browser-only OAuth integration against simulated official endpoints; no real credentials."""
import base64
import hashlib
import json
from pathlib import Path
import shutil
import tempfile
from urllib.parse import parse_qs, urlencode, urlparse
from playwright.sync_api import sync_playwright, expect

ROOT=Path(__file__).resolve().parents[1]
(ROOT/'tmp').mkdir(exist_ok=True)
with tempfile.TemporaryDirectory(dir=ROOT/'tmp',prefix='oauth-browser-') as work:
    extension=Path(work)/'extension'
    shutil.copytree(ROOT/'extension',extension)
    manifest=json.loads((extension/'manifest.json').read_text())
    manifest['host_permissions']=['https://auth.openai.com/*','https://api.openai.com/*','http://127.0.0.1/*']
    (extension/'manifest.json').write_text(json.dumps(manifest))
    with sync_playwright() as p:
        context=p.chromium.launch_persistent_context(str(Path(work)/'profile'),headless=False,
            args=['--headless=new',f'--disable-extensions-except={extension}',f'--load-extension={extension}'])
        worker=context.service_workers[0] if context.service_workers else context.wait_for_event('serviceworker')
        extension_id=worker.url.split('/')[2]
        worker.evaluate("chrome.storage.local.set({dataConsent:true,settings:{provider:'chatgpt',model:'test-model',language:'한국어'}})")
        connection=context.new_page()
        errors=[]
        connection.on('pageerror',lambda error:errors.append(str(error)))
        connection.goto(f'chrome-extension://{extension_id}/connect.html')
        jwk=connection.evaluate('''async()=>{
            globalThis.fixtureKeys=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
            return {...await crypto.subtle.exportKey('jwk',fixtureKeys.publicKey),kid:'fixture-key',alg:'RS256'};
        }''')
        state={}
        def authorize(route):
            query=parse_qs(urlparse(route.request.url).query)
            if not state.get('signins'):
                assert query['client_id']==['dynamic_agent_client']
                assert query['agent_name_hint']==['Subtitle Translator for MUBI']
            else:
                assert query['client_id']==['oaiapp_fixture']
                assert 'agent_name_hint' not in query
            state['signins']=state.get('signins',0)+1
            state.update({key:values[0] for key,values in query.items()})
            callback=state['redirect_uri']+'?'+urlencode({'state':state['state'],'code':'fixture-code','client_id':'oaiapp_fixture'})
            route.fulfill(content_type='text/html',body='<script>location.href='+json.dumps(callback)+'</script>')
        def token(route):
            form=parse_qs(route.request.post_data)
            assert form['client_id']==['oaiapp_fixture']
            if form['grant_type']==['refresh_token']:
                assert form['refresh_token'][0] in ('fixture-refresh','fixture-refresh-next')
                assert form['resource']==['https://api.openai.com/v1']
                assert 'scope' not in form
                state['refreshes']=state.get('refreshes',0)+1
                route.fulfill(content_type='application/json',body=json.dumps({'access_token':'fixture-access-next','refresh_token':'fixture-refresh-next','scope':'openid chatgpt.tokens.use.direct','expires_in':3600}))
                return
            assert form['code']==['fixture-code']
            assert form['redirect_uri']==[state['redirect_uri']]
            challenge=base64.urlsafe_b64encode(hashlib.sha256(form['code_verifier'][0].encode()).digest()).decode().rstrip('=')
            assert challenge==state['code_challenge']
            identity=connection.evaluate('''async(nonce)=>{
                const now=Math.floor(Date.now()/1000);
                const encode=CueOAuth.encode;
                const body=[{alg:'RS256',kid:'fixture-key'},{iss:'https://auth.openai.com',aud:'oaiapp_fixture',sub:'fixture-subject',nonce,iat:now,exp:now+3600,email:'synthetic@example.test'}].map(value=>encode(new TextEncoder().encode(JSON.stringify(value)))).join('.');
                return body+'.'+encode(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',fixtureKeys.privateKey,new TextEncoder().encode(body)));
            }''',state['nonce'])
            route.fulfill(content_type='application/json',body=json.dumps({'access_token':'fixture-access','refresh_token':'fixture-refresh','id_token':identity,'scope':'openid chatgpt.tokens.use.direct','expires_in':1}))
        def inference(route):
            body=json.loads(route.request.post_data)
            assert body['store'] is False and body['stream'] is True
            assert body['model']=='test-model'
            assert 'temperature' not in body and 'max_output_tokens' not in body
            data=json.loads(body['input'][0]['content'][0]['text'])
            text=json.dumps({'items':[{'id':row['id'],'text':'모의 번역'} for row in data['items']]})
            events=[{'type':'response.output_text.delta','delta':text},{'type':'response.completed','response':{'usage':{'input_tokens':45,'output_tokens':8}}}]
            route.fulfill(content_type='text/event-stream',body=''.join('data: '+json.dumps(event)+'\n\n' for event in events))
        context.route('https://auth.openai.com/api/accounts/authorize?**',authorize)
        context.route('https://auth.openai.com/api/accounts/oauth/token',token)
        context.route('https://auth.openai.com/.well-known/jwks.json',lambda r:r.fulfill(content_type='application/json',body=json.dumps({'keys':[jwk]})))
        context.route('https://auth.openai.com/.well-known/openid-configuration',lambda r:r.fulfill(content_type='application/json',body=json.dumps({'revocation_endpoint':'https://auth.openai.com/revoke'})))
        context.route('https://auth.openai.com/revoke',lambda r:r.fulfill(status=200,body=''))
        context.route('https://api.openai.com/v1/models',lambda r:r.fulfill(content_type='application/json',body=json.dumps({'models':[{'slug':'test-model','display_name':'Fixture model','visibility':'list'}]})))
        context.route('https://api.openai.com/v1/responses',inference)
        connection.locator('#signin').click()
        connection.locator('#welcome').wait_for(state='visible',timeout=20000)
        assert not errors,errors
        assert connection.locator('#models').input_value()=='test-model'
        connection.locator('#confirm').click()
        expect(connection.locator('#test')).to_be_enabled()
        connection.locator('#test').click()
        expect(connection.locator('#sample')).to_contain_text('모의 번역')
        saved=worker.evaluate('chrome.storage.local.get(null)')
        serialized=json.dumps(saved)
        assert 'fixture-access' not in serialized and 'fixture-refresh' not in serialized
        assert saved['translationUsage']['input_tokens']==45
        assert saved['chatgptRegistrations'][0]['clientId']=='oaiapp_fixture'
        # Site content scripts must not receive account state from the trusted connection tab.
        content=context.new_page()
        content.route('**/untrusted',lambda r:r.fulfill(content_type='text/html',body='<html>Fixture</html>'))
        content.goto('http://127.0.0.1:18947/untrusted')
        tab_id=worker.evaluate("async()=> (await chrome.tabs.query({url:'http://127.0.0.1/*'}))[0].id")
        result=worker.evaluate('''async(tabId)=>{
            const [result]=await chrome.scripting.executeScript({target:{tabId},func:async()=>{
                try{return await chrome.runtime.sendMessage({type:'chatgpt.status'});}catch{return null;}
            }});return result.result;
        }''',tab_id)
        assert result is None,result
        connection.locator('#signout').click()
        expect(connection.locator('#progress')).to_contain_text('revoked')
        assert connection.locator('#connection').inner_text()=='Not connected'
        assert not errors,errors
        connection.locator('#signin').click()
        expect(connection.locator('#test')).to_be_enabled()
        assert state['signins']==2 and state['refreshes']==2,state
        connection.locator('#signout').click()
        expect(connection.locator('#progress')).to_contain_text('revoked')
        context.close()
print('Chromium OAuth: callback, PKCE, JWT, plan consent, inference, token isolation, renewal, returning sign-in and revocation passed.')
