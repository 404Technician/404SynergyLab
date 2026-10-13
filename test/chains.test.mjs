import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createChainExplorer,validateChains} from '../src/chains.mjs';
const json=path=>JSON.parse(readFileSync(new URL('../'+path,import.meta.url)));
const reference=json('data/catalog/pob-bb52d6b-full-catalog1.json'),mechanics=json('data/mechanics/pob-bb52d6b-mechanics1.json'),data=json('data/chains/pob-bb52d6b-chains1.json');
const engine=createChainExplorer(reference,mechanics,data);
const run=(extra={})=>engine.explore({generatorId:'spark',payoffId:'comet',...extra}).chains;
test('conversion, remapping, actual event, Energy and socketed spell remain ordered',()=>{
 const chains=run({generatorId:'fireball',itemId:'blueflame-bracers',remap:true});
 assert.equal(chains.length,1);const c=chains[0];assert.equal(c.status,'needs-input');
 assert.match(c.steps.join(' | '),/Fireball.*Fire → Cold.*Three Dragons.*Actual Ignite.*Energy.*Comet/);
 assert.deepEqual(c.itemIds,['blueflame-bracers','the-three-dragons']);
 assert.ok(c.evidenceUrls.every(u=>u.includes(reference.sourceRevision)));
});
test('event confirmation does not claim a verified build',()=>{
 assert.equal(run({confirmedEvents:['critical']}).find(c=>c.event==='critical').status,'conditional');
 assert.match(run({confirmedEvents:['critical']})[0].reasons.join(' '),/Spirit, costs/);
});
test('critical restriction is scoped to generator rather than payoff',()=>{
 assert.equal(run({generatorSupportId:'controlled-destruction'}).find(c=>c.event==='critical').status,'blocked');
 assert.equal(run({payoffSupportId:'controlled-destruction',confirmedEvents:['critical']}).find(c=>c.event==='critical').status,'conditional');
 assert.equal(run({noCriticalHits:true,confirmedEvents:['critical']}).find(c=>c.event==='critical').status,'blocked');
});
test('elemental restriction is scoped to generator rather than payoff',()=>{
 assert.equal(run({generatorSupportId:'brutality-1'}).find(c=>c.event==='ailment').status,'blocked');
 assert.equal(run({payoffSupportId:'brutality-1'}).find(c=>c.event==='ailment').status,'needs-input');
 assert.equal(run({noElementalDamage:true}).find(c=>c.event==='ailment').status,'blocked');
});
test('triggered payoff support is checked against transformed skill types',()=>{
 const s=reference.entries.find(e=>e.name==='Considered Casting');
 assert.ok(s);assert.equal(run({payoffSupportId:s.id}).find(c=>c.event==='critical').status,'blocked');
});
test('minion death requires positively identified persistent minions',()=>{
 assert.deepEqual(run({generatorId:'unearth'}).filter(c=>c.event==='minion-death'),[]);
 const c=run({generatorId:'skeletal-warrior'});assert.equal(c.length,1);assert.equal(c[0].event,'minion-death');assert.match(c[0].reasons.join(' '),/Expiry.*underlevelled/);
 assert.deepEqual(run({generatorId:'skeletal-warrior',itemId:'blueflame-bracers'}),[]);
});
test('minion-creating payoff is excluded by Cast on Minion Death',()=>{
 const p=engine.payoffs.find(e=>mechanics.profiles.find(p=>p.id===e.id).skillTypes.includes('CreatesMinion'));
 assert.ok(p);assert.equal(run({generatorId:'skeletal-warrior',payoffId:p.id})[0].status,'blocked');
});
test('attacks are not legal meta socket payoffs',()=>{
 assert.ok(run({payoffId:'lightning-arrow'}).every(c=>c.status==='blocked'));
});
test('triggered and inbuilt skills are not fed back as generators',()=>{
 for(const id of ['cast-on-critical','gem:Metadata%2FItems%2FGems%2FSkillGemUniqueBreachLightningBolt'])assert.deepEqual(run({generatorId:id}),[]);
 assert.ok(!engine.generators.some(e=>e.id==='gem:Metadata%2FItems%2FGems%2FSkillGemUniqueBreachLightningBolt'));
});
test('a selected conversion must participate and Chaos is not assumed to ignite',()=>{
 assert.equal(run({generatorId:'frostbolt',itemId:'blueflame-bracers'}).length,0);
 const c=run({itemId:'unique:ring:Original%20Sin:Amethyst%20Ring'});assert.equal(c.length,1);assert.equal(c[0].status,'blocked');
});
test('item variants and source revision remain explicit',()=>{
 assert.ok(engine.items.length>=7);const wrong=structuredClone(data);wrong.mechanicsId='other';assert.throws(()=>validateChains(reference,mechanics,wrong),/version mismatch/);
});
test('invalid selections and event contexts fail closed',()=>{
 assert.throws(()=>engine.explore(null),/Invalid chain/);
 assert.throws(()=>run({generatorId:'missing'}),/Unknown chain/);
 assert.throws(()=>run({confirmedEvents:['any-hit']}),/Invalid chain context/);
 assert.throws(()=>run({generatorSupportId:'spark'}),/Unknown chain support/);
});
