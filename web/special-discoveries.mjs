import {specialTags,filterSpecialInteractions} from './src/special-interactions.mjs';
import {recordVisual,recordVignette} from './src/visuals.mjs';
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const button=(text,fn)=>{const b=el('button',text);b.type='button';b.addEventListener('click',fn);return b;};
const $=id=>document.getElementById(id);
export function initializeSpecialDiscoveries({data,params,itemInfo,description,openRecord,onChange}){
 let tag=params.get('specialTag')||'all',query=params.get('specialQuery')||'',selected=params.get('specialIdea')||'',page=0;
 if(params.has('special')&&params.get('special')!==data.id)throw new Error('This special-interaction snapshot is unavailable.');
 let matches=filterSpecialInteractions(data,{tag,query});
 if(selected&&!matches.some(i=>i.id===selected))throw new Error('This special interaction is unavailable with the saved filters.');
 if(selected)page=Math.floor(matches.findIndex(i=>i.id===selected)/4);
 const labels=$('special-tags');for(const [id,label] of Object.entries(specialTags)){const b=button(label,()=>{tag=id;page=0;selected='';render();onChange();});b.dataset.specialTag=id;labels.append(b);}
 $('special-search').value=query;$('special-search').addEventListener('input',()=>{query=$('special-search').value;page=0;selected='';render();onChange();});
 $('special-reset').addEventListener('click',()=>{tag='all';query='';selected='';page=0;$('special-search').value='';render();onChange();});
 $('special-surprise').addEventListener('click',()=>{const pool=matches.filter(i=>i.id!==selected);if(!pool.length)return;choose(pool[Math.floor(Math.random()*pool.length)].id);});
 for(const [id,delta] of [['special-previous',-1],['special-next',1]])$(id).addEventListener('click',()=>{page+=delta;renderCards();onChange();});
 function choose(id){selected=id;page=Math.floor(matches.findIndex(i=>i.id===id)/4);render();onChange();$('special-detail-heading').focus({preventScroll:true});$('special-detail').scrollIntoView({block:'start'});}
 function chain(idea){const list=el('ol',undefined,'special-chain');list.setAttribute('aria-label','Mechanic sequence');for(const [index,step] of idea.chain.entries()){const node=el('li');node.append(el('small',String(index+1).padStart(2,'0')),el('span',step));list.append(node);}return list;}
 function renderCards(){
  const pages=Math.max(1,Math.ceil(matches.length/4));page=Math.max(0,Math.min(page,pages-1));$('special-count').textContent=matches.length+' / '+data.entries.length+' unusual interactions · source research, not finished builds';$('special-page').textContent='Page '+(page+1)+' of '+pages;$('special-previous').disabled=page===0;$('special-next').disabled=page>=pages-1;$('special-surprise').disabled=matches.filter(i=>i.id!==selected).length===0;
  const cards=$('special-results');cards.replaceChildren();if(!matches.length)cards.append(el('p','No discoveries match yet. Try Chaos, Poison or reset your filters.','special-empty'));
  for(const idea of matches.slice(page*4,page*4+4)){
   const card=el('article',undefined,'special-card');card.dataset.specialIdea=idea.id;card.dataset.selected=String(idea.id===selected);const artRecord=idea.components.find(c=>c.kind==='skill')||idea.components[0];card.append(recordVignette(artRecord),el('p',idea.tags.map(t=>specialTags[t]).join(' · '),'eyebrow'),el('h3',idea.title),el('p',idea.hook),chain(idea));
   const components=el('div',undefined,'special-pieces');for(const c of idea.components.filter(c=>c.kind!=='skill'||idea.components.filter(x=>x.kind==='skill').length===1)){const chip=el('span');chip.append(recordVisual(c,'tiny'),el('span',c.name));components.append(chip);}card.append(components);
   card.append(el('p',idea.pitfalls[0],'special-catch'));const go=button('Reveal the interaction →',()=>choose(idea.id));go.setAttribute('aria-label','Reveal '+idea.title);go.setAttribute('aria-pressed',String(idea.id===selected));go.setAttribute('aria-controls','special-detail');card.append(go);cards.append(card);
  }
 }
 function renderDetail(){
  const box=$('special-detail'),idea=data.entries.find(i=>i.id===selected);box.replaceChildren();box.hidden=!idea;if(!idea)return;
  const heading=el('h3',idea.title);heading.id='special-detail-heading';heading.tabIndex=-1;box.append(el('p',idea.basis==='direct'?'SOURCE-DESCRIBED ROUTE · GAME TEST PENDING':'COMBINED SOURCE RULES · INTERACTION INFERRED','eyebrow'),heading,chain(idea));
  const columns=el('div',undefined,'special-explanation'),left=el('div'),right=el('div');left.append(el('h4','Why this is special'),el('p',idea.why),el('h4','Make it your own'),el('p',idea.inspiration));right.append(el('h4','What can break it'));const pitfalls=el('ul');for(const p of idea.pitfalls)pitfalls.append(el('li',p));right.append(pitfalls);columns.append(left,right);box.append(columns);
  const test=el('section',undefined,'special-test');test.append(el('small','ONE SMALL TEST BEFORE YOU BUILD'),el('p',idea.firstTest));box.append(test);
  const needed=el('details',undefined,'special-components');needed.open=true;needed.append(el('summary','Skills, supports & their roles'));
  for(const c of idea.components.filter(c=>c.kind!=='unique')){const row=el('section');row.dataset.specialComponent=c.id;const title=el('h4');title.append(recordVisual(c,'tiny'),document.createTextNode(c.name));row.append(title,el('p',c.role,'special-role'),el('p',description(c)));if(c.weaponRequirements)row.append(el('small','Weapon: '+c.weaponRequirements));row.append(button('Explore '+c.name,()=>openRecord(c.id)));needed.append(row);}box.append(needed);
  const uniques=idea.components.filter(c=>c.kind==='unique');for(const c of uniques){const full=itemInfo(c.id);full.dataset.specialUnique=c.id;full.prepend(el('p','REQUIRED UNIQUE · '+c.role,'eyebrow'));box.append(full);}if(!uniques.length)box.append(el('p','No unique is required by this core. Skill access and support eligibility still apply.','special-role'));
  const evidence=el('details',undefined,'special-evidence');evidence.append(el('summary','Steps & source evidence'));const steps=el('ol');for(const step of idea.steps)steps.append(el('li',step));evidence.append(steps);
  for(const c of idea.components){const a=el('a',c.name+' · pinned source ↗');a.href=(c.effectEvidence||c.evidence).url;a.target='_blank';a.rel='noopener noreferrer';evidence.append(a);}
  evidence.append(el('p','Research checked '+data.checkedAt+'. Individual source clauses are checked; combining them remains a hypothesis until tested. The target patch and live-client behavior are not verified.'));box.append(evidence);
 }
 function render(){matches=filterSpecialInteractions(data,{tag,query});for(const b of labels.children)b.setAttribute('aria-pressed',String(b.dataset.specialTag===tag));renderCards();renderDetail();}
 render();
 return {writeParams(url){for(const [key,value] of Object.entries({special:(selected||tag!=='all'||query)?data.id:'',specialIdea:selected,specialTag:tag==='all'?'':tag,specialQuery:query})){if(value)url.searchParams.set(key,value);else url.searchParams.delete(key);}}};
}
