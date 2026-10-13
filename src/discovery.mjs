import { analyze } from './engine.mjs';
import { validateSnapshot } from './validation.mjs';
export function validateDiscoveryCatalog(snapshot,catalog) {
 validateSnapshot(snapshot);const need=(ok,message)=>{if(!ok)throw new Error(message);};
 need(catalog?.schemaVersion===1&&catalog.snapshotId===snapshot.id&&catalog.rulesVersion==='discovery-1'&&catalog.status==='candidate','Discovery catalog version mismatch');
 need(Array.isArray(catalog.items)&&Array.isArray(catalog.extraSupports)&&Array.isArray(catalog.recipes),'Invalid discovery catalog');
 const ids=new Set();for(const item of catalog.items){need(item.id&&!ids.has(item.id)&&item.name,'Duplicate discovery item');ids.add(item.id);need(item.evidence&&/^https:\/\//.test(item.evidence.url),'Missing item evidence');}
 const supports=new Set(snapshot.entities.filter(e=>e.kind==='support').map(e=>e.id));
 for(const s of catalog.extraSupports){need(s.kind==='support'&&!supports.has(s.id),'Duplicate discovery support');supports.add(s.id);need(/^[a-f0-9]{64}$/.test(s.evidence?.descriptionSha256),'Missing support evidence fingerprint');}
 const augmented={...snapshot,entities:[...snapshot.entities,...catalog.extraSupports]};validateSnapshot(augmented);
 const seen=new Set();for(const r of catalog.recipes){
  need(r.id&&!seen.has(r.id),'Duplicate discovery idea');seen.add(r.id);need(r.itemId===null||ids.has(r.itemId),'Unknown idea unique');
  need(Array.isArray(r.skillIds)&&r.skillIds.length>0&&new Set(r.skillIds).size===r.skillIds.length&&r.skillIds.every(id=>snapshot.entities.some(e=>e.kind==='skill'&&e.id===id)),'Unknown idea skill');
  for(const k of ['title','hook','mechanics'])need(typeof r[k]==='string'&&r[k].length>0,'Missing idea explanation');
  for(const k of ['play','conditions','avoid','evidenceUrls'])need(Array.isArray(r[k])&&r[k].length>0&&r[k].every(s=>typeof s==='string'&&s.length>0),'Missing idea conditions/evidence');
  const plan=r.buildPlan;need(plan&&['playstyle','firstTest','stopIf'].every(k=>typeof plan[k]==='string'&&plan[k].trim().length>0)&&['components','nextChecks'].every(k=>Array.isArray(plan[k])&&plan[k].length>0&&plan[k].every(v=>typeof v==='string'&&v.trim().length>0)),'Missing build experiment plan');
  need(r.evidenceUrls.every(u=>/^https:\/\//.test(u)),'Unsafe idea evidence URL');need(Array.isArray(r.supports)&&r.supports.length>0,'Missing idea supports');
  for(const role of r.supports){need(r.skillIds.includes(role.skillId)&&supports.has(role.supportId)&&role.reason&&role.tradeoff,'Invalid support role');need(analyze(augmented,role.skillId).results.find(s=>s.id===role.supportId)?.status==='compatible','Idea support no longer matches its target');}
 }return augmented;
}
export function discover(snapshot,catalog,anchor) {
 const augmented=validateDiscoveryCatalog(snapshot,catalog);
 if(!anchor||!['skill','unique'].includes(anchor.kind))throw new Error('Invalid discovery starting point');
 const target=anchor.kind==='skill'?snapshot.entities.find(e=>e.kind==='skill'&&e.id===anchor.id):catalog.items.find(i=>i.id===anchor.id);
 if(!target)throw new Error('Unknown discovery starting point');
 return {anchor:{...anchor,name:target.name},snapshotId:snapshot.id,status:catalog.status,limits:catalog.limits,
 ideas:catalog.recipes.filter(r=>anchor.kind==='skill'?r.skillIds.includes(anchor.id):r.itemId===anchor.id).map(r=>({...r,item:r.itemId?catalog.items.find(i=>i.id===r.itemId):null,
 skills:r.skillIds.map(id=>snapshot.entities.find(e=>e.id===id)),
 supportIdeas:r.supports.map(role=>({...role,support:augmented.entities.find(e=>e.id===role.supportId),typeStatus:analyze(augmented,role.skillId).results.find(s=>s.id===role.supportId).status})),
 evidenceStatus:'conditional source-backed concept; not playtested'}))};
}
