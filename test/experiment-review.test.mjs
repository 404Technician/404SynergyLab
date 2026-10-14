import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateExperimentDetails, validateCritTest, assessCriticalCadence} from '../src/experiment-details.mjs';
import {discover} from '../src/discovery.mjs';
const json = path => JSON.parse(readFileSync(new URL('../' + path, import.meta.url)));
const reference = json('data/catalog/pob-bb52d6b-full-catalog1.json');
const data = json('data/research/pob-bb52d6b-details1.json');
const catalog = json('data/discovery/catalog.json');
const snapshot = json('data/snapshots/' + catalog.snapshotId + '.json');

test('all unique and support records have source-bound details, including missing descriptions', () => {
  validateExperimentDetails(reference, data);
  assert.equal(data.entries.filter(e => e.kind === 'unique').length, 443);
  assert.equal(data.entries.filter(e => e.kind === 'support').length, 567);
  const missing = data.entries.filter(e => e.descriptionStatus === 'missing');
  assert.ok(missing.length > 0);
  assert.ok(missing.every(e => e.description === null));
});
test('Presence ignition variants preserve the actual current and legacy values', () => {
  const item = reference.entries.find(e => e.name === 'Radiant Grief');
  const details = data.entries.find(e => e.id === item.id);
  assert.ok(details.modifiers.some(m => m.variants.includes('Current') && m.text.includes('200 Base Fire Damage')));
  assert.ok(details.modifiers.some(m => m.variants.includes('Pre 0.5.0') && m.text.includes('100 Base Fire Damage')));
  const ideas = discover(snapshot, catalog, {kind: 'unique', id: item.id}).ideas;
  assert.equal(ideas.length, 1);
  assert.deepEqual(ideas[0].skillIds, ['gas-arrow']);
  assert.match(ideas[0].conditions.join(' '), /helmet slot/);
});
test('Gas Arrow has direct ignition concepts without inventing a cloud crit generator', () => {
  const ideas = discover(snapshot, catalog, {kind: 'skill', id: 'gas-arrow'}).ideas;
  assert.ok(ideas.some(e => e.id === 'gas-arrow-radiant-grief'));
  assert.ok(ideas.some(e => e.id === 'gas-arrow-flame-wall'));
  assert.equal(data.gasArrow.cloudHits, false);
  assert.match(data.gasArrow.critical, /Do not count poison applications as critical hits/);
  assert.match(ideas.find(e => e.id === 'gas-arrow-flame-wall').conditions.join(' '), /actually Ignited/);
});
test('Ambush is scoped to full-life targets and Arjun is described as a crossbow support', () => {
  const ambush = reference.entries.find(e => e.name === 'Ambush'), arjun = reference.entries.find(e => e.name === "Arjun's Medal");
  assert.match(data.entries.find(e => e.id === ambush.id).description, /on full life/);
  assert.match(data.entries.find(e => e.id === arjun.id).description, /Supports Crossbow Skills/);
  assert.equal(data.entries.find(e => e.id === arjun.id).kind, 'support');
});
test('missing observations do not become an effectiveness verdict', () => {
  assert.deepEqual(assessCriticalCadence({}), {status: 'needs-input', missing: ['hitsPerSecond', 'critChance', 'energyPerCrit', 'energyRequired']});
  assert.equal(assessCriticalCadence({hitsPerSecond: 20, critChance: 80}).status, 'needs-input');
});
test('critical cadence uses qualifying hit rate, target crit chance and actual Energy threshold', () => {
  const result = assessCriticalCadence({hitsPerSecond: 4, critChance: 25, energyPerCrit: 10, energyRequired: 100});
  assert.equal(result.status, 'estimate');
  assert.equal(result.criticalHitsPerSecond, 1);
  assert.equal(result.energyPerSecond, 10);
  assert.equal(result.fillSeconds, 10);
  assert.equal(result.castsPerSecond, 0.1);
  assert.equal(result.manaDemand, null);
});
test('Mana shortfall is based on triggered-spell cost and never silently includes source cost', () => {
  const base = {hitsPerSecond: 4, critChance: 25, energyPerCrit: 10, energyRequired: 100, manaPerTrigger: 100};
  assert.equal(assessCriticalCadence({...base, manaPerSecond: 5}).manaShortfall, 5);
  assert.equal(assessCriticalCadence({...base, manaPerSecond: 12}).manaShortfall, 0);
  assert.equal(assessCriticalCadence(base).manaShortfall, null);
});
test('zero hits, crit chance or Energy yields no Energy and never Infinity', () => {
  const base = {hitsPerSecond: 4, critChance: 25, energyPerCrit: 10, energyRequired: 100};
  for (const key of ['hitsPerSecond', 'critChance', 'energyPerCrit']) {
    const result = assessCriticalCadence({...base, [key]: 0});
    assert.equal(result.status, 'no-energy'); assert.equal(result.fillSeconds, null); assert.equal(result.castsPerSecond, 0);
  }
});
test('unbounded, malformed and impossible crit inputs fail closed', () => {
  for (const input of [null, [], {hitsPerSecond: Infinity}, {hitsPerSecond: NaN}, {energyRequired: 0}, {critChance: 101}, {critChance: -1}, {energyPerCrit: '10'}, {projectilesFired: 20}, {hitsPerSecond: 1e-100}])
    assert.throws(() => validateCritTest(input), /Invalid crit test/);
});
test('details reject different snapshots, missing records and altered record provenance', () => {
  for (const mutate of [d => d.referenceId = 'other', d => d.entries.pop(), d => d.entries[0].evidence.recordSha256 = '0'.repeat(64), d => d.gasArrow.cloudHits = true]) {
    const copy = structuredClone(data); mutate(copy); assert.throws(() => validateExperimentDetails(reference, copy));
  }
});
