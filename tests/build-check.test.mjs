import test from 'node:test';
import assert from 'node:assert/strict';
import {checkBuild} from '../src/build-check.mjs';
const item=(id,category='ring',modifiers=[])=>({id,name:id,base:'Base',category,modifiers,generated:false});
const skill=(id,fromItem=false)=>({id,name:id,fromItem,weaponRequirements:''});
const setup=(...groups)=>({stamp:'skills',groups});
const group=(id,supports=[],role='base',fromItem=false)=>({skill:skill(id,fromItem),role,supports});
const source={stamp:'source',items:[{id:'core',name:'Core unique'}],conditions:['Check event'],firstTest:'Observe a cast'};
const plan=()=>({source:structuredClone(source),checked:[],tests:[]});
function run(p,extra={}){return checkBuild(p,{source:structuredClone(source),currentEquipment:structuredClone(p.loadout),currentSkills:structuredClone(p.skillSetup),requiredSkills:[{id:'core-skill',name:'Core skill'}],...extra});}
test('old plans need recorded setups, not inferred gear; checked boxes and notes do not validate resources',()=>{
 const p=plan();p.checked=['Check event'];p.notes={resources:'Infinite mana'};const r=run(p);assert.equal(r.paused,false);assert.equal(r.counts.missing,2);assert.equal(r.next.code,'no-equipment');assert.ok(r.findings.some(f=>f.code==='resources'));assert.ok(!r.findings.some(f=>f.code==='requirements'));assert.ok(r.findings.some(f=>f.code==='game-test'));assert.deepEqual(p.source,source);
});
test('conflicts take priority, all support tradeoffs remain visible and missing cores use IDs',()=>{
 const p=plan();p.loadout={stamp:'gear',items:[item('one','helmet'),item('two','helmet')]};p.skillSetup=setup(group('other',[{id:'bad',name:'Bad',status:'incompatible',reason:'Wrong types',warnings:['Cannot crit']},{id:'context',name:'Context',status:'unknown',reason:'Minion context',warnings:[]},{id:'ok',name:'Okay',status:'compatible',reason:'Types match',warnings:['Scaling tradeoff']}]));
 const r=run(p);assert.equal(r.counts.conflict,2);assert.equal(r.next.level,'conflict');assert.ok(r.findings.some(f=>f.code==='equipment-required-core'));assert.ok(r.findings.some(f=>f.code==='skill-core-skill'));assert.equal(r.findings.filter(f=>f.code.startsWith('warning-')).length,2);assert.equal(r.findings.find(f=>f.code==='support-other-context').level,'review');
});
test('outdated or altered snapshots pause synthesis rather than trust imported support checks',()=>{
 const p=plan();p.loadout={stamp:'gear',items:[]};p.skillSetup=setup(group('core-skill'));
 for(const override of [{source:null},{source:{...source,stamp:'changed'}},{currentEquipment:{...p.loadout,stamp:'different'}},{currentSkills:{...p.skillSetup,stamp:'different'}},{currentSkills:null}]){const r=run(p,override);assert.equal(r.paused,true);assert.equal(r.findings.length,1);assert.equal(r.counts.conflict,0);assert.equal(r.next.code,'source-changed');}
});
test('item access treats recognized grants as alternatives and unknown grants as manual checks',()=>{
 const p=plan();p.skillSetup=setup(group('granted',[],'base',true));const grantingItems=()=>[{id:'a',name:'Source A'},{id:'b',name:'Source B'}];
 assert.equal(run(p,{grantingItems}).findings.find(f=>f.code==='access-granted').level,'review');
 p.loadout={stamp:'gear',items:[]};const missing=run(p,{grantingItems}).findings.find(f=>f.code==='access-granted');assert.equal(missing.level,'missing');assert.equal(missing.items.length,2);assert.match(missing.message,/Other actual granting modifiers/);
 p.loadout.items=[item('b')];const selected=run(p,{grantingItems}).findings.find(f=>f.code==='access-granted');assert.equal(selected.level,'review');assert.deepEqual(selected.items,[{id:'b',name:'Source B'}]);assert.equal(run(p).findings.find(f=>f.code==='access-granted').level,'review');
});
test('intended trigger roles and weapon constraints remain manual checks without invented engines',()=>{
 const p=plan();p.skillSetup=setup(group('core-skill',[],'triggered'));p.skillSetup.groups[0].skill.weaponRequirements='Quarterstaff';const r=run(p);assert.match(r.findings.find(f=>f.code==='triggers').message,/does not supply a trigger engine/);assert.match(r.findings.find(f=>f.code==='skill-weapons').message,/Quarterstaff/);
});
test('personal results never clear findings; both recorded setups must match the latest test',()=>{
 const p=plan();p.loadout={stamp:'gear',items:[]};p.skillSetup=setup(group('core-skill'));const t={outcome:'works',patch:'actual patch',target:'A boss',loadout:structuredClone(p.loadout),skillSetup:structuredClone(p.skillSetup)};p.tests=[t];const r=run(p);assert.equal(r.findings.find(f=>f.code==='game-test').title,'Personal test scope');assert.ok(r.findings.some(f=>f.code==='equipment-required-core'));assert.ok(r.findings.some(f=>f.code==='resources'));
 p.skillSetup.groups[0].role='triggered';assert.equal(run(p).findings.find(f=>f.code==='game-test').title,'Retest this setup');p.tests=[{outcome:'works'}];assert.equal(run(p).findings.find(f=>f.code==='game-test').title,'Retest this setup');
});
