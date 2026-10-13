import { checksum } from './data.mjs';
import { validateTypeExpression } from './type-expression.mjs';
import { validateMechanics } from './mechanics.mjs';
export function buildMechanics(reference,files) {
 const effects=new Map(),itemBlocks=new Map();
 for(const source of reference.sources) {
  const text=files[source.path];
  if(typeof text!=='string'||checksum(text)!==source.sha256)throw new Error('Mechanic source fingerprint mismatch');
  if(source.path.includes('/Skills/')){
   const starts=[...text.matchAll(/^skills\["([A-Za-z0-9_]+)"\] = \{/gm)];
   starts.forEach((m,i)=>effects.set(m[1],{text:text.slice(m.index,starts[i+1]?.index??text.length),path:source.path,line:text.slice(0,m.index).split('\n').length}));
  }
  if(source.path.includes('/Uniques/'))for(const m of text.matchAll(/\[\[\r?\n([\s\S]*?)\]\]/g))itemBlocks.set(source.path+':'+checksum(m[1]),m[1]);
 }
 const profiles=reference.entries.map(entry=>{
  const profile={id:entry.id,kind:entry.kind,status:'structured',mechanics:[],unknowns:[]};
  if(entry.kind==='unique'){
   if(entry.generated){profile.status='catalog-only';profile.unknowns.push('Generated modifiers are not expanded.');return profile;}
   const block=itemBlocks.get(entry.evidence.path+':'+entry.evidence.recordSha256);if(!block)throw new Error('Missing unique mechanic record');
   block.split(/\r?\n/).forEach((raw,index)=>{
    const variants=[...raw.matchAll(/\{variant:([0-9,]+)\}/g)].flatMap(m=>m[1].split(',').map(Number));
    const line=raw.replace(/^(?:\{[^}]+\})+/,'');
    const evidence={path:entry.evidence.path,line:entry.evidence.line+index+1,lineSha256:checksum(raw),url:entry.evidence.url.replace(/#L[0-9]+$/,'#L'+(entry.evidence.line+index+1))};
    const conversion=line.match(/^(\d+)% of (Physical|Fire|Cold|Lightning|Chaos|Elemental) Damage Converted to (Physical|Fire|Cold|Lightning|Chaos) Damage$/);
    if(conversion)profile.mechanics.push({kind:'conversion',scope:'player',percent:Number(conversion[1]),from:conversion[2],to:conversion[3],variants,evidence});
    const grant=line.match(/^Grants Skill: (?:Level (?:\([0-9-]+\)|[0-9]+) )?(.+)$/);
    if(grant)profile.mechanics.push({kind:'grant',skillName:grant[1],variants,evidence});
    const trigger=line.match(/^Trigger (.+) Skill (on .+)$/);
    if(trigger)profile.mechanics.push({kind:'trigger',skillName:trigger[1],event:trigger[2],requiresCritical:trigger[2]==='on Critical Hit',variants,evidence});
   });
   profile.status=profile.mechanics.length?'partial':'catalog-only';
   profile.unknowns.push('Only recognized conversion, granted-skill and trigger lines are interpreted; remaining modifiers are unmodeled.');
   return profile;
  }
  const record=effects.get(entry.effectId);if(!record)throw new Error('Missing mechanic effect');
  profile.evidence={path:record.path,line:record.line,recordSha256:checksum(record.text),url:'https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/'+reference.sourceRevision+'/'+record.path+'#L'+record.line};
  const field=key=>record.text.match(new RegExp('^\\t'+key+' = (.+),$','m'))?.[1];
  const types=key=>{
   const literal=field(key);if(!literal)return [];
   if(!/^\{\s*(?:\[SkillType\.[A-Za-z][A-Za-z0-9_]*\] = true,\s*)+\}$/.test(literal))throw new Error('Unsupported mechanic skill types');
   return [...new Set([...literal.matchAll(/SkillType\.([A-Za-z][A-Za-z0-9_]*)/g)].map(m=>m[1]))];
  };
  const expression=key=>{
   const literal=field(key);
   if(!literal||!/^\{\s*(?:SkillType\.[A-Za-z][A-Za-z0-9_]*,\s*)*\}$/.test(literal))throw new Error('Unsupported mechanic support predicate');
   const result=[...literal.matchAll(/SkillType\.([A-Za-z][A-Za-z0-9_]*)/g)].map(m=>m[1]);validateTypeExpression(result);return result;
  };
  const bool=key=>{const value=field(key);if(value!==undefined&&!['true','false'].includes(value))throw new Error('Unsupported mechanic boolean');return value==='true';};
  if(entry.kind==='skill'){
   profile.skillTypes=types('skillTypes');profile.minionTypes=types('minionSkillTypes');profile.cannotBeSupported=bool('cannotBeSupported');
   profile.minionContext=profile.minionTypes.length>0||profile.skillTypes.includes('Minion');
   profile.damageHints=profile.skillTypes.filter(t=>['Physical','Fire','Cold','Lightning','Chaos'].includes(t));
   profile.unknowns.push('Skill types are not proof of outgoing damage, hit frequency, ailment application or resource feasibility.');
  }else{
   profile.requiredTypes=expression('requireSkillTypes');profile.excludedTypes=expression('excludeSkillTypes');
   profile.addedTypes=expression('addSkillTypes');
   profile.warnings=[];
   if(record.text.includes('"deal_no_elemental_damage"'))profile.warnings.push('Source records an elemental-damage restriction; verify the affected skill or actor.');
   if(record.text.includes('"base_deal_no_chaos_damage"'))profile.warnings.push('Source records a Chaos-damage restriction; verify the affected skill or actor.');
   if(record.text.includes('"global_cannot_crit"'))profile.warnings.push('Source records a critical-hit restriction; recheck any critical-hit generator.');
   profile.contextFlags=['isTrigger','supportGemsOnly','ignoreMinionTypes','fromItem','legacy'].filter(bool);
   if(profile.addedTypes.length)profile.contextFlags.push('addsSkillTypes');
   profile.unknowns.push('Only base-effect predicates are checked; final support interactions and behavior require verification.');
  }
  return profile;
 });
 const coverage={skills:profiles.filter(p=>p.kind==='skill').length,supports:profiles.filter(p=>p.kind==='support').length,uniques:profiles.filter(p=>p.kind==='unique').length,
  recognizedUniques:profiles.filter(p=>p.kind==='unique'&&p.mechanics.length).length,
  catalogOnlyUniques:profiles.filter(p=>p.kind==='unique'&&!p.mechanics.length).length,
  conversions:profiles.flatMap(p=>p.mechanics).filter(m=>m.kind==='conversion').length,
  grants:profiles.flatMap(p=>p.mechanics).filter(m=>m.kind==='grant').length,
  triggers:profiles.flatMap(p=>p.mechanics).filter(m=>m.kind==='trigger').length};
 return validateMechanics(reference,{schemaVersion:1,id:'pob-'+reference.sourceRevision.slice(0,7)+'-mechanics1',rulesVersion:'mechanic-links-1',status:'candidate',referenceId:reference.id,sourceRevision:reference.sourceRevision,coverage,profiles});
}
