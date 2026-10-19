import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateSpecialInteractions,resolveSpecialInteractions,filterSpecialInteractions} from '../src/special-interactions.mjs';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url)));
const ref=read('data/catalog/pob-bb52d6b-full-catalog1.json'),details=read('data/research/pob-bb52d6b-details2.json'),reviews=read('data/research/pob-bb52d6b-skill-reviews1.json'),mechanics=read('data/mechanics/pob-bb52d6b-mechanics1.json'),data=read('data/research/pob-bb52d6b-special-interactions1.json');
const validate=d=>validateSpecialInteractions(ref,details,reviews,mechanics,d);
const resolved=resolveSpecialInteractions(validate(data),ref);
test('eight unusual interactions have pinned effects, support assignments and concrete limitations',()=>{
 assert.equal(resolved.entries.length,8);assert.equal(new Set(data.entries.map(i=>i.id)).size,8);
 for(const i of resolved.entries){assert.ok(i.components.every(c=>c.name&&c.role&&c.requiredFragments.length));assert.ok(i.pitfalls.length>=3);assert.ok(i.steps.length>=2);assert.ok(i.firstTest.length>30);assert.ok(i.inspiration.length>30);assert.ok(i.chain.length>=2);}
});
test('special discovery filters search actual component names and preserve mechanics themes',()=>{
 assert.equal(filterSpecialInteractions(resolved,{query:'original sin'}).length,1);assert.deepEqual(filterSpecialInteractions(resolved,{query:'Plaguefinger'}).map(i=>i.id),['elemental-poison-spread']);assert.ok(filterSpecialInteractions(resolved,{tag:'poison'}).every(i=>i.tags.includes('poison')));assert.ok(filterSpecialInteractions(resolved,{tag:'freeze'}).every(i=>!i.components.some(c=>c.name==='Plaguefinger')));assert.equal(filterSpecialInteractions(resolved,{query:'no-record-1234567'}).length,0);assert.throws(()=>filterSpecialInteractions(resolved,{tag:'guaranteed'}));assert.throws(()=>filterSpecialInteractions(resolved,{query:'x'.repeat(201)}));
});
test('chaos hit eligibility never substitutes poison ticks, Chill or Shatter for a Freeze event',()=>{
 const debuff=data.entries.find(i=>i.id==='chaos-debuff-freeze'),native=data.entries.find(i=>i.id==='native-chaos-hit-freeze'),shatter=data.entries.find(i=>i.id==='poison-chill-shatter');assert.match(debuff.pitfalls.join(' '),/Poison is an Ailment/);assert.match(debuff.why,/any source/);assert.match(native.why,/only the hit/);assert.match(shatter.pitfalls.join(' '),/not a completed Freeze event/);assert.match(shatter.pitfalls.join(' '),/Poison damage-over-time kill is not/);
 const plague=data.entries.find(i=>i.id==='elemental-poison-spread');assert.match(plague.pitfalls.join(' '),/forbids Elemental Ailments/);assert.equal(plague.tags.includes('freeze'),false);
});
test('changed fingerprints, Current modifier restrictions, IDs and support exclusions fail closed',()=>{
 for(const mutate of [d=>d.sourceRevision='changed',d=>d.entries[0].components[0].recordSha256='changed',d=>d.entries[0].components[0].id='missing',d=>d.entries[0].components[1].requiredFragments=['Chaos Resistance is zero'],d=>d.entries.push(d.entries[0]),d=>d.entries[0].tags=['unmodeled']]){const d=structuredClone(data);mutate(d);assert.throws(()=>validate(d));}
 const d=structuredClone(data),r=ref.entries.find(r=>r.kind==='support'&&r.name==='Rapid Attacks I');d.entries[0].components[2]={id:r.id,role:'Wrong support',recordSha256:r.effectEvidence.recordSha256,requiredFragments:['Attack']};d.entries[0].supportPairs[0].supportId=r.id;assert.throws(()=>validate(d),/excluded support/);
});

const expanded=read('data/research/pob-bb52d6b-special-interactions2.json');
test('expanded discovery snapshot adds eight distinct ideas and preserves every historical entry',()=>{
 const current=validate(expanded);assert.equal(current.entries.length,16);assert.deepEqual(current.entries.filter(i=>data.entries.some(old=>old.id===i.id)),data.entries);assert.equal(current.entries.filter(i=>!data.entries.some(old=>old.id===i.id)).length,8);
 const resolvedNew=resolveSpecialInteractions(current,ref);assert.equal(filterSpecialInteractions(resolvedNew,{tag:'minions'}).length,3);assert.equal(filterSpecialInteractions(resolvedNew,{query:"Kurgal's Leash"}).length,1);assert.equal(filterSpecialInteractions(resolvedNew,{query:'Beyond Reach'}).length,1);
 for(const idea of current.entries){assert.ok(idea.pitfalls.length>=3);assert.ok(idea.steps.length>=2);assert.ok(idea.firstTest.length>30);}
});
test('specific item-granted skills reject missing or mismatched enabling uniques',()=>{
 const missing=structuredClone(expanded),mirror=missing.entries.find(i=>i.id==='mirror-frostbolt-nova');mirror.components=mirror.components.filter(c=>c.id!==mirror.components.find(c=>c.requiredItemId)?.requiredItemId);assert.throws(()=>validate(missing),/missing required granting unique/);
 const wrong=structuredClone(expanded),target=wrong.entries.find(i=>i.id==='mirror-frostbolt-nova'),boots=wrong.entries.find(i=>i.id==='sacrifice-walking-clouds').components[0];target.components[0]=structuredClone(boots);target.components[1].requiredItemId=boots.id;assert.throws(()=>validate(wrong),/does not grant Mirror/);
});
test('new chains retain event, weapon, temporary-minion and resource distinctions',()=>{
 const get=id=>expanded.entries.find(i=>i.id===id);
 assert.match(get('mirror-frostbolt-nova').pitfalls.join(' '),/do not cast the first Frostbolt/);assert.match(get('mirror-frostbolt-nova').pitfalls.join(' '),/may not be an eligible Ice Nova origin/);
 assert.match(get('sacrifice-walking-clouds').pitfalls.join(' '),/joint|does not accept|fails/);assert.match(get('sacrifice-walking-clouds').pitfalls.join(' '),/explode the gas/);
 assert.match(get('unearth-instability-carriers').pitfalls.join(' '),/not the Persistent Minions/);assert.match(get('lorrata-ranged-poison-stacks').pitfalls.join(' '),/not a global unlimited-Poison rule/);
 assert.match(get('life-cost-physical-spell').pitfalls.join(' '),/does not replace the Mana cost/);assert.match(get('cold-fireball-ignite').pitfalls.join(' '),/trades away the normal Chill\/Freeze/);
});
test('additional buff evidence remains tied to the same pinned primary source',()=>{
 const current=validate(expanded),command=current.entries.find(i=>i.id==='command-shared-unholy-might');assert.match(command.why,/extra Chaos damage; it is not conversion/);assert.ok(command.extraEvidence[0].url.includes(ref.sourceRevision));const wrong=structuredClone(expanded);wrong.entries.find(i=>i.id===command.id).extraEvidence[0].url='https://example.com/claims';assert.throws(()=>validate(wrong),/invalid extra source evidence/);
});
