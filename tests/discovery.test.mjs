import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { discover, validateDiscoveryCatalog } from '../src/discovery.mjs';
const snapshot=JSON.parse(readFileSync(new URL('../data/snapshots/pob-bb52d6b-connections1.json',import.meta.url)));
const catalog=JSON.parse(readFileSync(new URL('../data/discovery/catalog.json',import.meta.url)));
test('Frostbolt reveals a unique direction and a targeting direction',()=>{
 const r=discover(snapshot,catalog,{kind:'skill',id:'frostbolt'});assert.ok(r.ideas.some(i=>i.item?.id==='the-three-dragons'));assert.ok(r.ideas.some(i=>i.id==='frostbolt-delivery-point'));
});
test('reverse lookup uses the same idea and does not fabricate separate recommendations',()=>{
 const a=discover(snapshot,catalog,{kind:'skill',id:'frostbolt'}).ideas.find(i=>i.id==='cold-that-ignites');
 const b=discover(snapshot,catalog,{kind:'unique',id:'the-three-dragons'}).ideas.find(i=>i.id===a.id);assert.deepEqual(a,b);
});
test('uncovered skills receive an empty researched catalog',()=>assert.equal(discover(snapshot,catalog,{kind:'skill',id:'leap-slam'}).ideas.length,0));
test('support roles retain their target skill and explanation',()=>{
 const r=discover(snapshot,catalog,{kind:'unique',id:'the-three-dragons'}).ideas.find(i=>i.id==='lightning-that-freezes');
 const s=r.supportIdeas.find(s=>s.support.id==='deep-freeze');assert.equal(s.skillId,'spark');assert.match(s.tradeoff,/Does not increase Freeze buildup/);assert.equal(s.typeStatus,'compatible');
});
test('Cold-to-Ignite idea does not recommend freeze supports for that damage route',()=>{
 const r=discover(snapshot,catalog,{kind:'skill',id:'frostbolt'}).ideas.find(i=>i.id==='cold-that-ignites');
 assert.ok(!r.supportIdeas.some(s=>s.supportId==='deep-freeze'));assert.match(r.conditions.join(' '),/no longer supplies/);
});
test('Frostbolt delivery idea warns about redundant Pierce',()=>assert.match(discover(snapshot,catalog,{kind:'skill',id:'frostbolt'}).ideas.find(i=>i.id==='frostbolt-delivery-point').avoid.join(' '),/already pierces all/));
test('invalid targets, missing tradeoffs and unsafe evidence are rejected',()=>{
 const a=structuredClone(catalog);a.recipes[0].supports[0].tradeoff='';assert.throws(()=>validateDiscoveryCatalog(snapshot,a),/support role/);
 const b=structuredClone(catalog);b.recipes[0].evidenceUrls=['javascript:bad'];assert.throws(()=>validateDiscoveryCatalog(snapshot,b),/Unsafe/);
 assert.throws(()=>discover(snapshot,catalog,{kind:'unique',id:'missing'}),/Unknown/);
});
test('catalog from another snapshot cannot silently attach',()=>{
 const a=structuredClone(catalog);a.snapshotId='old';assert.throws(()=>validateDiscoveryCatalog(snapshot,a),/version mismatch/);
});
test('ideas remain conditional concepts rather than guaranteed builds',()=>{
 const r=discover(snapshot,catalog,{kind:'unique',id:'the-three-dragons'});assert.equal(r.status,'candidate');assert.ok(r.ideas.every(i=>i.evidenceStatus.includes('not playtested')));assert.match(r.limits,/No DPS/);
});
