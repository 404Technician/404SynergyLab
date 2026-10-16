import {analyzeEquipment,equipmentMatches} from './equipment-plan.mjs';
import {skillSetupMatches} from './skill-setup.mjs';

// Read-only synthesis of pinned rules. A reviewed checkbox or personal result is
// never evidence that an unmodeled rule, resource budget or trigger works.
export function checkBuild(plan,{source,currentEquipment,currentSkills,requiredSkills=[],grantingItems=()=>[]}){
 const findings=[];
 const add=(level,code,title,message,action,target,items=[])=>findings.push({level,code,title,message,action,target,items});
 const outdated=[];
 if(!source||JSON.stringify(source)!==JSON.stringify(plan.source))outdated.push('recipe');
 if(plan.loadout&&!equipmentMatches(plan.loadout,currentEquipment))outdated.push('equipment');
 if(plan.skillSetup&&!skillSetupMatches(plan.skillSetup,currentSkills))outdated.push('skill groups');
 if(outdated.length){
  add('review','source-changed','Saved source needs attention','Saved '+outdated.join(', ')+' differs from the current pinned source or is unavailable. Current build checks are paused; saved checks are not reused as current evidence.','Keep or export this plan. Reset changed equipment or skill groups explicitly; for a changed recipe, save a new plan from the current recipe.','plan-editor-title');
  return result(findings,true);
 }
 if(!plan.loadout)add('missing','no-equipment','Unique equipment not recorded','Required core uniques have not been compared with a saved equipment selection. This says nothing about your actual gear.','Use required core uniques or record your intended unique equipment.','plan-equipment-heading');
 else for(const f of analyzeEquipment(plan.loadout,plan.source.items).findings)add(f.level,'equipment-'+f.code,f.level==='conflict'?'Equipment conflict':f.level==='missing'?'Core unique missing':'Equipment needs review',f.message,f.level==='conflict'?'Remove or replace conflicting items, or verify the actual override.':f.level==='missing'?'Record the missing core unique or choose a different recipe.':'Verify the actual item variants, slots and active weapon set.','plan-equipment-heading');
 if(!plan.skillSetup)add('missing','no-skills','Skill groups not recorded','The source recipe has not been compared with a saved skill selection.','Use core skills, then record the supports you intend to use.','plan-skills-heading');
 else {
  const groups=plan.skillSetup.groups;
  for(const skill of requiredSkills)if(!groups.some(g=>g.skill.id===skill.id))add('missing','skill-'+skill.id,'Core skill missing',skill.name+' is part of the saved recipe but is absent from the planned groups.','Add '+skill.name+' or choose a different recipe.','plan-skills-heading');
  for(const group of groups){
   const skill=group.skill;
   for(const support of group.supports){
    if(support.status!=='compatible')add(support.status==='incompatible'?'conflict':'review','support-'+skill.id+'-'+support.id,skill.name+' + '+support.name,support.reason,support.status==='incompatible'?'Remove or replace this support; inspect its source restrictions.':'Check the support in the actual skill, minion or trigger context.','plan-skills-heading');
    for(const [index,warning] of support.warnings.entries())add('review','warning-'+skill.id+'-'+support.id+'-'+index,skill.name+' · '+support.name,warning,'Check whether this tradeoff prevents the intended event or scaling.','plan-skills-heading');
   }
   if(skill.fromItem){
    const candidates=grantingItems(skill.id),selected=candidates.filter(i=>plan.loadout?.items.some(x=>x.id===i.id));
    if(!candidates.length)add('review','access-'+skill.id,skill.name+' · item access unknown','No granting unique is recognized by the partial source rules. Other equipment or modifiers may grant this skill.','Identify the actual granting item, variant and active weapon set.','plan-skills-heading');
    else if(!plan.loadout)add('review','access-'+skill.id,skill.name+' · choose an item source','Possible granting uniques: '+candidates.map(i=>i.name).join(' / ')+'. These are alternatives; not all are required.','Record one applicable source in unique equipment and verify its actual granting modifier.','plan-equipment-heading',candidates);
    else if(!selected.length)add('missing','access-'+skill.id,skill.name+' · item access not recorded','No recognized granting unique is selected. Possible sources: '+candidates.map(i=>i.name).join(' / ')+'. Other actual granting modifiers need manual confirmation.','Select one applicable source or document the actual granting modifier; do not equip every alternative.','plan-equipment-heading',candidates);
    else add('review','access-'+skill.id,skill.name+' · granting unique selected',selected.map(i=>i.name).join(' / ')+' is selected. Catalog association alone does not verify the granting variant or active weapon set.','Match the actual granting modifier, skill level and active weapon set.','plan-equipment-heading',selected);
   }
  }
  const weapons=[...new Set(groups.map(g=>g.skill.weaponRequirements).filter(Boolean))];
  if(weapons.length)add('review','skill-weapons','Skill weapon requirements',weapons.join(' · '),'Match each skill to its actual weapon and active weapon set; catalog categories do not prove hand use.','plan-skills-heading');
  const triggered=groups.filter(g=>g.role==='triggered');
  if(triggered.length)add('review','triggers','Trigger path needs a test',triggered.map(g=>g.skill.name).join(', ')+': an intended triggered role does not supply a trigger engine.','Verify the actual engine, eligible event generator, sockets, Energy gain, threshold and triggered cast.','plan-skills-heading');
 }
 const remaining=plan.source.conditions.filter(c=>!plan.checked.includes(c));
 if(remaining.length)add('review','requirements','Recipe requirements to review',remaining.length+' recorded requirements remain unreviewed. Reviewing them does not validate a complete build.','Read and review the requirements before running the source test.','plan-requirements-heading');
 add('review','resources','Measure Mana and Spirit','Free-text notes are not a resource budget. Sustain and reservation are not calculated by this check.','Record actual reservation, available Spirit, triggered costs and Mana recovery during sustained use.','plan-note-resources');
 const latest=plan.tests.at(-1),scoped=latest&&plan.loadout&&plan.skillSetup&&equipmentMatches(latest.loadout,plan.loadout)&&skillSetupMatches(latest.skillSetup,plan.skillSetup);
 add('review','game-test',!latest?'First in-game test needed':!scoped?'Retest this setup':'Personal test scope',!latest?plan.source.firstTest:!scoped?'The latest personal test does not record both current equipment and skill groups.':'Latest result: '+latest.outcome+' · patch '+latest.patch+' · '+latest.target+'. A personal result does not clear source conflicts or other checks.',!latest||!scoped?'Run the source test with this setup and record the actual patch, target and observations.':'Repeat on your actual patch and content; use the recorded limitations and source stop condition.','plan-test-patch');
 return result(findings,false);
}
function result(findings,paused){
 const counts={conflict:0,missing:0,review:0};for(const f of findings)counts[f.level]++;
 const ordered=['conflict','missing','review'].flatMap(level=>findings.filter(f=>f.level===level));
 return {paused,counts,findings:ordered,next:ordered[0]||null};
}
