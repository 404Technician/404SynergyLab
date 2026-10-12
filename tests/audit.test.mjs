import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { analyze } from '../src/engine.mjs';
import { verifyAudit } from '../src/audit.mjs';
import { checksum } from '../src/data.mjs';
const bytes=readFileSync(new URL('../data/snapshots/pob-bb52d6b-review1.json',import.meta.url));
const snapshot=JSON.parse(bytes);
const audit=JSON.parse(readFileSync(new URL('../data/audits/pob-bb52d6b-review1.json',import.meta.url)));
test('cross-check binds all 16 factual records without declaring patch confirmed',()=>{
 const r=verifyAudit(snapshot,bytes,audit);assert.equal(r.corroborated,16);assert.equal(r.patchStatus,'pending');assert.ok(r.unresolved.length);
});
test('snapshot replacement invalidates audit even when the id stays the same',()=>{
 assert.throws(()=>verifyAudit(snapshot,Buffer.concat([bytes,Buffer.from(' ')]),audit),/binding/);
});
test('missing records and false observed values invalidate stored cross-check',()=>{
 const missing=structuredClone(audit);missing.records.pop();assert.throws(()=>verifyAudit(snapshot,bytes,missing),/every entity/);
 const changed=structuredClone(snapshot);changed.entities[0].skillTypes.push('FakeType');
 const changedBytes=JSON.stringify(changed);const bound=structuredClone(audit);bound.snapshotSha256=checksum(changedBytes);
 assert.throws(()=>verifyAudit(changed,changedBytes,bound),/field mismatch/);
});
test('official sideways cascade restriction blocks Ice Nova interaction in either direction',()=>{
 for(const skill of ['ice-nova','frostbolt']) {
  const normal=analyze(snapshot,skill).interactions[0];assert.equal(normal.status,'conditional');assert.match(normal.condition,/does not apply while cascading sideways/);
  const blocked=analyze(snapshot,skill,{sidewaysCascade:true}).interactions[0];assert.equal(blocked.status,'blocked');
  assert.equal(blocked.restrictions[0].sourceIds[0],'ggg-050-restriction');
 }
 assert.throws(()=>analyze(snapshot,'ice-nova',{sidewaysCascade:'true'}),/Invalid interaction context/);
});
