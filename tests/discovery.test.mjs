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

test('discovery-only minions do not enter the audited base workbench',()=>{
 const augmented=validateDiscoveryCatalog(snapshot,catalog);
 assert.ok(augmented.entities.some(e=>e.id==='unearth'));
 assert.equal(snapshot.entities.some(e=>e.id==='unearth'),false);
 const unearth=augmented.entities.find(e=>e.id==='unearth');
 assert.ok(unearth.minionSkillTypes.includes('Attack'));
 assert.equal(unearth.skillTypes.includes('Attack'),false);
 assert.equal(discover(snapshot,catalog,{kind:'skill',id:'unearth'}).ideas.length,2);
});
test('additional support context cannot silently become a confirmed type match',()=>{
 const r=discover(snapshot,catalog,{kind:'skill',id:'unearth'}).ideas.find(i=>i.id==='unearth-bone-bombs');
 assert.equal(r.supportIdeas.find(s=>s.supportId==='infernal-legion-1').typeStatus,'unknown');
 const broken=structuredClone(catalog);delete broken.recipes.find(i=>i.id===r.id).supports[0].contextRequired;
 assert.throws(()=>validateDiscoveryCatalog(snapshot,broken),/explicit context/);
 const mismatch=structuredClone(catalog);mismatch.recipes.find(i=>i.id==='living-lightning-arrow').supports[0].skillId='comet';
 assert.throws(()=>validateDiscoveryCatalog(snapshot,mismatch),/support role/);
});
test('unknown context does not bypass recorded support predicates',()=>{
 const broken=structuredClone(catalog),idea=broken.recipes.find(r=>r.id==='unearth-bone-bombs');
 idea.skillIds.push('comet');idea.supports[0].skillId='comet';
 assert.throws(()=>validateDiscoveryCatalog(snapshot,broken),/no longer matches/);
});
test('minion death socket rules reject Unearth and allow Comet',()=>{
 const r=discover(snapshot,catalog,{kind:'skill',id:'cast-on-minion-death'}).ideas[0];
 assert.equal(r.triggerRoute.socketedSkillId,'comet');assert.match(r.avoid.join(' '),/Do not socket Unearth/);
 const broken=structuredClone(catalog),idea=broken.recipes.find(i=>i.id===r.id);idea.skillIds.push('unearth');idea.triggerRoute.socketedSkillId='unearth';
 assert.throws(()=>validateDiscoveryCatalog(snapshot,broken),/socket is excluded/);
});
test('swarm idea warns about losing Lightning and does not promise a self-generating swarm',()=>{
 const r=discover(snapshot,catalog,{kind:'skill',id:'lightning-arrow'}).ideas.find(i=>i.id==='living-lightning-arrow');
 assert.match(r.avoid.join(' '),/Call of the Brotherhood/);assert.match(r.avoid.join(' '),/swarm can create more swarms/);
 assert.equal(r.supportIdeas.find(s=>s.supportId==='living-lightning').typeStatus,'unknown');
});
