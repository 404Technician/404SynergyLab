import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { analyze } from '../src/engine.mjs';
import { validateSnapshot, diffSnapshots, activationRecord, checksum } from '../src/data.mjs';
const fixture = JSON.parse(readFileSync(new URL('../data/snapshots/fixture-v1.json',import.meta.url)));
const copy = () => structuredClone(fixture);
test('projectile spell matches projectile and excludes attack support', () => {
 const r = analyze(fixture,'demo-projectile');
 assert.equal(r.dataStatus,'fixture');
 assert.deepEqual(r.results.map(x => x.status),['compatible','incompatible','compatible','unknown']);
 assert.match(r.results[1].reason,/Requires attack/); assert.match(r.results[1].reason,/Excludes spell/);
});
test('attack skill and OR conditions', () => assert.deepEqual(analyze(fixture,'demo-strike').results.map(x=>x.status),['incompatible','compatible','compatible','unknown']));
test('unknown skill rejected', () => assert.throws(()=>analyze(fixture,'missing'),/Unknown skill/));
test('duplicate ids and broken provenance rejected', () => {
 const a=copy(); a.entities.push(a.entities[0]); assert.throws(()=>validateSnapshot(a),/Duplicate/);
 const b=copy(); b.entities[0].sourceIds=['missing']; assert.throws(()=>validateSnapshot(b),/Unknown source/);
});
test('missing predicates never imply compatibility', () => {
 const a=copy(); delete a.entities[2].compatibility.all; assert.throws(()=>validateSnapshot(a),/predicate/);
 const b=copy(); b.entities[2].compatibility.all=[]; assert.throws(()=>validateSnapshot(b),/Empty/);
});
test('diff reports additions removals changes and rule changes', () => {
 const a=copy(); a.id='fixture-v2'; a.rulesVersion='tag-compatibility-2'; a.entities.shift(); a.entities[0].tags.push('fire'); a.entities.push({...a.entities[0],id:'new'});
 assert.deepEqual(diffSnapshots(fixture,a),{from:'fixture-v1',to:'fixture-v2',rulesChanged:true,added:['new'],removed:['demo-projectile'],changed:['demo-strike']});
});
test('fixtures and unreviewed candidates cannot activate', () => {
 assert.throws(()=>activationRecord(fixture,JSON.stringify(fixture),true),/Only verified/);
 const a=copy(); a.status='verified'; assert.throws(()=>validateSnapshot(a),/Unreviewed/);
});
test('activation requires passing tests and binds exact bytes', () => {
 const a=copy(); a.status='verified'; a.sources[0].revision='reviewed-test-revision'; a.review={by:'test-reviewer',at:'2026-10-12T00:00:00Z',notes:'Synthetic test only'};
 const bytes=JSON.stringify(a);
 assert.throws(()=>activationRecord(a,bytes,false),/tests/);
 assert.throws(()=>activationRecord(a,JSON.stringify(fixture),true),/mismatch/);
 assert.equal(activationRecord(a,bytes,true).sha256,checksum(bytes));
});

test("unsupported rule version cannot produce results", () => { const a=copy(); a.rulesVersion="future-rules"; assert.throws(()=>analyze(a,"demo-projectile"), /Unsupported engine/); });
