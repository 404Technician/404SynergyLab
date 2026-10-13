import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateReferenceCatalog, referenceEntries, resolveReference } from '../src/reference-catalog.mjs';
import { discover } from '../src/discovery.mjs';
const full=JSON.parse(readFileSync(new URL('../data/catalog/pob-bb52d6b-full-catalog1.json',import.meta.url)));
const discovery=JSON.parse(readFileSync(new URL('../data/discovery/catalog.json',import.meta.url)));
const snapshot=JSON.parse(readFileSync(new URL('../data/snapshots/'+discovery.snapshotId+'.json',import.meta.url)));
test('all imported references have provenance and source availability stays unverified',()=>{
 validateReferenceCatalog(full);assert.deepEqual(full.counts,{skill:399,support:567,unique:443});
 assert.equal(full.coverage.gemDeclarations,967);assert.equal(full.coverage.gemRecords,966);assert.equal(full.coverage.gemOverrides.length,1);
 assert.equal(full.coverage.staticUniques,435);assert.equal(full.coverage.generatedUniques,8);
 assert.ok(full.entries.every(e=>e.availability==='unverified'));
});
test('catalog lookup exposes previously unavailable skills and item skills',()=>{
 const unearth=resolveReference(full,'skill','unearth');assert.equal(unearth.reviewedId,'unearth');
 assert.ok(referenceEntries(full,'skill','Mirror of Refraction').length);
 assert.ok(referenceEntries(full,'skill','essence drain').length);
 assert.equal(snapshot.entities.some(e=>e.name==='Essence Drain'),false);
});
test('all unique categories and generated families remain discoverable',()=>{
 assert.ok(referenceEntries(full,'unique',"Atziri's Rule",'staff').length);
 for(const name of ['Against the Darkness','From Nothing','Prism of Belief','Megalomaniac','Flesh Crucible','Grip of Kulemak','Heart of the Well','Loreweave'])assert.equal(referenceEntries(full,'unique',name).some(e=>e.generated),true);
 assert.equal(referenceEntries(full,'unique','certainly not an item').length,0);
 assert.ok(referenceEntries(full,'unique','','helmet').every(e=>e.category==='helmet'));
});
test('support-first discovery reuses source-backed recipes',()=>{
 const reference=resolveReference(full,'support','living-lightning');
 const ideas=discover(snapshot,discovery,{kind:'support',id:reference.reviewedId}).ideas;
 assert.deepEqual(ideas.map(e=>e.id),['living-lightning-arrow']);
});
test('duplicates, wrong coverage and missing provenance are rejected',()=>{
 const duplicate=structuredClone(full);duplicate.entries.push(duplicate.entries[0]);assert.throws(()=>validateReferenceCatalog(duplicate),/entry/);
 const missing=structuredClone(full);missing.entries[0].evidence.path='not-a-source';assert.throws(()=>validateReferenceCatalog(missing),/evidence/);
 const wrong=structuredClone(full);wrong.counts.unique--;assert.throws(()=>validateReferenceCatalog(wrong),/count/);
});
