import { checksum, validateSnapshot } from './data.mjs';
import { matchesTypeExpression, validateTypeExpression } from './type-expression.mjs';
// This is a deliberately narrow reader for generated, single-line metadata.
// It never evaluates Lua and stops when the selected record changes format.
export function extractRecord(source, effectId) {
  const starts = [...source.matchAll(/^skills\["([A-Za-z0-9_]+)"\] = \{/gm)];
  const index = starts.findIndex(m => m[1] === effectId);
  if (index < 0 || starts.filter(m => m[1] === effectId).length !== 1) throw new Error(`Missing or duplicate record ${effectId}`);
  const start=starts[index].index;
  return {text:source.slice(start,starts[index+1]?.index ?? source.length),line:source.slice(0,start).split('\n').length};
}
function lineField(record, key, optional=false) {
  const matches=[...record.matchAll(new RegExp(`^\\t${key} = (.+),\\r?$`,'gm'))];
  if (matches.length === 0 && optional) return null;
  if (matches.length !== 1) throw new Error(`Missing or repeated metadata field ${key}`);
  return matches[0][1];
}
function booleanField(record,key,optional=true) {
  const literal=lineField(record,key,optional);
  if (literal === null) return false;
  if (!['true','false'].includes(literal)) throw new Error(`Unsupported boolean field ${key}`);
  return literal === 'true';
}
function expression(record,key) {
  const literal=lineField(record,key);
  if (!/^\{\s*(?:SkillType\.[A-Za-z][A-Za-z0-9_]*,\s*)*\}$/.test(literal)) throw new Error(`Unsupported ${key} syntax`);
  const tokens=[...literal.matchAll(/SkillType\.([A-Za-z][A-Za-z0-9_]*)/g)].map(m=>m[1]);
  validateTypeExpression(tokens); return tokens;
}
function types(record) {
  const literal=lineField(record,'skillTypes');
  if (!/^\{\s*(?:\[SkillType\.[A-Za-z][A-Za-z0-9_]*\] = true,\s*)+\}$/.test(literal)) throw new Error('Unsupported skillTypes syntax');
  return [...literal.matchAll(/SkillType\.([A-Za-z][A-Za-z0-9_]*)/g)].map(m=>m[1]);
}
export function buildPobSnapshot(manifest, files) {
  if (manifest.status !== 'candidate' || !/^[a-f0-9]{40}$/.test(manifest.revision)) throw new Error('Import requires candidate status and pinned commit');
  const selected=new Map();
  const entities=manifest.records.map(selection => {
    const source=files[selection.path];
    if (typeof source !== 'string' || !source.includes('Skill data (c) Grinding Gear Games')) throw new Error(`Missing generated source notice: ${selection.path}`);
    const record=extractRecord(source,selection.effectId); selected.set(selection.effectId,record);
    const nameLiteral=lineField(record.text,'name');
    if (!/^"[^"\\]*"$/.test(nameLiteral)) throw new Error('Unsupported name syntax');
    const entity={id:selection.id,name:JSON.parse(nameLiteral),kind:selection.kind,tags:[],sourceIds:['pob-skills'],
      evidence:{effectId:selection.effectId,path:selection.path,line:record.line,fileSha256:checksum(source),recordSha256:checksum(record.text),
        url:`https://github.com/${manifest.repository}/blob/${manifest.revision}/${selection.path}#L${record.line}`}};
    if (entity.kind === 'skill') {
      entity.skillTypes=types(record.text);
      entity.cannotBeSupported=booleanField(record.text,'cannotBeSupported');
      if (/^\t(?:minionSkillTypes|summonSkill) = /m.test(record.text)) throw new Error('Minion mechanics are out of scope');
    } else {
      if (lineField(record.text,'support') !== 'true') throw new Error('Selected record is not a support');
      entity.compatibility={status:'known',requiredTypes:expression(record.text,'requireSkillTypes'),excludedTypes:expression(record.text,'excludeSkillTypes')};
      const specialFields=['isTrigger','supportGemsOnly','ignoreMinionTypes','fromItem','legacy'];
      const additions=expression(record.text,'addSkillTypes');
      if (specialFields.some(key => booleanField(record.text,key)) || additions.length) {
        entity.compatibility.status='unknown'; entity.compatibility.note='Support requires context outside the initial source type checker.';
      }
      entity.warnings=[];
      if (/"global_cannot_crit"/.test(record.text)) entity.warnings.push('Prevents critical hits. Type compatibility does not establish a good build choice.');
      if (/"deal_no_elemental_damage"/.test(record.text)) entity.warnings.push('Disables elemental damage. This can undermine elemental skills despite matching their types.');
      if (/"base_deal_no_chaos_damage"/.test(record.text)) entity.warnings.push('Disables chaos damage.');
    }
    return entity;
  });
  const interactions=manifest.interactions.map(rule => {
    const record=selected.get(rule.effectId);
    const description=record && lineField(record.text,'description');
    if (!description || (rule.requiredDescriptionFragments && !rule.requiredDescriptionFragments.every(fragment=>description.includes(fragment))) || (rule.descriptionSha256 && checksum(description) !== rule.descriptionSha256)) throw new Error(`Interaction evidence changed: ${rule.id}`);

    const evidenceUrls=[];
    for(const extra of rule.additionalEvidence ?? []) {
      const source=files[extra.path]; if(!source) throw new Error('Missing additional evidence file');
      const other=extractRecord(source,extra.effectId);
      if(checksum(lineField(other.text,'description')) !== extra.descriptionSha256) throw new Error('Additional interaction evidence changed');
      evidenceUrls.push(`https://github.com/${manifest.repository}/blob/${manifest.revision}/${extra.path}#L${other.line}`);
    }
    if(rule.triggerCheck) {
      const check=rule.triggerCheck, support=extractRecord(files[check.path],check.effectId);
      const socketed=entities.find(e=>e.id===check.socketedSkillId && e.kind==='skill');
      if(!socketed || !matchesTypeExpression(expression(support.text,'requireSkillTypes'),socketed.skillTypes) || matchesTypeExpression(expression(support.text,'excludeSkillTypes'),socketed.skillTypes)) throw new Error('Trigger socket type check failed');
      evidenceUrls.push(`https://github.com/${manifest.repository}/blob/${manifest.revision}/${check.path}#L${support.line}`);
    }
    const entity=entities.find(e=>e.evidence.effectId===rule.effectId);
    return {id:rule.id,skillIds:rule.skillIds,explanation:rule.explanation,condition:rule.condition,sourceIds:['pob-skills'],evidenceUrl:entity.evidence.url, ...(rule.restrictions ? {restrictions:rule.restrictions} : {}), ...(rule.kind ? {kind:rule.kind} : {}), ...(evidenceUrls.length ? {evidenceUrls} : {})};
  });

  const items=(manifest.uniqueRecords ?? []).map(selection => {
    const source=files[selection.path];
    if(!source?.includes('Item data (c) Grinding Gear Games')) throw new Error('Missing unique item source notice');
    const blocks=[...source.matchAll(/\[\[\r?\n([\s\S]*?)\]\]/g)].filter(m=>m[1].split(/\r?\n/)[0]===selection.name);
    const parsed=selection.requiredLine.match(/^(\d+)% of (Fire|Lightning) Damage Converted to (Cold) Damage$/);
    if(blocks.length!==1 || !blocks[0][1].split(/\r?\n/).includes(selection.requiredLine) || !parsed || Number(parsed[1])!==selection.conversion.percent || parsed[2]!==selection.conversion.from || parsed[3]!==selection.conversion.to) throw new Error('Unique conversion evidence changed');
    const line=source.slice(0,blocks[0].index).split('\n').length;
    return {id:selection.id,name:selection.name,conversion:selection.conversion,sourceIds:['pob-items'],evidence:{path:selection.path,line,fileSha256:checksum(source),recordSha256:checksum(blocks[0][1]),url:`https://github.com/${manifest.repository}/blob/${manifest.revision}/${selection.path}#L${line}`}};
  });
  return validateSnapshot({schemaVersion:2,id:manifest.id,league:manifest.league,patch:manifest.patch,rulesVersion:manifest.rulesVersion,status:'candidate',
    patchValidation:manifest.patchValidation,importerVersion:manifest.uniqueRecords ? 'pob-metadata-3' : manifest.curatedSources ? 'pob-metadata-2' : 'pob-metadata-1',sources:[{id:'pob-skills',url:`https://github.com/${manifest.repository}`,revision:manifest.revision,
      license:'PoB software: MIT notice retained in THIRD_PARTY_NOTICES.md. Underlying skill facts: (c) Grinding Gear Games; not relicensed by this project.',retrievedAt:manifest.retrievedAt}, ...(manifest.curatedSources ?? []), ...(items.length ? [{id:'pob-items',url:`https://github.com/${manifest.repository}`,revision:manifest.revision,retrievedAt:manifest.retrievedAt,license:'Selected factual conversion modifiers; underlying item data (c) Grinding Gear Games.'}] : [])],entities,interactions, ...(items.length ? {items,uniqueIdeas:manifest.uniqueIdeas} : {})});
}
