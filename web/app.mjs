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
let catalog,discoveryMode='skill',discoveryAnchor='frostbolt';
let snapshot,meta,skills,selected='spark',filter='all',result;
let combination={version:1,skillIds:[],supports:{},itemId:null};
const contextInputs={sidewaysCascade:'sideways-cascade',criticalHitsDisabled:'critical-disabled',elementalAilmentsDisabled:'ailments-disabled',igniteDisabled:'ignite-disabled'};
const contextParams={criticalHitsDisabled:'noCrit',elementalAilmentsDisabled:'noAilments',igniteDisabled:'noIgnite'};
const readContext=()=>Object.fromEntries(Object.entries(contextInputs).map(([flag,id])=>[flag,$(id).checked]));
function updateUrl(){const url=new URL(location.href);url.searchParams.set('skill',selected);url.searchParams.set('snapshot',snapshot.id);if($('sideways-cascade').checked)url.searchParams.set('cascade','sideways');else url.searchParams.delete('cascade');for(const [flag,key] of Object.entries(contextParams)){if($(contextInputs[flag]).checked)url.searchParams.set(key,'1');else url.searchParams.delete(key);}if(combination.skillIds.length || combination.itemId)url.searchParams.set('build',JSON.stringify(combination));else url.searchParams.delete('build');url.searchParams.set('start',discoveryMode);url.searchParams.set('anchor',discoveryAnchor);if($('advanced-checks').open)url.searchParams.set('inspect','1');else url.searchParams.delete('inspect');history.replaceState(null,'',url);}
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

function renderDiscovery() {
  $('start-skill').setAttribute('aria-pressed',String(discoveryMode==='skill'));$('start-unique').setAttribute('aria-pressed',String(discoveryMode==='unique'));
  const anchors=discoveryMode==='skill'?skills:catalog.items;
  $('discovery-anchor').replaceChildren(...anchors.map(a=>{const o=element('option',a.name);o.value=a.id;return o;}));$('discovery-anchor').value=discoveryAnchor;
  const view=discover(snapshot,catalog,{kind:discoveryMode,id:discoveryAnchor}),query=$('discovery-search').value.trim().toLowerCase();
  const ideas=view.ideas.filter(i=>(i.title+' '+i.hook).toLowerCase().includes(query));
  $('discovery-count').textContent=ideas.length+' curated ideas for '+view.anchor.name+' · conditional concepts, not playtested builds';
  $('discovery-ideas').replaceChildren();
  if(!ideas.length){$('discovery-ideas').append(element('div',view.ideas.length?'No ideas match this search.':'No researched idea is in this small catalog for this starting point yet. Try Frostbolt, Spark, Fireball or The Three Dragons.','empty-support'));return;}
  for(const idea of ideas){
    const card=element('article',undefined,'discovery-card');card.dataset.idea=idea.id;
    card.append(element('span',idea.item?idea.item.name:'SKILL INTERACTION','discovery-item-label'),element('h3',idea.title),element('p',idea.hook,'discovery-hook'));
    const chips=element('div',undefined,'tag-row');for(const skill of idea.skills)chips.append(element('span',skill.name,'tag'));card.append(chips);
    const more=element('details',undefined,'idea-details');more.append(element('summary','Mechanics, supports & tradeoffs'));
    const body=element('div',undefined,'idea-body');body.append(element('h4','Why this is interesting'),element('p',idea.mechanics),element('h4','How to explore it'));
    const steps=element('ol');for(const step of idea.play)steps.append(element('li',step));body.append(steps,element('h4','Support ideas — and why'));
    for(const role of idea.supportIdeas){
      const box=element('div',undefined,'discovery-support');box.dataset.ideaSupport=role.supportId;
      box.append(element('strong',role.support.name+' → '+skills.find(s=>s.id===role.skillId).name),element('p',role.reason),element('small','Tradeoff: '+role.tradeoff),link('Support record ↗',role.support.evidence.url));body.append(box);
    }
    body.append(element('h4','Conditions & costs'));const conditions=element('ul');for(const c of idea.conditions)conditions.append(element('li',c));body.append(conditions,element('h4','Avoid the tempting mistake'));
    const avoid=element('ul');for(const c of idea.avoid)avoid.append(element('li',c));body.append(avoid,element('h4','Evidence'));
    for(const url of idea.evidenceUrls)body.append(link('Source ↗',url));
    more.append(body);card.append(more);
    const inspect=element('button','Inspect '+idea.skills[0].name+' checks ↗','share-button');inspect.type='button';
    inspect.addEventListener('click',()=>{selected=idea.skills[0].id;$('advanced-checks').open=true;render();updateUrl();$('skill-title').scrollIntoView({block:'start',behavior:'auto'});});card.append(inspect);
    $('discovery-ideas').append(card);
  }
}
async function start(){
  const responses=await Promise.all([fetch('./data/snapshot.json',{cache:'no-cache'}),fetch('./data/build.json',{cache:'no-cache'}),fetch('./data/catalog.json',{cache:'no-cache'})]);
  if(responses.some(r=>!r.ok))throw new Error('The bundled data could not be loaded.');
  const [bytes,metadata,catalogBytes]=await Promise.all([responses[0].arrayBuffer(),responses[1].json(),responses[2].arrayBuffer()]);meta=metadata;
  const sha=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');
  if(sha!==meta.snapshotSha256)throw new Error('The dataset does not match its saved source review. Rebuild or update the project.');
  snapshot=JSON.parse(new TextDecoder().decode(bytes));if(snapshot.id!==meta.snapshotId)throw new Error('Snapshot version mismatch.');

  const catalogSha=[...new Uint8Array(await crypto.subtle.digest('SHA-256',catalogBytes))].map(b=>b.toString(16).padStart(2,'0')).join('');
  if(catalogSha!==meta.catalogSha256)throw new Error('The idea catalog does not match this build. Rebuild or update the project.');
  catalog=JSON.parse(new TextDecoder().decode(catalogBytes));validateDiscoveryCatalog(snapshot,catalog);
  skills=snapshot.entities.filter(s=>s.kind==='skill');
  const params=new URL(location.href).searchParams;
  if(params.has('snapshot')&&params.get('snapshot')!==snapshot.id)throw new Error('This link refers to a different data snapshot. Open the lab without the link parameters to use this preview.');
  const requested=params.get('skill');if(requested&&!skills.some(s=>s.id===requested))throw new Error('This skill is not in the bundled preview. Open the lab without the link parameters.');
  if(params.has('build')){const raw=params.get('build');if(raw.length>12000)throw new Error('Combination link is too large.');combination=JSON.parse(raw);validateCombination(snapshot,combination);}
  selected=requested||(params.get('inspect')==='1'?'spark':'frostbolt');
  discoveryMode=params.get('start')||'skill';discoveryAnchor=params.get('anchor')||(discoveryMode==='unique'?'the-three-dragons':selected);
  discover(snapshot,catalog,{kind:discoveryMode,id:discoveryAnchor});$('advanced-checks').open=params.get('inspect')==='1';$('sideways-cascade').checked=params.get('cascade')==='sideways';
  for(const [flag,key] of Object.entries(contextParams))$(contextInputs[flag]).checked=params.get(key)==='1';
  $('version').textContent=`v${meta.appVersion}`;$('patch-label').textContent=`Target patch ${snapshot.patch}`;$('league-label').textContent=snapshot.league;
  const notice=$('data-notice');notice.replaceChildren(element('strong','CANDIDATE DATA'),element('span','Source metadata cross-checked. Live patch confirmation is pending; results are a preview.'));
  $('review-summary').textContent=`${meta.corroborated} source records cross-checked`;
  $('snapshot-info').textContent=`Snapshot: ${snapshot.id} · Rule version: ${snapshot.rulesVersion}`;
  $('review-info').textContent=snapshot.patchValidation.notes;$('patch-source').href=snapshot.patchValidation.officialPatchUrl;
  document.querySelector('.sidebar-note p').textContent=`A focused set of ${skills.length} skills. More combinations will follow.`;
  for(const skill of skills){const button=element('button',undefined,'skill-button');button.type='button';button.dataset.id=skill.id;button.dataset.name=skill.name.toLowerCase();const name=element('span',skill.name);name.append(element('small',family(skill)));button.append(name,element('span','↗','skill-symbol'));button.lastChild.setAttribute('aria-hidden','true');button.addEventListener('click',()=>choose(skill.id));$('skill-list').append(button);}

  for(const item of snapshot.items ?? []){const option=element('option',item.name);option.value=item.id;$('combination-item').append(option);}
  $('add-skill').addEventListener('click',()=>{if(!combination.skillIds.includes(selected))combination.skillIds.push(selected);render();updateUrl();});
  $('combination-item').addEventListener('change',()=>{combination.itemId=$('combination-item').value||null;renderCombination();updateUrl();});
  $('clear-combination').addEventListener('click',()=>{combination={version:1,skillIds:[],supports:{},itemId:null};render();updateUrl();});
  $('load-example').addEventListener('click',()=>{combination={version:1,skillIds:['spark','cast-on-critical','comet'],supports:{comet:['controlled-destruction']},itemId:null};selected='comet';for(const id of Object.values(contextInputs))$(id).checked=false;render();updateUrl();});

  $('start-skill').addEventListener('click',()=>{discoveryMode='skill';discoveryAnchor=selected;$('discovery-search').value='';renderDiscovery();updateUrl();});
  $('start-unique').addEventListener('click',()=>{discoveryMode='unique';discoveryAnchor='the-three-dragons';$('discovery-search').value='';renderDiscovery();updateUrl();});
  $('discovery-anchor').addEventListener('change',()=>{discoveryAnchor=$('discovery-anchor').value;if(discoveryMode==='skill')selected=discoveryAnchor;$('discovery-search').value='';render();updateUrl();});
  $('discovery-search').addEventListener('input',renderDiscovery);
  $('advanced-checks').addEventListener('toggle',()=>updateUrl());
  $('skill-search').addEventListener('input',renderSkillList);$('support-search').addEventListener('input',renderSupports);
  for(const button of $('filters').children)button.addEventListener('click',()=>{filter=button.dataset.filter;for(const b of $('filters').children)b.setAttribute('aria-pressed',String(b===button));renderSupports();});
  for(const id of Object.values(contextInputs))$(id).addEventListener('change',()=>{render();updateUrl();});
  $('share').addEventListener('click',async()=>{updateUrl();try{await navigator.clipboard.writeText(location.href);$('share-status').textContent='Link copied.';$('share').textContent='Link copied ✓';}catch{$('share-fallback').hidden=false;$('share-url').value=location.href;$('share-url').focus();$('share-url').select();}});
  render();$('workspace').hidden=false;
}
start().catch(error=>{$('workspace').hidden=true;$('load-error').hidden=false;$('load-error').textContent=error.message;$('data-notice').replaceChildren(element('strong','LAB UNAVAILABLE'),element('span','Results are hidden until the data check passes.'));});
