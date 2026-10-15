// Explicit interactions use exact source records, rather than shared damage tags.
export function validateSkillCombos(reference, data) {
  if (data?.schemaVersion !== 1 || data.id !== 'pob-bb52d6b-skill-combos1' || data.referenceId !== reference.id || data.sourceRevision !== reference.sourceRevision || data.status !== 'candidate') throw new Error('Skill combinations version mismatch');
  const entries = new Map(reference.entries.map(e => [e.id, e])), sources = new Map();
  const text = value => typeof value === 'string' && value.trim().length > 0;
  const list = value => Array.isArray(value) && value.length > 0 && value.every(text);
  if (!Array.isArray(data.sources) || !Array.isArray(data.recipes)) throw new Error('Missing skill combination records');
  for (const source of data.sources) {
    const entry = entries.get(source.id), evidence = entry?.effectEvidence || entry?.evidence;
    if (entry?.kind !== 'skill' || entry.legacy || sources.has(source.id) || !text(source.description) || JSON.stringify(source.evidence) !== JSON.stringify(evidence)) throw new Error('Invalid skill combination provenance');
    sources.set(source.id, source);
  }
  const ids = new Set();
  for (const recipe of data.recipes) {
    if (!text(recipe.id) || ids.has(recipe.id) || !Array.isArray(recipe.skillIds) || recipe.skillIds.length < 2 || new Set(recipe.skillIds).size !== recipe.skillIds.length || recipe.skillIds.some(id => !sources.has(id))) throw new Error('Invalid skill combination members');
    ids.add(recipe.id);
    if (!['title', 'hook', 'mechanics', 'evidenceStatus'].every(k => text(recipe[k])) || !['play', 'conditions', 'avoid'].every(k => list(recipe[k]))) throw new Error('Missing skill combination explanation');
    const plan = recipe.buildPlan;
    if (!plan || !['playstyle', 'firstTest', 'stopIf'].every(k => text(plan[k])) || !['components', 'nextChecks'].every(k => list(plan[k]))) throw new Error('Missing skill combination test plan');
    const urls = recipe.skillIds.map(id => sources.get(id).evidence.url);
    if (JSON.stringify(recipe.evidenceUrls) !== JSON.stringify(urls) || urls.some(url => !/^https:\/\//.test(url))) throw new Error('Invalid skill combination evidence');
    if (recipe.item !== null || !Array.isArray(recipe.supportIdeas) || recipe.supportIdeas.length) throw new Error('Skill combinations must not invent item or support roles');
  }
  return data;
}

export function discoverSkillCombos(reference, data, anchorId) {
  const entry = reference.entries.find(e => e.id === anchorId);
  if (!entry) throw new Error('Unknown skill combination starting point');
  if (entry.kind !== 'skill') return [];
  return data.recipes.filter(r => r.skillIds.includes(anchorId)).map(r => ({...r, skills: r.skillIds.map(id => reference.entries.find(e => e.id === id))}));
}

export function skillComboCoverage(reference, data, curated) {
  const ids = new Set([...data.recipes.flatMap(r => r.skillIds), ...curated.recipes.flatMap(r => r.skillIds)]);
  const covered = reference.entries.filter(e => e.kind === 'skill' && ids.has(e.id));
  return {recipes: data.recipes.length + curated.recipes.length, skills: covered.length, totalSkills: reference.counts.skill};
}
