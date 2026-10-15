import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateSkillCombos,discoverSkillCombos,skillComboCoverage} from '../src/skill-combos.mjs';
const read=path=>JSON.parse(readFileSync(new URL('../'+path,import.meta.url)));
const reference=read('data/catalog/pob-bb52d6b-full-catalog1.json');
const data=read('data/discovery/pob-bb52d6b-skill-combos2.json');
const curated=read('data/discovery/catalog.json');
const byName=name=>reference.entries.find(e=>e.kind==='skill'&&e.name===name&&!e.legacy).id;
test('explicit interactions bind to 107 source skills with complete practical test plans',()=>{
 validateSkillCombos(reference,data);assert.equal(data.recipes.length,64);assert.equal(data.sources.length,107);
 for(const r of data.recipes){assert.ok(r.buildPlan.firstTest.length>30);assert.ok(r.buildPlan.stopIf.length>20);assert.ok(r.conditions.length>0);assert.equal(r.item,null);assert.deepEqual(r.supportIdeas,[]);}
});
test('each member can find the same interaction, with no name or tag guessing',()=>{
 for(const r of data.recipes)for(const id of r.skillIds)assert.equal(discoverSkillCombos(reference,data,id).filter(i=>i.id===r.id).length,1);
 assert.equal(discoverSkillCombos(reference,data,byName('Artillery Ballista')).length,0);
 assert.deepEqual(discoverSkillCombos(reference,data,'the-three-dragons'),[]);
 assert.throws(()=>discoverSkillCombos(reference,data,'missing'),/Unknown/);
});
test('chaos and projectile targeting keep their decisive limitations',()=>{
 const drain=discoverSkillCombos(reference,data,byName('Essence Drain'));assert.equal(drain.length,3);assert.match(drain.find(r=>r.id==='chaos-spread').conditions.join(' '),/isolated boss/);
 const warp=data.recipes.find(r=>r.id==='ball-warp');assert.match(warp.avoid.join(' '),/enemy-only Shocked Ground/);
 assert.match(data.recipes.find(r=>r.id==='orb-flameblast').avoid.join(' '),/zero-button/);
 assert.match(data.recipes.find(r=>r.id==='palm-thunder').conditions.join(' '),/boss without adds/);
 assert.match(data.recipes.find(r=>r.id==='jagged-totem').avoid.join(' '),/does not supply its own Jagged Ground/);
});
test('coverage counts unique skills once across both research collections',()=>{
 const count=skillComboCoverage(reference,data,curated);const ids=new Set([...data.recipes,...curated.recipes].flatMap(r=>r.skillIds));
 assert.equal(count.recipes,77);assert.equal(count.skills,reference.entries.filter(e=>e.kind==='skill'&&ids.has(e.id)).length);assert.equal(count.skills,116);assert.equal(count.totalSkills,399);
});
test('unknown members, duplicate recipes and stale source evidence are rejected',()=>{
 for(const mutate of [d=>d.recipes[0].skillIds.push('missing'),d=>d.recipes.push(d.recipes[0]),d=>d.sources[0].evidence.recordSha256='0'.repeat(64),d=>d.sources.push(d.sources[0])]){const broken=structuredClone(data);mutate(broken);assert.throws(()=>validateSkillCombos(reference,broken));}
});
test('missing first tests, unsafe evidence and invented support roles are rejected',()=>{
 for(const mutate of [d=>d.recipes[0].buildPlan.firstTest='',d=>d.recipes[0].evidenceUrls[0]='javascript:bad',d=>d.recipes[0].supportIdeas.push({supportId:'made-up'}),d=>d.referenceId='old']){const broken=structuredClone(data);mutate(broken);assert.throws(()=>validateSkillCombos(reference,broken));}
});

test('previous recipe snapshot is immutable and is extended rather than rewritten',()=>{
 const previous=read('data/discovery/pob-bb52d6b-skill-combos1.json');validateSkillCombos(reference,previous);
 assert.notEqual(data.id,previous.id);assert.deepEqual(data.recipes.slice(0,previous.recipes.length),previous.recipes);
 for(const source of previous.sources)assert.deepEqual(data.sources.find(s=>s.id===source.id),source);
});
test('new skill families retain resource and effect-scope counterchecks',()=>{
 const get=id=>data.recipes.find(r=>r.id===id);
 assert.match(get('selfcast-spirits').conditions.join(' '),/used by you/);
 assert.match(get('selfcast-spirits').avoid.join(' '),/totem\/visage/);
 assert.match(get('soul-spell').conditions.join(' '),/does not increase your minions/);
 assert.match(get('wyvern-oil').conditions.join(' '),/additional Power Charges/);
 assert.match(get('freeze-mark-wave').conditions.join(' '),/weapon swap/);
 assert.match(get('charged-apparition').conditions.join(' '),/excludes channelling, cooldown, triggered, item-granted/);
 assert.match(get('armour-sunder').avoid.join(' '),/old assumption/);
 assert.match(get('ritual-zombies').conditions.join(' '),/already-consumed corpse/);
});
test('all new skills add coverage through an actual multi-skill recipe',()=>{
 const previous=read('data/discovery/pob-bb52d6b-skill-combos1.json'),prior=new Set(previous.sources.map(s=>s.id));
 const added=data.sources.filter(s=>!prior.has(s.id));assert.equal(added.length,66);
 for(const source of added){const ideas=discoverSkillCombos(reference,data,source.id);assert.ok(ideas.length>0);assert.ok(ideas.every(r=>r.skillIds.length>=2&&r.buildPlan.firstTest));}
 const pairs=data.recipes.map(r=>[...r.skillIds].sort().join('|'));assert.equal(new Set(pairs).size,pairs.length);
});
