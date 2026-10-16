import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateUniqueCombos,discoverUniqueCombos,uniqueRecipeItemIds} from '../src/unique-combos.mjs';
import {validateSkillCombos,discoverSkillCombos,skillComboCoverage} from '../src/skill-combos.mjs';
import {auditUniqueCoverage} from '../src/unique-audit.mjs';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url))),ref=read('data/catalog/pob-bb52d6b-full-catalog1.json'),details=read('data/research/pob-bb52d6b-details2.json'),reviews=read('data/research/pob-bb52d6b-skill-reviews1.json'),mechanics=read('data/mechanics/pob-bb52d6b-mechanics1.json'),curated=read('data/discovery/catalog.json'),skills=read('data/discovery/pob-bb52d6b-skill-combos4.json'),uniques=read('data/discovery/pob-bb52d6b-unique-combos4.json');
test('active research covers 272 skills and 207 uniques without replacing historical collections',()=>{
 validateSkillCombos(ref,skills,mechanics);validateUniqueCombos(ref,details,reviews,uniques);
 const oldSkills=read('data/discovery/pob-bb52d6b-skill-combos3.json'),oldUniques=read('data/discovery/pob-bb52d6b-unique-combos3.json');
 validateSkillCombos(ref,oldSkills,mechanics);validateUniqueCombos(ref,details,reviews,oldUniques);
 assert.deepEqual(skills.recipes.slice(0,167),oldSkills.recipes);assert.equal(skills.recipes.length,171);assert.equal(uniques.recipes.length,205);
 const corrected=new Set(['unique-study-27','unique-expansion-40','unique-expansion-48']);
 for(const old of oldUniques.recipes)if(!corrected.has(old.id))assert.deepEqual(uniques.recipes.find(r=>r.id===old.id),old);
 assert.deepEqual(skillComboCoverage(ref,skills,curated,uniques),{recipes:389,skills:272,totalSkills:399});
 assert.deepEqual(auditUniqueCoverage(ref,details,curated,uniques).counts,{researched:207,equipment:26,open:190,variant:12,generated:8});
});
test('Icefang evidence binds the offensive line rather than its separate incoming-damage effect',()=>{
 for(const id of ['unique-study-27','unique-expansion-40','unique-expansion-48']){
  const r=uniques.recipes.find(r=>r.id===id),fragments=id==='unique-expansion-48'?r.additionalItems[0].requiredFragments:r.requiredFragments;
  assert.deepEqual(fragments,['All Damage from Hits against Poisoned targets Contributes to Chill Magnitude']);
  assert.doesNotMatch(r.mechanics,/Damage taken from Hits while Poisoned/);assert.match(r.avoid.join(' '),/applies to you/);
 }
});
test('new recipes can be found from each real item and skill with all required item access',()=>{
 for(const r of uniques.recipes.filter(r=>r.id.startsWith('coverage-review-'))){
  for(const id of uniqueRecipeItemIds(r))assert.ok(discoverUniqueCombos(ref,uniques,'unique',id).some(x=>x.id===r.id));
  for(const id of r.skillIds)assert.ok(discoverUniqueCombos(ref,uniques,'skill',id).some(x=>x.id===r.id));
 }
 for(const r of skills.recipes.filter(r=>r.id.startsWith('review-')))for(const id of r.skillIds)assert.ok(discoverSkillCombos(ref,skills,id).some(x=>x.id===r.id));
 const cull=uniques.recipes.find(r=>r.id==='coverage-review-myris-fear');assert.equal(cull.additionalItems.length,1);assert.match(cull.conditions.join(' '),/Quarterstaff/);assert.match(cull.conditions.join(' '),/not a 100% life execution/);
 const illusion=uniques.recipes.find(r=>r.id==='coverage-review-powertread-illusion');assert.match(illusion.avoid.join(' '),/uncollected Remnant/);assert.match(illusion.avoid.join(' '),/does not increase critical-hit chance/);
});
test('new defensive and cold routes retain resource, timing and event counterchecks',()=>{
 const r=id=>skills.recipes.find(r=>r.id===id);
 assert.match(r('review-bitter-darts').conditions.join(' '),/does not create either resource/);
 assert.match(r('review-frost-darts-chill').avoid.join(' '),/does not supply a Cold Infusion/);
 assert.match(r('review-grim-cascade').avoid.join(' '),/Early Cascade bursts/);
 assert.match(r('review-ghost-wind').conditions.join(' '),/order of recovery and stage loss/);
 assert.match(r('review-ghost-wind').avoid.join(' '),/Evading an attack does not/);
});
