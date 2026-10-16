import {uniqueModifiers} from './unique-reviews.mjs';
import {checkSupportTypes} from './mechanics.mjs';
export const specialTags={all:'All discoveries',chaos:'Chaos',freeze:'Freeze',poison:'Poison',chain:'Chain reactions',unique:'Build-defining uniques',corpses:'Corpse mechanics'};
const need=(ok,message)=>{if(!ok)throw new Error('Special interactions: '+message);};
const text=v=>typeof v==='string'&&v.trim().length>0;
const strings=v=>Array.isArray(v)&&v.length>0&&v.every(text);
export function validateSpecialInteractions(reference,details,reviews,mechanics,data){
 need(data?.id==='pob-bb52d6b-special-interactions1'&&data.referenceId===reference.id&&data.sourceRevision===reference.sourceRevision,'source version mismatch');
 need(Array.isArray(data.entries)&&data.entries.length>0&&data.entries.length<=50,'invalid entries');
 const records=new Map(reference.entries.map(r=>[r.id,r])),detailMap=new Map(details.entries.map(r=>[r.id,r])),reviewMap=new Map(reviews.entries.map(r=>[r.id,r])),profiles=new Map(mechanics.profiles.map(r=>[r.id,r])),seen=new Set();
 for(const idea of data.entries){
  need(text(idea.id)&&!seen.has(idea.id),'duplicate or invalid ID');seen.add(idea.id);
  for(const key of ['title','hook','why','firstTest','inspiration'])need(text(idea[key]),idea.id+' missing '+key);
  for(const key of ['chain','steps','pitfalls','tags'])need(strings(idea[key]),idea.id+' missing '+key);
  need(idea.tags.every(t=>t!=='all'&&Object.hasOwn(specialTags,t)),'unknown tag');need(['direct','combined'].includes(idea.basis),'unknown evidence basis');
  need(Array.isArray(idea.components)&&idea.components.length>=2&&new Set(idea.components.map(c=>c.id)).size===idea.components.length,'invalid components');
  for(const c of idea.components){
   const r=records.get(c.id);need(r&&text(c.role)&&strings(c.requiredFragments),'missing component');
   need(c.recordSha256===(r.effectEvidence||r.evidence).recordSha256,'changed source for '+r.name);
   const detail=detailMap.get(r.id),description=r.kind==='unique'?uniqueModifiers(detail).map(m=>m.text).join('\n'):r.kind==='skill'?reviewMap.get(r.id)?.description:detail?.description;
   need(description&&c.requiredFragments.every(f=>description.toLowerCase().includes(f.toLowerCase())),'required effect missing for '+r.name+' in '+idea.id);
  }
  need(Array.isArray(idea.supportPairs),'missing support assignments');
  for(const pair of idea.supportPairs){
   const skill=records.get(pair.skillId),support=records.get(pair.supportId);
   need(skill?.kind==='skill'&&support?.kind==='support'&&[pair.skillId,pair.supportId].every(id=>idea.components.some(c=>c.id===id)),'invalid support assignment');
   need(checkSupportTypes(profiles.get(pair.skillId),profiles.get(pair.supportId)).status!=='incompatible','excluded support assignment');
  }
 }
 return data;
}
export function filterSpecialInteractions(data,{tag='all',query=''}={}){
 need(Object.hasOwn(specialTags,tag)&&typeof query==='string'&&query.length<=200,'invalid discovery filters');
 const q=query.trim().toLowerCase();return data.entries.filter(i=>(tag==='all'||i.tags.includes(tag))&&(!q||[i.title,i.hook,i.why,...i.chain,...i.pitfalls,...i.components.map(c=>c.name||'')].join(' ').toLowerCase().includes(q)));
}
export function resolveSpecialInteractions(data,reference){
 const records=new Map(reference.entries.map(r=>[r.id,r]));
 return {...data,entries:data.entries.map(i=>({...i,components:i.components.map(c=>({...c,...records.get(c.id),role:c.role}))}))};
}
