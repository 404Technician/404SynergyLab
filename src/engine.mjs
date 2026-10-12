import { validateSnapshot } from './data.mjs';
export function analyze(snapshot, skillId) {
  validateSnapshot(snapshot);
  if (snapshot.rulesVersion !== "tag-compatibility-1") throw new Error("Unsupported engine rules version");
  const skill = snapshot.entities.find(e => e.id === skillId && e.kind === 'skill');
  if (!skill) throw new Error(`Unknown skill: ${skillId}`);
  return {
    snapshotId:snapshot.id, league:snapshot.league, patch:snapshot.patch,
    rulesVersion:snapshot.rulesVersion, dataStatus:snapshot.status,
    disclaimer:'Tag compatibility only. No DPS ranking or complete build validation.',
    skill:skill.name,
    results:snapshot.entities.filter(e => e.kind === 'support').map(support => {
      const c = support.compatibility;
      if (c.status === 'unknown') return {id:support.id,name:support.name,status:'unknown',reason:'Compatibility requires verification.',sourceIds:support.sourceIds};
      const missing = c.all.filter(t => !skill.tags.includes(t));
      const anyMissing = c.any.length > 0 && !c.any.some(t => skill.tags.includes(t));
      const excluded = c.none.filter(t => skill.tags.includes(t));
      const reasons = [...missing.map(t => `Requires ${t}.`), ...(anyMissing ? [`Requires one of: ${c.any.join(', ')}.`] : []), ...excluded.map(t => `Excludes ${t}.`)];
      return {id:support.id,name:support.name,status:reasons.length ? 'incompatible' : 'compatible',reason:reasons.join(' ') || 'Matches the recorded tag conditions; other restrictions may still apply.',sourceIds:support.sourceIds};
    })
  };
}
