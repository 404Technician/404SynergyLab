import {uniqueModifiers} from './unique-reviews.mjs';
export const uniqueComboVersion='pob-bb52d6b-unique-combos2';
export function validateUniqueCombos(reference,details,reviews,data){
 if(data?.schemaVersion!==1||!['pob-bb52d6b-unique-combos1',uniqueComboVersion].includes(data.id)||data.referenceId!==reference.id||data.sourceRevision!==reference.sourceRevision||data.detailsId!==details.id||data.reviewsId!==reviews.id||data.status!=='candidate')throw new Error('Unique combinations version mismatch');
 const entries=new Map(reference.entries.map(e=>[e.id,e])),records=new Map(details.entries.map(e=>[e.id,e])),sources=new Map(reviews.entries.map(e=>[e.id,e])),ids=new Set();
 const text=v=>typeof v==='string'&&v.trim().length>0,list=v=>Array.isArray(v)&&v.length>0&&v.every(text);
 if(!Array.isArray(data.recipes)||!data.recipes.length)throw new Error('Missing unique combinations');
 for(const r of data.recipes){
  const item=entries.get(r.itemId),detail=records.get(r.itemId);
  if(!text(r.id)||ids.has(r.id)||item?.kind!=='unique'||!detail||detail.generated||r.itemRecordSha256!==item.evidence.recordSha256||r.itemRecordSha256!==detail.evidence.recordSha256)throw new Error('Invalid unique combination provenance');ids.add(r.id);
  const mods=uniqueModifiers(detail).map(m=>m.text).join('\n');
  if(!list(r.requiredFragments)||r.requiredFragments.some(f=>!mods.includes(f)))throw new Error('Unique combination modifier missing');
  if(!Array.isArray(r.skillIds)||!r.skillIds.length||new Set(r.skillIds).size!==r.skillIds.length||r.skillIds.some(id=>entries.get(id)?.kind!=='skill'||!sources.get(id)?.description))throw new Error('Invalid unique combination skills');
  if(!['title','hook','mechanics','evidenceStatus'].every(k=>text(r[k]))||!['play','conditions','avoid'].every(k=>list(r[k])))throw new Error('Missing unique combination explanation');
  if(!r.buildPlan||!['playstyle','firstTest','stopIf'].every(k=>text(r.buildPlan[k]))||!['components','nextChecks'].every(k=>list(r.buildPlan[k])))throw new Error('Missing unique combination test plan');
  const urls=[item.evidence.url,...r.skillIds.map(id=>(entries.get(id).effectEvidence||entries.get(id).evidence).url)];
  if(JSON.stringify(r.evidenceUrls)!==JSON.stringify(urls))throw new Error('Unique combination evidence mismatch');
 }
 return data;
}
export function discoverUniqueCombos(reference,data,kind,id){
 const entry=reference.entries.find(e=>e.id===id||e.reviewedId===id);
 if(!entry||!['skill','unique'].includes(kind))return [];
 return data.recipes.filter(r=>kind==='unique'?r.itemId===entry.id:r.skillIds.includes(entry.id)).map(r=>({...r,item:reference.entries.find(e=>e.id===r.itemId),skills:r.skillIds.map(id=>reference.entries.find(e=>e.id===id)),supportIdeas:[]}));
}
