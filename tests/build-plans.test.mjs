import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildPlanSource,createBuildPlan,validatePlanBook,validatePlanTest,mergePlanBooks,readPlanBook,writePlanBook,planStorageKey} from '../src/build-plans.mjs';
import {discover} from '../src/discovery.mjs';
import {discoverUniqueCombos} from '../src/unique-combos.mjs';
import {discoverSkillCombos} from '../src/skill-combos.mjs';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url)));
const ref=read('data/catalog/pob-bb52d6b-full-catalog1.json'),catalog=read('data/discovery/catalog.json'),skills=read('data/discovery/pob-bb52d6b-skill-combos4.json'),uniques=read('data/discovery/pob-bb52d6b-unique-combos4.json'),snapshot=read('data/snapshots/'+catalog.snapshotId+'.json'),details=new Map(read('data/research/pob-bb52d6b-details2.json').entries.map(e=>[e.id,e]));
const all=[...catalog.recipes,...skills.recipes,...uniques.recipes],date='2026-10-16T14:15:00Z';
function source(id){const r=all.find(r=>r.id===id),record=ref.entries.find(e=>e.id===r.skillIds[0]),original=record.reviewedId?discover(snapshot,catalog,{kind:'skill',id:record.reviewedId}).ideas:[];const idea=[...original,...discoverUniqueCombos(ref,uniques,'skill',record.id),...discoverSkillCombos(ref,skills,record.id)].find(r=>r.id===id);return buildPlanSource(idea,ref,details,'pinned-source',snapshot.patch);}
const make=(id='one',recipe='coverage-review-myris-fear')=>createBuildPlan(recipe,source(recipe),id,date);
test('all 389 researched recipes create valid plans with immutable source and required item stats',()=>{
 for(const r of all){const saved=createBuildPlan(r.id,source(r.id),r.id,date);assert.equal(saved.recipeId,r.id);assert.ok(saved.source.firstTest);assert.ok(saved.source.conditions.length);}
 const input=source('coverage-review-myris-fear'),plan=createBuildPlan('coverage-review-myris-fear',input,'one',date);assert.equal(plan.source.items.length,2);assert.match(plan.source.items.flatMap(i=>i.modifiers).join(' '),/Crushing Fear/);input.items[0].modifiers=[];assert.ok(plan.source.items[0].modifiers.length);
 const radiant=make('gas','gas-arrow-radiant-grief');assert.match(radiant.source.items[0].modifiers.join(' '),/200 Base Fire/);
});
test('personal results require actual patch, target and observations without changing source status',()=>{
 const p=make(),result={outcome:'works',patch:'0.5.5e',target:'A durable target',observations:'Only tested the culling window; boss damage not tested.',date};
 assert.equal(validatePlanTest(result),result);
 for(const key of ['patch','target','observations'])assert.throws(()=>validatePlanTest({...result,[key]:' '}),/patch, test target/);
 assert.throws(()=>validatePlanTest({...result,outcome:'endgame-verified'}));
 const before=structuredClone(p.source);p.tests.push(result);p.checked=[p.source.conditions[0]];validatePlanBook({version:1,plans:[p]});assert.deepEqual(p.source,before);
});
test('backup import keeps existing notes and validates limits before changing a book',()=>{
 const p=make();p.notes.defenses='Keep my defenses';const copy=structuredClone(p);copy.notes.defenses='Imported text';
 const merged=mergePlanBooks({version:1,plans:[p]},{version:1,plans:[copy,make('two')]});assert.equal(merged.plans.length,2);assert.equal(merged.plans[0].notes.defenses,'Keep my defenses');
 assert.throws(()=>validatePlanBook({version:2,plans:[]}));assert.throws(()=>validatePlanBook({version:1,plans:[p,p]}));
 assert.throws(()=>validatePlanBook({version:1,plans:Array.from({length:51},(_,i)=>({...p,id:String(i)}))}));
 assert.throws(()=>validatePlanBook({version:1,plans:[{...p,checked:['Invented requirement']}]}));
});
test('storage round trips, detects concurrent edits and never overwrites corrupt data or quota failures',()=>{
 const values=new Map(),storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)},book={version:1,plans:[make()]};
 assert.deepEqual(readPlanBook(storage),{raw:null,book:{version:1,plans:[]}});const raw=writePlanBook(storage,book,null);assert.deepEqual(readPlanBook(storage).book,book);
 values.set(planStorageKey,'other tab');assert.throws(()=>writePlanBook(storage,book,raw),/another tab/);assert.equal(values.get(planStorageKey),'other tab');
 assert.throws(()=>readPlanBook(storage));assert.equal(values.get(planStorageKey),'other tab');
 assert.throws(()=>writePlanBook({getItem:()=>null,setItem:()=>{throw new Error('Quota exceeded');}},book,null),/Quota exceeded/);
});
