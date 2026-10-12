import { matchesTypeExpression, describeTypeExpression } from './type-expression.mjs';
import { validateSnapshot } from './validation.mjs';
export function analyze(snapshot, skillId, context={}) {
  if (!context || typeof context !== 'object' || (context.sidewaysCascade !== undefined && typeof context.sidewaysCascade !== 'boolean')) throw new Error('Invalid interaction context');
  validateSnapshot(snapshot);
  if (!["tag-compatibility-1", "pob-skill-types-1"].includes(snapshot.rulesVersion)) throw new Error("Unsupported engine rules version");
  const skill = snapshot.entities.find(e => e.id === skillId && e.kind === 'skill');
  if (!skill) throw new Error(`Unknown skill: ${skillId}`);
  return {
    snapshotId:snapshot.id, league:snapshot.league, patch:snapshot.patch,
    rulesVersion:snapshot.rulesVersion, dataStatus:snapshot.status,
    disclaimer:snapshot.schemaVersion === 2 ? 'Source skill-type compatibility for the base effect only. Candidate data is not verified for the target patch. No DPS ranking, socket, resource, minion, or complete build validation.' : 'Tag compatibility only. No DPS ranking or complete build validation.',
    ...(snapshot.schemaVersion === 2 ? {patchValidation:snapshot.patchValidation.status,skillTypes:skill.skillTypes,interactions:snapshot.interactions.filter(r=>r.skillIds.includes(skillId)).map(r=>({...r,status:(r.restrictions ?? []).some(x=>context[x.contextFlag] === true) ? 'blocked' : 'conditional'})),evidenceUrl:skill.evidence.url} : {}),
    skill:skill.name,
    results:snapshot.entities.filter(e => e.kind === 'support').map(support => {
      const c = support.compatibility;
      if (snapshot.schemaVersion === 2) return analyzeSourceSupport(skill,support);
      if (c.status === 'unknown') return {id:support.id,name:support.name,status:'unknown',reason:'Compatibility requires verification.',sourceIds:support.sourceIds};
      const missing = c.all.filter(t => !skill.tags.includes(t));
      const anyMissing = c.any.length > 0 && !c.any.some(t => skill.tags.includes(t));
      const excluded = c.none.filter(t => skill.tags.includes(t));
      const reasons = [...missing.map(t => `Requires ${t}.`), ...(anyMissing ? [`Requires one of: ${c.any.join(', ')}.`] : []), ...excluded.map(t => `Excludes ${t}.`)];
      return {id:support.id,name:support.name,status:reasons.length ? 'incompatible' : 'compatible',reason:reasons.join(' ') || 'Matches the recorded tag conditions; other restrictions may still apply.',sourceIds:support.sourceIds};
    })
  };
}

function analyzeSourceSupport(skill,support) {
  const c=support.compatibility;
  const base={id:support.id,name:support.name,sourceIds:support.sourceIds,evidenceUrl:support.evidence.url,warnings:support.warnings};
  if (skill.cannotBeSupported) return {...base,status:'incompatible',reason:'Source marks this skill as unable to receive supports.'};
  if (c.status === 'unknown') return {...base,status:'unknown',reason:c.note || 'Context requires verification.'};
  const required=describeTypeExpression(c.requiredTypes), excluded=describeTypeExpression(c.excludedTypes);
  if (c.excludedTypes.length && matchesTypeExpression(c.excludedTypes,skill.skillTypes)) return {...base,status:'incompatible',reason:`Excluded by source rule: ${excluded}.`};
  if (c.requiredTypes.length && !matchesTypeExpression(c.requiredTypes,skill.skillTypes)) return {...base,status:'incompatible',reason:`Does not satisfy source rule: ${required}.`};
  return {...base,status:'compatible',reason:`Matches source rule: ${required}. Only the recorded base-effect types were checked.`};
}
