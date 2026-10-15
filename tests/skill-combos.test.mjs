import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateSkillCombos,discoverSkillCombos,skillComboCoverage} from '../src/skill-combos.mjs';
const read=path=>JSON.parse(readFileSync(new URL('../'+path,import.meta.url)));
const reference=read('data/catalog/pob-bb52d6b-full-catalog1.json');
const data=read('data/discovery/pob-bb52d6b-skill-combos1.json');
const curated=read('data/discovery/catalog.json');
const byName=name=>reference.entries.find(e=>e.kind==='skill'&&e.name===name&&!e.legacy).id;
test('explicit interactions bind to 41 source skills with complete practical test plans',()=>{
 validateSkillCombos(reference,data);assert.equal(data.recipes.length,25);assert.equal(data.sources.length,41);
 for(const r of data.recipes){assert.ok(r.buildPlan.firstTest.length>30);assert.ok(r.buildPlan.stopIf.length>20);assert.ok(r.conditions.length>0);assert.equal(r.item,null);assert.deepEqual(r.supportIdeas,[]);}
});
test('each member can find the same interaction, with no name or tag guessing',()=>{
 for(const r of data.recipes)for(const id of r.skillIds)assert.equal(discoverSkillCombos(reference,data,id).filter(i=>i.id===r.id).length,1);
 assert.equal(discoverSkillCombos(reference,data,byName('Leap Slam')).length,0);
 assert.deepEqual(discoverSkillCombos(reference,data,'the-three-dragons'),[]);
 assert.throws(()=>discoverSkillCombos(reference,data,'missing'),/Unknown/);
});
test('chaos and projectile targeting keep their decisive limitations',()=>{
 const drain=discoverSkillCombos(reference,data,byName('Essence Drain'));assert.equal(drain.length,2);assert.match(drain.find(r=>r.id==='chaos-spread').conditions.join(' '),/isolated boss/);
 const warp=data.recipes.find(r=>r.id==='ball-warp');assert.match(warp.avoid.join(' '),/enemy-only Shocked Ground/);
 assert.match(data.recipes.find(r=>r.id==='orb-flameblast').avoid.join(' '),/zero-button/);
 assert.match(data.recipes.find(r=>r.id==='palm-thunder').conditions.join(' '),/boss without adds/);
 assert.match(data.recipes.find(r=>r.id==='jagged-totem').avoid.join(' '),/does not supply its own Jagged Ground/);
});
test('coverage counts unique skills once across both research collections',()=>{
 const count=skillComboCoverage(reference,data,curated);const ids=new Set([...data.recipes,...curated.recipes].flatMap(r=>r.skillIds));
 assert.equal(count.recipes,38);assert.equal(count.skills,reference.entries.filter(e=>e.kind==='skill'&&ids.has(e.id)).length);assert.ok(count.skills>=45);assert.equal(count.totalSkills,399);
});
test('unknown members, duplicate recipes and stale source evidence are rejected',()=>{
 for(const mutate of [d=>d.recipes[0].skillIds.push('missing'),d=>d.recipes.push(d.recipes[0]),d=>d.sources[0].evidence.recordSha256='0'.repeat(64),d=>d.sources.push(d.sources[0])]){const broken=structuredClone(data);mutate(broken);assert.throws(()=>validateSkillCombos(reference,broken));}
});
test('missing first tests, unsafe evidence and invented support roles are rejected',()=>{
 for(const mutate of [d=>d.recipes[0].buildPlan.firstTest='',d=>d.recipes[0].evidenceUrls[0]='javascript:bad',d=>d.recipes[0].supportIdeas.push({supportId:'made-up'}),d=>d.referenceId='old']){const broken=structuredClone(data);mutate(broken);assert.throws(()=>validateSkillCombos(reference,broken));}
});
