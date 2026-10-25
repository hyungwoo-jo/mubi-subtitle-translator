(function(root){
  'use strict';
  function explain(error){
    const message=String(error?.message || error || '').slice(0,400);
    const t=root.CueI18N?.t||((key)=>({bridgeGeneric:'Could not connect to the helper.',bridgeMissing:'The helper is not registered in this browser, or its path is invalid.',bridgeForbidden:'The extension ID does not match the helper allowlist.',bridgeLaunch:'Could not launch the registered helper. Check its installation path.',bridgeExited:'The helper exited before replying or communication failed.',diagPrefix:'Diagnostic: '})[key]);
    let help=t('bridgeGeneric');
    if(/not found/i.test(message))help=t('bridgeMissing');
    else if(/forbidden/i.test(message))help=t('bridgeForbidden');
    else if(/failed to start/i.test(message))help=t('bridgeLaunch');
    else if(/exited|communicating/i.test(message))help=t('bridgeExited');
    return help+(message?'\n'+t('diagPrefix')+message:'');
  }
  root.HWConnection={explain};
})(globalThis);
