import {buildSkillReviews} from '../src/skill-reviews-import.mjs';
import {validateSkillCombos} from '../src/skill-combos.mjs';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { checksum } from '../src/data.mjs';
import { verifyDiscoveryEntity } from '../src/discovery-records.mjs';
import { extractRecord } from '../src/pob-import.mjs';
import { validateDiscoveryCatalog } from '../src/discovery.mjs';
const catalog=JSON.parse(await readFile(new URL('../data/discovery/catalog.json',import.meta.url)));
const snapshot=JSON.parse(await readFile(new URL(`../data/snapshots/${catalog.snapshotId}.json`,import.meta.url)));
validateDiscoveryCatalog(snapshot,catalog);
const directory=process.argv[2];if(!directory)throw new Error('Usage: node scripts/check-discovery-source.mjs PATH-TO-PINNED-POB');
const cwd=resolve(directory),revision=execFileSync('git',['rev-parse','HEAD'],{cwd,encoding:'utf8'}).trim();if(revision!==catalog.sourceRevision)throw new Error('Discovery source revision mismatch');
const paths=new Set([...catalog.extraSupports,...catalog.extraSkills].map(s=>s.evidence.path));for(const check of catalog.mechanicChecks)paths.add(check.path);paths.add('src/Data/Uniques/helmet.lua');const files={};
for(const path of paths)files[path]=execFileSync('git',['show',revision+':'+path],{cwd,encoding:'utf8',maxBuffer:16*1024*1024});
for(const entity of [...catalog.extraSupports,...catalog.extraSkills])verifyDiscoveryEntity(files[entity.evidence.path],entity,revision);
for(const check of catalog.mechanicChecks){
 const record=extractRecord(files[check.path],check.effectId);
 if(checksum(record.text)!==check.recordSha256)throw new Error('Mechanic source record changed');
 const description=record.text.match(/^\tdescription = (.+),$/m)?.[1];
 if(check.descriptionSha256 && checksum(description)!==check.descriptionSha256)throw new Error('Mechanic description changed');
 if(check.requiredFragments.some(fragment=>!description?.includes(fragment)))throw new Error('Mechanic source fragment missing');
 for(const [field,key] of [['requireSkillTypes','requiredTypes'],['excludeSkillTypes','excludedTypes']])if(check[key]!==undefined){
  const literal=record.text.match(new RegExp('^\\t'+field+' = (.+),$','m'))?.[1];
  if(!literal)throw new Error('Missing mechanic predicate');
  const tokens=[...literal.matchAll(/SkillType\.([A-Za-z0-9_]+)/g)].map(m=>m[1]);
  if(JSON.stringify(tokens)!==JSON.stringify(check[key]))throw new Error('Mechanic socket predicate changed');
 }
}
for(const item of catalog.items.filter(i=>i.evidence.path==='src/Data/Uniques/helmet.lua')){
 const source=files[item.evidence.path],block=[...source.matchAll(/\[\[\r?\n([\s\S]*?)\]\]/g)].find(m=>m[1].split(/\r?\n/)[0]===item.name);
 if(!block||checksum(source)!==item.evidence.fileSha256||checksum(block[1])!==item.evidence.recordSha256)throw new Error('Unique discovery item changed');
 if(item.mechanic==='presence-ignite'&&!block[1].includes('{variant:2}Enemies in your Presence are Ignited as though dealt 200 Base Fire Damage'))throw new Error('Presence ignition item variant changed');
}
const item=catalog.items.find(i=>i.id==='the-three-dragons'),source=files[item.evidence.path],block=[...source.matchAll(/\[\[\r?\n([\s\S]*?)\]\]/g)].find(m=>m[1].split(/\r?\n/)[0]===item.name);
if(!block||checksum(source)!==item.evidence.fileSha256||checksum(block[1])!==item.evidence.recordSha256)throw new Error('Ailment-remapping item evidence changed');
const clean=s=>s.replace(/ Chance| Magnitudes| Magnitude| Buildup/g,'').replace(/ or /g,' and ');
const observed=[...block[1].matchAll(/^(Fire|Cold|Lightning) Damage from Hits Contributes to (.+) instead of (.+)$/gm)].map(m=>({damage:m[1],contributesTo:clean(m[2]),replaces:clean(m[3])}));
if(JSON.stringify(observed)!==JSON.stringify(item.ailmentMap))throw new Error('Ailment-remapping facts do not match the source');
console.log('Discovery source fingerprints and support predicates match the pinned revision.');

const reference=JSON.parse(await readFile(new URL('../data/catalog/pob-bb52d6b-full-catalog1.json',import.meta.url)));
const comboMechanics=JSON.parse(await readFile(new URL('../data/mechanics/pob-bb52d6b-mechanics1.json',import.meta.url)));
const combos=validateSkillCombos(reference,JSON.parse(await readFile(new URL('../data/discovery/pob-bb52d6b-skill-combos3.json',import.meta.url))),comboMechanics);
for(const source of combos.sources){
 const entry=reference.entries.find(e=>e.id===source.id),path=source.evidence.path;
 if(!files[path])files[path]=execFileSync('git',['show',revision+':'+path],{cwd,encoding:'utf8',maxBuffer:16*1024*1024});
 const record=extractRecord(files[path],entry.effectId);
 const literal=record.text.match(/^\tdescription = (.+),$/m)?.[1];
 if(record.line!==source.evidence.line||checksum(record.text)!==source.evidence.recordSha256||!literal||JSON.parse(literal)!==source.description)throw new Error('Skill combination source changed: '+entry.name);
}
console.log(combos.recipes.length+' skill combinations: exact descriptions and source fingerprints match.');

const gems=execFileSync('git',['show',revision+':src/Data/Gems.lua'],{cwd,encoding:'utf8',maxBuffer:16*1024*1024});
const gemStarts=[...gems.matchAll(/^\t\["([^"]+)"\] = \{/gm)],gemBlocks=new Map(gemStarts.map((m,i)=>[m[1],gems.slice(m.index,gemStarts[i+1]?.index??gems.length)]));
let socketCount=0;
for(const recipe of combos.recipes)for(const check of recipe.socketChecks||[]){
 const path=check.evidence.path;if(!files[path])files[path]=execFileSync('git',['show',revision+':'+path],{cwd,encoding:'utf8',maxBuffer:16*1024*1024});
 const record=extractRecord(files[path],check.effectId),container=reference.entries.find(e=>e.id===check.containerId),gem=gemBlocks.get(container.gemId);
 if(checksum(record.text)!==check.evidence.recordSha256||record.line!==check.evidence.line||![...(gem||'').matchAll(/additionalGrantedEffectId[0-9]+ = "([^"]+)"/g)].some(m=>m[1]===check.effectId)||!/^\tsupport = true,/m.test(record.text))throw new Error('Socket association changed');
 for(const[field,key]of[['requireSkillTypes','requiredTypes'],['excludeSkillTypes','excludedTypes']]){const literal=record.text.match(new RegExp('^\\t'+field+' = (.+),$','m'))?.[1];const tokens=[...(literal||'').matchAll(/SkillType\.([A-Za-z0-9_]+)/g)].map(m=>m[1]);if(!literal||JSON.stringify(tokens)!==JSON.stringify(check[key]))throw new Error('Socket predicate changed');}
 socketCount++;
}
console.log(socketCount+' socket predicates and their actual gem associations checked.');

for(const entry of reference.entries.filter(e=>e.kind==='skill')){const path=(entry.effectEvidence||entry.evidence).path;if(!files[path])files[path]=execFileSync('git',['show',revision+':'+path],{cwd,encoding:'utf8',maxBuffer:16*1024*1024});}
const allReviews=buildSkillReviews(reference,files),reviewBytes=JSON.stringify(allReviews,null,2)+'\n';
if(await readFile(new URL('../data/research/'+allReviews.id+'.json',import.meta.url),'utf8')!==reviewBytes)throw new Error('Complete skill review data changed');
console.log(allReviews.entries.length+' skill source guides match the pinned records.');
