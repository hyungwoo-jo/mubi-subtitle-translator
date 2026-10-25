import {mkdir,cp,readFile,writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
assert.equal(spawnSync('python3',['scripts/build_locales.py','--check'],{stdio:'inherit'}).status,0);
const version=JSON.parse(await readFile('package.json','utf8')).version;
const dest=`out/hw-subtitles-${version}`;
await mkdir(dest,{recursive:true});
await cp('extension',`${dest}/extension`,{recursive:true});
await mkdir(`${dest}/native`,{recursive:true});
for(const name of ['host.py','install.py','setup.py']) await cp(`native/${name}`,`${dest}/native/${name}`);
await cp('docs/README.public.md',`${dest}/README.md`);
await mkdir(`${dest}/docs/assets`,{recursive:true});
const locales=JSON.parse(await readFile('scripts/locale-metadata.json','utf8'));
for(const locale of locales.filter(row=>row.id!=='en')) await cp(`docs/README.${locale.id}.md`,`${dest}/docs/README.${locale.id}.md`);
await cp('docs/PRIVACY.md',`${dest}/docs/PRIVACY.md`);
await cp('docs/assets/popup-en.png',`${dest}/docs/assets/popup-en.png`);
await cp('LICENSE',`${dest}/LICENSE`);
await writeFile(`${dest}/VERSION`,version+'\n');
const result=spawnSync('python3',['-c',
  'import pathlib,sys,zipfile; p=pathlib.Path(sys.argv[1]); z=zipfile.ZipFile(str(p)+".zip","w",zipfile.ZIP_DEFLATED); [z.write(f,f.relative_to(p.parent)) for f in sorted(p.rglob("*")) if f.is_file()]; z.close()',dest],{stdio:'inherit'});
assert.equal(result.status,0);
const filename=`hw-subtitles-${version}.zip`;
const sha256=createHash('sha256').update(await readFile(`${dest}.zip`)).digest('hex');
await writeFile('out/latest.json',JSON.stringify({version,filename,sha256},null,2)+'\n');
console.log(`${dest}.zip`);

const store=spawnSync('python3',['-c','import pathlib,zipfile; p=pathlib.Path("extension"); z=zipfile.ZipFile("out/mubi-subtitle-translator-webstore-'+version+'.zip","w",zipfile.ZIP_DEFLATED); [z.write(f,f.relative_to(p)) for f in sorted(p.rglob("*")) if f.is_file() and f.suffix in (".js",".json",".html",".css",".svg",".png")]; z.close()'],{stdio:'inherit'});
assert.equal(store.status,0);

const complete=spawnSync('python3',['-c','import pathlib,sys,zipfile; p=pathlib.Path(sys.argv[1]); z=zipfile.ZipFile("out/mubi-subtitle-translator-'+version+'.zip","w",zipfile.ZIP_DEFLATED); [z.write(f,pathlib.Path("mubi-subtitle-translator-'+version+'")/f.relative_to(p)) for f in sorted(p.rglob("*")) if f.is_file()]; z.close()',dest],{stdio:'inherit'});
assert.equal(complete.status,0);
