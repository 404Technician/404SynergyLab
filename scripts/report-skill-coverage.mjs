import {readFile,writeFile} from 'node:fs/promises';
import {skillComboCoverage} from '../src/skill-combos.mjs';
const root=new URL('../',import.meta.url),read=async p=>JSON.parse(await readFile(new URL(p,root)));
const reference=await read('data/catalog/pob-bb52d6b-full-catalog1.json'),reviews=await read('data/research/pob-bb52d6b-skill-reviews1.json'),skills=await read('data/discovery/pob-bb52d6b-skill-combos4.json'),uniques=await read('data/discovery/pob-bb52d6b-unique-combos4.json'),curated=await read('data/discovery/catalog.json');
const covered=new Set([...skills.recipes,...uniques.recipes,...curated.recipes].flatMap(r=>r.skillIds)),sources=new Map(reviews.entries.map(r=>[r.id,r]));
const entries=reference.entries.filter(e=>e.kind==='skill').map(e=>{
 const source=sources.get(e.id);if(!source)throw new Error('Missing source guide: '+e.id);
 const status=covered.has(e.id)?'Explicit recipes':e.name.includes('{0}')?'Bound template':!source.description?'Description missing':source.fromItem?'Granted access needs review':'Open combination research';
 return {...e,status,recipes:[...skills.recipes,...uniques.recipes,...curated.recipes].filter(r=>r.skillIds.includes(e.id)).length};
}).sort((a,b)=>a.name.localeCompare(b.name)||a.id.localeCompare(b.id));
const counts=new Map();for(const e of entries)counts.set(e.status,(counts.get(e.status)||0)+1);
const coverage=skillComboCoverage(reference,skills,curated,uniques),escape=s=>s.replaceAll('|','\\|').replaceAll('\n',' ');
const report=['# Skill combination coverage','','Recorded coverage is not every possible in-game combination. A source guide is not a proven build.','','Source revision: `'+reference.sourceRevision+'`. Active skill collection: `'+skills.id+'`; unique collection: `'+uniques.id+'`.','',coverage.recipes+' recorded combinations cover '+coverage.skills+' / '+coverage.totalSkills+' skills. All '+entries.length+' records retain their source guides.','','| Research state | Skills |','|---|---:|',...[...counts].sort().map(([state,count])=>'| '+state+' | '+count+' |'),'','Start with described, independently available skills in Open combination research. Granted sources require actual item, ascendancy or other access checks. Bound templates do not specify the chosen creature; missing descriptions are not replaced with invented mechanics. No priority label is a damage ranking.','','Regenerate with `npm run skills:coverage`; verify with `npm run skills:coverage -- --check`.','','| Skill / source ID | Research state | Recipes |','|---|---|---:|',...entries.map(e=>'| ['+escape(e.name)+']('+((e.effectEvidence||e.evidence).url)+') · `'+e.id+'` | '+e.status+' | '+e.recipes+' |'),''].join('\n');
const target=new URL('docs/SKILL_COVERAGE.md',root);
if(process.argv.includes('--check')){if(await readFile(target,'utf8')!==report)throw new Error('Skill coverage report is stale');console.log('All '+entries.length+' skill coverage rows match the recorded recipes.');}
else{await writeFile(target,report);console.log(JSON.stringify({recipes:coverage.recipes,skills:coverage.skills,states:Object.fromEntries(counts)}));}
