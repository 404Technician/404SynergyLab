import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { analyze } from '../src/engine.mjs';
import { validateSnapshot } from '../src/validation.mjs';
import { verifyAudit } from '../src/audit.mjs';
const bytes=readFileSync(new URL('../data/snapshots/pob-bb52d6b-connections1.json',import.meta.url)),snapshot=JSON.parse(bytes);
const audit=JSON.parse(readFileSync(new URL('../data/audits/pob-bb52d6b-connections1.json',import.meta.url)));
test('expanded metadata review binds all skills, supports and item modifiers',()=>assert.equal(verifyAudit(snapshot,bytes,audit).corroborated,26));
test('trigger spells are conditional and whole-setup critical-hit restrictions block the route',()=>{
 assert.equal(analyze(snapshot,'comet').interactions.find(r=>r.id==='crit-comet').status,'conditional');
 assert.equal(analyze(snapshot,'comet',{criticalHitsDisabled:true}).interactions.find(r=>r.id==='crit-comet').status,'blocked');
});
test('elemental ailment generation is required for the ailment trigger',()=>{
 const r=analyze(snapshot,'cast-on-elemental-ailment',{elementalAilmentsDisabled:true}).interactions[0];assert.equal(r.status,'blocked');assert.match(r.condition,/actual qualifying/);
});
test('Ignite restriction blocks the gas route but not projectile passage',()=>{
 const r=analyze(snapshot,'flame-wall',{igniteDisabled:true}).interactions;assert.equal(r.find(x=>x.id==='gas-arrow-flame-wall').status,'blocked');assert.equal(r.find(x=>x.id==='spark-flame-wall').status,'conditional');
});
test('Frostbolt route for Snap does not require an ignited enemy',()=>{
 assert.equal(analyze(snapshot,'snap',{igniteDisabled:true}).interactions.find(x=>x.id==='snap-frostbolt').status,'conditional');
});
test('unique conversion ideas preserve original skill types and avoid guaranteed ailments',()=>{
 const r=analyze(snapshot,'spark');assert.ok(r.skillTypes.includes('Lightning'));assert.ok(!r.skillTypes.includes('Cold'));assert.equal(r.uniqueIdeas[0].item.conversion.percent,100);assert.match(r.uniqueIdeas[0].condition,/Freeze is not guaranteed/);
});
test('item reference errors and unsupported context values fail validation',()=>{
 const s=structuredClone(snapshot);s.uniqueIdeas[0].itemId='missing';assert.throws(()=>validateSnapshot(s),/references/);assert.throws(()=>analyze(snapshot,'comet',{criticalHitsDisabled:'yes'}),/context/);
});
