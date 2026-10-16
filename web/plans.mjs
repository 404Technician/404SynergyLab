import {createSkillPlanner,skillSnapshot} from './skill-plans.mjs';
import {skillTestScope} from './src/skill-setup.mjs';
import {equipmentCategories,analyzeEquipment,equipmentMatches,equipmentTestScope} from './src/equipment-plan.mjs';
import {compareBuildPlans,createPlanVariant,planStorageKey,planFields,testOutcomes,validatePlanBook,validatePlanTest,createBuildPlan,mergePlanBooks,readPlanBook,writePlanBook} from './src/build-plans.mjs';
const $=id=>document.getElementById(id);
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const button=(text,action)=>{const b=el('button',text);b.type='button';b.addEventListener('click',action);return b;};
function download(name,text){const url=URL.createObjectURL(new Blob([text],{type:'application/json'})),a=el('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function initializeBuildPlans({getSource,getEquipment,equipmentOptions,getSkillSetup,getCoreSkills,skillOptions,supportOptions}){
 let book={version:1,plans:[]},raw=null,storage,storageBlocked=false,selected='',deleted=null,deletedCompared=false;
 const equipmentUndo=new Map(),equipmentFilters=new Map();
 const status=(text,error=false)=>{$('plan-status').textContent=text;$('plan-status').dataset.error=String(error);};
 const renderSkills=createSkillPlanner({getSkillSetup,getCoreSkills,skillOptions,supportOptions,onChange:touch,onRender:render,status});
 function load(){
  try{storage=window.localStorage;const saved=readPlanBook(storage);book=saved.book;raw=saved.raw;storageBlocked=false;status('Saved on this browser. Export a backup to keep or move your plans.');}
  catch{storageBlocked=true;status('Saved plans could not be read. Working in memory; existing storage will not be overwritten. Export your plans before leaving.',true);}
 }
 function persist(){
  try{validatePlanBook(book);if(storageBlocked)throw new Error('Working in memory. Export your plans before leaving; browser storage is unavailable or needs reloading.');raw=writePlanBook(storage,book,raw);status('Saved on this browser · your notes are not included in shared recipe links.');}
  catch(error){storageBlocked=true;status(error.message+' Use Export plans to keep this session.',true);}
 }
 function active(){return book.plans.find(p=>p.id===selected);}
 function touch(plan){plan.updated=new Date().toISOString();persist();renderComparison();}
 function comparisonIds(){return book.compareIds||[];}
 function openComparison(){renderComparison();$('plan-comparison').open=true;$('plan-comparison-heading').focus({preventScroll:true});$('plan-comparison').scrollIntoView({block:'start'});}
 function savedItem(item){const box=el('section',undefined,'item-info');box.dataset.compareItem=item.id;box.append(el('h4',item.name),el('p',item.base),el('p','Saved Current / common source modifiers; verify your actual variant.'));for(const text of item.modifiers)box.append(el('p',text,'item-effect'));return box;}
 function equipmentSummary(loadout,required){const result=analyzeEquipment(loadout,required);return result.conflicts+' modeled conflicts · '+result.missing+' missing core items · '+result.reviews+' manual checks';}
 function renderEquipment(plan,box,sourceStale){
  const panel=el('details',undefined,'plan-equipment');panel.id='plan-equipment';panel.open=true;panel.append(el('summary','Plan unique equipment'),el('p','Add uniques from the pinned catalog. Default armour/jewellery slots and explicit ring restrictions are checked. Actual weapon sets, dual wielding, rare gear, attributes and ascendancy overrides need manual review.'));
  panel.querySelector('summary').id='plan-equipment-heading';panel.querySelector('summary').tabIndex=-1;
  const current=plan.loadout?getEquipment(plan.loadout.items.map(i=>i.id)):null,stale=!!plan.loadout&&!equipmentMatches(plan.loadout,current);
  if(stale)panel.append(el('p','This equipment snapshot differs from current source data. Its saved modifiers are shown. Reset to the current core items to start a new equipment setup.','plan-stale'));
  const controls=el('fieldset');controls.disabled=sourceStale;const filter=equipmentFilters.get(plan.id)||{query:'',category:'',picked:''};
  const actions=el('div',undefined,'plan-equipment-actions');
  function change(next){equipmentUndo.set(plan.id,{loadout:plan.loadout?structuredClone(plan.loadout):null,checked:[...plan.checked]});plan.loadout=next;plan.checked=[];touch(plan);render();$('plan-equipment-heading').focus({preventScroll:true});}
  actions.append(button('Use required core uniques',()=>change(getEquipment(plan.source.items.map(i=>i.id)))));
  if(equipmentUndo.has(plan.id))actions.append(button('Undo equipment change',()=>{const before=equipmentUndo.get(plan.id);if(before.loadout)plan.loadout=before.loadout;else delete plan.loadout;plan.checked=before.checked;equipmentUndo.delete(plan.id);touch(plan);render();$('plan-equipment-heading').focus({preventScroll:true});}));controls.append(actions);
  const filters=el('div',undefined,'plan-equipment-filters'),searchLabel=el('label','Find a unique'),search=el('input');search.type='search';search.id='plan-equipment-search';search.placeholder='Name or base category…';search.value=filter.query;searchLabel.append(search);
  const categoryLabel=el('label','Category'),category=el('select');category.id='plan-equipment-category';const all=el('option','All categories');all.value='';category.append(all);for(const [value,name] of Object.entries(equipmentCategories)){const opt=el('option',name);opt.value=value;category.append(opt);}category.value=filter.category;categoryLabel.append(category);
  const pickerLabel=el('label','Unique to add'),picker=el('select');picker.id='plan-equipment-picker';pickerLabel.append(picker);const count=el('p',undefined,'plan-status');count.id='plan-equipment-count';
  const add=button('Add unique',()=>{const ids=plan.loadout?plan.loadout.items.map(i=>i.id):plan.source.items.map(i=>i.id);if(ids.length>=20){status('The equipment plan already has 20 entries. Remove one before adding another.',true);return;}const next=getEquipment([...ids,picker.value]);if(next)change(next);});add.id='plan-equipment-add';
  function fill(){const query=search.value.trim().toLowerCase(),matches=equipmentOptions.filter(i=>(!category.value||i.category===category.value)&&(i.name+' '+equipmentCategories[i.category]).toLowerCase().includes(query));picker.replaceChildren(...matches.map(i=>{const o=el('option',i.name+' · '+equipmentCategories[i.category]);o.value=i.id;return o;}));if(matches.some(i=>i.id===filter.picked))picker.value=filter.picked;picker.disabled=stale||!matches.length;add.disabled=stale||!matches.length;count.textContent=matches.length+' / '+equipmentOptions.length+' unique records';}
  search.addEventListener('input',()=>{filter.query=search.value;equipmentFilters.set(plan.id,filter);fill();});category.addEventListener('change',()=>{filter.category=category.value;equipmentFilters.set(plan.id,filter);fill();});picker.addEventListener('change',()=>{filter.picked=picker.value;equipmentFilters.set(plan.id,filter);});filters.append(searchLabel,categoryLabel,pickerLabel,add);controls.append(filters,count,el('p','The first addition starts from the required core uniques. Equipment changes reset the reviewed checklist; previous test records are kept with their recorded setup.','plan-status'));fill();panel.append(controls);
  if(!plan.loadout){panel.append(el('p','No equipment setup saved yet. Use the core uniques or add an item to start.','plan-status'));box.append(panel);return;}
  const findings=analyzeEquipment(plan.loadout,plan.source.items),summary=el('p',equipmentSummary(plan.loadout,plan.source.items),'equipment-findings');summary.id='plan-equipment-summary';summary.setAttribute('role','status');panel.append(summary);
  if(!findings.findings.length)panel.append(el('p','No conflict found in the covered checks. This is a partial unique setup, not a complete equipment or damage validation.','plan-status'));
  const list=el('ul');list.id='plan-equipment-findings';for(const finding of findings.findings){const li=el('li',finding.message);li.dataset.level=finding.level;list.append(li);}panel.append(list);
  const items=el('div');items.id='plan-equipment-items';
  plan.loadout.items.forEach((item,index)=>{const card=savedItem(item);card.dataset.equippedItem=item.id;delete card.dataset.compareItem;card.append(el('p',equipmentCategories[item.category]+' · saved source snapshot','plan-status'));if(item.generated||!item.modifiers.length)card.append(el('p','Actual generated or variant modifiers are not expanded. Record your actual item details in the equipment notes.','plan-status'));const remove=button('Remove '+item.name,()=>{const ids=plan.loadout.items.map(i=>i.id);ids.splice(index,1);change(getEquipment(ids));});remove.disabled=sourceStale||stale;card.append(remove);items.append(card);});panel.append(items);box.append(panel);
 }
 function renderComparison(){
  const ids=comparisonIds(),picker=$('plan-compare-picker'),focused=document.activeElement?.dataset.comparePlan,scroll=$('plan-compare-results').querySelector('.compare-scroll')?.scrollLeft||0;
  $('plan-compare-count').textContent=ids.length+' / 3 selected';picker.replaceChildren();
  for(const p of book.plans){const label=el('label',undefined,'plan-compare-choice'),input=el('input');input.type='checkbox';input.dataset.comparePlan=p.id;input.checked=ids.includes(p.id);input.disabled=ids.length===3&&!input.checked;input.setAttribute('aria-label','Compare '+p.name);
   input.addEventListener('change',()=>{book.compareIds=input.checked?[...comparisonIds(),p.id]:comparisonIds().filter(id=>id!==p.id);persist();renderComparison();if(comparisonIds().length>=2)$('plan-comparison').open=true;});label.append(input,el('span',p.name));picker.append(label);
  }
  if(focused)[...picker.querySelectorAll('input')].find(i=>i.dataset.comparePlan===focused)?.focus({preventScroll:true});
  $('plan-compare-export').disabled=ids.length<2;$('plan-compare-clear').disabled=!ids.length;
  const status=$('plan-compare-status'),text=ids.length<2?'Choose at least two plans. Save another recipe or create an untested variant to compare setups.':ids.length+' plans compared. '+(storageBlocked?'Session only; export selected plans to keep them.':'Selection is saved in this browser.');if(status.textContent!==text)status.textContent=text;
  const results=$('plan-compare-results');results.replaceChildren();if(ids.length<2)return;
  const view=compareBuildPlans(book,ids),sharedItems=view.sharedItemIds.map(id=>view.entries[0].plan.source.items.find(i=>i.id===id).name);
  results.append(el('p','Shared core · '+(view.sharedSkills.length?view.sharedSkills.join(', '):'No shared skills')+' · '+(sharedItems.length?sharedItems.join(', '):'No shared required uniques'),'compare-shared'));
  const wrap=el('div',undefined,'compare-scroll');wrap.tabIndex=0;wrap.setAttribute('role','region');wrap.setAttribute('aria-label','Build plan comparison; scroll horizontally for all plans');
  const table=el('table',undefined,'compare-table');table.dataset.plans=String(ids.length);table.append(el('caption','Your saved plans · requirements and personal observations'));
  const head=el('thead'),header=el('tr'),corner=el('th','Compare');corner.scope='col';header.append(corner);
  for(const {plan} of view.entries){const th=el('th',plan.name);th.scope='col';const fresh=getSource(plan.recipeId),stale=!fresh||JSON.stringify(fresh)!==JSON.stringify(plan.source);th.append(el('small','Source patch '+plan.source.patch),el('small',stale?'Saved source differs from the current recipe':'Source matches the current recipe',stale?'plan-stale':''));th.append(button('Edit this plan',()=>{selected=plan.id;render();$('plan-editor-title').focus({preventScroll:true});$('plan-editor').scrollIntoView({block:'start'});}));header.append(th);}head.append(header);table.append(head);
  const body=el('tbody');
  function row(title,renderCell){const tr=el('tr'),th=el('th',title);th.scope='row';tr.append(th);for(const entry of view.entries){const td=el('td');td.dataset.compareField=title;renderCell(td,entry);tr.append(td);}body.append(tr);}
  row('Core skills',(td,{plan})=>{for(const skill of plan.source.skills)td.append(el('span',skill,'compare-tag'));});
  row('Required uniques',(td,{plan})=>{if(!plan.source.items.length)td.append(el('p','No unique required by this core. Other requirements still apply.','compare-empty'));for(const item of plan.source.items)td.append(savedItem(item));});
  if(view.entries.some(e=>e.plan.loadout))row('Planned unique equipment',(td,{plan})=>{if(!plan.loadout){td.append(el('p','Not recorded','compare-empty'));return;}td.append(el('p',equipmentSummary(plan.loadout,plan.source.items)));for(const item of plan.loadout.items)td.append(savedItem(item));});
  if(view.entries.some(e=>e.plan.skillSetup))row('Planned skill groups',(td,{plan})=>{if(!plan.skillSetup){td.append(el('p','Not recorded','compare-empty'));return;}for(const group of plan.skillSetup.groups)td.append(el('p',group.skill.name+' · '+group.supports.length+' recorded supports'));const more=el('details');more.append(el('summary','Skill and support descriptions'),skillSnapshot(plan.skillSetup));td.append(more);});
  row('Requirements to review',(td,{plan,remaining})=>{td.append(el('p',plan.checked.length+' / '+plan.source.conditions.length+' reviewed · not a viability score'));if(remaining.length){const more=el('details');more.append(el('summary','Show '+remaining.length+' remaining requirements'));const list=el('ul');for(const requirement of remaining)list.append(el('li',requirement));more.append(list);td.append(more);}else td.append(el('p','All recorded requirements reviewed. Performance still needs testing.'));});
  for(const [key,label] of Object.entries(planFields))row(label,(td,{plan})=>td.append(el('p',plan.notes[key]||'Not recorded',plan.notes[key]?'':'compare-empty')));
  row('Latest personal test',(td,{plan,latestTest:t})=>{if(!t){td.append(el('p','Not tested in game','compare-empty'));return;}td.append(el('strong',testOutcomes[t.outcome]),el('p','Patch '+t.patch+' · '+t.date.slice(0,10)),el('p',t.target),el('p',t.observations),el('p',equipmentTestScope(t,plan.loadout),'plan-status'),el('p',skillTestScope(t,plan.skillSetup),'plan-status'));});
  row('First source test',(td,{plan})=>td.append(el('p',plan.source.firstTest)));
  row('Reconsider if…',(td,{plan})=>td.append(el('p',plan.source.stopIf)));
  table.append(body);wrap.append(table);results.append(el('p','Scroll sideways when needed to see every selected plan.','plan-status'),wrap,el('p','Personal results apply only to the recorded patch, setup and target. They do not verify the source recipe or rank complete builds.','plan-status'));wrap.scrollLeft=scroll;
 }
 function renderList(){
  $('plan-total').textContent=book.plans.length+' saved';$('plan-shortcut-count').textContent=book.plans.length;
  const list=$('plan-list');list.replaceChildren();for(const p of book.plans){const b=button('',()=>{selected=p.id;render();});b.dataset.planId=p.id;b.setAttribute('aria-pressed',String(p.id===selected));b.append(el('strong',p.name),el('small',p.tests.length?testOutcomes[p.tests.at(-1).outcome]:'Not tested in game'));list.append(b);}
  renderComparison();
 }
 function renderHistory(plan,box){
  box.replaceChildren();if(!plan.tests.length){box.append(el('p','No personal test recorded. The source recipe still awaits an in-game test.'));return;}
  for(const t of [...plan.tests].reverse()){const row=el('article');row.append(el('strong',testOutcomes[t.outcome]),el('p',t.patch+' · '+t.target+' · '+t.date.slice(0,10)),el('p',t.observations),el('p',equipmentTestScope(t,plan.loadout),'plan-status'),el('p',skillTestScope(t,plan.skillSetup),'plan-status'));if(t.loadout){const saved=el('details');saved.append(el('summary','Recorded equipment ('+t.loadout.items.length+' entries)'));for(const item of t.loadout.items)saved.append(savedItem(item));row.append(saved);}if(t.skillSetup){const saved=el('details');saved.append(el('summary','Recorded skill groups ('+t.skillSetup.groups.length+')'),skillSnapshot(t.skillSetup));row.append(saved);}box.append(row);}
 }
 function render(){
  if(!active())selected=book.plans[0]?.id||'';renderList();
  const editor=$('plan-editor');editor.replaceChildren();const plan=active();
  if(!plan){editor.append(el('p','Save any researched recipe as a build plan. Then record your gear, defenses, resources and in-game tests here.','plan-empty'));return;}
  const fresh=getSource(plan.recipeId),stale=!fresh||JSON.stringify(fresh)!==JSON.stringify(plan.source);
  const title=el('h3',plan.name);title.id='plan-editor-title';title.tabIndex=-1;
  editor.append(el('p','PERSONAL BUILD PLAN · '+plan.source.patch,'eyebrow'),title,el('p','Your notes and test results. This does not change the source review or rate a complete build.'));
  if(stale)editor.append(el('p','This saved source differs from the current recipe or is unavailable. Its saved components and item modifiers are shown below. Export or keep it for reference; start a new plan from the current recipe to continue testing.','plan-stale'));
  const actions=el('div',undefined,'plan-actions');actions.append(button('Export this plan',()=>download('synergy-build-plan.json',JSON.stringify({version:1,plans:[plan]},null,2))),button('Remove plan',()=>{deleted=structuredClone(plan);deletedCompared=comparisonIds().includes(plan.id);book.compareIds=comparisonIds().filter(id=>id!==plan.id);book.plans=book.plans.filter(p=>p.id!==plan.id);selected='';persist();render();renderUndo();}));const compare=button('Add to comparison',()=>{if(!comparisonIds().includes(plan.id)){if(comparisonIds().length>=3){status('Three plans are already selected. Remove one from the comparison first.',true);openComparison();return;}book.compareIds=[...comparisonIds(),plan.id];persist();}openComparison();});
  actions.append(compare);
  if(!stale)actions.append(button('Create untested variant',()=>{if(book.plans.length>=50){status('You have 50 plans. Export and remove one before creating a variant.',true);return;}const variant=createPlanVariant(plan,crypto.randomUUID(),new Date().toISOString());book.plans.push(variant);selected=variant.id;persist();render();$('plan-editor-title').focus({preventScroll:true});}));
  editor.append(actions);editor.append(el('p','Variants copy your notes and source core, with tests and reviewed requirements reset.','plan-status'));
  renderEquipment(plan,editor,stale);renderSkills(plan,editor,stale);
  const core=el('details',undefined,'plan-preview');core.open=!plan.loadout&&!plan.skillSetup;core.append(el('summary','Saved core · skills, uniques & first test'));
  core.append(el('p',plan.source.skills.join(' + ')),el('h4','First test'),el('p',plan.source.firstTest),el('h4','Reconsider if…'),el('p',plan.source.stopIf));
  const components=el('ul');for(const c of plan.source.components)components.append(el('li',c));core.append(components);
  for(const item of plan.source.items){const box=el('section',undefined,'item-info');box.dataset.planItem=item.id;box.append(el('h4',item.name),el('p',item.base),el('p','Saved Current / common source stats. Match your actual item variant and rolls.'));const effects=el('div',undefined,'item-effects');for(const text of item.modifiers)effects.append(el('p',text,'item-effect'));box.append(effects);core.append(box);}
  if(!plan.source.items.length)core.append(el('p','No unique required by the recorded core. Other equipment and support requirements still apply.'));editor.append(core);
  const fields=el('fieldset');fields.disabled=stale;
  const name=el('label','Plan name'),nameInput=el('input');nameInput.id='plan-name';nameInput.maxLength=160;nameInput.value=plan.name;nameInput.addEventListener('input',()=>{if(nameInput.value.trim()){plan.name=nameInput.value.trim();title.textContent=plan.name;touch(plan);renderList();}});name.append(nameInput);fields.append(name);
  const checks=el('details');checks.open=true;checks.append(el('summary','Review the requirements'));const count=el('p',undefined,'plan-check-count');count.id='plan-check-count';const updateCount=()=>{count.textContent=plan.checked.length+' / '+plan.source.conditions.length+' requirements reviewed · not a viability score';};updateCount();checks.append(count);
  for(const condition of plan.source.conditions){const label=el('label',undefined,'plan-check'),input=el('input');input.type='checkbox';input.checked=plan.checked.includes(condition);input.addEventListener('change',()=>{plan.checked=input.checked?[...plan.checked,condition]:plan.checked.filter(c=>c!==condition);updateCount();touch(plan);});label.append(input,el('span',condition));checks.append(label);}fields.append(checks);
  const notes=el('details');notes.open=true;notes.append(el('summary','Shape your build'));
  for(const [key,label] of Object.entries(planFields)){const field=el('label',label),input=el('textarea');input.id='plan-note-'+key;input.maxLength=5000;input.value=plan.notes[key];input.placeholder={character:'Your class, ascendancy, passive tree or PoB link…',equipment:'Actual item variants, weapon setup, support choices…',defenses:'Life / ES, resistances, recovery and what still needs testing…',resources:'Reservation, Mana cost and measured sustain…',notes:'What you want to try next…'}[key];input.addEventListener('input',()=>{plan.notes[key]=input.value;touch(plan);});field.append(input);notes.append(field);}fields.append(notes);
  const testing=el('details');testing.open=true;testing.append(el('summary','Record an in-game test'),el('p','A result applies only to your patch, setup and target. It does not mark the source recipe or other builds as verified.'));
  const form=el('form',undefined,'plan-test');form.id='plan-test-form';
  for(const [key,label,type,max] of [['patch','Game patch','input',100],['target','Test target / content','input',300],['outcome','Your result','select',0],['observations','What happened? Include setup and limitations.','textarea',5000]]){
   const field=el('label',label),input=el(type);input.name=key;input.id='plan-test-'+key;input.required=true;if(max)input.maxLength=max;
   if(type==='select'){const empty=el('option','Choose a result');empty.value='';input.append(empty);for(const [value,text] of Object.entries(testOutcomes)){const option=el('option',text);option.value=value;input.append(option);}}
   field.append(input);form.append(field);
  }
  const submit=el('button','Save test result');submit.type='submit';const message=el('p',undefined,'plan-test-message');message.setAttribute('role','status');
  const history=el('div',undefined,'plan-history');history.id='plan-history';renderHistory(plan,history);
  form.addEventListener('submit',event=>{event.preventDefault();try{if(plan.tests.length>=20)throw new Error('This plan already has 20 test records. Export it and start a new plan for further tests.');const data=new FormData(form),test={...Object.fromEntries(data),date:new Date().toISOString(),...(plan.loadout?{loadout:structuredClone(plan.loadout)}:{}),...(plan.skillSetup?{skillSetup:structuredClone(plan.skillSetup)}:{})};validatePlanTest(test);plan.tests.push(test);touch(plan);renderList();renderHistory(plan,history);form.reset();message.textContent='Personal test recorded. The source recipe remains unverified in game.';}catch(error){message.textContent=error.message;}});
  form.append(submit,message);testing.append(form);fields.append(testing);editor.append(fields,el('h4','Your test history'),history);
 }
 function renderUndo(){const box=$('plan-undo');box.replaceChildren();if(deleted)box.append(el('span','Plan removed.'),button('Undo removal',()=>{if(book.plans.length>=50){status('Export or remove a plan before restoring this one.',true);return;}book.plans.push(deleted);if(deletedCompared&&comparisonIds().length<3)book.compareIds=[...comparisonIds(),deleted.id];selected=deleted.id;deleted=null;deletedCompared=false;persist();render();renderUndo();}));}
 $('plan-compare-open').addEventListener('click',openComparison);
 $('plan-compare-clear').addEventListener('click',()=>{book.compareIds=[];persist();renderComparison();});
 $('plan-compare-export').addEventListener('click',()=>download('synergy-compared-plans.json',JSON.stringify({version:1,plans:comparisonIds().map(id=>book.plans.find(p=>p.id===id))},null,2)));
 load();render();
 $('plan-export').addEventListener('click',()=>download('synergy-build-plans.json',JSON.stringify(book,null,2)));
 $('plan-reload').addEventListener('click',()=>{load();render();});
 $('plan-import').addEventListener('change',async event=>{try{const file=event.target.files?.[0];if(!file)return;if(file.size>3000000)throw new Error('Plan file is too large (maximum 3 MB).');event.target.disabled=true;status('Reading plan file…');const incoming=validatePlanBook(JSON.parse(await file.text())),count=book.plans.length;book=mergePlanBooks(book,incoming);persist();render();if(!storageBlocked)status('Imported '+(book.plans.length-count)+' plans. Existing IDs were kept; no existing notes were overwritten.');}catch(error){status('Import failed: '+error.message,true);}finally{event.target.value='';event.target.disabled=false;}});
 return {add(recipeId){try{const source=getSource(recipeId);if(!source)throw new Error('The source recipe is unavailable.');let plan=book.plans.find(p=>p.recipeId===recipeId&&JSON.stringify(p.source)===JSON.stringify(source));if(!plan){if(book.plans.length>=50)throw new Error('You have 50 plans. Export and remove one before adding another.');plan=createBuildPlan(recipeId,source,crypto.randomUUID(),new Date().toISOString());book.plans.push(plan);persist();}selected=plan.id;render();$('build-plans').open=true;$('plan-editor-title').focus({preventScroll:true});$('build-plans').scrollIntoView({block:'start'});}catch(error){$('build-plans').open=true;status(error.message,true);}}};
}
