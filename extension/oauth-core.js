(function(root){
  'use strict';
  const ISSUER='https://auth.openai.com';
  const RESOURCE='https://api.openai.com/v1';
  const scopes=['openid','profile','email','offline_access','resource.invoke','chatgpt.tokens.use.direct'];
  function encode(bytes){return btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
  function decode(value){
    if(typeof value!=='string'||!/^[A-Za-z0-9_-]+$/.test(value))throw new Error('Invalid token encoding.');
    return Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-value.length%4)%4)),c=>c.charCodeAt(0));
  }
  function random(){return encode(crypto.getRandomValues(new Uint8Array(32)));}
  async function transaction(hostId,registration=null){
    const verifier=random();
    const port=49152+(crypto.getRandomValues(new Uint16Array(1))[0]%16384);
    const pending={verifier,state:random(),nonce:random(),redirect:`http://127.0.0.1:${port}/auth/callback`,created:Date.now(),clientId:registration?.clientId||null,subject:registration?.subject||null};
    const url=new URL(ISSUER+'/api/accounts/authorize');
    const params={client_id:pending.clientId||'dynamic_agent_client',ext_agent_host_id:hostId,response_type:'code',redirect_uri:pending.redirect,scope:scopes.join(' '),resource:RESOURCE,state:pending.state,nonce:pending.nonce,code_challenge_method:'S256',code_challenge:encode(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier)))};
    if(!pending.clientId)params.agent_name_hint='Subtitle Translator for MUBI';
    for(const [key,value]of Object.entries(params))url.searchParams.set(key,value);
    return {pending,url:url.href};
  }
  function callback(raw,pending){
    const url=new URL(raw),expected=new URL(pending.redirect);
    if(url.origin!==expected.origin||url.pathname!==expected.pathname||url.hash)throw new Error('Unexpected sign-in callback.');
    if(Date.now()-pending.created>10*60*1000)throw new Error('Sign-in expired. Please start again.');
    if(url.searchParams.getAll('state').length!==1||url.searchParams.get('state')!==pending.state)throw new Error('Sign-in state did not match.');
    if(url.searchParams.has('error'))throw new Error('ChatGPT sign-in or plan permission was declined.');
    const returned=url.searchParams.get('client_id');
    if(pending.clientId&&returned&&returned!==pending.clientId)throw new Error('The returned client does not match this account.');
    const clientId=pending.clientId||returned,code=url.searchParams.get('code');
    if(!clientId||clientId==='dynamic_agent_client'||!code||url.searchParams.getAll('code').length!==1)throw new Error('Registration did not return a client ID and code.');
    return {clientId,code};
  }
  async function identity(token,jwks,{clientId,nonce=null,subject=null,now=Date.now()/1000}){
    if(typeof token!=='string'||token.length>30000)throw new Error('Invalid identity token.');
    const parts=token.split('.');if(parts.length!==3)throw new Error('Invalid identity token.');
    const parse=s=>JSON.parse(new TextDecoder().decode(decode(s)));
    const header=parse(parts[0]),claims=parse(parts[1]);
    if(header.alg!=='RS256'||!header.kid)throw new Error('Unsupported identity signature.');
    const jwk=jwks.keys?.find(k=>k.kid===header.kid&&k.kty==='RSA'&&(!k.alg||k.alg==='RS256'));
    if(!jwk)throw new Error('The identity signing key was not found.');
    const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
    if(!await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,decode(parts[2]),new TextEncoder().encode(parts[0]+'.'+parts[1])))throw new Error('Invalid identity signature.');
    const audience=Array.isArray(claims.aud)?claims.aud:[claims.aud];
    if(claims.iss!==ISSUER||!audience.includes(clientId)||!Number.isFinite(claims.exp)||claims.exp<now-30||!Number.isFinite(claims.iat)||claims.iat>now+60||typeof claims.sub!=='string'||!claims.sub)throw new Error('Identity token claims did not match.');
    if(nonce!==null&&claims.nonce!==nonce)throw new Error('Sign-in nonce did not match.');
    if(subject!==null&&claims.sub!==subject)throw new Error('Sign-in returned a different account.');
    return {subject:claims.sub,email:typeof claims.email==='string'?claims.email:'',name:typeof claims.name==='string'?claims.name:''};
  }
  function planAllowed(scope){return typeof scope==='string'&&scope.split(/\s+/).includes('chatgpt.tokens.use.direct');}
  function codeForm(result,pending){return new URLSearchParams({grant_type:'authorization_code',client_id:result.clientId,code:result.code,code_verifier:pending.verifier,redirect_uri:pending.redirect,resource:RESOURCE});}
  async function readResponseStream(response){
    if(!response.body)throw new Error('The model response stream is missing.');
    const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='',output='',usage=null,completed=false,count=0;
    const event=block=>{
      const data=block.split('\n').filter(line=>line.startsWith('data:')).map(line=>line.slice(5).trimStart()).join('\n');
      if(!data||data==='[DONE]')return;
      const item=JSON.parse(data);
      if(item.type==='response.output_text.delta')output+=item.delta||'';
      if(item.type==='error'||item.type==='response.failed'||item.type==='response.incomplete')throw new Error('The model response did not complete.');
      if(item.type==='response.completed'){
        completed=true;usage=item.response?.usage||null;
        if(!output)output=(item.response?.output||[]).flatMap(row=>row.content||[]).filter(c=>c.type==='output_text').map(c=>c.text||'').join('');
      }
    };
    try{
      while(true){
        const {done,value}=await reader.read();if(done)break;
        count+=value.byteLength;if(count>2*1024*1024)throw new Error('The model response is too large.');
        buffer+=(decoder.decode(value,{stream:true})).replace(/\r/g,'');
        let at;while((at=buffer.indexOf('\n\n'))>=0){event(buffer.slice(0,at));buffer=buffer.slice(at+2);}
      }
      buffer+=decoder.decode();if(buffer.trim())event(buffer);
      if(!completed)throw new Error('The model response ended before completion.');
      return {output,usage};
    }finally{await reader.cancel().catch(()=>{});}
  }
  root.CueOAuth={ISSUER,RESOURCE,scopes,encode,random,transaction,callback,identity,planAllowed,codeForm,readResponseStream};
})(globalThis);
