import {checkBuild} from './src/build-check.mjs';
import {skillSetupSpecs} from './src/skill-setup.mjs';
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
export function createBuildCheck({getSource,getEquipment,getSkillSetup,getCoreSkills,getGrantingItems,skillOptions}){
 const opened=new Set(),names=new Map(skillOptions.map(s=>[s.id,s.name]));
 const jump=id=>{const target=document.getElementById(id);if(!target)return;for(let n=target.parentElement;n;n=n.parentElement)if(n.tagName==='DETAILS')n.open=true;target.focus({preventScroll:true});target.scrollIntoView({block:'center',behavior:'smooth'});};
 function update(plan){
  const output=document.getElementById('plan-build-check-output');if(!output||output.dataset.planId!==plan.id||!opened.has(plan.id))return;
  const report=checkBuild(plan,{source:getSource(plan.recipeId),currentEquipment:plan.loadout?getEquipment(plan.loadout.items.map(i=>i.id)):null,currentSkills:plan.skillSetup?getSkillSetup(skillSetupSpecs(plan.skillSetup)):null,requiredSkills:getCoreSkills(plan.recipeId).map(id=>({id,name:names.get(id)||id})),grantingItems:getGrantingItems});
  output.replaceChildren();output.hidden=false;output.dataset.paused=String(report.paused);
  const counts=el('div',undefined,'build-check-counts');counts.id='plan-build-check-counts';counts.setAttribute('role','status');for(const [level,label] of [['conflict','Conflicts'],['missing','Missing setup'],['review','To review / test']]){const item=el('div');item.dataset.level=level;item.append(el('strong',String(report.counts[level])),el('span',label));counts.append(item);}output.append(counts);
  const next=el('section',undefined,'build-check-next');next.id='plan-build-check-next';next.append(el('small','NEXT ACTION'),el('h4',report.next.title),el('p',report.next.action));const go=el('button','Go to this check');go.type='button';go.addEventListener('click',()=>jump(report.next.target));next.append(go);output.append(next);
  for(const [level,label] of [['conflict','Modeled conflicts'],['missing','Missing planned components'],['review','Review and in-game tests']]){
   const findings=report.findings.filter(f=>f.level===level);if(!findings.length)continue;
   const section=el('details',undefined,'build-check-section');section.dataset.level=level;section.open=level!=='review'||report.paused;section.append(el('summary',label+' · '+findings.length));
   for(const f of findings){const card=el('article');card.dataset.buildFinding=f.code;card.append(el('h4',f.title),el('p',f.message),el('p',f.action,'plan-status'));const go=el('button','Inspect');go.type='button';go.setAttribute('aria-label','Inspect '+f.title);go.addEventListener('click',()=>jump(f.target));card.append(go);
    if(f.items.length){const more=el('details');more.append(el('summary','View granting unique details'));const equipment=getEquipment(f.items.map(i=>i.id));for(const item of equipment?.items||[]){const info=el('section',undefined,'item-info');info.dataset.buildGrant=item.id;info.append(el('h4',item.name),el('p',item.base),el('p','Pinned Current / common modifiers; verify your actual variant.','plan-status'));for(const mod of item.modifiers)info.append(el('p',mod,'item-effect'));if(item.generated||!item.modifiers.length)info.append(el('p','Generated or variant modifiers require a manual check.'));more.append(info);}card.append(more);}section.append(card);
   }output.append(section);
  }
  output.append(el('p','Partial checks against pinned source data. Counts are findings, not a score. Damage, defenses, resource budgets and full game eligibility are not validated.','plan-status'));
 }
 function render(plan,box){const panel=el('section',undefined,'plan-build-check');panel.id='plan-build-check';panel.append(el('p','BUILD CHECK','eyebrow'),el('h4','What needs attention?'),el('p','Bring equipment, skill groups and recipe requirements together. Start with the next action, then inspect the details.'));const run=el('button',opened.has(plan.id)?'Run build check again':'Check my build');run.type='button';run.id='plan-build-check-run';run.addEventListener('click',()=>{opened.add(plan.id);update(plan);run.textContent='Run build check again';});const output=el('div');output.id='plan-build-check-output';output.dataset.planId=plan.id;output.hidden=true;panel.append(run,output);box.append(panel);update(plan);}
 return {render,update};
}
