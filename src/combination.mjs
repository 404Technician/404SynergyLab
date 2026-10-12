import { analyze } from './engine.mjs';
import { validateSnapshot } from './validation.mjs';

export function validateCombination(snapshot, selection) {
  validateSnapshot(snapshot);
  const fail=message=>{throw new Error(message);};
  if(!selection || selection.version!==1 || !Array.isArray(selection.skillIds) || !selection.supports || typeof selection.supports!=='object' || Array.isArray(selection.supports)) fail('Invalid combination format');
  if(new Set(selection.skillIds).size!==selection.skillIds.length) fail('Duplicate selected skill');
  for(const id of selection.skillIds) if(!snapshot.entities.some(e=>e.kind==='skill' && e.id===id)) fail('Unknown selected skill');
  for(const [id,supports] of Object.entries(selection.supports)) {
    if(!selection.skillIds.includes(id) || !Array.isArray(supports) || new Set(supports).size!==supports.length) fail('Invalid support assignment');
    for(const supportId of supports) if(!snapshot.entities.some(e=>e.kind==='support' && e.id===supportId)) fail('Unknown selected support');
  }
  if(selection.itemId!==null && !(snapshot.items ?? []).some(i=>i.id===selection.itemId)) fail('Unknown selected unique');
  return selection;
}
export function analyzeCombination(snapshot,selection,context={}) {
  validateCombination(snapshot,selection);
  const selected=selection.skillIds.map(id=>snapshot.entities.find(e=>e.id===id));
  const checks=new Map(selected.map(skill=>[skill.id,analyze(snapshot,skill.id,context)]));
  const assignments=[],findings=[];
  const add=(level,code,message,skillId=null)=>findings.push({level,code,message,skillId});
  for(const skill of selected) {
    for(const supportId of selection.supports[skill.id] ?? []) {
      const check=checks.get(skill.id).results.find(r=>r.id===supportId);
      assignments.push({skillId:skill.id,skillName:skill.name,...check});
      if(check.status==='incompatible') add('conflict','support-incompatible',check.name+' does not match '+skill.name+' in the recorded base-effect check.',skill.id);
      if(check.status==='unknown') add('needs-input','support-unknown',check.name+' on '+skill.name+' requires more context.',skill.id);
      for(const warning of check.warnings ?? []) add('caution','support-tradeoff',skill.name+' + '+check.name+': '+warning,skill.id);
    }
  }
  const usableSupport=(skillId,supportId)=>assignments.some(a=>a.skillId===skillId && a.id===supportId && a.status==='compatible');
  const connections=snapshot.interactions.filter(rule=>rule.skillIds.some(id=>selection.skillIds.includes(id))).map(rule=>{
    const missingSkillIds=rule.skillIds.filter(id=>!selection.skillIds.includes(id));
    let status=missingSkillIds.length?'missing-skill':checks.get(rule.skillIds[0]).interactions.find(r=>r.id===rule.id).status;
    const extraConditions=[];
    if(!missingSkillIds.length && rule.kind==='trigger' && status!=='blocked') {
      const generators=selected.filter(s=>!rule.skillIds.includes(s.id) && !s.skillTypes.includes('Meta') && (s.skillTypes.includes('Damage') || s.skillTypes.includes('Attack')));
      const crit=rule.id==='crit-comet';
      const candidates=generators.filter(s=>crit ? !usableSupport(s.id,'controlled-destruction') : !usableSupport(s.id,'brutality-1') && s.skillTypes.some(t=>['Fire','Cold','Lightning'].includes(t)));
      if(!generators.length) {status='needs-input';extraConditions.push('Add a separate Energy-generating skill. Manual and socketed copies of the same skill are not modeled.');}
      else if(!candidates.length && crit && generators.every(s=>usableSupport(s.id,'controlled-destruction'))) {status='blocked';extraConditions.push('Controlled Destruction prevents critical hits on every selected generator candidate.');}
      else if(!candidates.length) {status='needs-input';extraConditions.push('No suitable generator candidate is represented by the selected source fields. Other damage sources require manual verification.');}
      else extraConditions.push('Potential generator candidates: '+candidates.map(s=>s.name).join(', ')+'. Verify actual qualifying hits or ailments; type labels do not prove Energy generation.');
    }
    if(status==='blocked') add('conflict','connection-blocked',rule.skillIds.map(id=>snapshot.entities.find(e=>e.id===id).name).join(' + ')+': pathway blocked within the declared selection/context.');
    if(status==='needs-input') add('needs-input','generator-needed',rule.skillIds.map(id=>snapshot.entities.find(e=>e.id===id).name).join(' + ')+': Energy generation needs another check.');
    return {...rule,status,missingSkillIds,extraConditions};
  });
  const item=selection.itemId?(snapshot.items ?? []).find(i=>i.id===selection.itemId):null;
  const uniqueIdeas=item?(snapshot.uniqueIdeas ?? []).filter(i=>i.itemId===item.id && selection.skillIds.includes(i.skillId)):[];
  if(item) {
    add('caution','conversion-context',item.name+' converts '+item.conversion.from+' damage to '+item.conversion.to+'. Skill types stay unchanged; recheck the ailment plan.');
    if(!uniqueIdeas.length) add('needs-input','unique-unreviewed','No reviewed item direction is recorded for the selected skills. This is not proof that the item has no effect.');
    for(const skill of selected.filter(s=>!s.skillTypes.includes('Meta'))) if(usableSupport(skill.id,'brutality-1') && skill.skillTypes.includes(item.conversion.from))
      add('conflict','conversion-brutality',skill.name+': the unique produces Cold damage while assigned Brutality removes elemental damage. Remaining damage is not calculated.',skill.id);
  }
  return {snapshotId:snapshot.id,rulesVersion:'combination-checks-1',dataStatus:snapshot.status,selection,assignments,connections,item,uniqueIdeas,findings,
    summary:{skills:selected.length,supports:assignments.length,conflicts:findings.filter(f=>f.level==='conflict').length,needsInput:findings.filter(f=>f.level==='needs-input').length},
    limits:'Partial source-backed checks only. No DPS, trigger rate, resource, socket, support-family, weapon, or complete build validation.'};
}
