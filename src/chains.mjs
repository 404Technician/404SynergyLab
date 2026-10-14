import { validateMechanics, checkSupportTypes } from './mechanics.mjs';
import { matchesTypeExpression, validateTypeExpression } from './type-expression.mjs';
export function validateChains(reference,mechanics,data) {
 if(data?.schemaVersion!==1||data.rulesVersion!=='mechanic-chains-1'||data.status!=='candidate'||data.referenceId!==reference.id||data.mechanicsId!==mechanics.id||data.sourceRevision!==reference.sourceRevision||data.id!=='pob-bb52d6b-chains1')throw new Error('Chain source version mismatch');
 const entries=new Map(reference.entries.map(e=>[e.id,e])),seen=new Set();
 if(!Array.isArray(data.rules)||data.rules.length!==3||!Array.isArray(data.persistent))throw new Error('Incomplete chain rules');
 for(const rule of data.rules){if(!entries.has(rule.id)||seen.has(rule.event)||!['ailment','critical','minion-death'].includes(rule.event)||!rule.description||!rule.evidence?.url||!Array.isArray(rule.sourceAssertions))throw new Error('Invalid chain rule');seen.add(rule.event);for(const k of ['requiredTypes','excludedTypes','addedTypes'])validateTypeExpression(rule[k]);}
 for(const p of data.persistent)if(entries.get(p.id)?.kind!=='skill'||!p.description||!p.evidence?.url)throw new Error('Invalid persistent-minion source');
 if(!Array.isArray(data.restrictions)||data.restrictions.some(r=>entries.get(r.id)?.kind!=='support'||!['noCriticalHits','noElementalDamage'].includes(r.flag)))throw new Error('Invalid chain restriction');
 if(data.remapper?.id!=='the-three-dragons'||JSON.stringify(data.remapper.map)!==JSON.stringify({Fire:'Shock',Cold:'Ignite',Lightning:'Freeze'})||!entries.has(data.remapper.id))throw new Error('Invalid ailment remapping');
 return data;
}
export function createChainExplorer(reference,mechanics,data){
 validateMechanics(reference,mechanics);validateChains(reference,mechanics,data);
 const entries=new Map(reference.entries.map(e=>[e.id,e])),profiles=new Map(mechanics.profiles.map(p=>[p.id,p])),persistent=new Set(data.persistent.map(p=>p.id));
 const elements=['Fire','Cold','Lightning'],native={Fire:'Ignite',Cold:'Freeze',Lightning:'Shock'};
 const manual=p=>p.kind==='skill'&&p.skillTypes.includes('Damage')&&!p.minionContext&&!p.skillTypes.some(t=>['Meta','Triggers','Triggered','InbuiltTrigger','UsedByTotem'].includes(t));
 const generators=mechanics.profiles.filter(p=>manual(p)||persistent.has(p.id)).map(p=>entries.get(p.id));
 const payoffs=mechanics.profiles.filter(p=>p.kind==='skill'&&p.skillTypes.includes('Spell')&&p.skillTypes.includes('Triggerable')&&!p.skillTypes.includes('InbuiltTrigger')).map(p=>entries.get(p.id));
 const items=mechanics.profiles.filter(p=>p.kind==='unique'&&p.mechanics.some(m=>m.kind==='conversion')).map(p=>entries.get(p.id));
 items.push(entries.get(data.remapper.id));
 function explore(input){
  if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Invalid chain selection');
  const {generatorId,payoffId,itemId=null,remap=false,generatorSupportId=null,payoffSupportId=null,confirmedEvents=[],focusEvent='all',noElementalDamage=false,noChaosDamage=false,noCriticalHits=false}=input||{};
  const g=profiles.get(generatorId),p=profiles.get(payoffId);
  if(g?.kind!=='skill'||p?.kind!=='skill'||(itemId&&!items.some(i=>i.id===itemId)))throw new Error('Unknown chain selection');
  if(!['all','ailment','critical','minion-death'].includes(focusEvent))throw new Error('Invalid chain event focus');
  if(!Array.isArray(confirmedEvents)||confirmedEvents.some(e=>!['ailment','critical','minion-death'].includes(e))||[remap,noElementalDamage,noChaosDamage,noCriticalHits].some(x=>typeof x!=='boolean'))throw new Error('Invalid chain context');
  const supports={};for(const [role,id] of [['generator',generatorSupportId],['payoff',payoffSupportId]])if(id){const support=profiles.get(id);if(support?.kind!=='support')throw new Error('Unknown chain support');supports[role]=support;}
  const results=[];
  for(const rule of data.rules){
   if(rule.event==='minion-death'&&!persistent.has(g.id))continue;
   if(rule.event!=='minion-death'&&!manual(g))continue;
   let routes=[{type:null,steps:[],items:[],evidence:[]}];
   if(rule.event==='ailment'){
    routes=g.damageHints.filter(t=>(itemId&&itemId!==data.remapper.id?['Physical',...elements,'Chaos']:elements).includes(t)).map(type=>({type,steps:[type+' damage component (source hint; actual hit must be checked)'],items:[],evidence:[]}));
    if(itemId&&itemId!==data.remapper.id){
     const item=profiles.get(itemId);
     routes=routes.flatMap(route=>item.mechanics.filter(m=>m.kind==='conversion'&&(m.from===route.type||(m.from==='Elemental'&&elements.includes(route.type)))).map(m=>({type:m.to,steps:[...route.steps,m.percent+'% '+route.type+' → '+m.to+' through '+entries.get(itemId).name],items:[itemId],evidence:[m.evidence.url],modifier:m})));
    }
    if(itemId===data.remapper.id||remap)routes=routes.map(route=>({...route,items:[...route.items,data.remapper.id],steps:[...route.steps,'The Three Dragons: '+route.type+' contributes to '+(data.remapper.map[route.type]||'no modeled ailment')],evidence:[...route.evidence,data.remapper.evidence.url],remapped:true}));
    if(!routes.length){if(itemId)continue;routes=[{type:null,steps:['No enabled elemental hit component established'],items:[],evidence:[]}];}
   } else if(itemId||remap)continue; // An item anchor must participate in the modeled chain.
   for(const route of routes){
    const reasons=[],blocked=[];
    let eventStep=rule.event==='critical'?'Your actual critical hit':rule.event==='minion-death'?'Your persistent minion is actually killed':'Actual '+(route.remapped?data.remapper.map[route.type]:native[route.type]||'elemental ailment')+' on an enemy';
    if(rule.event==='ailment'&&(!elements.includes(route.type)||noElementalDamage))blocked.push('No enabled elemental component is modeled for this ailment route. Chaos ailments and special overrides are outside these rules.');
    if(rule.event==='critical'&&noCriticalHits)blocked.push('The generator cannot critically hit in this scenario.');
    if(p.cannotBeSupported||!matchesTypeExpression(rule.requiredTypes,p.skillTypes)||matchesTypeExpression(rule.excludedTypes,p.skillTypes))blocked.push('Payoff is excluded by this meta gem’s recorded socket predicates.');
    for(const [role,support] of Object.entries(supports)){
     const skill=role==='generator'?g:{...p,skillTypes:[...p.skillTypes,...rule.addedTypes]};
     const check=checkSupportTypes(skill,support);
     if(check.status==='incompatible')blocked.push(entries.get(support.id).name+' is excluded on the '+role+'.');
     if(check.status==='unknown')reasons.push(entries.get(support.id).name+' on the '+role+' needs additional support-context checks.');
     for(const warning of check.warnings||[])reasons.push(role+': '+warning);
     // Restriction descriptions are warnings, not enough to infer every support's final effects.
     if(role==='generator'&&rule.event==='critical'&&data.restrictions.some(r=>r.id===support.id&&r.flag==='noCriticalHits'))blocked.push('Controlled Destruction prevents the generator from dealing critical hits.');
     if(role==='generator'&&rule.event==='ailment'&&data.restrictions.some(r=>r.id===support.id&&r.flag==='noElementalDamage'))blocked.push('Brutality prevents the generator from dealing the elemental damage needed for this modeled route.');
    }
    if(!confirmedEvents.includes(rule.event))reasons.push('Confirm this event for this exact generator in game; a damage type or minion tag does not prove the event.');
    if(rule.event==='minion-death')reasons.push('Expiry or replacement is not assumed to count as killed. Very underlevelled minions have an Energy penalty.');
    if(route.modifier)reasons.push(route.modifier.variants.length?'Requires source item variant '+route.modifier.variants.join(' or ')+'.':'Requires this exact equipped conversion modifier.');
    reasons.push('Verify actor ownership, target susceptibility, Energy threshold/rate, socket slots, Spirit, costs, cooldowns, equipment and target-patch behavior.');
    const steps=[entries.get(g.id).name,...route.steps,eventStep,'Energy for '+entries.get(rule.id).name,'Maximum Energy reached',entries.get(p.id).name+' socketed and triggered'];
    results.push({id:[g.id,rule.id,p.id,route.type,...route.items,...route.steps].join(':'),generatorId:g.id,payoffId:p.id,triggerId:rule.id,event:rule.event,itemIds:route.items,status:blocked.length?'blocked':confirmedEvents.includes(rule.event)?'conditional':'needs-input',steps,reasons:[...blocked,...reasons],evidenceUrls:[g.evidence.url,...route.evidence,rule.evidence.url,p.evidence.url,...Object.values(supports).map(s=>s.evidence.url)]});
   }
  }
  return {chains:focusEvent==='all'?results:results.filter(chain=>chain.event===focusEvent),limits:data.limits};
 }
 return {generators,payoffs,items,explore};
}
