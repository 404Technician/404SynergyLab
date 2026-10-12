import { analyze } from './src/engine.mjs';
const $=id=>document.getElementById(id);
function element(tag, text, className) { const e=document.createElement(tag);if(text !== undefined)e.textContent=text;if(className)e.className=className;return e; }
function link(text,url) { const e=element('a',text);const parsed=new URL(url);if(parsed.protocol !== 'https:')throw new Error('Invalid evidence URL');e.href=parsed.href;e.target='_blank';e.rel='noopener noreferrer';return e; }
const labels={compatible:'TYPE MATCH',incompatible:'DOES NOT MATCH',unknown:'UNKNOWN'};
const symbols={compatible:'✓',incompatible:'×',unknown:'?'};
const family=skill=>skill.skillTypes.includes('Spell') ? 'Spell' : 'Attack';
const friendlyTypes=['Spell','Attack','Projectile','Melee','Area','Cold','Fire','Lightning','Chaos','Slam','Bow','Duration'];
let snapshot,meta,skills,selected='spark',filter='all',result;
function updateUrl(){const url=new URL(location.href);url.searchParams.set('skill',selected);url.searchParams.set('snapshot',snapshot.id);if($('sideways-cascade').checked)url.searchParams.set('cascade','sideways');else url.searchParams.delete('cascade');history.replaceState(null,'',url);}
function choose(id) { selected=id;render();updateUrl(); }
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
    const details=element('details');details.append(element('summary','Why? & source'));
    const content=element('div',undefined,'evidence-content');content.append(element('p',r.reason),link('View source record ↗',r.evidenceUrl));details.append(content);card.append(details);$('support-list').append(card);
  }
}
function render(){
  $('share').textContent='Copy link ↗';$('share-status').textContent='';$('share-fallback').hidden=true;
  const skill=skills.find(s=>s.id===selected);
  result=analyze(snapshot,selected,{sidewaysCascade:$('sideways-cascade').checked});
  $('skill-title').textContent=skill.name;document.title=`${skill.name} · 404 Synergy Lab`;
  $('skill-tags').replaceChildren(...friendlyTypes.filter(t=>skill.skillTypes.includes(t)).map(t=>element('span',t==='Area'?'Area of effect':t,'tag')));
  $('support-total').textContent=`${result.results.filter(r=>r.status==='compatible').length} type matches`;
  $('context-control').hidden=!result.interactions.some(r=>(r.restrictions ?? []).some(x=>x.contextFlag==='sidewaysCascade'));
  renderSkillList();renderSupports();$('interactions').replaceChildren();
  for(const r of result.interactions){
    const card=element('article',undefined,`interaction-card ${r.status}`);card.dataset.interaction=r.id;
    card.append(element('div',r.status==='blocked'?'BLOCKED IN THIS CONTEXT':'CONDITIONAL CONNECTION','connection-label'));
    const names=element('div',undefined,'connection-names');
    r.skillIds.forEach((id,index)=>{if(index)names.append(element('span','+'));const button=element('button',skills.find(s=>s.id===id).name);button.type='button';button.addEventListener('click',()=>choose(id));names.append(button);});
    card.append(names,element('p',r.explanation));const condition=element('div',undefined,'condition-box');condition.append(element('strong',r.status==='blocked'?'WHY IT IS BLOCKED':'CONDITIONS'),element('span',r.condition));card.append(condition,link('Source record ↗',r.evidenceUrl));
    for(const restriction of r.restrictions ?? [])card.append(link('Official restriction ↗',restriction.evidenceUrl));$('interactions').append(card);
  }
  if(!result.interactions.length)$('interactions').append(element('p','No reviewed skill interaction is recorded for this skill yet. This does not mean there are no possible synergies.','empty-note'));
}
async function start(){
  const responses=await Promise.all([fetch('./data/snapshot.json',{cache:'no-cache'}),fetch('./data/build.json',{cache:'no-cache'})]);
  if(responses.some(r=>!r.ok))throw new Error('The bundled data could not be loaded.');
  const [bytes,metadata]=await Promise.all([responses[0].arrayBuffer(),responses[1].json()]);meta=metadata;
  const sha=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');
  if(sha!==meta.snapshotSha256)throw new Error('The dataset does not match its saved source review. Rebuild or update the project.');
  snapshot=JSON.parse(new TextDecoder().decode(bytes));if(snapshot.id!==meta.snapshotId)throw new Error('Snapshot version mismatch.');
  skills=snapshot.entities.filter(s=>s.kind==='skill');
  const params=new URL(location.href).searchParams;
  if(params.has('snapshot')&&params.get('snapshot')!==snapshot.id)throw new Error('This link refers to a different data snapshot. Open the lab without the link parameters to use this preview.');
  const requested=params.get('skill');if(requested&&!skills.some(s=>s.id===requested))throw new Error('This skill is not in the bundled preview. Open the lab without the link parameters.');
  selected=requested||'spark';$('sideways-cascade').checked=params.get('cascade')==='sideways';
  $('version').textContent=`v${meta.appVersion}`;$('patch-label').textContent=`Target patch ${snapshot.patch}`;$('league-label').textContent=snapshot.league;
  const notice=$('data-notice');notice.replaceChildren(element('strong','CANDIDATE DATA'),element('span','Source metadata cross-checked. Live patch confirmation is pending; results are a preview.'));
  $('review-summary').textContent=`${meta.corroborated} source records cross-checked`;
  $('snapshot-info').textContent=`Snapshot: ${snapshot.id} · Rule version: ${snapshot.rulesVersion}`;
  $('review-info').textContent=snapshot.patchValidation.notes;$('patch-source').href=snapshot.patchValidation.officialPatchUrl;
  for(const skill of skills){const button=element('button',undefined,'skill-button');button.type='button';button.dataset.id=skill.id;button.dataset.name=skill.name.toLowerCase();const name=element('span',skill.name);name.append(element('small',family(skill)));button.append(name,element('span','↗','skill-symbol'));button.lastChild.setAttribute('aria-hidden','true');button.addEventListener('click',()=>choose(skill.id));$('skill-list').append(button);}
  $('skill-search').addEventListener('input',renderSkillList);$('support-search').addEventListener('input',renderSupports);
  for(const button of $('filters').children)button.addEventListener('click',()=>{filter=button.dataset.filter;for(const b of $('filters').children)b.setAttribute('aria-pressed',String(b===button));renderSupports();});
  $('sideways-cascade').addEventListener('change',()=>{render();updateUrl();});
  $('share').addEventListener('click',async()=>{updateUrl();try{await navigator.clipboard.writeText(location.href);$('share-status').textContent='Link copied.';$('share').textContent='Link copied ✓';}catch{$('share-fallback').hidden=false;$('share-url').value=location.href;$('share-url').focus();$('share-url').select();}});
  render();$('workspace').hidden=false;
}
start().catch(error=>{$('workspace').hidden=true;$('load-error').hidden=false;$('load-error').textContent=error.message;$('data-notice').replaceChildren(element('strong','LAB UNAVAILABLE'),element('span','Results are hidden until the data check passes.'));});
