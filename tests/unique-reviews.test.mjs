import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {describeUniqueReview,uniqueModifiers} from '../src/unique-reviews.mjs';
import {validateUniqueCombos,discoverUniqueCombos,uniqueRecipeItemIds} from '../src/unique-combos.mjs';
import {skillComboCoverage} from '../src/skill-combos.mjs';
import {validateExperimentDetails} from '../src/experiment-details.mjs';
import {auditUniqueCoverage} from '../src/unique-audit.mjs';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url)));
const ref=read('data/catalog/pob-bb52d6b-full-catalog1.json'),details=read('data/research/pob-bb52d6b-details2.json'),reviews=read('data/research/pob-bb52d6b-skill-reviews1.json'),data=read('data/discovery/pob-bb52d6b-unique-combos3.json');
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
test('200 unique interactions are discoverable from the exact item and every member skill',()=>{
 validateUniqueCombos(ref,details,reviews,data);assert.equal(data.recipes.length,200);assert.equal(new Set(data.recipes.flatMap(uniqueRecipeItemIds)).size,198);
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
 assert.equal(old.recipes,180);assert.equal(all.recipes,380);assert.ok(all.skills>=old.skills);assert.ok(all.skills<=399);
});
test('every unique receives an honest coverage state and aliases retain their existing recipes',()=>{
 const curated=read('data/discovery/catalog.json'),audit=auditUniqueCoverage(ref,details,curated,data);
 assert.equal(audit.entries.length,443);assert.equal(new Set(audit.entries.map(e=>e.id)).size,443);
 assert.deepEqual(audit.counts,{researched:202,equipment:26,open:195,variant:12,generated:8});assert.equal(Object.values(audit.counts).reduce((a,b)=>a+b,0),443);
 for(const e of audit.entries){assert.ok(e.reason.length>40);assert.equal(e.status==='researched',e.recipeIds.length>0);}
 const row=n=>audit.entries.find(e=>e.id===entry(n).id);
 assert.equal(row('The Three Dragons').recipeIds.length,3);assert.equal(row('Blueflame Bracers').recipeIds.length,2);assert.equal(row('Goldrim').status,'equipment');assert.equal(row('Mageblood').status,'variant');assert.equal(row("Saffell's Frame").status,'open');assert.match(row("Saffell's Frame").reason,/does not mean/);
 const bad=structuredClone(curated);bad.recipes[0].itemId='invented-unique';assert.throws(()=>auditUniqueCoverage(ref,details,bad,data),/unknown unique/);
});
test('the 100-item expansion preserves all 52 earlier interactions unchanged',()=>{
 const previous=read('data/discovery/pob-bb52d6b-unique-combos1.json'),second=read('data/discovery/pob-bb52d6b-unique-combos2.json');assert.deepEqual(second.recipes.slice(0,52),previous.recipes);assert.equal(second.recipes.length-previous.recipes.length,100);
 assert.equal(new Set(data.recipes.slice(52,152).map(r=>r.itemId)).size,100);
 for(const r of data.recipes.slice(52,152)){assert.match(r.conditions[0],/granting weapon to remain active/);assert.ok(r.avoid.length);assert.ok(r.buildPlan.firstTest.length>40);}
});
test('new trigger, minion and recovery routes preserve decisive counterchecks',()=>{
 const recipe=n=>data.recipes.find(r=>r.itemId===entry(n).id),warnings=n=>recipe(n).avoid.join(' ');
 assert.match(warnings('Choir of the Storm'),/triggered.*Energy/);assert.match(warnings('Dusk Vigil'),/reset Ember duration/);assert.match(warnings("Enezun's Charge"),/not an infinite corpse loop/);assert.match(warnings('Heartbound Loop'),/Despawn.*not automatically/);assert.match(warnings('Glowswarm'),/spending flask charges.*not automatically/);assert.match(warnings('Svalinn'),/not guaranteed block/);
 assert.match(recipe('Facebreaker').conditions.join(' '),/both hand slots empty/);assert.match(recipe('Rathpith Globe').avoid.join(' '),/two-handed staff/);assert.match(recipe('The Covenant').avoid.join(' '),/Remnant on the ground/);
});
test('earlier snapshots remain intact while two weapon-bound minion routes are corrected',()=>{
 const previous=read('data/discovery/pob-bb52d6b-unique-combos2.json'),corrected=new Set(['unique-audit-15','unique-audit-76']);
 for(let i=0;i<152;i++){const before=previous.recipes[i],after=data.recipes[i];if(!corrected.has(before.id))assert.deepEqual(after,before);else{assert.equal(after.id,before.id);assert.equal(after.itemRecordSha256,before.itemRecordSha256);assert.deepEqual(after.requiredFragments,before.requiredFragments);assert.ok(before.skillIds.some(id=>ref.entries.find(e=>e.id===id)?.name==='Skeletal Warrior'));assert.ok(after.skillIds.some(id=>ref.entries.find(e=>e.id===id)?.name==='Skeletal Reaver'));assert.ok(!after.skillIds.some(id=>ref.entries.find(e=>e.id===id)?.name==='Skeletal Warrior'));}}
 assert.equal(data.recipes.length-previous.recipes.length,48);assert.equal(data.recipes.filter(r=>r.additionalItems?.length).length,12);
});
test('new minion routes use an independently available minion when another weapon must stay active',()=>{
 const reaver=ref.entries.find(e=>e.kind==='skill'&&e.name==='Skeletal Reaver');assert.equal(reviews.entries.find(e=>e.id===reaver.id).fromItem,false);
 for(const name of ['Chober Chaber',"The Raven's Flock",'Guiding Palm of the Eye','Guiding Palm of the Heart','Guiding Palm of the Mind'])assert.ok(data.recipes.find(r=>r.itemId===entry(name).id).skillIds.includes(reaver.id));
 for(const r of data.recipes.filter(r=>r.title.startsWith('Gravebind +')))assert.ok(r.skillIds.includes(reaver.id));
});
test('multi-unique routes are discoverable from every required item and skill',()=>{
 for(const recipe of data.recipes.filter(r=>r.additionalItems?.length)){
  const itemIds=uniqueRecipeItemIds(recipe);assert.equal(itemIds.length,2);
  for(const id of itemIds){const found=discoverUniqueCombos(ref,data,'unique',id).find(r=>r.id===recipe.id);assert.ok(found);assert.deepEqual(found.items.map(e=>e.id),itemIds);}
  for(const id of recipe.skillIds)assert.ok(discoverUniqueCombos(ref,data,'skill',id).some(r=>r.id===recipe.id));
 }
 const report=auditUniqueCoverage(ref,details,read('data/discovery/catalog.json'),data);const headhunter=report.entries.find(e=>e.id===entry('Headhunter').id);assert.equal(headhunter.status,'researched');assert.ok(headhunter.recipeIds.includes(data.recipes.find(r=>r.title==='Gravebind + Headhunter').id));
});
test('additional unique provenance and equipment conflicts fail closed',()=>{
 const original=data.recipes.find(r=>r.additionalItems?.length),withItems=(a,b)=>{const d=structuredClone(data),r=structuredClone(original),primary=entry(a),secondary=entry(b);r.itemId=primary.id;r.itemRecordSha256=primary.evidence.recordSha256;r.requiredFragments=[uniqueModifiers(detail(primary))[0].text];r.additionalItems=[{itemId:secondary.id,recordSha256:secondary.evidence.recordSha256,requiredFragments:[uniqueModifiers(detail(secondary))[0].text]}];r.evidenceUrls=[primary.evidence.url,secondary.evidence.url,...r.skillIds.map(id=>(ref.entries.find(e=>e.id===id).effectEvidence||ref.entries.find(e=>e.id===id).evidence).url)];d.recipes=[r];return d;};
 assert.throws(()=>validateUniqueCombos(ref,details,reviews,withItems('Gravebind','Killjoy')),/equipment slot conflict/);
 assert.throws(()=>validateUniqueCombos(ref,details,reviews,withItems("Thief's Torment",'Polcirkeln')),/ring restriction/);
 assert.throws(()=>validateUniqueCombos(ref,details,reviews,withItems('Pillar of the Caged God','Svalinn')),/weapon slot conflict/);
 assert.throws(()=>validateUniqueCombos(ref,details,reviews,withItems('Gravebind','Gravebind')),/Duplicate unique/);
 for(const change of [r=>r.additionalItems[0].recordSha256='bad',r=>r.additionalItems[0].requiredFragments=['fabricated effect'],r=>r.evidenceUrls.splice(1,1)]){const d=structuredClone(data);change(d.recipes.find(r=>r.additionalItems?.length));assert.throws(()=>validateUniqueCombos(ref,details,reviews,d));}
});
test('poison and bleed shatter routes do not invent actual Freeze or damage-over-time killing hits',()=>{
 const pair=data.recipes.find(r=>r.title==='Icefang Orbit + Polcirkeln');assert.match(pair.avoid.join(' '),/damage-over-time kills/);assert.match(pair.avoid.join(' '),/not a completed Freeze/);
 const party=data.recipes.find(r=>r.title==='Font of Power · Spark');assert.match(party.conditions.join(' '),/two real party characters/);assert.match(party.avoid.join(' '),/minions are not Party Members/);
});
