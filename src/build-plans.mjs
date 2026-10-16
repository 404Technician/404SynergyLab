import {uniqueModifiers} from './unique-reviews.mjs';
export const planStorageKey='404-synergy-lab:build-plans:1';
export const planFields={character:'Class, ascendancy & passive plan',equipment:'Weapons, gear & supports',defenses:'Defenses & recovery',resources:'Mana, Spirit & other resources',notes:'Next steps & observations'};
export const testOutcomes={works:'Worked in my test',adjust:'Needs changes',failed:'Did not work in my test'};
const need=(ok,message)=>{if(!ok)throw new Error(message);};
const str=(v,max=5000)=>typeof v==='string'&&v.length<=max;
export function validatePlanBook(book){
 need(book?.version===1&&Array.isArray(book.plans)&&book.plans.length<=50,'Invalid plan file or more than 50 plans.');
 const ids=new Set();
 for(const p of book.plans){
  need(str(p.id,100)&&p.id&&!ids.has(p.id),'Invalid or duplicate plan ID.');ids.add(p.id);
  need(str(p.name,160)&&p.name.trim()&&str(p.recipeId,200)&&str(p.updated,40),'Invalid plan name or recipe.');
  const s=p.source;need(s&&str(s.stamp,2000)&&s.stamp&&str(s.patch,100)&&str(s.title,300)&&str(s.firstTest,5000)&&str(s.stopIf,5000),'Invalid saved source.');
  for(const key of ['skills','components','conditions'])need(Array.isArray(s[key])&&s[key].length<=50&&s[key].every(t=>str(t,5000)),'Invalid source components.');
  need(Array.isArray(s.items)&&s.items.length<=10,'Invalid required items.');
  for(const i of s.items)need(str(i.id,400)&&str(i.name,200)&&str(i.base,200)&&Array.isArray(i.modifiers)&&i.modifiers.length<=100&&i.modifiers.every(m=>str(m,3000)),'Invalid saved item details.');
  need(p.notes&&Object.keys(planFields).every(k=>str(p.notes[k])),'Invalid plan notes.');
  need(Array.isArray(p.checked)&&p.checked.length<=50&&p.checked.every(c=>s.conditions.includes(c))&&new Set(p.checked).size===p.checked.length,'Invalid checked conditions.');
  need(Array.isArray(p.tests)&&p.tests.length<=20,'Too many saved test results.');
  for(const t of p.tests)validatePlanTest(t);
 }
 return book;
}
export function validatePlanTest(t){
 need(t&&Object.hasOwn(testOutcomes,t.outcome)&&str(t.patch,100)&&t.patch.trim()&&str(t.target,300)&&t.target.trim()&&str(t.observations)&&t.observations.trim()&&str(t.date,40),'Record the game patch, test target and observations before saving a test.');
 return t;
}
export function createBuildPlan(recipeId,source,id,date){
 const plan={id,recipeId,name:source.title.slice(0,160),source:structuredClone(source),updated:date,notes:Object.fromEntries(Object.keys(planFields).map(k=>[k,''])),checked:[],tests:[]};
 validatePlanBook({version:1,plans:[plan]});return plan;
}
export function mergePlanBooks(existing,incoming){
 validatePlanBook(existing);validatePlanBook(incoming);
 const ids=new Set(existing.plans.map(p=>p.id));const added=incoming.plans.filter(p=>!ids.has(p.id));
 return validatePlanBook({version:1,plans:[...existing.plans,...structuredClone(added)]});
}
export function readPlanBook(storage){
 const raw=storage.getItem(planStorageKey);return {raw,book:raw===null?{version:1,plans:[]}:validatePlanBook(JSON.parse(raw))};
}
export function writePlanBook(storage,book,expectedRaw){
 validatePlanBook(book);need(storage.getItem(planStorageKey)===expectedRaw,'Saved plans changed in another tab. Export your current notes, then reload saved plans.');
 const raw=JSON.stringify(book);storage.setItem(planStorageKey,raw);return raw;
}

export function buildPlanSource(idea,reference,details,stamp,patch){
 const items=(idea.items||(idea.item?[idea.item]:[])).map(item=>reference.entries.find(e=>e.id===item.id||e.reviewedId===item.id));
 need(items.every(Boolean),'A required source item is unavailable.');
 return {stamp,patch,title:idea.title,skills:idea.skills.map(s=>s.name),components:[...idea.buildPlan.components],conditions:[...new Set([...idea.conditions,...idea.buildPlan.nextChecks])],firstTest:idea.buildPlan.firstTest,stopIf:idea.buildPlan.stopIf,items:items.map(item=>({id:item.id,name:item.name,base:item.base||'',modifiers:uniqueModifiers(details.get(item.id)).map(m=>m.text)}))};
}
