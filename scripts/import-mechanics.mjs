import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { buildMechanics } from '../src/mechanics-import.mjs';
import { validateReferenceCatalog } from '../src/reference-catalog.mjs';
const root=new URL('../',import.meta.url),manifest=JSON.parse(await readFile(new URL('data/mechanics/manifest.json',root)));
const directory=process.argv[2];if(!directory)throw new Error('Usage: node scripts/import-mechanics.mjs PATH-TO-PINNED-POB [--check]');
const cwd=resolve(directory);
if(execFileSync('git',['rev-parse','HEAD'],{cwd,encoding:'utf8'}).trim()!==manifest.sourceRevision)throw new Error('Mechanic source revision mismatch');
const reference=validateReferenceCatalog(JSON.parse(await readFile(new URL('data/catalog/'+manifest.referenceId+'.json',root))));
const files={};for(const source of reference.sources)files[source.path]=await readFile(resolve(cwd,source.path),'utf8');
const data=buildMechanics(reference,files);
if(data.id!==manifest.id||data.rulesVersion!==manifest.rulesVersion)throw new Error('Mechanic manifest mismatch');
const bytes=JSON.stringify(data,null,2)+'\n',target=new URL('data/mechanics/'+manifest.id+'.json',root);
if(process.argv.includes('--check')){if(await readFile(target,'utf8')!==bytes)throw new Error('Mechanics differ from reproducible pinned source import');console.log('Mechanic profiles match all pinned catalog sources.');}
else {await writeFile(target,bytes);console.log('Imported mechanical source profiles: '+data.id);}
