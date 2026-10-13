import { extractRecord } from './pob-import.mjs';
import { checksum } from './data.mjs';
import { validateTypeExpression } from './type-expression.mjs';

// Discovery metadata stays separate from the base-effect/workbench importer.
// No Lua is executed and minion attack types never become player skill types.
export function readDiscoveryEntity(source, selection, revision) {
  if (!source.includes('Skill data (c) Grinding Gear Games')) throw new Error('Missing discovery source notice');
  const record=extractRecord(source,selection.effectId);
  const field=(key,optional=false)=>{
    const matches=[...record.text.matchAll(new RegExp('^\\t'+key+' = (.+),\\r?$','gm'))];
    if(optional && !matches.length)return null;
    if(matches.length!==1)throw new Error('Invalid discovery field: '+key);
    return matches[0][1];
  };
  const bool=key=>{const value=field(key,true);if(value===null)return false;if(!['true','false'].includes(value))throw new Error('Unsupported discovery boolean');return value==='true';};
  const typeSet=(key,optional=false)=>{
    const literal=field(key,optional);if(literal===null)return [];
    if(!/^\{\s*(?:\[SkillType\.[A-Za-z][A-Za-z0-9_]*\] = true,\s*)+\}$/.test(literal))throw new Error('Unsupported discovery type set');
    return [...new Set([...literal.matchAll(/SkillType\.([A-Za-z][A-Za-z0-9_]*)/g)].map(m=>m[1]))];
  };
  const expression=key=>{
    const literal=field(key);
    if(!/^\{\s*(?:SkillType\.[A-Za-z][A-Za-z0-9_]*,\s*)*\}$/.test(literal))throw new Error('Unsupported discovery expression');
    const tokens=[...literal.matchAll(/SkillType\.([A-Za-z][A-Za-z0-9_]*)/g)].map(m=>m[1]);validateTypeExpression(tokens);return tokens;
  };
  const name=field('name');if(!/^"[^"\\]*"$/.test(name))throw new Error('Unsupported discovery name');
  const entity={id:selection.id,name:JSON.parse(name),kind:selection.kind,tags:[],sourceIds:['pob-skills'],reviewScope:'discovery-only',
    evidence:{effectId:selection.effectId,path:selection.path,line:record.line,fileSha256:checksum(source),recordSha256:checksum(record.text),descriptionSha256:checksum(field('description')),
      url:'https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/blob/'+revision+'/'+selection.path+'#L'+record.line}};
  if(selection.kind==='skill') {
    entity.skillTypes=typeSet('skillTypes');entity.minionSkillTypes=typeSet('minionSkillTypes',true);entity.cannotBeSupported=bool('cannotBeSupported');
  } else if(selection.kind==='support') {
    if(!bool('support'))throw new Error('Discovery record is not a support');
    const needsContext=['isTrigger','supportGemsOnly','ignoreMinionTypes','fromItem','legacy'].some(bool)||expression('addSkillTypes').length>0;
    entity.compatibility={status:needsContext?'unknown':'known',requiredTypes:expression('requireSkillTypes'),excludedTypes:expression('excludeSkillTypes'),...(needsContext?{note:'Additional support context is not simulated; verify the final setup in game.'}:{})};
    entity.warnings=[];
  } else throw new Error('Invalid discovery record kind');
  return entity;
}

export function verifyDiscoveryEntity(source,entity,revision) {
  const observed=readDiscoveryEntity(source,{...entity,effectId:entity.evidence.effectId,path:entity.evidence.path},revision);
  for(const key of ['name','kind','evidence',...(entity.kind==='skill'?['skillTypes','minionSkillTypes','cannotBeSupported','reviewScope']:['compatibility'])]) {
    if(JSON.stringify(observed[key])!==JSON.stringify(entity[key]))throw new Error('Discovery source mismatch: '+entity.id+' / '+key);
  }
}
