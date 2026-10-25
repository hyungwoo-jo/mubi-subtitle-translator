import {readdir,readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
for(const folder of ['extension','scripts','tests']){
  for(const file of await readdir(folder)){
    if(!/\.(m?js)$/.test(file)) continue;
    const result=spawnSync(process.execPath,['--check',`${folder}/${file}`],{stdio:'inherit'});
    assert.equal(result.status,0,file);
  }
}
// User-facing text belongs in _locales; the generated i18n.js is the only catalog.
for(const [folder,pattern] of [['extension',/\.js$/],['native',/\.py$/]]){
  for(const file of await readdir(folder)){
    if(!pattern.test(file)||file==='i18n.js') continue;
    assert(!/[가-힣]/.test(await readFile(`${folder}/${file}`,'utf8')),`${folder}/${file} contains hardcoded Korean text`);
  }
}
assert.equal(spawnSync('python3',['scripts/build_locales.py','--check'],{stdio:'inherit'}).status,0);
const manifest=JSON.parse(await readFile('extension/manifest.json','utf8'));
assert.equal(manifest.manifest_version,3);
assert(!manifest.permissions.includes('tabCapture'));
assert(!manifest.host_permissions?.length);
for(const file of [manifest.background.service_worker,manifest.action.default_popup,manifest.options_ui.page,...Object.values(manifest.icons||{})]) await readFile(`extension/${file}`);
console.log('JavaScript syntax and extension manifest checks passed.');
