import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { analyzeCombination, validateCombination } from '../src/combination.mjs';
const snapshot=JSON.parse(readFileSync(new URL('../data/snapshots/pob-bb52d6b-connections1.json',import.meta.url)));
const selection=(skills,supports={},itemId=null)=>({version:1,skillIds:skills,supports,itemId});
const route=(r,id)=>r.connections.find(c=>c.id===id);
test('empty workbench remains empty instead of recommending a build',()=>assert.equal(analyzeCombination(snapshot,selection([])).summary.skills,0));
test('support assignment is checked against its actual target skill',()=>{
 const r=analyzeCombination(snapshot,selection(['spark','leap-slam'],{'leap-slam':['rapid-casting-1']}));
 assert.equal(r.assignments[0].skillId,'leap-slam');assert.ok(r.findings.some(f=>f.code==='support-incompatible'));
});
test('Controlled Destruction on the triggered Comet does not disable a separate Spark generator',()=>{
 const r=analyzeCombination(snapshot,selection(['spark','cast-on-critical','comet'],{comet:['controlled-destruction']}));
 assert.equal(route(r,'crit-comet').status,'conditional');
});
test('Controlled Destruction on every represented critical generator blocks the route',()=>{
 const r=analyzeCombination(snapshot,selection(['spark','cast-on-critical','comet'],{spark:['controlled-destruction']}));
 assert.equal(route(r,'crit-comet').status,'blocked');assert.match(route(r,'crit-comet').extraConditions[0],/every selected generator/);
});
test('trigger pair without another Energy generator needs input',()=>{
 const r=analyzeCombination(snapshot,selection(['cast-on-critical','comet']));assert.equal(route(r,'crit-comet').status,'needs-input');
});
test('missing partner is reported explicitly',()=>{
 const r=analyzeCombination(snapshot,selection(['comet']));assert.deepEqual(route(r,'crit-comet').missingSkillIds,['cast-on-critical']);
});
test('whole-setup context overrides candidate generation',()=>{
 const r=analyzeCombination(snapshot,selection(['spark','cast-on-critical','comet']),{criticalHitsDisabled:true});
 assert.equal(route(r,'crit-comet').status,'blocked');
});
test('Ignite restriction does not block the Spark projectile passage',()=>{
 const r=analyzeCombination(snapshot,selection(['spark','flame-wall','gas-arrow']),{igniteDisabled:true});
 assert.equal(route(r,'gas-arrow-flame-wall').status,'blocked');assert.equal(route(r,'spark-flame-wall').status,'conditional');
});
test('unique conversion and assigned Brutality are flagged together',()=>{
 const r=analyzeCombination(snapshot,selection(['spark'],{spark:['brutality-1']},'call-of-the-brotherhood'));
 assert.ok(r.findings.some(f=>f.code==='conversion-brutality'));assert.equal(r.item.conversion.to,'Cold');
});
test('unreviewed item direction is not treated as no effect',()=>{
 const r=analyzeCombination(snapshot,selection(['leap-slam'],{},'blueflame-bracers'));assert.ok(r.findings.some(f=>f.code==='unique-unreviewed'));
});
test('invalid links and dangling assignments are rejected',()=>{
 for(const s of [selection(['missing']),selection(['spark','spark']),selection(['spark'],{comet:['chain-1']}),selection(['spark'],{},'missing'),{...selection(['spark']),version:2}])assert.throws(()=>validateCombination(snapshot,s));
});
test('potential ailment source does not become a guaranteed trigger',()=>{
 const r=analyzeCombination(snapshot,selection(['spark','cast-on-elemental-ailment','comet']));
 assert.equal(route(r,'ailment-comet').status,'conditional');assert.match(route(r,'ailment-comet').extraConditions[0],/Verify actual/);
});
