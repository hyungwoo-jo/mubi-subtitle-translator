const t=CueI18N.t;
const fields=['provider','language','model','glossary','showOriginal','fontSize','offset'];
const status=document.querySelector('#status');
document.querySelector('#extension-id').textContent=chrome.runtime.id;
chrome.storage.local.get(['settings','uiLanguage']).then(({settings={},uiLanguage='en'})=> {
  document.querySelector('#uiLanguage').value=uiLanguage;
  for(const field of fields) if(settings[field]!==undefined){
    const input=document.getElementById(field);
    if(input.type==='checkbox') input.checked=settings[field]; else input.value=settings[field];
  }
});
document.querySelector('#form').onsubmit=async event=> {
  event.preventDefault();
  const settings={};
  for(const field of fields){
    const input=document.getElementById(field);
    settings[field]=input.type==='checkbox'?input.checked:input.type==='number'?Number(input.value):input.value.trim();
  }
  await chrome.storage.local.set({settings,uiLanguage:document.querySelector('#uiLanguage').value});
  await CueI18N.ready;CueI18N.apply();status.textContent=t('saved');
};
document.querySelector('#test').onclick=async()=> {
  status.textContent=t('testing');
  try {
    const provider=document.querySelector('#provider').value;
    if(provider==='chatgpt'){
      const result=await chrome.runtime.sendMessage({type:'chatgpt.status'}).catch(()=>null);
      status.textContent=result?.connected?'ChatGPT connected · '+result.account:'Open Continue with ChatGPT to connect. Keep the connection tab open.';return;
    }
    const result=await chrome.runtime.sendNativeMessage('com.hw.subtitle_translator',{action:'health',provider});
    status.textContent=result.ok?t('helperOk',{version:result.version||''}):t('helperMissing');
  } catch(error) {status.textContent=HWConnection.explain(error);}
};
document.querySelector('#clear').onclick=async()=> {
  const data=await chrome.storage.local.get(null);
  await chrome.storage.local.remove(Object.keys(data).filter(k=>k.startsWith('cache:')));
  status.textContent=t('cacheCleared');
};

document.querySelector('#uiLanguage').onchange=async event=>{
  await chrome.storage.local.set({uiLanguage:event.target.value});
};
document.querySelector('#provider').onchange=()=>{
  const model=document.querySelector('#model');
  if(document.querySelector('#provider').value==='ollama'&&model.value.startsWith('gpt-'))model.value='';
  else if(document.querySelector('#provider').value==='codex'&&!model.value)model.value='gpt-6-luna';
};
CueI18N.ready.then(()=>CueI18N.apply());

document.querySelector('#connect').onclick=()=>CueConnection.open();
