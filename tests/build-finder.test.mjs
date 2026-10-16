import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildDirections,resolveBuildDirections,filterBuildDirections,validateFinderFilters} from '../src/build-finder.mjs';
import {discover} from '../src/discovery.mjs';
import {discoverUniqueCombos} from '../src/unique-combos.mjs';
import {discoverSkillCombos} from '../src/skill-combos.mjs';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url)));
const ref=read('data/catalog/pob-bb52d6b-full-catalog1.json'),catalog=read('data/discovery/catalog.json'),skills=read('data/discovery/pob-bb52d6b-skill-combos4.json'),uniques=read('data/discovery/pob-bb52d6b-unique-combos4.json'),snapshot=read('data/snapshots/'+catalog.snapshotId+'.json');
const all=[...catalog.recipes,...skills.recipes,...uniques.recipes];
const directions=resolveBuildDirections(id=>{
 const raw=all.find(r=>r.id===id),record=ref.entries.find(e=>e.id===raw?.skillIds[0]);if(!record)return;
 const original=record.reviewedId?discover(snapshot,catalog,{kind:'skill',id:record.reviewedId}).ideas:[];
 return [...original,...discoverUniqueCombos(ref,uniques,'skill',record.id),...discoverSkillCombos(ref,skills,record.id)].find(r=>r.id===id);
});
test('reviewed directions resolve actual recipes, required items and explicit prerequisites',()=>{
 assert.equal(directions.length,17);assert.equal(new Set(buildDirections.map(d=>d.recipeId)).size,17);
 for(const d of directions){assert.ok(d.requirement.length>30);assert.ok(d.idea.play.length);assert.ok(d.idea.buildPlan.stopIf);for(const item of d.idea.items)assert.ok(ref.entries.some(e=>e.id===item.id||e.reviewedId===item.id));assert.match(d.testStatus,/pending/);}
 assert.throws(()=>resolveBuildDirections(()=>undefined),/Missing build direction/);
 const cull=directions.find(d=>d.recipeId==='coverage-review-myris-fear');assert.equal(cull.idea.items.length,2);assert.match(cull.requirement,/Quarterstaff/);
});
test('playstyle and control filters preserve conditions instead of inferring automation from tags',()=>{
 const ranged=filterBuildDirections(directions,{style:'ranged',control:'low',gear:'required'});assert.deepEqual(ranged.map(d=>d.recipeId),['gas-arrow-radiant-grief']);
 const minions=filterBuildDirections(directions,{style:'minions',control:'passive'});assert.deepEqual(minions.map(d=>d.recipeId),['coverage-review-vis-reavers']);
 assert.deepEqual(filterBuildDirections(directions,{style:'ranged',control:'passive'}),[]);
 assert.equal(filterBuildDirections(directions,{control:'trigger'}).some(d=>d.recipeId==='coverage-review-powertread-illusion'),false);
 assert.ok(filterBuildDirections(directions,{gear:'none'}).every(d=>!d.idea.items.length));
 assert.ok(filterBuildDirections(directions,{gear:'required'}).every(d=>d.idea.items.length));
});
test('saved filters reject unavailable values and default consistently',()=>{
 assert.deepEqual(validateFinderFilters(),{style:'all',control:'all',gear:'all'});
 for(const input of [{style:'tankiest'},{control:'zero-button'},{gear:'cheap'}])assert.throws(()=>validateFinderFilters(input),/Invalid build finder/);
 assert.deepEqual(JSON.parse(JSON.stringify(validateFinderFilters({style:'caster',control:'trigger'}))),{style:'caster',control:'trigger',gear:'all'});
});
