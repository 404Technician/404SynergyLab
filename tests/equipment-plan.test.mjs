import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {uniqueModifiers} from '../src/unique-reviews.mjs';
import {equipmentCategories,validateEquipmentPlan,analyzeEquipment,equipmentTestScope,equipmentMatches} from '../src/equipment-plan.mjs';
import {validatePlanBook,createPlanVariant} from '../src/build-plans.mjs';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url)));
const ref=read('data/catalog/pob-bb52d6b-full-catalog1.json'),details=new Map(read('data/research/pob-bb52d6b-details2.json').entries.map(i=>[i.id,i]));
function item(name){const i=ref.entries.find(i=>i.kind==='unique'&&i.name===name);return {id:i.id,name:i.name,base:i.base,category:i.category,generated:!!i.generated,modifiers:uniqueModifiers(details.get(i.id)).map(m=>m.text)};}
const setup=(...names)=>({stamp:'pinned-reference-and-details',items:names.map(item)});
test('all 443 unique records have supported categories and retain current/common modifiers',()=>{
 const uniques=ref.entries.filter(i=>i.kind==='unique');assert.equal(uniques.length,443);
 for(const i of uniques){assert.ok(Object.hasOwn(equipmentCategories,i.category));const saved={stamp:'pinned',items:[{id:i.id,name:i.name,base:i.base,category:i.category,generated:!!i.generated,modifiers:uniqueModifiers(details.get(i.id)).map(m=>m.text)}]};validateEquipmentPlan(saved);analyzeEquipment(saved);}
});
test('default slot conflicts, required items and explicit ring restrictions are independently reported',()=>{
 const core=[item('Radiant Grief')];let result=analyzeEquipment(setup('Radiant Grief','The Three Dragons'),core);assert.equal(result.conflicts,1);assert.equal(result.missing,0);
 result=analyzeEquipment(setup('The Three Dragons'),core);assert.equal(result.missing,1);assert.equal(result.conflicts,0);
 result=analyzeEquipment(setup("Thief's Torment",'Veilpiercer'));assert.ok(result.findings.some(f=>f.code==='other-rings'));
 result=analyzeEquipment(setup('Veilpiercer','Veilpiercer'));assert.equal(result.conflicts,0);
 result=analyzeEquipment(setup('Veilpiercer','Veilpiercer','Veilpiercer'));assert.ok(result.findings.some(f=>f.code==='slot-ring'));
});
test('weapon and variable slot categories request actual context instead of making false pairing claims',()=>{
 const result=analyzeEquipment(setup("Brutus' Lead Sprinkler",'Svalinn'));assert.equal(result.conflicts,0);assert.ok(result.findings.some(f=>f.code==='weapon-sets'));
 const generated=ref.entries.find(i=>i.kind==='unique'&&i.generated);assert.ok(analyzeEquipment({stamp:'pinned',items:[{id:generated.id,name:generated.name,base:generated.base,category:generated.category,generated:true,modifiers:[]}]}).reviews>0);
 assert.ok(analyzeEquipment(setup("Arakaali's Gift")).findings.some(f=>f.code==='variable-slots'));
});
test('equipment snapshots and optional test equipment remain valid in older plan books and variants',()=>{
 const source={stamp:'source',patch:'0.5.5e',title:'Example',firstTest:'Test',stopIf:'Stop',skills:['Skill'],components:['Skill'],conditions:['A condition'],items:[]};
 const plan={id:'one',recipeId:'recipe',name:'Example',source,updated:'2026-10-16',notes:{character:'',equipment:'',defenses:'',resources:'',notes:''},checked:[],tests:[]};validatePlanBook({version:1,plans:[plan]});
 plan.loadout=setup('Radiant Grief');plan.tests=[{outcome:'works',patch:'0.5.5e',target:'Pack',observations:'Original helmet',date:'2026-10-16',loadout:structuredClone(plan.loadout)}];validatePlanBook({version:1,plans:[plan]});assert.match(equipmentTestScope(plan.tests[0],plan.loadout),/matches/);
 const variant=createPlanVariant(plan,'two','2026-10-16');assert.equal(variant.tests.length,0);variant.loadout.items=[];assert.equal(plan.loadout.items.length,1);assert.match(equipmentTestScope(plan.tests[0],variant.loadout),/different/);assert.match(equipmentTestScope({},plan.loadout),/not recorded/);assert.equal(equipmentMatches(plan.loadout,{...plan.loadout,stamp:'changed'}),false);
 assert.throws(()=>validateEquipmentPlan({stamp:'source',items:Array(21).fill(item('Radiant Grief'))}));assert.throws(()=>validateEquipmentPlan({stamp:'source',items:[{...item('Radiant Grief'),category:'invented'}]}));
});
