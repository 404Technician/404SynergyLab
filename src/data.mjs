import { validateSnapshot } from './validation.mjs';
export { validateSnapshot } from './validation.mjs';
import { createHash } from 'node:crypto';
export const checksum = bytes => createHash('sha256').update(bytes).digest('hex');
const require = (condition, message) => { if (!condition) throw new Error(message); };
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
