import {recordVisual,visualTheme,combinationVisual} from './src/visuals.mjs';
import {validateSkillReviews,describeSkillReview} from './src/skill-reviews.mjs';
import {describeUniqueReview,uniqueModifiers} from './src/unique-reviews.mjs';
import {validateUniqueCombos,discoverUniqueCombos} from './src/unique-combos.mjs';
import {validateSkillCombos, discoverSkillCombos, skillComboCoverage} from './src/skill-combos.mjs';
import {validateExperimentDetails, validateCritTest, assessCriticalCadence} from './src/experiment-details.mjs';
import {createChainDiscovery, chainDiscoveryVersion} from './src/chain-discovery.mjs';
import { validateChains, createChainExplorer } from './src/chains.mjs';
import { validateMechanics, createMechanicExplorer, checkSupportTypes } from './src/mechanics.mjs';
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
const sourceGrantCache=new Map();
let uniqueCombos,skillReviews,skillReviewRecords,skillCombos,comboCoverage,experimentDetails,detailRecords,profileRecords,manualAnchorId,restoringManual=false,criticalBlocked=false;
let suggestChains,chainIdeaKey,chainIdeaOffset=0;
let chainsData,chainExplorer,chainInput={generatorId:'frostbolt',payoffId:'comet',itemId:null,remap:false,generatorSupportId:null,payoffSupportId:null,confirmedEvents:[],focusEvent:'all'};
let referenceCatalog,mechanicsData,exploreMechanics,ruleRecord,ruleAnchor,ruleLimit=12,supportLimit=16;
let catalog,discoveryMode='skill',discoveryAnchor='frostbolt';
let snapshot,meta,skills,selected='spark',filter='all',result;
let combination={version:1,skillIds:[],supports:{},itemId:null};
const contextInputs={sidewaysCascade:'sideways-cascade',criticalHitsDisabled:'critical-disabled',elementalAilmentsDisabled:'ailments-disabled',igniteDisabled:'ignite-disabled'};
const contextParams={criticalHitsDisabled:'noCrit',elementalAilmentsDisabled:'noAilments',igniteDisabled:'noIgnite'};
const readContext=()=>Object.fromEntries(Object.entries(contextInputs).map(([flag,id])=>[flag,$(id).checked]));
function updateUrl(){const url=new URL(location.href);url.searchParams.set('skill',selected);url.searchParams.set('snapshot',snapshot.id);url.searchParams.set('reference',referenceCatalog.id);url.searchParams.set('mechanics',mechanicsData.id);url.searchParams.set('chains',chainsData.id);url.searchParams.set('details',experimentDetails.id);url.searchParams.set('combos',skillCombos.id);url.searchParams.set('reviews',skillReviews.id);url.searchParams.set('uniques',uniqueCombos.id);if($('combo-only').checked)url.searchParams.set('covered','1');else url.searchParams.delete('covered');for(const [id,key] of [['chain-ideas-panel','explore'],['chain-panel','workbench'],['rule-explorer','sourceChecks'],['crit-cadence','critCheck']]){if($(id).open)url.searchParams.set(key,'1');else url.searchParams.delete(key);}url.searchParams.set('chainIdeas',chainDiscoveryVersion);for(const [id,key,fallback] of [['chain-idea-status','ideaStatus','potential'],['chain-idea-event','ideaEvent','all'],['chain-idea-search','ideaQuery','']]){const value=$(id).value;if(value!==fallback)url.searchParams.set(key,value);else url.searchParams.delete(key);}url.searchParams.set('chain',JSON.stringify(chainInput));for(const [id,key] of [['rule-no-elemental','ruleNoElemental'],['rule-no-chaos','ruleNoChaos'],['rule-no-critical','ruleNoCrit']]){if($(id).checked)url.searchParams.set(key,'1');else url.searchParams.delete(key);}if($('sideways-cascade').checked)url.searchParams.set('cascade','sideways');else url.searchParams.delete('cascade');for(const [flag,key] of Object.entries(contextParams)){if($(contextInputs[flag]).checked)url.searchParams.set(key,'1');else url.searchParams.delete(key);}if(combination.skillIds.length || combination.itemId)url.searchParams.set('build',JSON.stringify(combination));else url.searchParams.delete('build');url.searchParams.set('start',discoveryMode);url.searchParams.set('anchor',discoveryAnchor);if($('advanced-checks').open)url.searchParams.set('inspect','1');else url.searchParams.delete('inspect');history.replaceState(null,'',url);}
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
    card.append(itemInfo(idea.item.id),condition,link('Pinned item modifier ↗',idea.item.evidence.url));$('unique-list').append(card);
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
  $('combination-item-info').replaceChildren(...(combination.itemId?[itemInfo(combination.itemId)]:[]));
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
  let view={anchor:{id:record.id,name:record.name,kind},status:'candidate',ideas:[],limits:catalog.limits};
  if(record.kind==='unique'&&catalog.items.some(item=>item.id===record.id))view=discover(snapshot,catalog,{kind,id:record.id});
  else if(record.reviewedId)view=discover(snapshot,catalog,{kind,id:record.reviewedId});
  return {...view,ideas:[...view.ideas,...discoverUniqueCombos(referenceCatalog,uniqueCombos,kind,record.id)]};
}
function itemInfo(id,showName=true){
 const record=referenceCatalog.entries.find(e=>e.id===id||e.reviewedId===id),detail=detailRecords.get(record?.id);
 const box=element('section',undefined,'item-info');box.dataset.itemInfo=id;
 if(!record){box.append(element('strong','Unique details unavailable'),element('p','No source record is available for this item.','muted'));return box;}
 const heading=element('div',undefined,'item-info-heading');heading.append(recordVisual(record),element('strong',showName?'Unique '+record.category+' · '+record.name:'What this item changes'));box.append(heading);if(showName)box.append(element('p',record.base,'muted'));
 if(!detail||detail.generated){box.append(element('p',detail?.generated?'Variable unique: generated modifiers are not expanded.':'Item modifiers are unavailable in this source.','muted'),link('Item source ↗',record.evidence.url));return box;}
 const current=uniqueModifiers(detail);
 for(const mod of current)box.append(element('p',mod.text,'item-effect'));
 const variants=[...new Set(detail.modifiers.flatMap(m=>m.variants))],versions=[...new Set(detail.modifiers.flatMap(m=>m.versions||[]))];
 if(versions.length)box.append(element('small','Versioned modifiers use the source Current version. Older versions are listed separately below.'));
 if(variants.length)box.append(element('small',variants.includes('Current')?'Showing common stats + Current source variant. Other versions differ.':'Showing common stats only. Match your actual named variant against the source stats below.'));
 const all=element('details');all.append(element('summary','All source stats & variants'));
 if(variants.length&&!variants.includes('Current'))all.open=true;
 const lines=element('ul');for(const mod of detail.modifiers)lines.append(element('li',(mod.variants.length?'Variant '+mod.variants.join(' / ')+': ':'')+(mod.versions?.length?'Version '+mod.versions.join(' / ')+': ':'')+mod.text));all.append(lines,link('Item source ↗',record.evidence.url));box.append(all);return box;
}
function renderReferenceRecord(record) {
 const box=$('catalog-record'),heading=element('div',undefined,'record-heading'),copy=element('div',undefined,'record-heading-copy');
 box.dataset.visualTone=visualTheme(record).tone;
 copy.append(element('p',record.kind.toUpperCase()+' · '+record.category+(record.weaponRequirements?' · Requires '+record.weaponRequirements:record.base?' · '+record.base:''),'eyebrow'),element('h3',record.name));
 heading.append(recordVisual(record,'large'),copy);box.replaceChildren(heading);
 if(record.kind==='unique'){box.append(itemInfo(record.id,false));renderUniqueGuide(record,box);}
 else if(record.kind==='support')box.append(element('p',detailRecords.get(record.id)?.description||'No description is recorded in this source. Type checks are available.','muted'));
 if(record.kind==='skill')renderSkillGuide(record,box);
 if(record.id==='gas-arrow')box.append(element('p',experimentDetails.gasArrow.summary,'mechanic-note'));
 const details=element('details');details.append(element('summary','Record & source'));
 const tags=element('div',undefined,'tag-row');for(const tag of record.tags)tags.append(element('span',tag,'tag'));details.append(tags);
 if(record.legacy)details.append(element('p','Marked as legacy in this source record.','warning'));
 details.append(element('p','Imported source record; target-patch behavior remains unverified.','muted'),link('View source record ↗',record.evidence.url));
 if(record.effectEvidence)details.append(link('Skill mechanics source ↗',record.effectEvidence.url));box.append(details);
}
function sourceItemAccess(id){
 if(!sourceGrantCache.has(id))sourceGrantCache.set(id,[...new Set(exploreMechanics(id).links.filter(c=>(c.kind==='grant'||c.kind==='trigger')&&c.skillId===id).map(c=>c.itemId))]);
 return sourceGrantCache.get(id);
}
function renderUniqueGuide(record,box){
 const guide=describeUniqueReview(record,detailRecords.get(record.id)),count=referenceView('unique',record.id).ideas.length;
 const section=element('section',undefined,'skill-review');section.dataset.uniqueReview=record.id;section.dataset.reviewStatus=guide.status;
 section.append(element('p',guide.roles.join(' · '),'skill-role'),element('p',count?count+' researched combinations below':'No specific researched combination established for this item.','muted'));
 for(const warning of guide.warnings)section.append(element('p',warning,'warning'));
 const details=element('details');details.append(element('summary','Unique setup & practical checks'));
 if(guide.conditions.length){details.append(element('h4','Conditions & tradeoffs from the source'));const list=element('ul');for(const line of guide.conditions)list.append(element('li',line));details.append(list);}
 const list=element('ol');for(const check of guide.practical)list.append(element('li',check));details.append(element('h4','Test before combining'),list,element('p','Source guide only; equipment budget, passive tree and in-game performance remain untested.','muted'),link('Exact unique source ↗',record.evidence.url));section.append(details);box.append(section);
}
function renderSkillGuide(record,box){
 const source=skillReviewRecords.get(record.id),guide=describeSkillReview(record,source,profileRecords.get(record.id));
 const section=element('section',undefined,'skill-review');section.dataset.skillReview=record.id;section.dataset.descriptionStatus=source.descriptionStatus;
 const recipes=referenceView('skill',record.id).ideas.length+discoverSkillCombos(referenceCatalog,skillCombos,record.id).length;
 section.append(element('p',guide.role+' · '+(recipes?recipes+' researched combinations':'No specific researched combination established'),'skill-role'));
 if(source.description)section.append(element('p',source.description,'muted'));
 for(const warning of guide.warnings)section.append(element('p',warning,'warning'));
 const details=element('details');details.append(element('summary','Skill setup & practical checks'));
 if(guide.statements.length){details.append(element('h4','Conditions from the source'));const statements=element('ul');for(const statement of guide.statements)statements.append(element('li',statement));details.append(statements);}
 details.append(element('h4','Test before combining'));const practical=element('ol');for(const check of guide.practical)practical.append(element('li',check));details.append(practical);
 details.append(element('p','Source guide only. These checks do not establish a new synergy, damage gain or complete build.','muted'),link('Exact skill source ↗',(record.effectEvidence||record.evidence).url));
 section.append(details);if(source.fromItem&&source.descriptionStatus==='recorded'&&!record.name.includes('{0}')){const items=sourceItemAccess(record.id);for(const id of items)section.append(itemInfo(id));if(!items.length)section.append(element('p','No granting unique is recognized by the partial item rules. Verify the actual item source before using this skill.','muted'));}box.append(section);
}

function syncManualAnchor(record){
 if(manualAnchorId===record.id)return;manualAnchorId=record.id;
 if(restoringManual){restoringManual=false;return;}chainInput.critTest={};chainInput.confirmedEvents=[];
 const generator=chainExplorer.generators.some(e=>e.id===record.id);
 if(generator)chainInput={...chainInput,generatorId:record.id,itemId:null,remap:false,generatorSupportId:null,payoffSupportId:null,confirmedEvents:[],focusEvent:'all',critTest:{}};
 else if(chainExplorer.items.some(e=>e.id===record.id))chainInput={...chainInput,itemId:record.id,remap:false,confirmedEvents:[],critTest:{}};
 else if(record.kind!=='support')$('chain-panel').open=false;
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
    const conditions=element('ul');for(const condition of connection.conditions)conditions.append(element('li',condition));card.append(conditions);if(connection.itemId)card.append(itemInfo(connection.itemId));
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
  $('combo-filter').hidden=discoveryMode!=='skill';
  const records=referenceEntries(referenceCatalog,discoveryMode,$('catalog-search').value,$('catalog-category').value).filter(record=>discoveryMode!=='skill'||!$('combo-only').checked||referenceView('skill',record.id).ideas.length||discoverSkillCombos(referenceCatalog,skillCombos,record.id).length);
  $('catalog-count').textContent=referenceCatalog.counts.skill+' skills · '+referenceCatalog.counts.support+' supports · '+referenceCatalog.counts.unique+' uniques in the pinned source catalog';
  $('discovery-anchor').replaceChildren(...records.map(record=>{const option=element('option',record.name+(record.base?' · '+record.base:''));option.value=record.id;return option;}));$('discovery-anchor').disabled=!records.length;
  $('discovery-ideas').replaceChildren();$('source-experiments').replaceChildren();
  if(!records.length){$('rule-explorer').hidden=true;$('chain-panel').hidden=true;$('chain-ideas-panel').hidden=true;$('catalog-record').replaceChildren(element('p','No source records match this search. Try another name, tag or category.','empty-note'));$('discovery-count').textContent='No catalog matches';return;}
  let record=resolveReference(referenceCatalog,discoveryMode,discoveryAnchor);
  if(!record||!records.some(e=>e.id===record.id))record=records[0];
  discoveryAnchor=record.id;$('discovery-anchor').value=record.id;syncManualAnchor(record);renderReferenceRecord(record);renderRules(record);renderChains(record);
  const view=referenceView(discoveryMode,discoveryAnchor),query=$('discovery-search').value.trim().toLowerCase();
  const allIdeas=[...view.ideas,...discoverSkillCombos(referenceCatalog,skillCombos,record.id)];
  const ideas=allIdeas.filter(i=>(i.title+' '+i.hook+' '+i.skills.map(s=>s.name).join(' ')).toLowerCase().includes(query));
  renderSourceExperiments(record,query);
  $('discovery-count').textContent=ideas.length+' researched ideas for '+view.anchor.name+' · mechanics checked, performance untested';
  $('discovery-ideas').replaceChildren();
  if(!ideas.length){$('discovery-ideas').append(element('div',allIdeas.length?'No ideas match this search.':'No researched combination is recorded for this starting point yet. Use the source setup guide above and any separate item experiments below; a setup guide is not a proven synergy.','empty-support'));return;}
  for(const idea of ideas){
    const card=element('article',undefined,'discovery-card');card.dataset.idea=idea.id;
    card.prepend(combinationVisual(idea));
    card.append(element('span',idea.item?idea.item.name:'SKILL INTERACTION','discovery-item-label'),element('h3',idea.title),element('p',idea.hook,'discovery-hook'));
    const chips=element('div',undefined,'tag-row');for(const skill of idea.skills){const chip=element('span',undefined,'tag skill-tag');chip.append(recordVisual(skill,'tiny'),element('span',skill.name));chips.append(chip);}card.append(chips,element('p',idea.buildPlan.playstyle,'muted'));if(idea.item)card.append(itemInfo(idea.item.id));if(skillCombos.recipes.some(r=>r.id===idea.id)||uniqueCombos.recipes.some(r=>r.id===idea.id)){const members=element('div',undefined,'tag-row');if(idea.item&&record.id!==idea.item.id){const open=element('button','Explore '+idea.item.name+' ↗','rule-open');open.type='button';open.addEventListener('click',()=>openRuleReference('unique',idea.item.id));members.append(open);}for(const skill of idea.skills.filter(s=>s.id!==record.id)){const open=element('button','Explore '+skill.name+' ↗','rule-open');open.type='button';open.addEventListener('click',()=>openRuleReference('skill',skill.id));members.append(open);}card.append(members);}
    const itemSkills=idea.skills.filter(s=>skillReviewRecords.get(s.id)?.fromItem);const access=new Set(itemSkills.flatMap(s=>sourceItemAccess(s.id)));if(idea.item)access.delete(idea.item.id);if(access.size)card.append(element('p','Item access · confirm the actual source variant','skill-role'));for(const id of access)card.append(itemInfo(id));if(itemSkills.some(s=>!sourceItemAccess(s.id).length))card.append(element('p','This idea includes an item-granted skill. Its granting item is not modeled here; verify that source and its equipment requirements first.','warning'));
    const firstTest=element('div',undefined,'first-test');firstTest.append(element('strong','First test'),element('p',idea.buildPlan.firstTest));card.append(firstTest);
    const more=element('details',undefined,'idea-details');more.append(element('summary',idea.supportIdeas.length?'Mechanics, supports & tradeoffs':'Mechanics & tradeoffs'));
    const body=element('div',undefined,'idea-body');body.append(element('h4','Why this is interesting'),element('p',idea.mechanics),element('h4','How to explore it'));
    const steps=element('ol');for(const step of idea.play)steps.append(element('li',step));body.append(steps);if(idea.supportIdeas.length)body.append(element('h4','Support ideas — and why'));
    for(const role of idea.supportIdeas){
      const box=element('div',undefined,'discovery-support');box.dataset.ideaSupport=role.supportId;
      box.append(element('strong',role.support.name+' → '+idea.skills.find(s=>s.id===role.skillId).name),element('p',role.reason),element('small',role.typeStatus==='unknown'?'CONTEXT REQUIRED · Verify this support in game':(idea.skills.find(s=>s.id===role.skillId).reviewScope?'BASE TYPES MATCH · Minion behavior untested':'BASE TYPES MATCH')),element('small','Tradeoff: '+role.tradeoff),link('Support record ↗',role.support.evidence.url));body.append(box);
    }
    body.append(element('h4','Conditions & costs'));const conditions=element('ul');for(const c of idea.conditions)conditions.append(element('li',c));body.append(conditions,element('h4','Avoid the tempting mistake'));
    const avoid=element('ul');for(const c of idea.avoid)avoid.append(element('li',c));body.append(avoid,element('h4','Evidence'));
    for(const url of new Set([...idea.evidenceUrls,...(idea.socketChecks||[]).map(c=>c.evidence.url)]))body.append(link('Source ↗',url));
    more.append(body);card.append(more);
    const plan=element('details',undefined,'idea-details');plan.append(element('summary','Turn this idea into a build experiment'));
    const planBody=element('div',undefined,'idea-body');planBody.append(element('h4','Core components'));
    const components=element('ul');for(const component of idea.buildPlan.components)components.append(element('li',component));
    planBody.append(components,element('h4','Test the mechanic first'),element('p',idea.buildPlan.firstTest),element('h4','Reconsider the idea if'),element('p',idea.buildPlan.stopIf),element('h4','Before calling this a full build'));
    const checks=element('ol');for(const check of idea.buildPlan.nextChecks)checks.append(element('li',check));planBody.append(checks,element('p','Experiment only: no validated ascendancy, passive tree, gear budget or endgame rating yet.','muted'));plan.append(planBody);card.append(plan);
    const inspectable=idea.skills.find(s=>skills.some(base=>base.id===s.id));
    if(!inspectable){if(!skillCombos.recipes.some(r=>r.id===idea.id))card.append(element('p','Use the source descriptions and first test above. This interaction is not included in the smaller support-and-trigger workbench yet.','muted'));$('discovery-ideas').append(card);continue;}
    const inspect=element('button','Inspect '+inspectable.name+' checks ↗','share-button');inspect.type='button';
    inspect.addEventListener('click',()=>{selected=inspectable.id;$('advanced-checks').open=true;render();updateUrl();$('skill-title').scrollIntoView({block:'start',behavior:'auto'});});card.append(inspect);
    $('discovery-ideas').append(card);
  }
}

function renderSourceExperiments(record,query){
 const box=$('source-experiments');box.replaceChildren();
 const usedItems=new Set(referenceView(record.kind,record.id).ideas.map(i=>i.item?.id).filter(Boolean));
 const links=exploreMechanics(record.id,{noElementalDamage:$('rule-no-elemental').checked,noChaosDamage:$('rule-no-chaos').checked,noCriticalHits:$('rule-no-critical').checked}).links.filter(c=>c.status!=='blocked'&&!usedItems.has(c.itemId)&&(c.title+' '+c.explanation).toLowerCase().includes(query));
 const seen=new Set(),unique=links.filter(c=>{const key=c.kind+':'+c.skillId+':'+c.itemId;if(seen.has(key))return false;seen.add(key);return true;});
 if(!unique.length)return;
 const panel=element('details',undefined,'source-experiment-panel');panel.open=!referenceView(record.kind,record.id).ideas.length&&!discoverSkillCombos(referenceCatalog,skillCombos,record.id).length;panel.append(element('summary','Other item experiments ('+unique.length+')'));
 panel.append(element('p','Source relationships to investigate. Equipment scope, damage components and current item variants still need a practical check.','muted'));
 for(const connection of unique.slice(0,2)){
  const card=element('article',undefined,'rule-card source-experiment');card.dataset.sourceExperiment=connection.id;
  card.append(element('span','SOURCE CANDIDATE · UNTESTED','connection-label'),element('h4',connection.title),element('p',connection.explanation),itemInfo(connection.itemId));
  const first=element('div',undefined,'first-test');first.append(element('strong','First test'),element('p',connection.kind==='conversion'?'Equip the exact item variant, confirm weapon compatibility and inspect the intended skill damage component before and after. Stop if the modifier does not apply to that component.':'Equip the item and check the exact granted skill, its requirements and actual activation. Do not assume a granted skill is an automatic trigger.'));card.append(first);
  const details=element('details');details.append(element('summary','Conditions & sources'));const list=element('ul');for(const condition of connection.conditions)list.append(element('li',condition));details.append(list);for(const url of connection.evidenceUrls)details.append(link('Pinned source ↗',url));card.append(details);panel.append(card);
 }
 if(unique.length>2){const more=element('button','Inspect all '+unique.length+' item relationships ↗','rule-open');more.type='button';more.addEventListener('click',()=>{$('rule-explorer').open=true;$('rule-explorer').scrollIntoView({block:'start'});updateUrl();});panel.append(more);}box.append(panel);
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
 $('chain-ideas-scope').textContent=record.id==='gas-arrow'?'No continuous critical-hit path is modeled for Gas Arrow’s poison cloud. Start with the ignition ideas above; arrow and explosion hits need separate testing.':'Starting point: '+record.name+' ('+roleLabels[view.anchorRole]+'). Triggered spell: '+payoff.name+'. Candidates need an in-game setup and rate check.';
 $('chain-ideas-count').textContent='Showing '+(view.matched?chainIdeaOffset+1:0)+'–'+Math.min(chainIdeaOffset+8,view.matched)+' of '+view.matched+' matching paths / '+view.total+' modeled paths · '+view.blocked+' blocked before filters. Alphabetical order; no damage ranking.';
 $('chain-ideas-results').replaceChildren();
 if(!view.proposals.length)$('chain-ideas-results').append(element('p',view.anchorRole==='unmodeled'?'No chain role is modeled for this source yet. Its presence in the catalog does not establish a synergy.':view.total?'No paths match these filters. Inspect blocked paths or change the payoff, supports or scenario.':'No path is modeled for this source and payoff under the bounded chain rules.','empty-note'));
 for(const proposal of view.proposals){
  const card=element('article',undefined,'rule-card chain-idea');card.dataset.ideaChainStatus=proposal.status;card.dataset.ideaChainEvent=proposal.event;card.dataset.ideaAnchorRole=proposal.anchorRole;
  card.append(element('span',proposal.status==='blocked'?'BLOCKED':'MECHANIC CANDIDATE · UNTESTED','connection-label'),element('h4',proposal.title));
  if(record.kind==='support')card.append(element('p',record.name+' assigned to the '+(proposal.anchorRole==='generator-support'?'generator':'payoff')+'.'));
  if(proposal.event==='critical')card.append(element('p','Critical-hit frequency and Energy gain have not been assessed. A type match does not establish an effective trigger setup.','muted'));for(const id of proposal.itemIds)card.append(itemInfo(id));const steps=element('ol');for(const step of proposal.steps)steps.append(element('li',step));
  const details=element('details');details.append(element('summary','Steps, conditions & sources'),steps);
  const conditions=element('ul');for(const reason of proposal.reasons)conditions.append(element('li',reason));details.append(conditions);
  for(const url of [...new Set(proposal.evidenceUrls)])details.append(link('Pinned source ↗',url));card.append(details);
  const tryIdea=element('button','Try this chain','rule-open');tryIdea.type='button';tryIdea.addEventListener('click',()=>{
   chainInput={...proposal.input,confirmedEvents:[],critTest:{}};$('chain-panel').open=true;if(proposal.event==='critical')$('crit-cadence').open=true;renderChains(ruleRecord);updateUrl();$('chain-panel').scrollIntoView({block:'start',behavior:'auto'});
  });card.append(tryIdea);$('chain-ideas-results').append(card);
 }
 $('chain-ideas-more').hidden=!view.hasMore;$('chain-ideas-previous').hidden=chainIdeaOffset===0;
}
const critInputs={hitsPerSecond:'crit-hits',critChance:'crit-chance',energyPerCrit:'crit-energy',energyRequired:'crit-required',manaPerTrigger:'crit-cost',manaPerSecond:'crit-sustain'};
function fillChainSupports(){
 const generator=profileRecords.get(chainInput.generatorId),payoff=profileRecords.get(chainInput.payoffId);
 const triggered={...payoff,skillTypes:[...payoff.skillTypes,'Triggered']};
 for(const [id,key,target,blank] of [['chain-generator-support','generatorSupportId',generator,'No source support'],['chain-payoff-support','payoffSupportId',triggered,'No triggered-spell support']]){
  const options=[];const none=element('option',blank);none.value='';options.push(none);
  for(const entry of referenceCatalog.entries.filter(e=>e.kind==='support')){
   const check=checkSupportTypes(target,profileRecords.get(entry.id));
   if((check.status==='incompatible'||entry.legacy)&&chainInput[key]!==entry.id)continue;
   const label=(check.status==='incompatible'?'Excluded: ':check.status==='unknown'?'Context check: ':'')+entry.name;
   const option=element('option',label);option.value=entry.id;option.title=detailRecords.get(entry.id)?.description||check.reason;options.push(option);
  }
  $(id).replaceChildren(...options);$(id).value=chainInput[key]||'';
 }
}
function renderComponentInfo(){
 const box=$('chain-component-info');box.replaceChildren();
 const itemIds=[chainInput.itemId,...(chainInput.remap?['the-three-dragons']:[])].filter(Boolean);
 if(!itemIds.length)box.append(element('p','No unique item is selected for this trigger experiment.','muted'));
 for(const id of new Set(itemIds))box.append(itemInfo(id));
 for(const [role,id,skillId] of [['Event-source',chainInput.generatorSupportId,chainInput.generatorId],['Triggered-spell',chainInput.payoffSupportId,chainInput.payoffId]]){
  if(!id)continue;const record=referenceCatalog.entries.find(e=>e.id===id),info=element('section',undefined,'support-info');
  info.append(element('strong',role+' support gem · '+record.name),element('p',detailRecords.get(id)?.description||'No source description is recorded; only type checks are available.','muted'));
  const base=profileRecords.get(skillId),target=role==='Triggered-spell'?{...base,skillTypes:[...base.skillTypes,'Triggered']}:base,check=checkSupportTypes(target,profileRecords.get(id));
  info.append(element('p',check.reason,check.status==='incompatible'?'warning':'muted'),link('Support source ↗',(record.effectEvidence||record.evidence).url));box.append(info);
 }
}
function initCritTest(){
 for(const [key,id] of Object.entries(critInputs))$(id).addEventListener('input',()=>{
  const input={};for(const [field,control] of Object.entries(critInputs))if($(control).value!=='')input[field]=$(control).valueAsNumber;
  try{validateCritTest(input);chainInput.critTest=input;showCritResult();updateUrl();}
  catch{$('crit-result').replaceChildren(element('p','Use finite, nonnegative values; crit chance is 0–100% and the Energy requirement must be greater than zero.','warning'));}
 });
}
function renderCritTest(view){
 const critical=view.chains.find(c=>c.event==='critical');criticalBlocked=critical?.status==='blocked';$('crit-cadence').hidden=!critical;
 for(const [key,id] of Object.entries(critInputs))$(id).value=chainInput.critTest?.[key]??'';
 showCritResult();
}
function showCritResult(){
 const result=assessCriticalCadence(chainInput.critTest||{}),box=$('crit-result');box.replaceChildren();
 if(criticalBlocked)box.append(element('p','This critical-hit route is blocked by the selected setup. A cadence estimate cannot make an excluded support or disabled critical hit work.','warning'));
 else if(result.status==='needs-input')box.append(element('p','Trigger frequency is not assessed. Enter qualifying hits, final crit chance, Energy per critical hit and the actual Energy requirement.','muted'));
 else if(result.status==='no-energy')box.append(element('p','These observations produce no qualifying critical-hit Energy. This setup cannot sustain the modeled trigger from them.','warning'));
 else{
  const format=x=>x.toLocaleString('en',{maximumFractionDigits:3});
  box.append(element('p','Estimated average: '+format(result.criticalHitsPerSecond)+' critical hits/s · '+format(result.energyPerSecond)+' Energy/s.'),element('p','Energy fill time: '+format(result.fillSeconds)+' s · Energy-only upper bound: '+format(result.castsPerSecond)+' triggers/s.'));
  if(result.manaDemand!==null)box.append(element('p','Triggered-spell Mana demand at that upper bound: '+format(result.manaDemand)+'/s. This excludes the event-source cost.'));
  if(result.manaShortfall!==null)box.append(element('p',result.manaShortfall?'Mana sustain shortfall: '+format(result.manaShortfall)+'/s before the event-source cost.':'The supplied Mana rate covers this modeled triggered-spell cost; the event source and other costs still need checking.',result.manaShortfall?'warning':'muted'));
 }
 const notes=element('ul');for(const note of experimentDetails.critNotes)notes.append(element('li',note));box.append(notes);
}

function initChains(){
 for(const id of ['chain-idea-status','chain-idea-event','chain-idea-search'])$(id).addEventListener(id==='chain-idea-search'?'input':'change',()=>{chainIdeaOffset=0;renderChainIdeas(ruleRecord);updateUrl();});
 $('chain-ideas-previous').addEventListener('click',()=>{chainIdeaOffset=Math.max(0,chainIdeaOffset-8);renderChainIdeas(ruleRecord);});
 $('chain-ideas-more').addEventListener('click',()=>{chainIdeaOffset+=8;renderChainIdeas(ruleRecord);});
 const fill=(id,records,blank)=>{const options=records.map(r=>{const o=element('option',r.name);o.value=r.id;return o;});if(blank){const o=element('option',blank);o.value='';options.unshift(o);}$(id).replaceChildren(...options);};
 fill('chain-generator',chainExplorer.generators);fill('chain-payoff',chainExplorer.payoffs);
 fill('chain-item',chainExplorer.items,'No conversion or remapping unique');
 initCritTest();
 for(const [id,key] of [['chain-ideas-panel','explore'],['chain-panel','workbench'],['rule-explorer','sourceChecks'],['crit-cadence','critCheck']])$(id).addEventListener('toggle',()=>{if(snapshot&&experimentDetails)updateUrl();});
 for(const [id,key] of [['chain-focus-event','focusEvent'],['chain-generator','generatorId'],['chain-payoff','payoffId'],['chain-item','itemId'],['chain-generator-support','generatorSupportId'],['chain-payoff-support','payoffSupportId']]){
  $(id).addEventListener('change',()=>{chainInput[key]=$(id).value||null;chainInput.critTest={};if(['generatorId','itemId','generatorSupportId'].includes(key))chainInput.confirmedEvents=[];if(key==='focusEvent'&&chainInput.focusEvent==='critical')$('crit-cadence').open=true;renderChains(ruleRecord);updateUrl();});
 }
 $('chain-remap').addEventListener('change',()=>{chainInput.remap=$('chain-remap').checked;chainInput.confirmedEvents=[];chainInput.critTest={};renderChains(ruleRecord);updateUrl();});
 for(const event of ['ailment','critical','minion-death'])$('chain-confirm-'+event).addEventListener('change',()=>{
  chainInput.confirmedEvents=['ailment','critical','minion-death'].filter(e=>$('chain-confirm-'+e).checked);renderChains(ruleRecord);updateUrl();
 });
 $('chain-use-source').addEventListener('click',()=>{
  const r=ruleRecord;if(!r)return;chainInput.confirmedEvents=[];chainInput.critTest={};
  if(chainExplorer.generators.some(e=>e.id===r.id)){chainInput.generatorId=r.id;chainInput.confirmedEvents=[];}
  else if(chainExplorer.payoffs.some(e=>e.id===r.id))chainInput.payoffId=r.id;
  else if(chainExplorer.items.some(e=>e.id===r.id))chainInput.itemId=r.id;
  else if(r.kind==='support')chainInput.generatorSupportId=r.id;
  renderChains(ruleRecord);updateUrl();
 });
}
function renderChains(record){
 renderChainIdeas(record);
 $('chain-panel').hidden=false;fillChainSupports();
 for(const [id,key] of [['chain-focus-event','focusEvent'],['chain-generator','generatorId'],['chain-payoff','payoffId'],['chain-item','itemId'],['chain-generator-support','generatorSupportId'],['chain-payoff-support','payoffSupportId']])$(id).value=chainInput[key]||(key==='focusEvent'?'all':'');
 $('chain-remap').checked=chainInput.remap;
 for(const event of ['ailment','critical','minion-death'])$('chain-confirm-'+event).checked=chainInput.confirmedEvents.includes(event);
 const usable=record&&(chainExplorer.generators.some(e=>e.id===record.id)||chainExplorer.payoffs.some(e=>e.id===record.id)||chainExplorer.items.some(e=>e.id===record.id)||record.kind==='support');
 $('chain-use-source').hidden=!usable;
 $('chain-use-source').textContent='Use '+record.name+' as a component';
 const source=referenceCatalog.entries.find(e=>e.id===chainInput.generatorId),payoff=referenceCatalog.entries.find(e=>e.id===chainInput.payoffId);
 $('chain-active-title').textContent=source.name+' → '+payoff.name;
 $('chain-active-scope').textContent='Event source: '+source.name+'. Catalog record: '+record.name+'. '+(record.id==='gas-arrow'?experimentDetails.gasArrow.critical:'The triggered spell is separately socketed; type matches alone do not establish effectiveness.');
 renderComponentInfo();
 const view=chainExplorer.explore({...chainInput,noElementalDamage:$('rule-no-elemental').checked,noChaosDamage:$('rule-no-chaos').checked,noCriticalHits:$('rule-no-critical').checked});
 const events=new Set(view.chains.map(chain=>chain.event));for(const event of ['ailment','critical','minion-death'])$('chain-confirm-'+event).closest('label').hidden=!events.has(event);
 $('chain-remap').closest('label').hidden=chainInput.focusEvent==='critical'&&!chainInput.remap;
 $('chain-item').closest('label').hidden=chainInput.focusEvent==='critical'&&!chainInput.itemId;

 $('chain-count').textContent=view.chains.length+' candidate paths · '+view.chains.filter(c=>c.status==='blocked').length+' blocked';
 renderCritTest(view);$('chain-results').replaceChildren();
 if(!view.chains.length)$('chain-results').append(element('p','No route is modeled for these selections. A selected unique must participate in the chain; minion conversion and recursive trigger loops are outside these rules.','empty-note'));
 for(const chain of view.chains){
  const card=element('article',undefined,'rule-card');card.dataset.chainStatus=chain.status;card.dataset.chainEvent=chain.event;
  card.append(element('h4',referenceCatalog.entries.find(e=>e.id===chain.triggerId).name+' · '+(chain.status==='blocked'?'BLOCKED':chain.status==='conditional'?'EVENT CONFIRMED · PERFORMANCE UNTESTED':'SETUP AND EVENT CHECK NEEDED')));
  if(chain.status==='blocked')card.append(element('p',chain.reasons[0],'warning'));if(chain.event==='critical')card.append(element('p','A critical hit alone is not an effectiveness check. Review sustained critical hits, Energy fill time and Mana below.','muted'));const steps=element('ol');for(const step of chain.steps)steps.append(element('li',step));
  const conditions=element('ul');for(const reason of chain.reasons)conditions.append(element('li',reason));
  const details=element('details');details.append(element('summary','Steps, checks & sources'),steps,conditions);
  for(const url of [...new Set(chain.evidenceUrls)])details.append(link('Source ↗',url));card.append(details);$('chain-results').append(card);
 }
}

async function start(){
  const responses=await Promise.all([fetch('./data/snapshot.json',{cache:'no-cache'}),fetch('./data/build.json',{cache:'no-cache'}),fetch('./data/catalog.json',{cache:'no-cache'}),fetch('./data/reference.json',{cache:'no-cache'}),fetch('./data/mechanics.json',{cache:'no-cache'}),fetch('./data/chains.json',{cache:'no-cache'}),fetch('./data/experiment-details.json',{cache:'no-cache'}),fetch('./data/skill-combos.json',{cache:'no-cache'}),fetch('./data/skill-reviews.json',{cache:'no-cache'}),fetch('./data/unique-combos.json',{cache:'no-cache'})]);
  if(responses.some(r=>!r.ok))throw new Error('The bundled data could not be loaded.');
  const [bytes,metadata,catalogBytes,referenceBytes,mechanicsBytes,chainsBytes,detailBytes,comboBytes,reviewBytes,uniqueBytes]=await Promise.all([responses[0].arrayBuffer(),responses[1].json(),responses[2].arrayBuffer(),responses[3].arrayBuffer(),responses[4].arrayBuffer(),responses[5].arrayBuffer(),responses[6].arrayBuffer(),responses[7].arrayBuffer(),responses[8].arrayBuffer(),responses[9].arrayBuffer()]);meta=metadata;
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
  const detailSha=[...new Uint8Array(await crypto.subtle.digest('SHA-256',detailBytes))].map(b=>b.toString(16).padStart(2,'0')).join('');
  if(detailSha!==meta.detailsSha256)throw new Error('The experiment details do not match this build.');
  experimentDetails=validateExperimentDetails(referenceCatalog,JSON.parse(new TextDecoder().decode(detailBytes)));
  if(experimentDetails.id!==meta.detailsId)throw new Error('Experiment details version mismatch.');
  detailRecords=new Map(experimentDetails.entries.map(e=>[e.id,e]));profileRecords=new Map(mechanicsData.profiles.map(p=>[p.id,p]));
  skills=snapshot.entities.filter(s=>s.kind==='skill');
  const comboSha=[...new Uint8Array(await crypto.subtle.digest('SHA-256',comboBytes))].map(b=>b.toString(16).padStart(2,'0')).join('');
  if(comboSha!==meta.skillCombosSha256)throw new Error('The skill combinations do not match this build.');
  skillCombos=validateSkillCombos(referenceCatalog,JSON.parse(new TextDecoder().decode(comboBytes)),mechanicsData);
  if(skillCombos.id!==meta.skillCombosId)throw new Error('Skill combinations version mismatch.');
  const reviewSha=[...new Uint8Array(await crypto.subtle.digest('SHA-256',reviewBytes))].map(b=>b.toString(16).padStart(2,'0')).join('');
  if(reviewSha!==meta.skillReviewsSha256)throw new Error('The skill reviews do not match this build.');
  skillReviews=validateSkillReviews(referenceCatalog,JSON.parse(new TextDecoder().decode(reviewBytes)));
  if(skillReviews.id!==meta.skillReviewsId)throw new Error('Skill review version mismatch.');
  skillReviewRecords=new Map(skillReviews.entries.map(e=>[e.id,e]));
  const uniqueSha=[...new Uint8Array(await crypto.subtle.digest('SHA-256',uniqueBytes))].map(b=>b.toString(16).padStart(2,'0')).join('');
  if(uniqueSha!==meta.uniqueCombosSha256)throw new Error('The unique combinations do not match this build.');
  uniqueCombos=validateUniqueCombos(referenceCatalog,experimentDetails,skillReviews,JSON.parse(new TextDecoder().decode(uniqueBytes)));
  if(uniqueCombos.id!==meta.uniqueCombosId)throw new Error('Unique combination version mismatch.');
  comboCoverage=skillComboCoverage(referenceCatalog,skillCombos,catalog,uniqueCombos);
  $('discovery-coverage').textContent=skillReviews.entries.length+' / '+referenceCatalog.counts.skill+' skill source guides; '+comboCoverage.recipes+' researched combinations across '+comboCoverage.skills+' / '+comboCoverage.totalSkills+' skills. Source item experiments are listed separately; none are damage-ranked. '+referenceCatalog.counts.unique+' / '+referenceCatalog.counts.unique+' unique source guides ('+experimentDetails.entries.filter(e=>e.kind==='unique'&&!e.generated).length+' fixed items, '+experimentDetails.entries.filter(e=>e.kind==='unique'&&e.generated).length+' generated families); '+uniqueCombos.recipes.length+' new unique interactions across '+new Set(uniqueCombos.recipes.map(r=>r.itemId)).size+' uniques.';
  const params=new URL(location.href).searchParams;
  if(params.has('uniques')&&params.get('uniques')!==uniqueCombos.id)throw new Error('This link refers to different unique combinations.');
  if(params.has('reviews')&&params.get('reviews')!==skillReviews.id)throw new Error('This link refers to different skill reviews.');
  if(params.has('combos')&&params.get('combos')!==skillCombos.id)throw new Error('This link refers to different skill combinations.');
  $('combo-only').checked=params.get('covered')==='1';
  if(params.has('snapshot')&&params.get('snapshot')!==snapshot.id)throw new Error('This link refers to a different data snapshot. Open the lab without the link parameters to use this preview.');
  if(params.has('reference')&&params.get('reference')!==referenceCatalog.id)throw new Error('This link refers to a different source catalog. Open the lab without link parameters to use this build.');
  if(params.has('mechanics')&&params.get('mechanics')!==mechanicsData.id)throw new Error('This link refers to different mechanics. Open the lab without link parameters to use this build.');
  if(params.has('chains')&&params.get('chains')!==chainsData.id)throw new Error('This link refers to different chain rules. Open the lab without link parameters to use this build.');
  if(params.has('chainIdeas')&&params.get('chainIdeas')!==chainDiscoveryVersion)throw new Error('This link refers to different chain discovery rules. Open the lab without link parameters to use this build.');
  for(const [id,key,fallback] of [['chain-idea-status','ideaStatus','potential'],['chain-idea-event','ideaEvent','all'],['chain-idea-search','ideaQuery','']]){const value=params.get(key)??fallback;$(id).value=value;if($(id).value!==value||value.length>300)throw new Error('Invalid chain discovery filters in this link.');}
  if(params.has('details')&&params.get('details')!==experimentDetails.id)throw new Error('This link refers to different experiment details.');
  for(const [id,key] of [['chain-ideas-panel','explore'],['chain-panel','workbench'],['rule-explorer','sourceChecks'],['crit-cadence','critCheck']])$(id).open=params.get(key)==='1';
  if(['ideaStatus','ideaEvent','ideaQuery'].some(key=>params.has(key)))$('chain-ideas-panel').open=true;
  if(params.has('chain')){restoringManual=true;const raw=params.get('chain');if(raw.length>6000)throw new Error('Chain link is too large.');chainInput=JSON.parse(raw);validateCritTest(chainInput.critTest||{});chainExplorer.explore(chainInput);if(!chainExplorer.generators.some(e=>e.id===chainInput.generatorId)||!chainExplorer.payoffs.some(e=>e.id===chainInput.payoffId))throw new Error('This chain selection is unavailable.');}
  const requested=params.get('skill');if(requested&&!skills.some(s=>s.id===requested))throw new Error('This skill is not in the bundled preview. Open the lab without the link parameters.');
  if(params.has('build')){const raw=params.get('build');if(raw.length>12000)throw new Error('Combination link is too large.');combination=JSON.parse(raw);validateCombination(snapshot,combination);}
  selected=requested||(params.get('inspect')==='1'?'spark':'frostbolt');
  discoveryMode=params.get('start')||'skill';discoveryAnchor=params.get('anchor')||(discoveryMode==='unique'?'the-three-dragons':discoveryMode==='support'?'living-lightning':selected);
  referenceView(discoveryMode,discoveryAnchor);$('advanced-checks').open=params.get('inspect')==='1';$('sideways-cascade').checked=params.get('cascade')==='sideways';
  for(const [flag,key] of Object.entries(contextParams))$(contextInputs[flag]).checked=params.get(key)==='1';
  for(const [id,key] of [['rule-no-elemental','ruleNoElemental'],['rule-no-chaos','ruleNoChaos'],['rule-no-critical','ruleNoCrit']])$(id).checked=params.get(key)==='1';
  for(const kind of ['skill','support','unique'])$('start-'+kind).prepend(recordVisual({kind,category:'jewel'},'tiny'));
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
  $('combo-only').addEventListener('change',()=>{renderDiscovery();updateUrl();});
  $('browse-combos').addEventListener('click',()=>{discoveryMode='skill';$('combo-only').checked=true;$('catalog-search').value='';$('catalog-category').value='';$('discovery-search').value='';renderDiscovery();updateUrl();});
  $('start-unique').addEventListener('click',()=>{discoveryMode='unique';discoveryAnchor='the-three-dragons';$('discovery-search').value='';$('catalog-search').value='';$('catalog-category').value='';renderDiscovery();updateUrl();});
  $('start-support').addEventListener('click',()=>{discoveryMode='support';discoveryAnchor='living-lightning';$('discovery-search').value='';$('catalog-search').value='';$('catalog-category').value='';renderDiscovery();updateUrl();});
  initChains();
  for(const id of ['rule-no-elemental','rule-no-chaos','rule-no-critical'])$(id).addEventListener('change',()=>{chainInput.confirmedEvents=[];chainInput.critTest={};renderRules(ruleRecord);renderChains(ruleRecord);renderSourceExperiments(ruleRecord,$('discovery-search').value.trim().toLowerCase());updateUrl();});
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
