import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { buildReferenceCatalog } from '../src/reference-import.mjs';
const root=new URL('../',import.meta.url);
const manifest=JSON.parse(await readFile(new URL('data/catalog/manifest.json',root)));
const directory=process.argv[2];if(!directory)throw new Error('Usage: node scripts/import-catalog.mjs PATH-TO-PINNED-POB [--check]');
const cwd=resolve(directory);
if(execFileSync('git',['rev-parse','HEAD'],{cwd,encoding:'utf8'}).trim()!==manifest.revision)throw new Error('Full catalog source revision mismatch');
const files={};
for(const path of [manifest.gemPath,...manifest.skillPaths,...manifest.uniquePaths,...manifest.specialUniquePaths])files[path]=await readFile(resolve(cwd,path),'utf8');
const discovery=JSON.parse(await readFile(new URL('data/discovery/catalog.json',root)));
const snapshot=JSON.parse(await readFile(new URL('data/snapshots/'+discovery.snapshotId+'.json',root)));
const result=buildReferenceCatalog(manifest,files,snapshot,discovery),bytes=JSON.stringify(result,null,2)+'\n';
const target=new URL('data/catalog/'+manifest.id+'.json',root);
if(process.argv.includes('--check')){
 if(await readFile(target,'utf8')!==bytes)throw new Error('Full catalog differs from reproducible pinned source import');
 console.log('Full catalog matches its pinned sources: '+result.counts.skill+' skills, '+result.counts.support+' supports, '+result.counts.unique+' uniques.');
}else{await writeFile(target,bytes);console.log('Imported full source catalog: '+manifest.id);}
