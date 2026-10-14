export function validateExperimentDetails(reference, data) {
  if (data?.schemaVersion !== 1 || data.id !== 'pob-bb52d6b-details1' || data.referenceId !== reference.id || data.sourceRevision !== reference.sourceRevision)
    throw new Error('Experiment details version mismatch');
  const expected = reference.entries.filter(e => ['unique', 'support'].includes(e.kind) || ['gas-arrow', 'flame-wall', 'cast-on-critical'].includes(e.id));
  if (!Array.isArray(data.entries) || data.entries.length !== expected.length) throw new Error('Incomplete experiment details');
  const seen = new Set();
  for (const item of data.entries) {
    const source = expected.find(e => e.id === item.id);
    if (!source || seen.has(item.id) || source.kind !== item.kind || item.evidence?.recordSha256 !== (source.effectEvidence || source.evidence).recordSha256)
      throw new Error('Invalid experiment detail provenance');
    seen.add(item.id);
    if (item.kind === 'unique') {
      if (item.generated !== source.generated || !Array.isArray(item.modifiers) || !item.modifiers.every(m => typeof m.text === 'string' && Array.isArray(m.variants) && m.variants.every(v => typeof v === 'string')))
        throw new Error('Invalid unique modifier details');
    } else if (!((item.descriptionStatus === 'recorded' && typeof item.description === 'string' && item.description.length) || (item.descriptionStatus === 'missing' && item.description === null))) throw new Error('Missing source description');
  }
  if (data.gasArrow?.cloudHits !== false || !data.gasArrow.evidenceUrls?.every(url => /^https:\/\//.test(url))) throw new Error('Invalid Gas Arrow review');
  if (!Array.isArray(data.critNotes) || data.critNotes.length !== 4) throw new Error('Invalid critical review');
  return data;
}

// These are observations from one setup and target, not stats inferred from tags.
export function validateCritTest(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid crit test');
  const keys = ['hitsPerSecond', 'critChance', 'energyPerCrit', 'energyRequired', 'manaPerTrigger', 'manaPerSecond'];
  for (const [key, value] of Object.entries(input)) {
    if (!keys.includes(key) || typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > (key === 'critChance' ? 100 : 1e6) || (value > 0 && value < 1e-6) || (key === 'energyRequired' && value === 0))
      throw new Error('Invalid crit test value');
  }
  return input;
}

export function assessCriticalCadence(input = {}) {
  validateCritTest(input);
  const required = ['hitsPerSecond', 'critChance', 'energyPerCrit', 'energyRequired'];
  const missing = required.filter(key => input[key] === undefined);
  if (missing.length) return {status: 'needs-input', missing};
  const criticalHitsPerSecond = input.hitsPerSecond * input.critChance / 100;
  const energyPerSecond = criticalHitsPerSecond * input.energyPerCrit;
  const castsPerSecond = energyPerSecond / input.energyRequired;
  const fillSeconds = energyPerSecond ? input.energyRequired / energyPerSecond : null;
  const manaDemand = input.manaPerTrigger === undefined ? null : castsPerSecond * input.manaPerTrigger;
  const manaShortfall = manaDemand !== null && input.manaPerSecond !== undefined ? Math.max(0, manaDemand - input.manaPerSecond) : null;
  return {status: energyPerSecond ? 'estimate' : 'no-energy', criticalHitsPerSecond, energyPerSecond, castsPerSecond, fillSeconds, manaDemand, manaShortfall};
}
