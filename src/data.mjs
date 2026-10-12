import { validateTypeExpression } from './type-expression.mjs';
import { createHash } from 'node:crypto';
export const checksum = bytes => createHash('sha256').update(bytes).digest('hex');
const require = (condition, message) => { if (!condition) throw new Error(message); };
const text = x => typeof x === 'string' && x.trim().length > 0;
const strings = x => Array.isArray(x) && x.every(text) && new Set(x).size === x.length;
export function validateSnapshot(s) {
  require([1,2].includes(s?.schemaVersion), 'Unsupported schema version');
  for (const k of ['id','league','patch','rulesVersion']) require(text(s[k]), `Missing ${k}`);
  require(['fixture','candidate','verified'].includes(s.status), 'Invalid status');
  require(Array.isArray(s.sources) && s.sources.length > 0, 'Missing sources');
  const sourceIds = new Set();
  for (const source of s.sources) {
    require(text(source.id) && !sourceIds.has(source.id), 'Duplicate or missing source id');
    sourceIds.add(source.id);
    for (const k of ['url','revision','license','retrievedAt']) require(text(source[k]), `Missing source ${k}`);
    require(Number.isFinite(Date.parse(source.retrievedAt)), 'Invalid retrieval date');
    require(/^https:\/\//.test(source.url), 'Source must use HTTPS');
  }
  require(Array.isArray(s.entities) && s.entities.length > 0, 'Missing entities');
  const ids = new Set();
  for (const e of s.entities) {
    require(text(e.id) && !ids.has(e.id), 'Duplicate or missing entity id'); ids.add(e.id);
    require(text(e.name) && ['skill','support'].includes(e.kind), 'Invalid entity');
    require(strings(e.tags) && strings(e.sourceIds) && e.sourceIds.length > 0, 'Invalid tags or sources');
    require(e.sourceIds.every(id => sourceIds.has(id)), 'Unknown source');
    if (s.schemaVersion === 2) {
      require(s.rulesVersion === 'pob-skill-types-1', 'Invalid source engine version');
      require(e.evidence && text(e.evidence.effectId) && /^https:\/\//.test(e.evidence.url), 'Missing record evidence');
      require(Number.isInteger(e.evidence.line) && e.evidence.line > 0 && text(e.evidence.path) && /^[a-f0-9]{64}$/.test(e.evidence.fileSha256) && /^[a-f0-9]{64}$/.test(e.evidence.recordSha256), 'Invalid record provenance');
      if (e.kind === 'skill') {
        require(strings(e.skillTypes) && e.skillTypes.length > 0 && e.skillTypes.every(t=>/^[A-Za-z][A-Za-z0-9_]*$/.test(t) && !['AND','OR','NOT'].includes(t)), 'Missing skill types');
        require(typeof e.cannotBeSupported === 'boolean', 'Missing supportability');
      } else {
        require(e.compatibility && ['known','unknown'].includes(e.compatibility.status), 'Missing compatibility status');
        validateTypeExpression(e.compatibility.requiredTypes);
        validateTypeExpression(e.compatibility.excludedTypes);
        require(strings(e.warnings), 'Invalid warnings');
      }
    }
    if (e.kind === 'support' && s.schemaVersion === 1) {
      require(e.compatibility && ['known','unknown'].includes(e.compatibility.status), 'Missing compatibility status');
      for (const key of ['all','any','none']) require(strings(e.compatibility[key]), 'Invalid compatibility predicate');
      if (e.compatibility.status === 'known') require(e.compatibility.all.length + e.compatibility.any.length + e.compatibility.none.length > 0, 'Empty compatibility rule');
    }
  }
  if (s.schemaVersion === 2) {
    require(s.patchValidation && ['pending','confirmed'].includes(s.patchValidation.status), 'Missing patch validation');
    require(text(s.patchValidation.notes) && /^https:\/\//.test(s.patchValidation.officialPatchUrl), 'Missing patch evidence');
    require(Array.isArray(s.interactions), 'Missing interactions');
    const interactionIds = new Set();
    for (const rule of s.interactions) {
      require(text(rule.id) && !interactionIds.has(rule.id), 'Duplicate interaction'); interactionIds.add(rule.id);
      require(strings(rule.skillIds) && rule.skillIds.length >= 2 && rule.skillIds.every(id => s.entities.some(e => e.id === id && e.kind === 'skill')), 'Invalid interaction skills');
      require(text(rule.explanation) && text(rule.condition) && /^https:\/\//.test(rule.evidenceUrl), 'Missing interaction evidence');
      require(strings(rule.sourceIds) && rule.sourceIds.length > 0 && rule.sourceIds.every(id=>sourceIds.has(id)), 'Invalid interaction source');
    }
  }
  if (s.status === 'verified') {
    if (s.schemaVersion === 2) require(s.patchValidation.status === 'confirmed', 'Patch validation required before activation');
    require(s.sources.every(x => x.revision !== 'fixture' && x.license !== 'unreviewed'), 'Unreviewed source');
    require(s.review && text(s.review.by) && text(s.review.notes) && Number.isFinite(Date.parse(s.review.at)), 'Missing review');
  }
  return s;
}
export function diffSnapshots(old, next) {
  validateSnapshot(old); validateSnapshot(next);
  const a = new Map(old.entities.map(e => [e.id,e]));
  const b = new Map(next.entities.map(e => [e.id,e]));
  const canonical = x => Array.isArray(x) ? x.map(canonical) : x && typeof x === 'object' ? Object.fromEntries(Object.keys(x).sort().map(k => [k,canonical(x[k])])) : x;
  return {from:old.id,to:next.id, rulesChanged:old.rulesVersion !== next.rulesVersion,
    ...(old.schemaVersion === 2 || next.schemaVersion === 2 ? {interactionsChanged:JSON.stringify(canonical(old.interactions ?? [])) !== JSON.stringify(canonical(next.interactions ?? [])),patchValidationChanged:JSON.stringify(canonical(old.patchValidation ?? null)) !== JSON.stringify(canonical(next.patchValidation ?? null))} : {}),
    added:[...b.keys()].filter(id => !a.has(id)), removed:[...a.keys()].filter(id => !b.has(id)),
    changed:[...b.keys()].filter(id => a.has(id) && JSON.stringify(canonical(a.get(id))) !== JSON.stringify(canonical(b.get(id))))};
}
export function activationRecord(snapshot, bytes, testsPassed) {
  validateSnapshot(snapshot);
  require(checksum(bytes) === checksum(JSON.stringify(snapshot)) || JSON.stringify(JSON.parse(bytes)) === JSON.stringify(snapshot), 'Snapshot bytes mismatch');
  require(snapshot.status === 'verified', 'Only verified data can become active');
  require(testsPassed === true, 'Regression tests must pass before activation');
  return {snapshotId:snapshot.id,sha256:checksum(bytes),rulesVersion:snapshot.rulesVersion};
}
