import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { checksum } from '../src/data.mjs';
import { extractRecord } from '../src/pob-import.mjs';
import { validateDiscoveryCatalog } from '../src/discovery.mjs';
const catalog=JSON.parse(await readFile(new URL('../data/discovery/catalog.json',import.meta.url)));
const snapshot=JSON.parse(await readFile(new URL(`../data/snapshots/${catalog.snapshotId}.json`,import.meta.url)));
validateDiscoveryCatalog(snapshot,catalog);
const directory=process.argv[2];if(!directory)throw new Error('Usage: node scripts/check-discovery-source.mjs PATH-TO-PINNED-POB');
const cwd=resolve(directory),revision=execFileSync('git',['rev-parse','HEAD'],{cwd,encoding:'utf8'}).trim();if(revision!==catalog.sourceRevision)throw new Error('Discovery source revision mismatch');
const paths=new Set(catalog.extraSupports.map(s=>s.evidence.path));paths.add('src/Data/Uniques/helmet.lua');const files={};
for(const path of paths)files[path]=execFileSync('git',['show',revision+':'+path],{cwd,encoding:'utf8',maxBuffer:16*1024*1024});
for(const support of catalog.extraSupports){
 const source=files[support.evidence.path],record=extractRecord(source,support.evidence.effectId);
 if(checksum(source)!==support.evidence.fileSha256||checksum(record.text)!==support.evidence.recordSha256||checksum(record.text.match(/^\tdescription = (.+),$/m)[1])!==support.evidence.descriptionSha256)throw new Error('Discovery support evidence changed');
 for(const [field,key]of [['requireSkillTypes','requiredTypes'],['excludeSkillTypes','excludedTypes']]){
 const literal=record.text.match(new RegExp('^\\t'+field+' = (.+),$','m'))[1],tokens=[...literal.matchAll(/SkillType\.([A-Za-z0-9_]+)/g)].map(m=>m[1]);if(JSON.stringify(tokens)!==JSON.stringify(support.compatibility[key]))throw new Error('Discovery support predicate mismatch');
 }
}
const item=catalog.items.find(i=>i.id==='the-three-dragons'),source=files[item.evidence.path],block=[...source.matchAll(/\[\[\r?\n([\s\S]*?)\]\]/g)].find(m=>m[1].split(/\r?\n/)[0]===item.name);
if(!block||checksum(source)!==item.evidence.fileSha256||checksum(block[1])!==item.evidence.recordSha256)throw new Error('Ailment-remapping item evidence changed');
const clean=s=>s.replace(/ Chance| Magnitudes| Magnitude| Buildup/g,'').replace(/ or /g,' and ');
const observed=[...block[1].matchAll(/^(Fire|Cold|Lightning) Damage from Hits Contributes to (.+) instead of (.+)$/gm)].map(m=>({damage:m[1],contributesTo:clean(m[2]),replaces:clean(m[3])}));
if(JSON.stringify(observed)!==JSON.stringify(item.ailmentMap))throw new Error('Ailment-remapping facts do not match the source');
console.log('Discovery source fingerprints and support predicates match the pinned revision.');
