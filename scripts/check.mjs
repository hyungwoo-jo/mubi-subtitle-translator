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
const manifest=JSON.parse(await readFile('extension/manifest.json','utf8'));
assert.equal(manifest.manifest_version,3);
assert(!manifest.permissions.includes('tabCapture'));
assert(!manifest.host_permissions?.length);
for(const file of [manifest.background.service_worker,manifest.action.default_popup,manifest.options_ui.page,...Object.values(manifest.icons||{})]) await readFile(`extension/${file}`);
console.log('JavaScript syntax and extension manifest checks passed.');
