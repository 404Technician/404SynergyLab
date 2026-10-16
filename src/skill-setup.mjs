import {checkSupportTypes} from './mechanics.mjs';
export const skillRoles={base:'Base skill effect',triggered:'Intended triggered spell'};
export const supportCheckLabels={compatible:'Base types match',incompatible:'Source types do not match',unknown:'Context required'};
const str=(v,max)=>typeof v==='string'&&v.length<=max;
const strings=(v,max=50)=>Array.isArray(v)&&v.length<=max&&v.every(x=>str(x,5000));
function need(ok,message){if(!ok)throw new Error(message);}
export function validateSkillSetup(setup){
 need(setup&&str(setup.stamp,2000)&&setup.stamp&&Array.isArray(setup.groups)&&setup.groups.length<=12,'Invalid skill setup (maximum 12 groups).');
 const ids=new Set();
 for(const group of setup.groups){
  const s=group.skill;need(s&&str(s.id,400)&&s.id&&!ids.has(s.id)&&str(s.name,200)&&str(s.description,10000)&&strings(s.types)&&str(s.weaponRequirements,1000)&&typeof s.fromItem==='boolean'&&/^https:\/\//.test(s.evidenceUrl)&&Object.hasOwn(skillRoles,group.role),'Invalid saved skill group.');ids.add(s.id);
  need(Array.isArray(group.supports)&&group.supports.length<=8&&new Set(group.supports.map(x=>x.id)).size===group.supports.length,'Invalid or duplicate supports in a group.');
  for(const p of group.supports)need(str(p.id,400)&&p.id&&str(p.name,200)&&str(p.description,10000)&&Object.hasOwn(supportCheckLabels,p.status)&&str(p.reason,5000)&&strings(p.warnings)&&/^https:\/\//.test(p.evidenceUrl),'Invalid saved support check.');
 }
 return setup;
}
export function createSkillSetup(specs,{reference,profiles,reviews,details,stamp}){
 need(Array.isArray(specs)&&specs.length<=12,'Select at most 12 skill groups.');
 const groups=specs.map(spec=>{
  const record=reference.get(spec.skillId),profile=profiles.get(spec.skillId),review=reviews.get(spec.skillId);need(record?.kind==='skill'&&profile&&review,'Unknown skill source.');
  need(Object.hasOwn(skillRoles,spec.role)&&Array.isArray(spec.supportIds)&&spec.supportIds.length<=8,'Invalid skill role or support list.');
  const target=spec.role==='triggered'?{...profile,skillTypes:[...profile.skillTypes,'Triggered']}:profile;
  return {skill:{id:record.id,name:record.name,description:review.description||'No skill description recorded in this source.',types:[...profile.skillTypes],weaponRequirements:record.weaponRequirements||'',fromItem:review.fromItem,evidenceUrl:(record.effectEvidence||record.evidence).url},role:spec.role,supports:spec.supportIds.map(id=>{const support=reference.get(id),p=profiles.get(id);need(support?.kind==='support'&&p,'Unknown support source.');return {id,name:support.name,description:details.get(id)?.description||'No support description recorded in this source.',...checkSupportTypes(target,p),evidenceUrl:support.evidence.url};})};
 });
 return validateSkillSetup({stamp,groups});
}
export function skillSetupSpecs(setup){validateSkillSetup(setup);return setup.groups.map(g=>({skillId:g.skill.id,role:g.role,supportIds:g.supports.map(s=>s.id)}));}
export function skillSetupMatches(saved,current){return !!current&&JSON.stringify(saved)===JSON.stringify(current);}
export function analyzeSkillSetup(setup,requiredIds=[]){
 validateSkillSetup(setup);const checks=setup.groups.flatMap(g=>g.supports),missing=requiredIds.filter(id=>!setup.groups.some(g=>g.skill.id===id));
 return {conflicts:checks.filter(s=>s.status==='incompatible').length,context:checks.filter(s=>s.status==='unknown').length,matches:checks.filter(s=>s.status==='compatible').length,missing};
}
export function skillTestScope(test,setup){if(!test?.skillSetup)return 'Skill groups were not recorded for this test.';return skillSetupMatches(test.skillSetup,setup)?'Recorded skill groups match this planned setup.':'This test used different skill groups. Repeat it for the current setup.';}
