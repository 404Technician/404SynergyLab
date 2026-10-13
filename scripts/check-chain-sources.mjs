import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {validateChains} from '../src/chains.mjs';
const root=new URL('../',import.meta.url);
const reference=JSON.parse(await readFile(new URL('data/catalog/pob-bb52d6b-full-catalog1.json',root)));
const mechanics=JSON.parse(await readFile(new URL('data/mechanics/pob-bb52d6b-mechanics1.json',root)));
const data=validateChains(reference,mechanics,JSON.parse(await readFile(new URL('data/chains/pob-bb52d6b-chains1.json',root))));
if(!process.argv[2])throw new Error('Pass the pinned PoB checkout directory.');
const upstream=resolve(process.argv[2]);
const skills=await readFile(resolve(upstream,'src/Data/Skills/act_int.lua'),'utf8');
function record(id){const start=skills.indexOf('skills["'+id+'"] = {');if(start<0)throw new Error('Missing '+id);const next=skills.indexOf('\nskills["',start+1);return skills.slice(start,next<0?undefined:next);}
for(const rule of data.rules)for(const assertion of rule.sourceAssertions)if(!record(assertion.record).includes(assertion.text))throw new Error('Chain source assertion changed: '+assertion.record);
for(const p of data.persistent)if(!record(p.effectId).includes('description = "'+p.description+'"'))throw new Error('Persistent-minion description changed: '+p.id);
const helmets=await readFile(resolve(upstream,data.remapper.evidence.path),'utf8');
const start=helmets.indexOf('The Three Dragons\n'),end=helmets.indexOf(']]',start);
if(start<0)throw new Error('Missing remapping unique');
for(const line of data.remapper.sourceAssertions)if(!helmets.slice(start,end).includes(line))throw new Error('Ailment mapping changed');
const catalog=JSON.parse(await readFile(new URL('data/discovery/catalog.json',root)));
for(const item of catalog.items.filter(i=>i.id==='the-three-dragons'))if(createHash('sha256').update(helmets).digest('hex')!==item.evidence.fileSha256)throw new Error('Remapping source fingerprint changed');
console.log('Three meta triggers, nine persistent-minion records and the remapping unique match the pinned source.');

for(const restriction of data.restrictions){
 const text=await readFile(resolve(upstream,restriction.path),'utf8');
 const start=text.indexOf('skills["'+restriction.effectId+'"] = {'),end=text.indexOf('\nskills["',start+1);
 if(start<0||restriction.assertions.some(a=>!text.slice(start,end<0?undefined:end).includes(a)))throw new Error('Support restriction source changed: '+restriction.id);
}
console.log('Role-scoped critical/elemental restrictions match their exact source support records.');

for(const rule of data.rules){
 const text=record(rule.supportEffectId);
 for(const [key,lua] of [['requiredTypes','requireSkillTypes'],['excludedTypes','excludeSkillTypes'],['addedTypes','addSkillTypes']]){
  const expression=text.match(new RegExp(lua+' = \\{([^}]*)\\}'))?.[1];
  const types=[...(expression||'').matchAll(/SkillType\.([A-Za-z0-9_]+)/g)].map(m=>m[1]);
  if(JSON.stringify(types)!==JSON.stringify(rule[key]))throw new Error('Socket predicate mismatch: '+rule.id+' '+key);
 }
}
for(const p of data.persistent)if(!/^(Activate to summon .*Reviving|Summon the spirit of the bound monster as a Reviving Minion)/.test(p.description))throw new Error('Unproven persistent-minion classification');
