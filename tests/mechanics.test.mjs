import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateMechanics, createMechanicExplorer } from '../src/mechanics.mjs';
const reference=JSON.parse(readFileSync(new URL('../data/catalog/pob-bb52d6b-full-catalog1.json',import.meta.url)));
const data=JSON.parse(readFileSync(new URL('../data/mechanics/pob-bb52d6b-mechanics1.json',import.meta.url)));
const explore=createMechanicExplorer(reference,data),id=name=>reference.entries.find(e=>e.name===name).id;
test('mechanic coverage distinguishes structural profiles from partial and unmodeled item modifiers',()=>{
 validateMechanics(reference,data);assert.deepEqual(data.coverage,{skills:399,supports:567,uniques:443,recognizedUniques:104,catalogOnlyUniques:339,conversions:8,grants:117,triggers:3});
 const empty=reference.entries.find(e=>e.kind==='unique'&&!data.profiles.find(p=>p.id===e.id).mechanics.length);
 assert.equal(explore(empty.id).profile.status,'catalog-only');assert.equal(explore(empty.id).links.length,0);
});
test('conversion rules work for a skill outside the researched recipe selection',()=>{
 const r=explore(id('Ball Lightning'));
 assert.ok(r.links.some(l=>l.itemId==='call-of-the-brotherhood'&&l.kind==='conversion'));
 assert.ok(r.links.every(l=>l.status==='conditional'));
 assert.match(r.links.find(l=>l.itemId==='call-of-the-brotherhood').explanation,/Skill types alone/);
});
test('destination damage restriction blocks a conversion component without declaring the complete skill invalid',()=>{
 const link=explore('fireball',{noElementalDamage:true}).links.find(l=>l.itemId==='blueflame-bracers'&&l.kind==='conversion');
 assert.equal(link.status,'blocked');assert.match(link.conditions.join(' '),/other damage components may still work/);
});
test('player conversion is not automatically transferred to minion damage',()=>{
 const r=explore('unearth');assert.equal(r.links.some(l=>l.kind==='conversion'),false);
 assert.ok(r.supportChecks.some(l=>l.status==='unknown'));
});
test('granted skill lookup works for Atziri staff without claiming a complete automation build',()=>{
 const r=explore(id("Atziri's Rule")),link=r.links.find(l=>reference.entries.find(e=>e.id===l.skillId).name==='Mirror of Refraction');
 assert.equal(link.kind,'grant');assert.equal(link.status,'conditional');assert.match(link.explanation,/not a proven synergy/);
});
test('explicit critical-hit trigger is blocked only by the matching critical context',()=>{
 const trigger=data.profiles.find(p=>p.mechanics.some(m=>m.kind==='trigger'&&m.requiresCritical));
 assert.ok(trigger);
 assert.equal(explore(trigger.id).links.find(l=>l.kind==='trigger').status,'conditional');
 assert.equal(explore(trigger.id,{noCriticalHits:true}).links.find(l=>l.kind==='trigger').status,'blocked');
});
test('support-first rules retain target types, special context and harmful restrictions',()=>{
 assert.equal(explore('spark').supportChecks.find(s=>s.id==='rapid-attacks-1').status,'incompatible');
 assert.equal(explore('spark').supportChecks.find(s=>s.id==='rapid-casting-1').status,'compatible');
 assert.match(explore('spark').supportChecks.find(s=>s.id==='brutality-1').warnings.join(' '),/elemental-damage/);
 assert.match(explore('spark').supportChecks.find(s=>s.id==='controlled-destruction').warnings.join(' '),/critical-hit/);
 const r=explore('living-lightning');assert.ok(r.supportChecks.some(s=>s.status==='unknown'));
});
test('item variants remain explicit and generated modifiers are not fabricated',()=>{
 const variant=data.profiles.find(p=>p.mechanics.some(m=>m.variants.length));
 assert.ok(explore(variant.id).links.some(l=>l.conditions.some(c=>c.includes('source item variant'))));
 assert.equal(explore(id('From Nothing')).links.length,0);
});
test('wrong version, missing profile and invalid source conditions fail closed',()=>{
 const wrong=structuredClone(data);wrong.referenceId='other';assert.throws(()=>validateMechanics(reference,wrong),/version mismatch/);
 const missing=structuredClone(data);missing.profiles.pop();assert.throws(()=>validateMechanics(reference,missing),/coverage/);
 assert.throws(()=>explore('not-a-record'),/Unknown/);assert.throws(()=>explore('spark',{noElementalDamage:'yes'}),/context/);
});
