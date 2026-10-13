import { matchesTypeExpression, describeTypeExpression, validateTypeExpression } from './type-expression.mjs';
const words=x=>Array.isArray(x)&&x.every(t=>typeof t==='string'&&/^[A-Za-z][A-Za-z0-9_]*$/.test(t));
const evidence=x=>x&&typeof x.path==='string'&&Number.isInteger(x.line)&&x.line>0&&/^https:\/\//.test(x.url);
export function validateMechanics(reference,data){
 if(data?.schemaVersion!==1||data.rulesVersion!=='mechanic-links-1'||data.status!=='candidate'||data.referenceId!==reference.id||data.sourceRevision!==reference.sourceRevision||!data.id)throw new Error('Mechanics version mismatch');
 const records=new Map(reference.entries.map(e=>[e.id,e])),seen=new Set();
 if(!Array.isArray(data.profiles)||data.profiles.length!==reference.entries.length)throw new Error('Incomplete mechanics coverage');
 for(const p of data.profiles){
  const entry=records.get(p.id);
  if(!entry||seen.has(p.id)||p.kind!==entry.kind||!['structured','partial','catalog-only'].includes(p.status)||!Array.isArray(p.mechanics)||!Array.isArray(p.unknowns))throw new Error('Invalid mechanic profile');seen.add(p.id);
  if(p.kind==='skill'&&(!words(p.skillTypes)||!p.skillTypes.length||!words(p.minionTypes)||!words(p.damageHints)||typeof p.cannotBeSupported!=='boolean'||typeof p.minionContext!=='boolean'||!evidence(p.evidence)))throw new Error('Invalid skill mechanic profile');
  if(p.kind==='support'){validateTypeExpression(p.requiredTypes);validateTypeExpression(p.excludedTypes);validateTypeExpression(p.addedTypes);if(!words(p.contextFlags)||!Array.isArray(p.warnings)||!p.warnings.every(w=>typeof w==='string')||!evidence(p.evidence))throw new Error('Invalid support mechanic profile');}
  for(const m of p.mechanics){
   if(!['conversion','grant','trigger'].includes(m.kind)||!evidence(m.evidence)||!/^[a-f0-9]{64}$/.test(m.evidence.lineSha256)||!Array.isArray(m.variants)||!m.variants.every(n=>Number.isInteger(n)&&n>0))throw new Error('Invalid item mechanic');
   if(m.kind==='conversion'&&(m.scope!=='player'||!['Physical','Fire','Cold','Lightning','Chaos','Elemental'].includes(m.from)||!['Physical','Fire','Cold','Lightning','Chaos'].includes(m.to)||!Number.isInteger(m.percent)||m.percent<1||m.percent>100))throw new Error('Unsupported conversion mechanic');
   if(m.kind!=='conversion'&&(typeof m.skillName!=='string'||!m.skillName.length))throw new Error('Missing granted skill');
   if(m.kind==='trigger'&&(typeof m.event!=='string'||typeof m.requiresCritical!=='boolean'))throw new Error('Missing trigger event');
  }
 }
 const counts={skills:data.profiles.filter(p=>p.kind==='skill').length,supports:data.profiles.filter(p=>p.kind==='support').length,uniques:data.profiles.filter(p=>p.kind==='unique').length,
  recognizedUniques:data.profiles.filter(p=>p.kind==='unique'&&p.mechanics.length).length,catalogOnlyUniques:data.profiles.filter(p=>p.kind==='unique'&&!p.mechanics.length).length,
  conversions:data.profiles.flatMap(p=>p.mechanics).filter(m=>m.kind==='conversion').length,grants:data.profiles.flatMap(p=>p.mechanics).filter(m=>m.kind==='grant').length,triggers:data.profiles.flatMap(p=>p.mechanics).filter(m=>m.kind==='trigger').length};
 if(JSON.stringify(counts)!==JSON.stringify(data.coverage))throw new Error('Mechanics coverage count mismatch');return data;
}
export function checkSupportTypes(skill,support){
 const outcome=(status,reason)=>({status,reason,warnings:support.warnings});
 if(skill.cannotBeSupported)return outcome('incompatible','The source marks this skill as unable to receive supports.');
 if(support.excludedTypes.length&&matchesTypeExpression(support.excludedTypes,skill.skillTypes))return outcome('incompatible','Excluded by base source rule: '+describeTypeExpression(support.excludedTypes));
 const base=!support.requiredTypes.length||matchesTypeExpression(support.requiredTypes,skill.skillTypes);
 const minion=skill.minionTypes.length&&matchesTypeExpression(support.requiredTypes,[...skill.skillTypes,...skill.minionTypes]);
 if(!base&&!minion)return outcome('incompatible','Does not satisfy recorded types: '+describeTypeExpression(support.requiredTypes));
 if(!base||skill.minionContext||support.contextFlags.length)return outcome('unknown','Potential type route, but minion, trigger or added-type context is not simulated.');
 return outcome('compatible','Base types match '+describeTypeExpression(support.requiredTypes)+'. This is not a recommendation or live-game eligibility check.');
}
export function createMechanicExplorer(reference,data) {
 validateMechanics(reference,data);
 const entries=new Map(reference.entries.map(e=>[e.id,e])),profiles=new Map(data.profiles.map(p=>[p.id,p])),skills=data.profiles.filter(p=>p.kind==='skill'),supports=data.profiles.filter(p=>p.kind==='support'),items=data.profiles.filter(p=>p.kind==='unique');
 const normalize=name=>name.toLowerCase().replace(/ minion$/,'');
 const namedSkills=name=>skills.filter(s=>normalize(entries.get(s.id).name)===normalize(name));
 const variantCondition=m=>m.variants.length?'Requires source item variant '+m.variants.join(' or ')+'; verify the actual item version.':'Requires the corresponding modifier on the actual equipped item.';
 return function explore(id,context={}) {
  if(!context||typeof context!=='object'||['noElementalDamage','noChaosDamage','noCriticalHits'].some(k=>context[k]!==undefined&&typeof context[k]!=='boolean'))throw new Error('Invalid mechanic context');
  const current=profiles.get(id);if(!current)throw new Error('Unknown mechanic starting point');
  const links=[],supportChecks=[];
  const conversion=(skill,item,m)=>{
   if(skill.minionContext||!skill.skillTypes.includes('Damage'))return;
   const possible=m.from==='Elemental'?skill.damageHints.some(t=>['Fire','Cold','Lightning'].includes(t)):skill.damageHints.includes(m.from);if(!possible)return;
   const blocked=(context.noElementalDamage&&['Fire','Cold','Lightning'].includes(m.to))||(context.noChaosDamage&&m.to==='Chaos');
   links.push({id:'conversion:'+skill.id+':'+item.id+':'+m.evidence.line,kind:'conversion',skillId:skill.id,itemId:item.id,status:blocked?'blocked':'conditional',title:entries.get(skill.id).name+' + '+entries.get(item.id).name,
    explanation:'If the skill deals outgoing '+m.from+' damage, this modifier converts '+m.percent+'% of that component to '+m.to+'. Skill types alone do not establish that damage.',
    conditions:[variantCondition(m),'Player damage only; no minion conversion is inferred.','Actual damage, other conversions, ailments, resources and equipment constraints require further checks.',...(blocked?['The destination damage component is disabled; other damage components may still work.']:[])],evidenceUrls:[skill.evidence.url,m.evidence.url]});
  };
  const grant=(skill,item,m)=>{
   const blocked=m.kind==='trigger'&&m.requiresCritical&&context.noCriticalHits;
   const ambiguous=namedSkills(m.skillName).length>1;
   links.push({id:m.kind+':'+skill.id+':'+item.id+':'+m.evidence.line,kind:m.kind,skillId:skill.id,itemId:item.id,status:blocked?'blocked':'conditional',title:entries.get(item.id).name+' → '+entries.get(skill.id).name,
    explanation:m.kind==='trigger'?'The source records an item trigger for this skill '+m.event+'.':'The source records this unique as a way to grant the named skill; this is a source relationship, not a proven synergy.',
    conditions:[variantCondition(m),...(ambiguous?['Several source records share this skill name; verify the actual granted effect and variant.']:[]),...(m.kind==='trigger'?['The trigger event must actually occur; cooldown, costs and trigger limits are not simulated.']:['Granted skill availability, level and equipment requirements need verification.']),...(blocked?['The selected setup cannot make the required critical hit.']:[])],evidenceUrls:[m.evidence.url,skill.evidence.url]});
  };
  for(const item of items)for(const m of item.mechanics){
   if(current.kind==='unique'&&item.id!==id)continue;
   if(current.kind==='support')continue;
   const candidates=m.kind==='conversion'?(current.kind==='skill'?[current]:skills):namedSkills(m.skillName).filter(s=>current.kind!=='skill'||s.id===id);
   for(const skill of candidates)if(m.kind==='conversion')conversion(skill,item,m);else grant(skill,item,m);
  }
  if(current.kind==='skill')for(const support of supports)supportChecks.push({id:support.id,...checkSupportTypes(current,support),evidenceUrls:[current.evidence.url,support.evidence.url]});
  if(current.kind==='support')for(const skill of skills)supportChecks.push({id:skill.id,...checkSupportTypes(skill,current),evidenceUrls:[skill.evidence.url,current.evidence.url]});
  return {anchor:entries.get(id),profile:current,links,supportChecks,coverage:data.coverage,rulesVersion:data.rulesVersion,limits:'Partial source mechanic links, not full builds, damage simulation or exhaustive combinations.'};
 };
}
