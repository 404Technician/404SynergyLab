import {uniqueModifiers} from './unique-reviews.mjs';
export const uniqueComboVersion='pob-bb52d6b-unique-combos3';
export function uniqueRecipeItemIds(recipe){return [recipe.itemId,...(recipe.additionalItems||[]).map(e=>e.itemId)];}
export function validateUniqueCombos(reference,details,reviews,data){
 if(data?.schemaVersion!==1||!['pob-bb52d6b-unique-combos1','pob-bb52d6b-unique-combos2',uniqueComboVersion].includes(data.id)||data.referenceId!==reference.id||data.sourceRevision!==reference.sourceRevision||data.detailsId!==details.id||data.reviewsId!==reviews.id||data.status!=='candidate')throw new Error('Unique combinations version mismatch');
 const entries=new Map(reference.entries.map(e=>[e.id,e])),records=new Map(details.entries.map(e=>[e.id,e])),sources=new Map(reviews.entries.map(e=>[e.id,e])),ids=new Set();
 const text=v=>typeof v==='string'&&v.trim().length>0,list=v=>Array.isArray(v)&&v.length>0&&v.every(text);
 if(!Array.isArray(data.recipes)||!data.recipes.length)throw new Error('Missing unique combinations');
 for(const r of data.recipes){
  const item=entries.get(r.itemId),detail=records.get(r.itemId);
  if(!text(r.id)||ids.has(r.id)||item?.kind!=='unique'||!detail||detail.generated||r.itemRecordSha256!==item.evidence.recordSha256||r.itemRecordSha256!==detail.evidence.recordSha256)throw new Error('Invalid unique combination provenance');ids.add(r.id);
  const mods=uniqueModifiers(detail).map(m=>m.text).join('\n');
  if(!list(r.requiredFragments)||r.requiredFragments.some(f=>!mods.includes(f)))throw new Error('Unique combination modifier missing');
  if(r.additionalItems!==undefined){
   if(data.id!==uniqueComboVersion||!Array.isArray(r.additionalItems)||!r.additionalItems.length||r.additionalItems.length>2)throw new Error('Invalid additional unique records');
   const itemIds=uniqueRecipeItemIds(r);if(new Set(itemIds).size!==itemIds.length)throw new Error('Duplicate unique in recipe');
   for(const source of r.additionalItems){const e=entries.get(source.itemId),d=records.get(source.itemId);if(e?.kind!=='unique'||!d||d.generated||source.recordSha256!==e.evidence.recordSha256||source.recordSha256!==d.evidence.recordSha256||!list(source.requiredFragments)||source.requiredFragments.some(f=>!uniqueModifiers(d).some(m=>m.text.includes(f))))throw new Error('Invalid additional unique provenance');}
   const members=itemIds.map(id=>entries.get(id)),slots=new Map();for(const e of members){slots.set(e.category,(slots.get(e.category)||0)+1);if(slots.get(e.category)>(e.category==='ring'?2:1))throw new Error('Unique equipment slot conflict');}
   if(members.some(e=>e.name==="Thief's Torment")&&(slots.get('ring')||0)>1)throw new Error('Unique ring restriction');
   const weapons=members.filter(e=>['wand','mace','bow','staff','crossbow','sceptre','spear','talisman'].includes(e.category)),offhands=members.filter(e=>['shield','focus','quiver'].includes(e.category));
   if(weapons.length>1||offhands.length>1||(offhands.length&&weapons.some(e=>['staff','crossbow','talisman','mace'].includes(e.category)))||(weapons.some(e=>e.category==='bow')&&offhands.some(e=>e.category!=='quiver'))||(offhands.some(e=>e.category==='quiver')&&weapons.some(e=>e.category!=='bow')))throw new Error('Unique weapon slot conflict');
  }
  if(!Array.isArray(r.skillIds)||!r.skillIds.length||new Set(r.skillIds).size!==r.skillIds.length||r.skillIds.some(id=>entries.get(id)?.kind!=='skill'||!sources.get(id)?.description))throw new Error('Invalid unique combination skills');
  if(!['title','hook','mechanics','evidenceStatus'].every(k=>text(r[k]))||!['play','conditions','avoid'].every(k=>list(r[k])))throw new Error('Missing unique combination explanation');
  if(!r.buildPlan||!['playstyle','firstTest','stopIf'].every(k=>text(r.buildPlan[k]))||!['components','nextChecks'].every(k=>list(r.buildPlan[k])))throw new Error('Missing unique combination test plan');
  const urls=[...uniqueRecipeItemIds(r).map(id=>entries.get(id).evidence.url),...r.skillIds.map(id=>(entries.get(id).effectEvidence||entries.get(id).evidence).url)];
  if(JSON.stringify(r.evidenceUrls)!==JSON.stringify(urls))throw new Error('Unique combination evidence mismatch');
 }
 return data;
}
export function discoverUniqueCombos(reference,data,kind,id){
 const entry=reference.entries.find(e=>e.id===id||e.reviewedId===id);
 if(!entry||!['skill','unique'].includes(kind))return [];
 return data.recipes.filter(r=>kind==='unique'?uniqueRecipeItemIds(r).includes(entry.id):r.skillIds.includes(entry.id)).map(r=>({...r,item:reference.entries.find(e=>e.id===r.itemId),items:uniqueRecipeItemIds(r).map(id=>reference.entries.find(e=>e.id===id)),skills:r.skillIds.map(id=>reference.entries.find(e=>e.id===id)),supportIdeas:[]}));
}
