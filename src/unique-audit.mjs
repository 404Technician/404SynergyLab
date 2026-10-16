import {uniqueRecipeItemIds} from './unique-combos.mjs';
// Coverage describes recorded research, never all combinations that could exist in game.
const equipment=new Set(['Andvarius','Ashrend','Astramentis',"Atziri's Step",'Aurseize','Black Sun Crest','Blackbraid','Bronzebeard','Briskwrap','Cornathaum','Crown of the Victor',"Erian's Cobble",'Eye of Chayula','Goldrim',"Greed's Embrace",'Infernoclasp','Innsmouth','Legionstride',"Obern's Bastion",'Perandus Seal',"Quatl's Molt",'Revered Resin','Rondel of Fragility','Thrillsteel','Thunderstep','Vigilant View','Wanderlust','Wondertrap']);
export function auditUniqueCoverage(reference,details,...collections){
 const items=reference.entries.filter(e=>e.kind==='unique'),records=new Map(details.entries.map(e=>[e.id,e])),lookup=new Map();
 for(const e of items){lookup.set(e.id,e.id);if(e.reviewedId)lookup.set(e.reviewedId,e.id);}
 const recipes=new Map(items.map(e=>[e.id,new Set()]));
 for(const collection of collections)for(const r of collection.recipes){if(!r.itemId)continue;for(const itemId of uniqueRecipeItemIds(r)){const id=lookup.get(itemId);if(!id)throw new Error('Coverage recipe references unknown unique');recipes.get(id).add(r.id);}}
 const entries=items.map(e=>{
  const detail=records.get(e.id);if(!detail||detail.evidence.recordSha256!==e.evidence.recordSha256)throw new Error('Unique coverage provenance mismatch');
  const recipeIds=[...recipes.get(e.id)],variants=[...new Set(detail.modifiers.flatMap(m=>m.variants))];
  let status,reason;
  if(recipeIds.length){status='researched';reason=recipeIds.length+' explicit source-based combination'+(recipeIds.length===1?' is':'s are')+' recorded. Costs, conditions and in-game performance still need testing.';}
  else if(detail.generated){status='generated';reason='The actual generated rolls are not expanded. No fixed skill partner is inferred from this family record.';}
  else if(variants.length&&!variants.includes('Current')){status='variant';reason='Named alternatives need an actual item selection. No recipe is established for a specific alternative yet.';}
  else if(equipment.has(e.name)){status='equipment';reason='General equipment role: compare the shown stats and tradeoffs with your build. No specific researched skill interaction is recorded.';}
  else{status='open';reason='Open research: no explicit combination is established here yet. This does not mean that no possible combination exists.';}
  return {id:e.id,status,reason,recipeIds};
 });
 const counts=Object.fromEntries(['researched','equipment','open','variant','generated'].map(s=>[s,entries.filter(e=>e.status===s).length]));
 return {entries,counts,total:items.length};
}
export function renderUniqueCoverageReport(reference,details,...collections){
 const audit=auditUniqueCoverage(reference,details,...collections),entries=new Map(reference.entries.map(e=>[e.id,e])),recipes=new Map(collections.flatMap(c=>c.recipes).map(r=>[r.id,r]));
 const labels={researched:'Explicit recipes',equipment:'General equipment',open:'Open research',variant:'Variant selection needed',generated:'Actual rolls needed'};
 let out='# Unique combination coverage\n\n';
 out+='This is recorded source-based research coverage, not a claim to list every possible in-game combination. An open entry is not evidence that an item has no combinations.\n\n';
 out+='Source revision: `'+reference.sourceRevision+'`. Details: `'+details.id+'`. Unique recipes: `'+collections.at(-1).id+'`.\n\n';
 out+='| Status | Uniques |\n|---|---:|\n';for(const [status,count]of Object.entries(audit.counts))out+='| '+labels[status]+' | '+count+' |\n';
 out+='\nGenerated families require actual rolls. Named alternate variants need a real selection. General equipment entries retain their stat comparisons; they are not padded with arbitrary skill partners. All explicit recipes include source evidence, conditions and a first test. Live-client performance remains untested.\n\n';
 out+='Regenerate with `npm run uniques:coverage`; verify with `npm run uniques:coverage -- --check`. The source provenance check also verifies this report.\n\n';
 out+='For multi-unique entries, each semicolon-separated pair is a separate recipe, not a requirement to equip every listed alternative together.\n\n';
 out+='| Unique / base | Research state | Recorded skill partners | Required items per multi-unique recipe |\n|---|---|---|---|\n';
 for(const row of audit.entries){const e=entries.get(row.id),skills=[...new Set(row.recipeIds.flatMap(id=>recipes.get(id).skillIds).map(id=>entries.get(id)?.name||id))];const pairs=row.recipeIds.map(id=>recipes.get(id)).filter(r=>r.additionalItems?.length).map(r=>uniqueRecipeItemIds(r).map(id=>entries.get(id).name).join(' + '));out+='| '+e.name+' / '+e.base+' | '+labels[row.status]+' | '+(skills.join(', ')||'No explicit recipe established')+' | '+(pairs.join('; ')||'—')+' |\n';}
 return out;
}
