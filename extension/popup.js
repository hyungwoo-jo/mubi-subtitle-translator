const t=CueI18N.t;
const status=document.querySelector('#status');
document.querySelector('#version').textContent='v'+chrome.runtime.getManifest().version;
async function current(){
  const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
  const url=new URL(tab.url);
  if(!['http:','https:'].includes(url.protocol)) throw new Error(t('websiteOnly'));
  return {tab,pattern:url.protocol+'//'+url.hostname+'/*',id:'hwsubs-'+url.hostname.replace(/[^a-z0-9]/gi,'-')+'-'+url.protocol.slice(0,-1)};
}
document.querySelector('#settings').onclick=()=>chrome.runtime.openOptionsPage();
document.querySelector('#diagnostic').onclick=async()=>{
  try{
    const {tab}=await current();
    const frames=await chrome.scripting.executeScript({target:{tabId:tab.id,allFrames:true},func:()=>typeof globalThis.__hwSubsDiagnostics==='function'?globalThis.__hwSubsDiagnostics():null});
    const reports=frames.filter(f=>f.result).slice(0,12).map(f=>({frameId:f.frameId,snapshot:f.result}));
    if(!reports.length){status.textContent=t('clickStart');return;}
    const result=await chrome.runtime.sendNativeMessage('com.hw.subtitle_translator',{action:'diagnostic',reports});
    status.textContent=result?.ok?t('diagSaved'):t('diagFailed');
  }catch{status.textContent=t('diagFailed');}
};
document.querySelector('#enable').onclick=async()=> {
  try {
    if(!document.querySelector('#consent').checked){status.textContent=t('consentNeeded');return;}
    const {tab,pattern,id}=await current();
    if(!await chrome.permissions.request({origins:[pattern]})) {status.textContent=t('permission');return;}
    await chrome.storage.local.set({dataConsent:true});
    const registered=await chrome.scripting.getRegisteredContentScripts({ids:[id]});
    if(!registered.length) await chrome.scripting.registerContentScripts([
      {id,matches:[pattern],js:['hook.js'],world:'MAIN',runAt:'document_start',allFrames:true},
      {id:id+'-content',matches:[pattern],js:['i18n.js','core.js','content.js'],runAt:'document_start',allFrames:true}
    ]);
    if(registered.length)await chrome.scripting.updateContentScripts([{id:id+'-content',js:['i18n.js','core.js','content.js']}]);
    await chrome.scripting.executeScript({target:{tabId:tab.id,allFrames:true},files:['hook.js'],world:'MAIN'});
    await chrome.scripting.executeScript({target:{tabId:tab.id,allFrames:true},files:['i18n.js','core.js','content.js']});
    await chrome.tabs.sendMessage(tab.id,{type:'toggle',enabled:true});
    status.textContent=t('started');
  } catch {status.textContent=t('startFailed');}
};
document.querySelector('#stop').onclick=async()=> {
  try {
    const {pattern,id}=await current();
    const registered=await chrome.scripting.getRegisteredContentScripts({ids:[id,id+'-content']});
    if(registered.length) await chrome.scripting.unregisterContentScripts({ids:registered.map(s=>s.id)});
    const tabs=await chrome.tabs.query({url:pattern});
    await Promise.all(tabs.map(tab=>chrome.tabs.sendMessage(tab.id,{type:'toggle',enabled:false}).catch(()=>{})));
    await chrome.permissions.remove({origins:[pattern]});
    status.textContent=t('stopped');
  } catch {status.textContent=t('stopFailed');}
};

for(const id of ['controls','pick'])document.querySelector('#'+id).onclick=async()=>{
  try{const {tab}=await current();await chrome.tabs.sendMessage(tab.id,{type:'controls',open:true,pick:id==='pick'});window.close();}catch{status.textContent=t('clickStart');}
};
async function refreshPlayback(){
  try{
    const {tab}=await current();
    const result=await chrome.tabs.sendMessage(tab.id,{type:'status'});
    const ready=result?.video&&result.active;
    document.querySelector('#playback').textContent=!ready?t('waiting'):result.mode==='시간표'?t('ready',{seconds:result.bufferSeconds}):t('domMode');
    document.querySelector('#timeline').textContent=!ready?t('clickStart'):result.mode==='시간표'?t('counts',{cues:result.cues,translated:result.translated}):t('domHint');
    document.querySelector('#buffer-note').textContent=!ready?'':result.mode==='시간표'?t('window'): '이 방식은 번역 응답만큼 지연될 수 있습니다.';
  }catch{
    document.querySelector('#playback').textContent=t('waiting');
    document.querySelector('#timeline').textContent=t('clickStart');
    document.querySelector('#buffer-note').textContent='';
  }
}
refreshPlayback();setInterval(refreshPlayback,1000);
async function refreshUsage(){
  const {translationUsage:u}=await chrome.storage.local.get('translationUsage');
  document.querySelector('#usage').textContent=u?t('usage',{calls:u.calls,input:u.input_tokens.toLocaleString(),cached:u.cached_input_tokens.toLocaleString(),output:u.output_tokens.toLocaleString(),batch:u.lastBatch,duration:(u.lastDurationMs/1000).toFixed(1)})+'\n'+t('measured'):t('usageEmpty');
}
chrome.storage.local.get('dataConsent').then(({dataConsent})=>{document.querySelector('#consent').checked=dataConsent===true;});
CueI18N.ready.then(()=>{CueI18N.apply();refreshPlayback();refreshUsage();});
