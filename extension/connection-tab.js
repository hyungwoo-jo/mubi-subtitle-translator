(() => {
  'use strict';
  async function open(){
    const url=chrome.runtime.getURL('connect.html');
    const contexts=await chrome.runtime.getContexts({contextTypes:['TAB'],documentUrls:[url]});
    const existing=contexts.find(row=>row.tabId>=0);
    if(existing){await chrome.tabs.update(existing.tabId,{active:true});return;}
    await chrome.tabs.create({url,pinned:true});
  }
  globalThis.CueConnection={open};
})();
