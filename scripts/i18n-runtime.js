// Generated catalogs are injected by build_locales.py; edit _locales/*/messages.json.
(() => {
  'use strict';
  if(globalThis.CueI18N)return;
  const messages=__MESSAGES__;
  const locales=__LOCALES__;
  let language='en';
  const t=(key,values={})=>(messages[language]?.[key]||messages.en[key]||key).replace(/\{(\w+)\}/g,(_m,k)=>String(values[k]??''));
  function apply(){
    if(location.protocol!=='chrome-extension:'||!document.documentElement)return;
    document.documentElement.lang=language;
    document.documentElement.dir=language==='ar'?'rtl':'ltr';
    for(const element of document.querySelectorAll('[data-i18n]'))element.textContent=t(element.dataset.i18n);
    for(const element of document.querySelectorAll('[data-i18n-title]'))element.title=t(element.dataset.i18nTitle);
  }
  const setLanguage=value=>{language=Object.hasOwn(messages,value)?value:'en';apply();};
  const ready=chrome.storage.local.get('uiLanguage').then(({uiLanguage})=>setLanguage(uiLanguage));
  chrome.storage.onChanged.addListener(changes=>{if(changes.uiLanguage)setLanguage(changes.uiLanguage.newValue);});
  globalThis.CueI18N={t,apply,ready,locales,get language(){return language;}};
})();
