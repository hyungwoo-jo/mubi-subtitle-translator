import {mkdir,cp,readFile,writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const version=JSON.parse(await readFile('package.json','utf8')).version;
const dest=`out/hw-subtitles-${version}`;
await mkdir(dest,{recursive:true});
await cp('extension',`${dest}/extension`,{recursive:true});
await mkdir(`${dest}/native`,{recursive:true});
for(const name of ['host.py','install.py','setup.py']) await cp(`native/${name}`,`${dest}/native/${name}`);
await cp('docs/README.public.md',`${dest}/README.md`);
await cp('LICENSE',`${dest}/LICENSE`);
await writeFile(`${dest}/VERSION`,version+'\n');
const result=spawnSync('python3',['-c',
  'import pathlib,sys,zipfile; p=pathlib.Path(sys.argv[1]); z=zipfile.ZipFile(str(p)+".zip","w",zipfile.ZIP_DEFLATED); [z.write(f,f.relative_to(p.parent)) for f in sorted(p.rglob("*")) if f.is_file()]; z.close()',dest],{stdio:'inherit'});
assert.equal(result.status,0);
const filename=`hw-subtitles-${version}.zip`;
const sha256=createHash('sha256').update(await readFile(`${dest}.zip`)).digest('hex');
await writeFile('out/latest.json',JSON.stringify({version,filename,sha256},null,2)+'\n');
console.log(`${dest}.zip`);

const store=spawnSync('python3',['-c','import pathlib,zipfile; p=pathlib.Path("extension"); z=zipfile.ZipFile("out/cuebraid-webstore-'+version+'.zip","w",zipfile.ZIP_DEFLATED); [z.write(f,f.relative_to(p)) for f in sorted(p.rglob("*")) if f.is_file() and f.suffix in (".js",".json",".html",".css",".svg",".png")]; z.close()'],{stdio:'inherit'});
assert.equal(store.status,0);

const complete=spawnSync('python3',['-c','import pathlib,sys,zipfile; p=pathlib.Path(sys.argv[1]); z=zipfile.ZipFile("out/cuebraid-'+version+'.zip","w",zipfile.ZIP_DEFLATED); [z.write(f,pathlib.Path("cuebraid-'+version+'")/f.relative_to(p)) for f in sorted(p.rglob("*")) if f.is_file()]; z.close()',dest],{stdio:'inherit'});
assert.equal(complete.status,0);
