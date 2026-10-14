import {createChainDiscovery, chainDiscoveryVersion} from './src/chain-discovery.mjs';
import { validateChains, createChainExplorer } from './src/chains.mjs';
import { validateMechanics, createMechanicExplorer } from './src/mechanics.mjs';
import { validateReferenceCatalog, referenceEntries, resolveReference } from './src/reference-catalog.mjs';
import { discover, validateDiscoveryCatalog } from './src/discovery.mjs';
import { analyzeCombination, validateCombination } from './src/combination.mjs';
import { analyze } from './src/engine.mjs';
const $=id=>document.getElementById(id);
function element(tag, text, className) { const e=document.createElement(tag);if(text !== undefined)e.textContent=text;if(className)e.className=className;return e; }
function link(text,url) { const e=element('a',text);const parsed=new URL(url);if(parsed.protocol !== 'https:')throw new Error('Invalid evidence URL');e.href=parsed.href;e.target='_blank';e.rel='noopener noreferrer';return e; }
const labels={compatible:'TYPE MATCH',incompatible:'DOES NOT MATCH',unknown:'UNKNOWN'};
const symbols={compatible:'✓',incompatible:'×',unknown:'?'};
const family=skill=>skill.skillTypes.includes('Meta') ? 'Meta gem' : skill.skillTypes.includes('Spell') ? 'Spell' : 'Attack';
const friendlyTypes=['Spell','Attack','Projectile','Melee','Area','Cold','Fire','Lightning','Chaos','Slam','Bow','Duration','Meta','Persistent','Buff','Triggers'];
let suggestChains,chainIdeaKey,chainIdeaOffset=0;
let chainsData,chainExplorer,chainInput={generatorId:'frostbolt',payoffId:'comet',itemId:null,remap:false,generatorSupportId:null,payoffSupportId:null,confirmedEvents:[],focusEvent:'all'};
let referenceCatalog,mechanicsData,exploreMechanics,ruleRecord,ruleAnchor,ruleLimit=12,supportLimit=16;
let catalog,discoveryMode='skill',discoveryAnchor='frostbolt';
let snapshot,meta,skills,selected='spark',filter='all',result;
let combination={version:1,skillIds:[],supports:{},itemId:null};
const contextInputs={sidewaysCascade:'sideways-cascade',criticalHitsDisabled:'critical-disabled',elementalAilmentsDisabled:'ailments-disabled',igniteDisabled:'ignite-disabled'};
const contextParams={criticalHitsDisabled:'noCrit',elementalAilmentsDisabled:'noAilments',igniteDisabled:'noIgnite'};
const readContext=()=>Object.fromEntries(Object.entries(contextInputs).map(([flag,id])=>[flag,$(id).checked]));
function updateUrl(){const url=new URL(location.href);url.searchParams.set('skill',selected);url.searchParams.set('snapshot',snapshot.id);url.searchParams.set('reference',referenceCatalog.id);url.searchParams.set('mechanics',mechanicsData.id);url.searchParams.set('chains',chainsData.id);url.searchParams.set('chainIdeas',chainDiscoveryVersion);for(const [id,key,fallback] of [['chain-idea-status','ideaStatus','potential'],['chain-idea-event','ideaEvent','all'],['chain-idea-search','ideaQuery','']]){const value=$(id).value;if(value!==fallback)url.searchParams.set(key,value);else url.searchParams.delete(key);}url.searchParams.set('chain',JSON.stringify(chainInput));for(const [id,key] of [['rule-no-elemental','ruleNoElemental'],['rule-no-chaos','ruleNoChaos'],['rule-no-critical','ruleNoCrit']]){if($(id).checked)url.searchParams.set(key,'1');else url.searchParams.delete(key);}if($('sideways-cascade').checked)url.searchParams.set('cascade','sideways');else url.searchParams.delete('cascade');for(const [flag,key] of Object.entries(contextParams)){if($(contextInputs[flag]).checked)url.searchParams.set(key,'1');else url.searchParams.delete(key);}if(combination.skillIds.length || combination.itemId)url.searchParams.set('build',JSON.stringify(combination));else url.searchParams.delete('build');url.searchParams.set('start',discoveryMode);url.searchParams.set('anchor',discoveryAnchor);if($('advanced-checks').open)url.searchParams.set('inspect','1');else url.searchParams.delete('inspect');history.replaceState(null,'',url);}
function choose(id) { selected=id;discoveryMode='skill';discoveryAnchor=id;render();updateUrl(); }
function renderSkillList() {
  const query=$('skill-search').value.trim().toLowerCase();let count=0;
  for(const button of $('skill-list').children){button.hidden=!button.dataset.name.includes(query);if(!button.hidden)count++;button.setAttribute('aria-pressed',String(button.dataset.id===selected));}
  $('skill-empty').hidden=count>0;$('skill-count').textContent=`${count} / ${skills.length}`;
}
function renderSupports(){
  const query=$('support-search').value.trim().toLowerCase();
  const visible=result.results.filter(r=>(filter==='all'||r.status===filter)&&r.name.toLowerCase().includes(query));
  $('support-list').replaceChildren();$('result-count').textContent=`Showing ${visible.length} of ${result.results.length} supports`;
  if(!visible.length){$('support-list').append(element('div','No supports match these filters. Try another filter or search.','empty-support'));return;}
  for(const r of visible){
    const card=element('article',undefined,`support-card ${r.status}`);card.dataset.support=r.id;
    const head=element('div',undefined,'card-head');head.append(element('h4',r.name),element('span',symbols[r.status],'match-mark'));head.lastChild.setAttribute('aria-hidden','true');card.append(head,element('div',labels[r.status],'match-label'));
    const explanation=r.status==='compatible' ? 'Matches the recorded conditions for this base skill effect.' : r.status==='unknown' ? 'This combination needs more context before it can be checked.' : 'The recorded support conditions exclude this base skill effect.';
    card.append(element('p',explanation));
    for(const warning of r.warnings ?? [])card.append(element('div',warning,'warning'));

    const assign=element('label',undefined,'assign-support');
    const checkbox=element('input');checkbox.type='checkbox';checkbox.dataset.assign=r.id;
    checkbox.checked=(combination.supports[selected] ?? []).includes(r.id);
    checkbox.addEventListener('change',()=>{
      if(!combination.skillIds.includes(selected))combination.skillIds.push(selected);
      const assigned=new Set(combination.supports[selected] ?? []);if(checkbox.checked)assigned.add(r.id);else assigned.delete(r.id);
      combination.supports[selected]=[...assigned];renderCombination();updateUrl();
    });
    assign.append(checkbox,element('span','Assign to '+result.skill));card.append(assign);
    const details=element('details');details.append(element('summary','Why? & source'));
    const content=element('div',undefined,'evidence-content');content.append(element('p',r.reason),link('View source record ↗',r.evidenceUrl));details.append(content);card.append(details);$('support-list').append(card);
  }
}
function render(){
  $('share').textContent='Copy link ↗';$('share-status').textContent='';$('share-fallback').hidden=true;
  const skill=skills.find(s=>s.id===selected);
  result=analyze(snapshot,selected,readContext());
  $('skill-title').textContent=skill.name;document.title=`${skill.name} · 404 Synergy Lab`;
  $('skill-tags').replaceChildren(...friendlyTypes.filter(t=>skill.skillTypes.includes(t)).map(t=>element('span',t==='Area'?'Area of effect':t,'tag')));
  $('support-total').textContent=`${result.results.filter(r=>r.status==='compatible').length} type matches`;
  const availableFlags=new Set([...result.interactions,...snapshot.interactions.filter(r=>r.skillIds.some(id=>combination.skillIds.includes(id)))].flatMap(r=>(r.restrictions ?? []).map(x=>x.contextFlag)));
  $('context-control').hidden=availableFlags.size===0;
  for(const label of document.querySelectorAll('[data-context]'))label.hidden=!availableFlags.has(label.dataset.context);
  renderSkillList();renderSupports();$('interactions').replaceChildren();
  for(const r of result.interactions){
    const card=element('article',undefined,`interaction-card ${r.status}`);card.dataset.interaction=r.id;
    card.append(element('div',`${(r.kind || 'connection').toUpperCase()} · ${r.status==='blocked'?'BLOCKED IN THIS CONTEXT':'CONDITIONAL'}`,'connection-label'));
    const names=element('div',undefined,'connection-names');
    r.skillIds.forEach((id,index)=>{if(index)names.append(element('span','+'));const button=element('button',skills.find(s=>s.id===id).name);button.type='button';button.addEventListener('click',()=>choose(id));names.append(button);});
    card.append(names,element('p',r.explanation));const condition=element('div',undefined,'condition-box');condition.append(element('strong',r.status==='blocked'?'WHY IT IS BLOCKED':'CONDITIONS'),element('span',r.condition));card.append(condition,link('Source record ↗',r.evidenceUrl));
    for(const restriction of r.restrictions ?? [])card.append(link(restriction.sourceIds.includes('ggg-050-restriction')?'Official restriction ↗':'Restriction source ↗',restriction.evidenceUrl));
    for(const url of r.evidenceUrls ?? [])card.append(link('Additional evidence ↗',url));$('interactions').append(card);
  }

  $('unique-section').hidden=result.uniqueIdeas.length===0;$('unique-list').replaceChildren();
  for(const idea of result.uniqueIdeas) {
    const card=element('article',undefined,'unique-card');card.dataset.unique=idea.item.id;
    card.append(element('h4',idea.item.name),element('div',`${idea.item.conversion.percent}% ${idea.item.conversion.from} → ${idea.item.conversion.to}`,'conversion-chip'),element('p',idea.explanation));
    const condition=element('div',undefined,'condition-box');condition.append(element('strong','CONDITIONS & TRADEOFFS'),element('span',idea.condition));
    card.append(condition,link('Pinned item modifier ↗',idea.item.evidence.url));$('unique-list').append(card);
  }
  renderDiscovery();renderCombination();
  if(!result.interactions.length)$('interactions').append(element('p','No reviewed skill interaction is recorded for this skill yet. This does not mean there are no possible synergies.','empty-note'));
}

function renderCombination() {
  $('share').textContent='Copy link ↗';$('share-status').textContent='';$('share-fallback').hidden=true;
  const review=analyzeCombination(snapshot,combination,readContext());
  $('add-skill').textContent=combination.skillIds.includes(selected)?'In combination ✓':'Add to combination +';
  $('add-skill').disabled=combination.skillIds.includes(selected);
  $('combination-count').textContent=review.summary.skills+' skills · '+review.summary.supports+' assigned supports';
  $('combination-skills').replaceChildren();
  for(const id of combination.skillIds) {
    const row=element('div',undefined,'combination-skill');const skill=skills.find(s=>s.id===id);
    const open=element('button',skill.name);open.type='button';open.addEventListener('click',()=>choose(id));
    const remove=element('button','Remove');remove.type='button';remove.setAttribute('aria-label','Remove '+skill.name+' from combination');
    remove.addEventListener('click',()=>{combination.skillIds=combination.skillIds.filter(s=>s!==id);delete combination.supports[id];render();updateUrl();});
    row.append(open,element('small',(combination.supports[id] ?? []).map(id=>snapshot.entities.find(e=>e.id===id).name).join(', ') || 'No assigned supports'),remove);$('combination-skills').append(row);
  }
  $('combination-item').value=combination.itemId||'';
  $('combination-findings').replaceChildren();
  if(!combination.skillIds.length && !combination.itemId) $('combination-findings').append(element('p','Add a skill or load the trigger example to begin. Supports are assigned to the skill currently on the workbench.','empty-note'));
  else {
    $('combination-findings').append(element('p',review.summary.conflicts+' known conflicts · '+review.summary.needsInput+' checks needing input','combination-summary'));
    for(const finding of review.findings){const box=element('div',undefined,'build-finding '+finding.level);box.append(element('strong',finding.level==='conflict'?'CONFLICT':finding.level==='needs-input'?'NEEDS INPUT':'TRADEOFF'),element('p',finding.message));$('combination-findings').append(box);}
    if(!review.findings.length)$('combination-findings').append(element('p','No conflict found by these partial checks. Full build validity is still unverified.','empty-note'));
  }
  $('combination-connections').replaceChildren();
  for(const connection of review.connections) {
    const box=element('article',undefined,'build-connection');box.dataset.buildConnection=connection.id;
    box.append(element('strong',connection.skillIds.map(id=>skills.find(s=>s.id===id).name).join(' + ')),element('span',connection.status.toUpperCase().replaceAll('-',' '),'build-connection-status'));
    if(connection.missingSkillIds.length)box.append(element('p','Missing partner: '+connection.missingSkillIds.map(id=>skills.find(s=>s.id===id).name).join(', ')));
    box.append(element('p',connection.condition));for(const note of connection.extraConditions)box.append(element('p',note));
    $('combination-connections').append(box);
  }
}


function referenceView(kind,id) {
  const record=resolveReference(referenceCatalog,kind,id);
  if(!record)throw new Error('This starting point is not in the imported source catalog.');
  if(record.reviewedId)return discover(snapshot,catalog,{kind,id:record.reviewedId});
  return {anchor:{id:record.id,name:record.name,kind},status:'candidate',ideas:[],limits:catalog.limits};
}
function renderReferenceRecord(record) {
  const box=$('catalog-record');box.replaceChildren();
  box.append(element('p',record.kind.toUpperCase()+' · '+record.category,'eyebrow'),element('h3',record.name));
  if(record.base)box.append(element('p','Base: '+record.base));
  if(record.weaponRequirements)box.append(element('p','Weapons: '+record.weaponRequirements));
  const tags=element('div',undefined,'tag-row');for(const tag of record.tags)tags.append(element('span',tag,'tag'));box.append(tags);
  if(record.legacy)box.append(element('p','Marked as legacy in this source record.','warning'));
  if(record.variants?.length)box.append(element('p','Source variants: '+record.variants.join(', ')));
  if(record.generated)box.append(element('p','Variable unique: modifiers are generated by the source and are not expanded in this catalog.'));
  box.append(element('p','Imported source record. Availability and behavior in the target patch remain unverified.','muted'),link('View source record ↗',record.evidence.url));
  if(record.effectEvidence)box.append(link('Skill mechanics source ↗',record.effectEvidence.url));
}


function openRuleReference(kind,id) {
  discoveryMode=kind;discoveryAnchor=id;$('catalog-search').value='';$('catalog-category').value='';$('discovery-search').value='';
  if(kind==='skill'&&skills.some(s=>s.id===id))selected=id;
  render();updateUrl();$('catalog-record').scrollIntoView({block:'start',behavior:'auto'});
}
function renderRules(record) {
  if(!record)return;
  ruleRecord=record;if(ruleAnchor!==record.id){ruleAnchor=record.id;ruleLimit=12;supportLimit=16;}
  $('rule-explorer').hidden=false;
  const view=exploreMechanics(record.id,{noElementalDamage:$('rule-no-elemental').checked,noChaosDamage:$('rule-no-chaos').checked,noCriticalHits:$('rule-no-critical').checked}),c=view.coverage;
  $('rule-coverage').textContent='Source profiles: '+c.skills+' skills and '+c.supports+' supports. Recognized item mechanics: '+c.recognizedUniques+' / '+c.uniques+' uniques; '+c.catalogOnlyUniques+' still need a modifier model.';
  $('rule-summary').textContent=view.links.length+' source mechanic links · conditional experiments, not proven builds';
  $('rule-links').replaceChildren();
  if(!view.links.length)$('rule-links').append(element('p',record.kind==='unique'?'No item mechanic is recognized by these rules yet. Unmodeled modifiers may still create useful combinations.':'No item link is found by these partial rules. This does not establish that no synergy exists.','empty-note'));
  for(const connection of view.links.slice(0,ruleLimit)){
    const card=element('article',undefined,'rule-card');card.dataset.ruleKind=connection.kind;card.dataset.ruleStatus=connection.status;
    card.append(element('span',connection.kind.toUpperCase()+' · '+connection.status.toUpperCase(),'connection-label'),element('h4',connection.title),element('p',connection.explanation));
    const conditions=element('ul');for(const condition of connection.conditions)conditions.append(element('li',condition));card.append(conditions);
    for(const id of [connection.skillId,connection.itemId]){const target=referenceCatalog.entries.find(e=>e.id===id);if(target.id!==record.id){const open=element('button','Open '+target.name+' ↗','rule-open');open.type='button';open.addEventListener('click',()=>openRuleReference(target.kind,target.id));card.append(open);}}
    for(const source of connection.evidenceUrls)card.append(link('Source ↗',source));$('rule-links').append(card);
  }
  $('rule-more').hidden=view.links.length<=ruleLimit;$('rule-more').textContent='Show more links ('+Math.max(0,view.links.length-ruleLimit)+' remaining)';
  $('rule-support-panel').hidden=record.kind==='unique';
  const checks=view.supportChecks,filter=$('rule-support-filter').value,query=$('rule-support-search').value.trim().toLowerCase();
  const matched=checks.filter(check=>(filter==='all'||check.status===filter||(filter==='potential'&&check.status!=='incompatible'))&&referenceCatalog.entries.find(e=>e.id===check.id).name.toLowerCase().includes(query));
  $('rule-support-count').textContent=checks.filter(x=>x.status==='compatible').length+' base-type matches · '+checks.filter(x=>x.status==='unknown').length+' requiring context · '+checks.filter(x=>x.status==='incompatible').length+' excluded';
  $('rule-support-results').replaceChildren();
  if(!matched.length)$('rule-support-results').append(element('p','No source checks match these filters.','empty-note'));
  for(const check of matched.slice(0,supportLimit)){
    const target=referenceCatalog.entries.find(e=>e.id===check.id),row=element('article',undefined,'rule-support-row');row.dataset.ruleCheck=check.status;
    row.append(element('strong',target.name),element('span',check.status==='compatible'?'BASE TYPES MATCH':check.status==='unknown'?'CONTEXT REQUIRED':'EXCLUDED','connection-label'),element('p',check.reason));for(const warning of check.warnings??[])row.append(element('p',warning,'warning'));
    const open=element('button','Open '+target.name+' ↗','rule-open');open.type='button';open.addEventListener('click',()=>openRuleReference(target.kind,target.id));row.append(open);
    for(const source of check.evidenceUrls)row.append(link('Source ↗',source));$('rule-support-results').append(row);
  }
  $('rule-support-more').hidden=matched.length<=supportLimit;
}

function renderDiscovery() {
  for(const kind of ['skill','support','unique'])$('start-'+kind).setAttribute('aria-pressed',String(discoveryMode===kind));
  const category=$('catalog-category').value;
  const categories=[...new Set(referenceCatalog.entries.filter(e=>e.kind===discoveryMode).map(e=>e.category))].sort();
  const all=element('option','All categories');all.value='';
  $('catalog-category').replaceChildren(all,...categories.map(name=>{const option=element('option',name);option.value=name;return option;}));$('catalog-category').value=categories.includes(category)?category:'';
  const records=referenceEntries(referenceCatalog,discoveryMode,$('catalog-search').value,$('catalog-category').value);
  $('catalog-count').textContent=referenceCatalog.counts.skill+' skills · '+referenceCatalog.counts.support+' supports · '+referenceCatalog.counts.unique+' uniques in the pinned source catalog';
  $('discovery-anchor').replaceChildren(...records.map(record=>{const option=element('option',record.name+(record.base?' · '+record.base:''));option.value=record.id;return option;}));$('discovery-anchor').disabled=!records.length;
  $('discovery-ideas').replaceChildren();
  if(!records.length){$('rule-explorer').hidden=true;$('chain-panel').hidden=true;$('chain-ideas-panel').hidden=true;$('catalog-record').replaceChildren(element('p','No source records match this search. Try another name, tag or category.','empty-note'));$('discovery-count').textContent='No catalog matches';return;}
  let record=resolveReference(referenceCatalog,discoveryMode,discoveryAnchor);
  if(!record||!records.some(e=>e.id===record.id))record=records[0];
  discoveryAnchor=record.id;$('discovery-anchor').value=record.id;renderReferenceRecord(record);renderRules(record);renderChains(record);
  const view=referenceView(discoveryMode,discoveryAnchor),query=$('discovery-search').value.trim().toLowerCase();
  const ideas=view.ideas.filter(i=>(i.title+' '+i.hook).toLowerCase().includes(query));
  $('discovery-count').textContent=ideas.length+' curated ideas for '+view.anchor.name+' · conditional concepts, not playtested builds';
  $('discovery-ideas').replaceChildren();
  if(!ideas.length){$('discovery-ideas').append(element('div',view.ideas.length?'No ideas match this search.':'This record is imported. No researched combination is recorded for it yet; catalog inclusion does not establish a synergy.','empty-support'));return;}
  for(const idea of ideas){
    const card=element('article',undefined,'discovery-card');card.dataset.idea=idea.id;
    card.append(element('span',idea.item?idea.item.name:'SKILL INTERACTION','discovery-item-label'),element('h3',idea.title),element('p',idea.hook,'discovery-hook'));
    const chips=element('div',undefined,'tag-row');for(const skill of idea.skills)chips.append(element('span',skill.name,'tag'));card.append(chips,element('p',idea.buildPlan.playstyle,'muted'));
    const more=element('details',undefined,'idea-details');more.append(element('summary','Mechanics, supports & tradeoffs'));
    const body=element('div',undefined,'idea-body');body.append(element('h4','Why this is interesting'),element('p',idea.mechanics),element('h4','How to explore it'));
    const steps=element('ol');for(const step of idea.play)steps.append(element('li',step));body.append(steps,element('h4','Support ideas — and why'));
    for(const role of idea.supportIdeas){
      const box=element('div',undefined,'discovery-support');box.dataset.ideaSupport=role.supportId;
      box.append(element('strong',role.support.name+' → '+idea.skills.find(s=>s.id===role.skillId).name),element('p',role.reason),element('small',role.typeStatus==='unknown'?'CONTEXT REQUIRED · Verify this support in game':(idea.skills.find(s=>s.id===role.skillId).reviewScope?'BASE TYPES MATCH · Minion behavior untested':'BASE TYPES MATCH')),element('small','Tradeoff: '+role.tradeoff),link('Support record ↗',role.support.evidence.url));body.append(box);
    }
    body.append(element('h4','Conditions & costs'));const conditions=element('ul');for(const c of idea.conditions)conditions.append(element('li',c));body.append(conditions,element('h4','Avoid the tempting mistake'));
    const avoid=element('ul');for(const c of idea.avoid)avoid.append(element('li',c));body.append(avoid,element('h4','Evidence'));
    for(const url of idea.evidenceUrls)body.append(link('Source ↗',url));
    more.append(body);card.append(more);
    const plan=element('details',undefined,'idea-details');plan.append(element('summary','Turn this idea into a build experiment'));
    const planBody=element('div',undefined,'idea-body');planBody.append(element('h4','Core components'));
    const components=element('ul');for(const component of idea.buildPlan.components)components.append(element('li',component));
    planBody.append(components,element('h4','Test the mechanic first'),element('p',idea.buildPlan.firstTest),element('h4','Reconsider the idea if'),element('p',idea.buildPlan.stopIf),element('h4','Before calling this a full build'));
    const checks=element('ol');for(const check of idea.buildPlan.nextChecks)checks.append(element('li',check));planBody.append(checks,element('p','Experiment only: no validated ascendancy, passive tree, gear budget or endgame rating yet.','muted'));plan.append(planBody);card.append(plan);
    const inspectable=idea.skills.find(s=>skills.some(base=>base.id===s.id));
    if(!inspectable){card.append(element('p','Discovery-only minion concept: use the source links and in-game test plan. Full minion checks are not available yet.','muted'));$('discovery-ideas').append(card);continue;}
    const inspect=element('button','Inspect '+inspectable.name+' checks ↗','share-button');inspect.type='button';
    inspect.addEventListener('click',()=>{selected=inspectable.id;$('advanced-checks').open=true;render();updateUrl();$('skill-title').scrollIntoView({block:'start',behavior:'auto'});});card.append(inspect);
    $('discovery-ideas').append(card);
  }
}

function renderChainIdeas(record){
 if(!record)return;
 $('chain-ideas-panel').hidden=false;
 const options={
  payoffId:chainInput.payoffId,generatorSupportId:chainInput.generatorSupportId,payoffSupportId:chainInput.payoffSupportId,
  noElementalDamage:$('rule-no-elemental').checked,noChaosDamage:$('rule-no-chaos').checked,noCriticalHits:$('rule-no-critical').checked,
  status:$('chain-idea-status').value,event:$('chain-idea-event').value,query:$('chain-idea-search').value
 };
 const key=JSON.stringify([record.id,options]);if(chainIdeaKey!==key){chainIdeaKey=key;chainIdeaOffset=0;}
 const view=suggestChains(record.id,{...options,offset:chainIdeaOffset,limit:8});
 const payoff=referenceCatalog.entries.find(e=>e.id===view.payoffId);
 const roleLabels={generator:'generator',trigger:'meta trigger',payoff:'socketed payoff',item:'equipped unique',support:'generator or payoff support',unmodeled:'unmodeled source'};
 $('chain-ideas-scope').textContent='Starting with '+record.name+' as '+roleLabels[view.anchorRole]+'. Socketed payoff: '+payoff.name+'. Uses the damage/critical scenario and support choices from the workbench; event confirmations are always cleared.';
 $('chain-ideas-count').textContent='Showing '+(view.matched?chainIdeaOffset+1:0)+'–'+Math.min(chainIdeaOffset+8,view.matched)+' of '+view.matched+' matching paths / '+view.total+' modeled paths · '+view.blocked+' blocked before filters. Alphabetical order; no damage ranking.';
 $('chain-ideas-results').replaceChildren();
 if(!view.proposals.length)$('chain-ideas-results').append(element('p',view.anchorRole==='unmodeled'?'No chain role is modeled for this source yet. Its presence in the catalog does not establish a synergy.':view.total?'No paths match these filters. Inspect blocked paths or change the payoff, supports or scenario.':'No path is modeled for this source and payoff under the bounded chain rules.','empty-note'));
 for(const proposal of view.proposals){
  const card=element('article',undefined,'rule-card chain-idea');card.dataset.ideaChainStatus=proposal.status;card.dataset.ideaChainEvent=proposal.event;card.dataset.ideaAnchorRole=proposal.anchorRole;
  card.append(element('span',proposal.status.toUpperCase().replaceAll('-',' '),'connection-label'),element('h4',proposal.title));
  if(record.kind==='support')card.append(element('p',record.name+' assigned to the '+(proposal.anchorRole==='generator-support'?'generator':'payoff')+'.'));
  const steps=element('ol');for(const step of proposal.steps)steps.append(element('li',step));card.append(steps);
  const details=element('details');details.append(element('summary','Conditions, blockers & sources'));
  const conditions=element('ul');for(const reason of proposal.reasons)conditions.append(element('li',reason));details.append(conditions);
  for(const url of [...new Set(proposal.evidenceUrls)])details.append(link('Pinned source ↗',url));card.append(details);
  const tryIdea=element('button','Try this chain','rule-open');tryIdea.type='button';tryIdea.addEventListener('click',()=>{
   chainInput={...proposal.input,confirmedEvents:[]};renderChains(ruleRecord);updateUrl();$('chain-panel').scrollIntoView({block:'start',behavior:'auto'});
  });card.append(tryIdea);$('chain-ideas-results').append(card);
 }
 $('chain-ideas-more').hidden=!view.hasMore;$('chain-ideas-previous').hidden=chainIdeaOffset===0;
}
function initChains(){
 for(const id of ['chain-idea-status','chain-idea-event','chain-idea-search'])$(id).addEventListener(id==='chain-idea-search'?'input':'change',()=>{chainIdeaOffset=0;renderChainIdeas(ruleRecord);updateUrl();});
 $('chain-ideas-previous').addEventListener('click',()=>{chainIdeaOffset=Math.max(0,chainIdeaOffset-8);renderChainIdeas(ruleRecord);});
 $('chain-ideas-more').addEventListener('click',()=>{chainIdeaOffset+=8;renderChainIdeas(ruleRecord);});
 const fill=(id,records,blank)=>{const options=records.map(r=>{const o=element('option',r.name);o.value=r.id;return o;});if(blank){const o=element('option',blank);o.value='';options.unshift(o);}$(id).replaceChildren(...options);};
 fill('chain-generator',chainExplorer.generators);fill('chain-payoff',chainExplorer.payoffs);
 fill('chain-item',chainExplorer.items,'No conversion or remapping unique');
 const supports=referenceCatalog.entries.filter(e=>e.kind==='support');
 fill('chain-generator-support',supports,'No generator support');fill('chain-payoff-support',supports,'No payoff support');
 for(const [id,key] of [['chain-focus-event','focusEvent'],['chain-generator','generatorId'],['chain-payoff','payoffId'],['chain-item','itemId'],['chain-generator-support','generatorSupportId'],['chain-payoff-support','payoffSupportId']]){
  $(id).addEventListener('change',()=>{chainInput[key]=$(id).value||null;if(['generatorId','itemId','generatorSupportId'].includes(key))chainInput.confirmedEvents=[];renderChains(ruleRecord);updateUrl();});
 }
 $('chain-remap').addEventListener('change',()=>{chainInput.remap=$('chain-remap').checked;chainInput.confirmedEvents=[];renderChains(ruleRecord);updateUrl();});
 for(const event of ['ailment','critical','minion-death'])$('chain-confirm-'+event).addEventListener('change',()=>{
  chainInput.confirmedEvents=['ailment','critical','minion-death'].filter(e=>$('chain-confirm-'+e).checked);renderChains(ruleRecord);updateUrl();
 });
 $('chain-use-source').addEventListener('click',()=>{
  const r=ruleRecord;if(!r)return;chainInput.confirmedEvents=[];
  if(chainExplorer.generators.some(e=>e.id===r.id)){chainInput.generatorId=r.id;chainInput.confirmedEvents=[];}
  else if(chainExplorer.payoffs.some(e=>e.id===r.id))chainInput.payoffId=r.id;
  else if(chainExplorer.items.some(e=>e.id===r.id))chainInput.itemId=r.id;
  else if(r.kind==='support')chainInput.generatorSupportId=r.id;
  renderChains(ruleRecord);updateUrl();
 });
}
function renderChains(record){
 renderChainIdeas(record);
 $('chain-panel').hidden=false;
 for(const [id,key] of [['chain-focus-event','focusEvent'],['chain-generator','generatorId'],['chain-payoff','payoffId'],['chain-item','itemId'],['chain-generator-support','generatorSupportId'],['chain-payoff-support','payoffSupportId']])$(id).value=chainInput[key]||(key==='focusEvent'?'all':'');
 $('chain-remap').checked=chainInput.remap;
 for(const event of ['ailment','critical','minion-death'])$('chain-confirm-'+event).checked=chainInput.confirmedEvents.includes(event);
 const usable=record&&(chainExplorer.generators.some(e=>e.id===record.id)||chainExplorer.payoffs.some(e=>e.id===record.id)||chainExplorer.items.some(e=>e.id===record.id)||record.kind==='support');
 $('chain-use-source').disabled=!usable;
 $('chain-use-source').textContent=usable?'Use '+record.name+' in this experiment':'Selected source has no modeled chain role yet';
 const view=chainExplorer.explore({...chainInput,noElementalDamage:$('rule-no-elemental').checked,noChaosDamage:$('rule-no-chaos').checked,noCriticalHits:$('rule-no-critical').checked});
 $('chain-count').textContent=view.chains.length+' candidate paths · '+view.chains.filter(c=>c.status==='blocked').length+' blocked';
 $('chain-results').replaceChildren();
 if(!view.chains.length)$('chain-results').append(element('p','No route is modeled for these selections. A selected unique must participate in the chain; minion conversion and recursive trigger loops are outside these rules.','empty-note'));
 for(const chain of view.chains){
  const card=element('article',undefined,'rule-card');card.dataset.chainStatus=chain.status;card.dataset.chainEvent=chain.event;
  card.append(element('h4',referenceCatalog.entries.find(e=>e.id===chain.triggerId).name+' · '+chain.status.toUpperCase().replaceAll('-',' ')));
  const steps=element('ol');for(const step of chain.steps)steps.append(element('li',step));card.append(steps);
  const conditions=element('ul');for(const reason of chain.reasons)conditions.append(element('li',reason));card.append(conditions);
  const details=element('details');details.append(element('summary','Pinned sources'));
  for(const url of [...new Set(chain.evidenceUrls)])details.append(link('Source ↗',url));card.append(details);$('chain-results').append(card);
 }
}

async function start(){
  const responses=await Promise.all([fetch('./data/snapshot.json',{cache:'no-cache'}),fetch('./data/build.json',{cache:'no-cache'}),fetch('./data/catalog.json',{cache:'no-cache'}),fetch('./data/reference.json',{cache:'no-cache'}),fetch('./data/mechanics.json',{cache:'no-cache'}),fetch('./data/chains.json',{cache:'no-cache'})]);
  if(responses.some(r=>!r.ok))throw new Error('The bundled data could not be loaded.');
  const [bytes,metadata,catalogBytes,referenceBytes,mechanicsBytes,chainsBytes]=await Promise.all([responses[0].arrayBuffer(),responses[1].json(),responses[2].arrayBuffer(),responses[3].arrayBuffer(),responses[4].arrayBuffer(),responses[5].arrayBuffer()]);meta=metadata;
  const sha=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');
  if(sha!==meta.snapshotSha256)throw new Error('The dataset does not match its saved source review. Rebuild or update the project.');
  snapshot=JSON.parse(new TextDecoder().decode(bytes));if(snapshot.id!==meta.snapshotId)throw new Error('Snapshot version mismatch.');

  const catalogSha=[...new Uint8Array(await crypto.subtle.digest('SHA-256',catalogBytes))].map(b=>b.toString(16).padStart(2,'0')).join('');
  if(catalogSha!==meta.catalogSha256)throw new Error('The idea catalog does not match this build. Rebuild or update the project.');
  catalog=JSON.parse(new TextDecoder().decode(catalogBytes));validateDiscoveryCatalog(snapshot,catalog);
  const referenceSha=[...new Uint8Array(await crypto.subtle.digest('SHA-256',referenceBytes))].map(b=>b.toString(16).padStart(2,'0')).join('');
  if(referenceSha!==meta.referenceSha256)throw new Error('The full catalog does not match this build. Rebuild or update the project.');
  referenceCatalog=validateReferenceCatalog(JSON.parse(new TextDecoder().decode(referenceBytes)));
  if(referenceCatalog.id!==meta.referenceId||referenceCatalog.sourceRevision!==catalog.sourceRevision)throw new Error('Full catalog version mismatch.');
  const mechanicsSha=[...new Uint8Array(await crypto.subtle.digest('SHA-256',mechanicsBytes))].map(b=>b.toString(16).padStart(2,'0')).join('');
  if(mechanicsSha!==meta.mechanicsSha256)throw new Error('The mechanics do not match this build. Rebuild or update the project.');
  mechanicsData=validateMechanics(referenceCatalog,JSON.parse(new TextDecoder().decode(mechanicsBytes)));
  if(mechanicsData.id!==meta.mechanicsId)throw new Error('Mechanics version mismatch.');
  exploreMechanics=createMechanicExplorer(referenceCatalog,mechanicsData);
  const chainsSha=[...new Uint8Array(await crypto.subtle.digest('SHA-256',chainsBytes))].map(b=>b.toString(16).padStart(2,'0')).join('');
  if(chainsSha!==meta.chainsSha256)throw new Error('The chains do not match this build. Rebuild or update the project.');
  chainsData=validateChains(referenceCatalog,mechanicsData,JSON.parse(new TextDecoder().decode(chainsBytes)));
  if(chainsData.id!==meta.chainsId)throw new Error('Chain version mismatch.');
  chainExplorer=createChainExplorer(referenceCatalog,mechanicsData,chainsData);
  suggestChains=createChainDiscovery(referenceCatalog,chainExplorer,chainsData);
  skills=snapshot.entities.filter(s=>s.kind==='skill');
  const params=new URL(location.href).searchParams;
  if(params.has('snapshot')&&params.get('snapshot')!==snapshot.id)throw new Error('This link refers to a different data snapshot. Open the lab without the link parameters to use this preview.');
  if(params.has('reference')&&params.get('reference')!==referenceCatalog.id)throw new Error('This link refers to a different source catalog. Open the lab without link parameters to use this build.');
  if(params.has('mechanics')&&params.get('mechanics')!==mechanicsData.id)throw new Error('This link refers to different mechanics. Open the lab without link parameters to use this build.');
  if(params.has('chains')&&params.get('chains')!==chainsData.id)throw new Error('This link refers to different chain rules. Open the lab without link parameters to use this build.');
  if(params.has('chainIdeas')&&params.get('chainIdeas')!==chainDiscoveryVersion)throw new Error('This link refers to different chain discovery rules. Open the lab without link parameters to use this build.');
  for(const [id,key,fallback] of [['chain-idea-status','ideaStatus','potential'],['chain-idea-event','ideaEvent','all'],['chain-idea-search','ideaQuery','']]){const value=params.get(key)??fallback;$(id).value=value;if($(id).value!==value||value.length>300)throw new Error('Invalid chain discovery filters in this link.');}
  if(params.has('chain')){const raw=params.get('chain');if(raw.length>6000)throw new Error('Chain link is too large.');chainInput=JSON.parse(raw);chainExplorer.explore(chainInput);if(!chainExplorer.generators.some(e=>e.id===chainInput.generatorId)||!chainExplorer.payoffs.some(e=>e.id===chainInput.payoffId))throw new Error('This chain selection is unavailable.');}
  const requested=params.get('skill');if(requested&&!skills.some(s=>s.id===requested))throw new Error('This skill is not in the bundled preview. Open the lab without the link parameters.');
  if(params.has('build')){const raw=params.get('build');if(raw.length>12000)throw new Error('Combination link is too large.');combination=JSON.parse(raw);validateCombination(snapshot,combination);}
  selected=requested||(params.get('inspect')==='1'?'spark':'frostbolt');
  discoveryMode=params.get('start')||'skill';discoveryAnchor=params.get('anchor')||(discoveryMode==='unique'?'the-three-dragons':discoveryMode==='support'?'living-lightning':selected);
  referenceView(discoveryMode,discoveryAnchor);$('advanced-checks').open=params.get('inspect')==='1';$('sideways-cascade').checked=params.get('cascade')==='sideways';
  for(const [flag,key] of Object.entries(contextParams))$(contextInputs[flag]).checked=params.get(key)==='1';
  for(const [id,key] of [['rule-no-elemental','ruleNoElemental'],['rule-no-chaos','ruleNoChaos'],['rule-no-critical','ruleNoCrit']])$(id).checked=params.get(key)==='1';
  $('version').textContent=`v${meta.appVersion}`;$('patch-label').textContent=`Target patch ${snapshot.patch}`;$('league-label').textContent=snapshot.league;
  const notice=$('data-notice');notice.replaceChildren(element('strong','CANDIDATE DATA'),element('span','Base snapshot cross-checked; discovery records pinned to sources. Live patch confirmation is pending.'));
  $('review-summary').textContent=`${meta.corroborated} source records cross-checked`;
  $('snapshot-info').textContent=`Snapshot: ${snapshot.id} · Rule version: ${snapshot.rulesVersion}`;
  $('review-info').textContent=snapshot.patchValidation.notes;$('patch-source').href=snapshot.patchValidation.officialPatchUrl;
  document.querySelector('.sidebar-note p').textContent=`${skills.length} reviewed skill shortcuts. Use the catalog selector to explore all imported skills and uniques.`;
  for(const skill of skills){const button=element('button',undefined,'skill-button');button.type='button';button.dataset.id=skill.id;button.dataset.name=skill.name.toLowerCase();const name=element('span',skill.name);name.append(element('small',family(skill)));button.append(name,element('span','↗','skill-symbol'));button.lastChild.setAttribute('aria-hidden','true');button.addEventListener('click',()=>choose(skill.id));$('skill-list').append(button);}

  for(const item of snapshot.items ?? []){const option=element('option',item.name);option.value=item.id;$('combination-item').append(option);}
  $('add-skill').addEventListener('click',()=>{if(!combination.skillIds.includes(selected))combination.skillIds.push(selected);render();updateUrl();});
  $('combination-item').addEventListener('change',()=>{combination.itemId=$('combination-item').value||null;renderCombination();updateUrl();});
  $('clear-combination').addEventListener('click',()=>{combination={version:1,skillIds:[],supports:{},itemId:null};render();updateUrl();});
  $('load-example').addEventListener('click',()=>{combination={version:1,skillIds:['spark','cast-on-critical','comet'],supports:{comet:['controlled-destruction']},itemId:null};selected='comet';for(const id of Object.values(contextInputs))$(id).checked=false;render();updateUrl();});

  $('start-skill').addEventListener('click',()=>{discoveryMode='skill';discoveryAnchor=selected;$('discovery-search').value='';$('catalog-search').value='';$('catalog-category').value='';renderDiscovery();updateUrl();});
  $('start-unique').addEventListener('click',()=>{discoveryMode='unique';discoveryAnchor='the-three-dragons';$('discovery-search').value='';$('catalog-search').value='';$('catalog-category').value='';renderDiscovery();updateUrl();});
  $('start-support').addEventListener('click',()=>{discoveryMode='support';discoveryAnchor='living-lightning';$('discovery-search').value='';$('catalog-search').value='';$('catalog-category').value='';renderDiscovery();updateUrl();});
  initChains();
  for(const id of ['rule-no-elemental','rule-no-chaos','rule-no-critical'])$(id).addEventListener('change',()=>{chainInput.confirmedEvents=[];renderRules(ruleRecord);renderChains(ruleRecord);updateUrl();});
  $('rule-more').addEventListener('click',()=>{ruleLimit+=12;renderRules(ruleRecord);});
  $('rule-support-more').addEventListener('click',()=>{supportLimit+=16;renderRules(ruleRecord);});
  $('rule-support-filter').addEventListener('change',()=>{supportLimit=16;renderRules(ruleRecord);});
  $('rule-support-search').addEventListener('input',()=>{supportLimit=16;renderRules(ruleRecord);});
  $('catalog-search').addEventListener('input',()=>{renderDiscovery();updateUrl();});
  $('catalog-category').addEventListener('change',()=>{renderDiscovery();updateUrl();});
  $('discovery-anchor').addEventListener('change',()=>{discoveryAnchor=$('discovery-anchor').value;if(discoveryMode==='skill'&&skills.some(s=>s.id===discoveryAnchor))selected=discoveryAnchor;$('discovery-search').value='';render();updateUrl();});
  $('discovery-search').addEventListener('input',renderDiscovery);
  $('advanced-checks').addEventListener('toggle',()=>updateUrl());
  $('skill-search').addEventListener('input',renderSkillList);$('support-search').addEventListener('input',renderSupports);
  for(const button of $('filters').children)button.addEventListener('click',()=>{filter=button.dataset.filter;for(const b of $('filters').children)b.setAttribute('aria-pressed',String(b===button));renderSupports();});
  for(const id of Object.values(contextInputs))$(id).addEventListener('change',()=>{render();updateUrl();});
  $('share').addEventListener('click',async()=>{updateUrl();try{await navigator.clipboard.writeText(location.href);$('share-status').textContent='Link copied.';$('share').textContent='Link copied ✓';}catch{$('share-fallback').hidden=false;$('share-url').value=location.href;$('share-url').focus();$('share-url').select();}});
  render();$('workspace').hidden=false;
}
start().catch(error=>{$('workspace').hidden=true;$('load-error').hidden=false;$('load-error').textContent=error.message;$('data-notice').replaceChildren(element('strong','LAB UNAVAILABLE'),element('span','Results are hidden until the data check passes.'));});
