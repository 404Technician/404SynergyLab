import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {describeUniqueReview,uniqueModifiers} from '../src/unique-reviews.mjs';
import {validateUniqueCombos,discoverUniqueCombos} from '../src/unique-combos.mjs';
import {skillComboCoverage} from '../src/skill-combos.mjs';
import {validateExperimentDetails} from '../src/experiment-details.mjs';
import {auditUniqueCoverage} from '../src/unique-audit.mjs';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url)));
const ref=read('data/catalog/pob-bb52d6b-full-catalog1.json'),details=read('data/research/pob-bb52d6b-details2.json'),reviews=read('data/research/pob-bb52d6b-skill-reviews1.json'),data=read('data/discovery/pob-bb52d6b-unique-combos2.json');
const entry=name=>ref.entries.find(e=>e.kind==='unique'&&e.name===name),detail=e=>details.entries.find(r=>r.id===e.id),guide=name=>describeUniqueReview(entry(name),detail(entry(name)));
test('all 443 distinct uniques have source-bound setup guides, including generated families',()=>{
 const uniques=ref.entries.filter(e=>e.kind==='unique');assert.equal(uniques.length,443);
 for(const e of uniques){const g=describeUniqueReview(e,detail(e));assert.ok(g.roles.length);assert.ok(g.practical.length);assert.ok(!('recipes' in g));}
 assert.equal(uniques.filter(e=>guide(e.name).status==='generated').length,8);
 const spectra=uniques.filter(e=>e.name==='Grand Spectrum');assert.equal(spectra.length,3);assert.equal(new Set(spectra.map(e=>e.id)).size,3);
});
test('Current modifier selection never combines historical versions or source selection metadata',()=>{
 const e=entry('Radiant Grief'),mods=uniqueModifiers(detail(e)).map(m=>m.text).join(' ');
 assert.match(mods,/200 Base Fire/);assert.doesNotMatch(mods,/100 Base Fire|Selected Variant|Has Alt Variant|Version:/);
 const alternate=entry('The Unborn Lich');assert.doesNotMatch(uniqueModifiers(detail(alternate)).map(m=>m.text).join(' '),/Selected|Crafted|Has Alt/);assert.match(guide(alternate.name).warnings.join(' '),/common modifiers only/);
});
test('source versions and alternate variants remain independent conditions',()=>{
 validateExperimentDetails(ref,details);
 const wulfsbane=uniqueModifiers(detail(entry('Wulfsbane'))).map(m=>m.text).join(' ');assert.match(wulfsbane,/Intimidate Enemies on Block for 8 seconds/);assert.doesNotMatch(wulfsbane,/Permanently/);
 const flask=uniqueModifiers(detail(entry("Olroth's Resolve"))).map(m=>m.text).join(' ');assert.match(flask,/Current Runic Ward/);assert.doesNotMatch(flask,/Instant Recovery|Excess Life Recovery/);
 const jewel=detail(entry('Controlled Metamorphosis')),common=uniqueModifiers(jewel).map(m=>m.text).join(' ');assert.doesNotMatch(common,/Chaos Resistance|Only affects Passives/);
 const alternate=uniqueModifiers(jewel,'Medium Ring').map(m=>m.text).join(' ');assert.match(alternate,/Only affects Passives in Medium Ring/);assert.doesNotMatch(alternate,/Chaos Resistance/);
 const both={modifiers:[{text:'Current only',variants:['A'],versions:['Current']},{text:'old only',variants:['A'],versions:['Old']}]};assert.deepEqual(uniqueModifiers(both,'A').map(m=>m.text),['Current only']);
 const bad=structuredClone(details);delete bad.entries.find(e=>e.kind==='unique'&&!e.generated).modifiers[0].versions;assert.throws(()=>validateExperimentDetails(ref,bad),/version details/);
});
test('hard restrictions remain explicit rather than becoming tempting automatic combinations',()=>{
 for(const[name,pattern]of[['Plaguefinger',/forbids Elemental Ailments/],["Saffell's Frame",/Cannot Block/],['Redemption',/Cannot load/],["Cospri's Will",/half.*duration/],["Ungil's Harmony",/No Critical Damage Bonus/],['Indigon',/Mana Flasks/],["Tyranny's Grip",/Cannot use Projectile/]])assert.match(guide(name).warnings.join(' '),pattern);
});
test('152 unique interactions are discoverable from the exact item and every member skill',()=>{
 validateUniqueCombos(ref,details,reviews,data);assert.equal(data.recipes.length,152);assert.equal(new Set(data.recipes.map(r=>r.itemId)).size,152);
 for(const r of data.recipes){assert.ok(discoverUniqueCombos(ref,data,'unique',r.itemId).some(x=>x.id===r.id));for(const id of r.skillIds){const hydrated=discoverUniqueCombos(ref,data,'skill',id).find(x=>x.id===r.id);assert.ok(hydrated);assert.equal(hydrated.item.id,r.itemId);assert.equal(hydrated.skills.length,r.skillIds.length);}}
 assert.equal(discoverUniqueCombos(ref,data,'support',data.recipes[0].itemId).length,0);
});
test('fabricated item fragments, missing skill sources and stale item identities are rejected',()=>{
 for(const change of [d=>d.recipes[0].requiredFragments=['invented effect'],d=>d.recipes[0].itemRecordSha256='0'.repeat(64),d=>d.recipes[0].skillIds=['not-a-skill'],d=>d.recipes[0].evidenceUrls.pop(),d=>d.recipes[0].buildPlan.firstTest='',d=>d.recipes.push(d.recipes[0]),d=>d.detailsId='stale']){const broken=structuredClone(data);change(broken);assert.throws(()=>validateUniqueCombos(ref,details,reviews,broken));}
 const changed=structuredClone(details);changed.entries.find(e=>e.id===data.recipes[0].itemId).modifiers=[];assert.throws(()=>validateUniqueCombos(ref,changed,reviews,data),/modifier missing/);
});
test('generated guides cannot invent rolled modifiers and mismatched provenance fails',()=>{
 const generated=ref.entries.find(e=>e.kind==='unique'&&e.generated),g=describeUniqueReview(generated,detail(generated));assert.deepEqual(g.effects,[]);assert.match(g.warnings.join(' '),/actual rolled item/);
 const e=entry('Blackflame'),bad=structuredClone(detail(e));bad.evidence.recordSha256='bad';assert.throws(()=>describeUniqueReview(e,bad),/provenance/);
});
test('overall coverage includes unique recipes without inflating distinct skill counts',()=>{
 const skills=read('data/discovery/pob-bb52d6b-skill-combos3.json'),curated=read('data/discovery/catalog.json'),old=skillComboCoverage(ref,skills,curated),all=skillComboCoverage(ref,skills,curated,data);
 assert.equal(old.recipes,180);assert.equal(all.recipes,332);assert.ok(all.skills>=old.skills);assert.ok(all.skills<=399);
});
test('every unique receives an honest coverage state and aliases retain their existing recipes',()=>{
 const curated=read('data/discovery/catalog.json'),audit=auditUniqueCoverage(ref,details,curated,data);
 assert.equal(audit.entries.length,443);assert.equal(new Set(audit.entries.map(e=>e.id)).size,443);
 assert.deepEqual(audit.counts,{researched:156,equipment:28,open:238,variant:13,generated:8});assert.equal(Object.values(audit.counts).reduce((a,b)=>a+b,0),443);
 for(const e of audit.entries){assert.ok(e.reason.length>40);assert.equal(e.status==='researched',e.recipeIds.length>0);}
 const row=n=>audit.entries.find(e=>e.id===entry(n).id);
 assert.equal(row('The Three Dragons').recipeIds.length,3);assert.equal(row('Blueflame Bracers').recipeIds.length,2);assert.equal(row('Goldrim').status,'equipment');assert.equal(row('Mageblood').status,'variant');assert.equal(row("Saffell's Frame").status,'open');assert.match(row("Saffell's Frame").reason,/does not mean/);
 const bad=structuredClone(curated);bad.recipes[0].itemId='invented-unique';assert.throws(()=>auditUniqueCoverage(ref,details,bad,data),/unknown unique/);
});
test('the 100-item expansion preserves all 52 earlier interactions unchanged',()=>{
 const previous=read('data/discovery/pob-bb52d6b-unique-combos1.json');assert.deepEqual(data.recipes.slice(0,52),previous.recipes);assert.equal(data.recipes.length-previous.recipes.length,100);
 assert.equal(new Set(data.recipes.slice(52).map(r=>r.itemId)).size,100);
 for(const r of data.recipes.slice(52)){assert.match(r.conditions[0],/granting weapon to remain active/);assert.ok(r.avoid.length);assert.ok(r.buildPlan.firstTest.length>40);}
});
test('new trigger, minion and recovery routes preserve decisive counterchecks',()=>{
 const recipe=n=>data.recipes.find(r=>r.itemId===entry(n).id),warnings=n=>recipe(n).avoid.join(' ');
 assert.match(warnings('Choir of the Storm'),/triggered.*Energy/);assert.match(warnings('Dusk Vigil'),/reset Ember duration/);assert.match(warnings("Enezun's Charge"),/not an infinite corpse loop/);assert.match(warnings('Heartbound Loop'),/Despawn.*not automatically/);assert.match(warnings('Glowswarm'),/spending flask charges.*not automatically/);assert.match(warnings('Svalinn'),/not guaranteed block/);
 assert.match(recipe('Facebreaker').conditions.join(' '),/both hand slots empty/);assert.match(recipe('Rathpith Globe').avoid.join(' '),/two-handed staff/);assert.match(recipe('The Covenant').avoid.join(' '),/Remnant on the ground/);
});
