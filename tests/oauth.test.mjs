import test from 'node:test';
import assert from 'node:assert/strict';
import '../extension/oauth-core.js';
const O=globalThis.CueOAuth;
test('new registration uses its own agent name, stable host, PKCE and per-attempt state',async()=>{
 const {pending,url}=await O.transaction('urn:uuid:test-host');const u=new URL(url);
 assert.equal(u.searchParams.get('client_id'),'dynamic_agent_client');assert.equal(u.searchParams.get('agent_name_hint'),'Subtitle Translator for MUBI');
 assert.equal(u.searchParams.get('ext_agent_host_id'),'urn:uuid:test-host');assert.equal(u.searchParams.get('code_challenge_method'),'S256');
 assert(!url.includes(pending.verifier));assert.equal(new URL(pending.redirect).hostname,'127.0.0.1');
 const result=O.callback(pending.redirect+'?state='+pending.state+'&code=sample-code&client_id=oaiapp_test',pending);
 const form=O.codeForm(result,pending);assert.equal(form.get('client_id'),'oaiapp_test');assert.equal(form.get('redirect_uri'),pending.redirect);
 const next=await O.transaction('urn:uuid:test-host',{clientId:'oaiapp_test',subject:'s'});assert.notEqual(next.pending.state,pending.state);assert(!new URL(next.url).searchParams.has('agent_name_hint'));
});
test('callbacks reject state mismatch, wrong origin, expired and different registration',async()=>{
 const {pending}=await O.transaction('urn:uuid:h',{clientId:'oaiapp_saved',subject:'s'});
 for(const value of [pending.redirect+'?state=wrong&code=c',pending.redirect.replace('127.0.0.1','localhost')+'?state='+pending.state+'&code=c',pending.redirect+'?state='+pending.state+'&code=c&client_id=oaiapp_other'])assert.throws(()=>O.callback(value,pending));
 assert.throws(()=>O.callback(pending.redirect+'?state='+pending.state+'&code=c',{...pending,created:Date.now()-700000}));
 assert.throws(()=>O.callback(pending.redirect+'?state='+pending.state+'&error=access_denied',pending));
});
test('identity is verified with a signing key, audience, nonce, expiry and account',async()=>{
 const keys=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
 const jwk={...await crypto.subtle.exportKey('jwk',keys.publicKey),kid:'test-key',alg:'RS256'};
 const claims={iss:O.ISSUER,aud:'oaiapp_test',sub:'subject',nonce:'nonce',iat:1000,exp:2000,email:'synthetic@example.test'};
 const sign=async payload=>{const body=[{alg:'RS256',kid:'test-key'},payload].map(v=>O.encode(new TextEncoder().encode(JSON.stringify(v)))).join('.');return body+'.'+O.encode(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',keys.privateKey,new TextEncoder().encode(body)));};
 const token=await sign(claims),options={clientId:'oaiapp_test',nonce:'nonce',subject:'subject',now:1500};
 assert.equal((await O.identity(token,{keys:[jwk]},options)).subject,'subject');
 await assert.rejects(()=>O.identity(token.slice(0,-6)+'aaaaaa',{keys:[jwk]},options));
 for(const fields of [{clientId:'other'},{nonce:'wrong'},{subject:'other'},{now:3000}])await assert.rejects(()=>O.identity(token,{keys:[jwk]},{...options,...fields}));
 await assert.rejects(async()=>O.identity(await sign({...claims,iss:'https://attacker.test'}),{keys:[jwk]},options));
});
test('plan permission is distinct from sign-in and stream completion is required',async()=>{
 assert(!O.planAllowed('openid email'));assert(O.planAllowed('openid chatgpt.tokens.use.direct'));
 const text='data: '+JSON.stringify({type:'response.output_text.delta',delta:'{"items":[]}'})+'\n\ndata: '+JSON.stringify({type:'response.completed',response:{usage:{input_tokens:42,output_tokens:9}}})+'\n\n';
 const bytes=new TextEncoder().encode(text);const result=await O.readResponseStream(new Response(new ReadableStream({start(c){c.enqueue(bytes.slice(0,21));c.enqueue(bytes.slice(21));c.close();}})));
 assert.equal(result.output,'{"items":[]}');assert.equal(result.usage.input_tokens,42);
 await assert.rejects(()=>O.readResponseStream(new Response('data: {"type":"response.output_text.delta","delta":"partial"}\n\n')));
});
