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
    const record={savedAt:new Date().toISOString(),reports};
    await chrome.storage.local.set({lastDiagnostics:record});
    const url=URL.createObjectURL(new Blob([JSON.stringify(record,null,2)],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download='mubi-subtitle-diagnostics.json';link.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    status.textContent=t('diagSaved');
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
// Setup steps tick off as they complete; the list folds away once all are done.
const setup={consent:false,needsConnect:true,connected:false,started:false};
function renderSteps(){
  document.querySelector('#step-consent').classList.toggle('done',setup.consent);
  document.querySelector('#step-connect').hidden=!setup.needsConnect;
  document.querySelector('#step-connect').classList.toggle('done',setup.connected);
  document.querySelector('#step-start').classList.toggle('done',setup.started);
  document.querySelector('#setup').hidden=setup.consent&&(setup.connected||!setup.needsConnect)&&setup.started;
}
document.querySelector('#consent').onchange=event=>{setup.consent=event.target.checked;renderSteps();};
async function refreshPlayback(){
  try{
    const {tab}=await current();
    const result=await chrome.tabs.sendMessage(tab.id,{type:'status'});
    setup.started=!!result?.active;renderSteps();
    const ready=result?.video&&result.active;
    document.querySelector('#playback').textContent=!ready?t('waiting'):result.mode==='timed'?t('ready',{seconds:result.bufferSeconds}):t('domMode');
    document.querySelector('#timeline').textContent=!ready?t('clickStart'):result.mode==='timed'?t('counts',{cues:result.cues,translated:result.translated}):t('domHint');
    document.querySelector('#buffer-note').textContent=!ready?'':result.mode==='timed'?t('window'):t('domDelay');
  }catch{
    setup.started=false;renderSteps();
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
chrome.storage.local.get('dataConsent').then(({dataConsent})=>{document.querySelector('#consent').checked=setup.consent=dataConsent===true;renderSteps();});
CueI18N.ready.then(()=>{CueI18N.apply();refreshPlayback();refreshUsage();});

document.querySelector('#connect').onclick=()=>CueConnection.open();
async function refreshConnection(){
  const button=document.querySelector('#connect');
  const {settings={}}=await chrome.storage.local.get('settings');
  setup.needsConnect=(settings.provider||'chatgpt')==='chatgpt';
  const result=setup.needsConnect?await chrome.runtime.sendMessage({type:'chatgpt.status'}).catch(()=>null):null;
  setup.connected=!!result?.connected;
  button.textContent=setup.connected?'ChatGPT · '+(result.account||t('connectedAccount')):'Continue with ChatGPT';
  renderSteps();
}
refreshConnection();setInterval(refreshConnection,2000);
