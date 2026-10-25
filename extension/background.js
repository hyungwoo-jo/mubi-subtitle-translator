importScripts('core.js');
const DEFAULTS={language:'English',provider:'codex',model:'gpt-6-luna',glossary:'',showOriginal:false,fontSize:24,offset:0};
let queue=Promise.resolve();
async function digest(value) {
  const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value)));
  return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
async function translate(message) {
  const {settings={},dataConsent}=await chrome.storage.local.get(['settings','dataConsent']);
  if(dataConsent!==true)throw new Error('Accept subtitle processing in the popup before starting.');
  const cfg={...DEFAULTS,...settings};
  const texts=message.texts;
  if(!Array.isArray(texts)||!texts.length||texts.length>40||texts.some(t=>typeof t!=='string'||t.length>4000)||texts.join('').length>24000)throw new Error('The subtitle batch is too large.');
  const context=typeof message.context==='string'?message.context.slice(-6000):'';
  const scope=String(message.scope||'').slice(0,4096);
  const keys=await Promise.all(texts.map(text=>digest([cfg.provider,cfg.model,cfg.language,cfg.glossary,scope,text]).then(hash=>'cache:cue:'+hash)));
  const cached=await chrome.storage.local.get(keys);
  const missing=texts.map((text,index)=>({text,index})).filter(row=>!cached[keys[row.index]]);
  let response=null,translated=[];
  if(missing.length){
    response=await chrome.runtime.sendNativeMessage('com.hw.subtitle_translator',{
      action:'translate',provider:cfg.provider,model:cfg.model,language:cfg.language,glossary:cfg.glossary,
      context,items:missing.map((row,id)=>({id,text:row.text}))
    });
    if(!response?.ok)throw new Error(response?.error||'The translation helper did not respond.');
    translated=HWSubs.validateTranslations(response.items,missing);
    const updates={};
    missing.forEach((row,i)=>{updates[keys[row.index]]={text:translated[i],created:Date.now()};});
    const {translationUsage:previous={}}=await chrome.storage.local.get('translationUsage');
    const usage={calls:(previous.calls||0)+1,measuredCalls:(previous.measuredCalls||0)+(response.usage?1:0),lastBatch:missing.length,lastDurationMs:response.durationMs||0};
    for(const field of ['input_tokens','cached_input_tokens','output_tokens'])usage[field]=(previous[field]||0)+(Number(response.usage?.[field])||0);
    updates.translationUsage=usage;
    await chrome.storage.local.set(updates);
    const all=await chrome.storage.local.get(null);
    const entries=Object.keys(all).filter(k=>k.startsWith('cache:'));
    if(entries.length>6000)await chrome.storage.local.remove(entries.sort((a,b)=>all[a].created-all[b].created).slice(0,entries.length-6000));
  }
  const output=texts.map((_,i)=>cached[keys[i]]?.text);
  missing.forEach((row,i)=>{output[row.index]=translated[i];});
  return {texts:output,cached:!missing.length};
}
chrome.runtime.onMessage.addListener((message,sender,respond)=> {
  if(sender.id!==chrome.runtime.id) return;
  if(message.type==='diagnostic'){
    try{
      const hostname=new URL(sender.url).hostname;
      if(hostname!=='mubi.com'&&!hostname.endsWith('.mubi.com')) return;
    }catch{return;}
    chrome.runtime.sendNativeMessage('com.hw.subtitle_translator',{action:'diagnostic',reports:[{frameId:sender.frameId||0,snapshot:message.snapshot}]})
      .then(result=>respond(result),()=>respond({ok:false}));
    return true;
  }
  if(message.type==='translate') {
    const task=queue.then(()=>translate(message));
    queue=task.catch(()=>{});
    task.then(result=>respond({ok:true,...result}),()=>respond({ok:false,error:'Translation failed. Check the helper, selected provider, sign-in and model in Settings.'}));
    return true;
  }
});

chrome.runtime.onInstalled.addListener(async()=>{
  const scripts=await chrome.scripting.getRegisteredContentScripts();
  const updates=scripts.filter(s=>s.id.startsWith('hwsubs-')&&s.id.endsWith('-content')).map(s=>({id:s.id,js:['i18n.js','core.js','content.js']}));
  if(updates.length)await chrome.scripting.updateContentScripts(updates);
});
