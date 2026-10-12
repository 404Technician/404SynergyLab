import { checksum, validateSnapshot } from './data.mjs';
export function verifyAudit(snapshot, bytes, audit) {
  validateSnapshot(snapshot);
  if (audit?.schemaVersion !== 1 || audit.snapshotId !== snapshot.id || audit.snapshotSha256 !== checksum(bytes)) throw new Error('Audit snapshot binding mismatch');
  if (!Array.isArray(audit.records) || audit.records.length !== snapshot.entities.length+(snapshot.items ?? []).length) throw new Error('Audit must cover every entity');
  const seen=new Set();
  for (const record of audit.records) {
    const entity=[...snapshot.entities,...(snapshot.items ?? [])].find(e=>e.id===record.entityId);
    if (!entity || seen.has(record.entityId)) throw new Error('Unknown or duplicate audit entity');
    seen.add(record.entityId);
    const expectedFields=entity.conversion ? ['conversion'] : entity.kind === 'skill' ? ['skillTypes'] : ['requiredTypes','excludedTypes'];
    if (JSON.stringify(record.fields) !== JSON.stringify(expectedFields)) throw new Error('Unexpected audit fields');
    const facts={};
    for (const field of expectedFields) facts[field]=entity.conversion || entity.kind === 'skill' ? entity[field] : entity.compatibility[field];
    if (record.result !== 'corroborated' || record.observedSha256 !== checksum(JSON.stringify(facts)) || !/^https:\/\/poe2db\.tw\/us\//.test(record.sourceUrl)) throw new Error(`Audit field mismatch: ${entity.id}`);
  }
  return {corroborated:seen.size,patchStatus:snapshot.patchValidation.status,method:audit.method,unresolved:audit.unresolved};
}
