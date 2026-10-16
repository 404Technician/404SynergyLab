import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSkillSetup,validateSkillSetup,analyzeSkillSetup,skillSetupSpecs,skillSetupMatches,skillTestScope} from '../src/skill-setup.mjs';
import {validatePlanBook,createBuildPlan,createPlanVariant} from '../src/build-plans.mjs';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url)));
const reference=read('data/catalog/pob-bb52d6b-full-catalog1.json'),profiles=read('data/mechanics/pob-bb52d6b-mechanics1.json'),reviews=read('data/research/pob-bb52d6b-skill-reviews1.json'),details=read('data/research/pob-bb52d6b-details2.json');
const map=values=>new Map(values.map(v=>[v.id,v]));
const context={reference:map(reference.entries),profiles:map(profiles.profiles),reviews:map(reviews.entries),details:map(details.entries),stamp:'pinned-source-checks'};
const group=(skillId='spark',supportIds=[],role='base')=>({skillId,supportIds,role});
const build=(...specs)=>createSkillSetup(specs,context);
const id=(kind,name)=>reference.entries.find(e=>e.kind===kind&&e.name===name).id;
test('all 399 skill records and 567 supports produce source descriptions and validated saved checks',()=>{
 const skills=reference.entries.filter(e=>e.kind==='skill'),supports=reference.entries.filter(e=>e.kind==='support');assert.equal(skills.length,399);assert.equal(supports.length,567);
 for(const skill of skills){const setup=build(group(skill.id));assert.ok(setup.groups[0].skill.description);assert.equal(setup.groups[0].skill.fromItem,context.reviews.get(skill.id).fromItem);}
 for(const support of supports){const setup=build(group('spark',[support.id]));assert.ok(setup.groups[0].supports[0].description);assert.ok(['compatible','incompatible','unknown'].includes(setup.groups[0].supports[0].status));}
 for(const recipe of [...read('data/discovery/catalog.json').recipes,...read('data/discovery/pob-bb52d6b-skill-combos4.json').recipes,...read('data/discovery/pob-bb52d6b-unique-combos4.json').recipes])validateSkillSetup(build(...recipe.skillIds.map(skillId=>group(skillId))));
});
test('source exclusions, triggered roles and minion context remain distinct from a type match',()=>{
 const bad=build(group('spark',['rapid-attacks-1']));assert.equal(analyzeSkillSetup(bad).conflicts,1);
 assert.equal(build(group('spark',['controlled-destruction'])).groups[0].supports[0].status,'compatible');
 const base=build(group('spark',[id('support','Unleash')])),triggered=build(group('spark',[id('support','Unleash')],'triggered'));assert.equal(base.groups[0].supports[0].status,'unknown');assert.equal(triggered.groups[0].supports[0].status,'incompatible');
 const minion=build(group(id('skill','Skeletal Reaver'),[id('support','Ambush')]));assert.equal(minion.groups[0].supports[0].status,'unknown');
 const granted=build(group(id('skill','Crushing Fear')));assert.equal(granted.groups[0].skill.fromItem,true);assert.ok(granted.groups[0].skill.weaponRequirements);assert.deepEqual(analyzeSkillSetup(granted,['spark']).missing,['spark']);
});
test('saved setups reject duplicate or unavailable records and round trip their intended role',()=>{
 const setup=build(group('spark',['controlled-destruction'],'triggered'));assert.deepEqual(skillSetupSpecs(setup),[group('spark',['controlled-destruction'],'triggered')]);
 for(const specs of [[group('missing')],[group('spark',['missing'])],[group('spark',['controlled-destruction','controlled-destruction'])],[group('spark'),group('spark')],[group('spark',[],'automatic')]])assert.throws(()=>createSkillSetup(specs,context));
 assert.throws(()=>createSkillSetup(Array(13).fill(group()),context));assert.equal(skillSetupMatches(setup,{...setup,stamp:'changed'}),false);
});
test('optional skill groups survive old plan books, immutable test snapshots and untested variants',()=>{
 const source={stamp:'source',patch:'0.5.5e',title:'Example',firstTest:'Test',stopIf:'Stop',skills:['Spark'],components:['Spark'],conditions:['A condition'],items:[]},plan=createBuildPlan('recipe',source,'one','2026-10-16');validatePlanBook({version:1,plans:[plan]});
 plan.skillSetup=build(group('spark',['controlled-destruction']));plan.tests=[{outcome:'works',patch:'0.5.5e',target:'A target',observations:'This source group only',date:'2026-10-16',skillSetup:structuredClone(plan.skillSetup)}];validatePlanBook({version:1,plans:[plan]});assert.match(skillTestScope(plan.tests[0],plan.skillSetup),/match/);
 const variant=createPlanVariant(plan,'two','2026-10-16');assert.equal(variant.tests.length,0);variant.skillSetup.groups[0].supports=[];assert.equal(plan.skillSetup.groups[0].supports.length,1);assert.match(skillTestScope(plan.tests[0],variant.skillSetup),/different/);assert.match(skillTestScope({},plan.skillSetup),/not recorded/);
});
