import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createChainExplorer} from '../src/chains.mjs';
import {createChainDiscovery, chainDiscoveryVersion} from '../src/chain-discovery.mjs';
const json = path => JSON.parse(readFileSync(new URL('../' + path, import.meta.url)));
const reference = json('data/catalog/pob-bb52d6b-full-catalog1.json');
const mechanics = json('data/mechanics/pob-bb52d6b-mechanics1.json');
const data = json('data/chains/pob-bb52d6b-chains1.json');
const explorer = createChainExplorer(reference, mechanics, data);
const discover = createChainDiscovery(reference, explorer, data);

test('a generator anchor discovers direct and remapped paths without unrelated conversions', () => {
  const view = discover('frostbolt', {limit: 100});
  assert.equal(view.anchorRole, 'generator');
  assert.ok(view.proposals.length > 3);
  assert.ok(view.proposals.every(p => p.generatorId === 'frostbolt'));
  assert.ok(view.proposals.some(p => p.itemIds.includes('the-three-dragons')));
  assert.ok(view.proposals.some(p => p.event === 'critical' && !p.itemIds.length));
  assert.ok(view.proposals.every(p => !p.itemIds.includes('blueflame-bracers')));
});

test('a unique anchor participates in every route and can be paired with the remapping helmet', () => {
  const view = discover('blueflame-bracers', {limit: 100, status: 'all'});
  assert.equal(view.anchorRole, 'item');
  assert.ok(view.proposals.every(p => p.itemIds.includes('blueflame-bracers')));
  const fireball = view.proposals.find(p => p.generatorId === 'fireball' && p.input.remap);
  assert.ok(fireball);
  assert.match(fireball.steps.join(' '), /Fire → Cold.*Three Dragons.*Actual Ignite/);
  assert.deepEqual(fireball.input.confirmedEvents, []);
});

test('remapper anchor includes compatible converters, never minion conversion', () => {
  const view = discover('the-three-dragons', {query: 'Fireball', status: 'all', limit: 100});
  assert.ok(view.proposals.some(p => p.itemIds.length === 2));
  assert.ok(view.proposals.every(p => p.itemIds.includes('the-three-dragons')));
  assert.ok(view.proposals.every(p => p.event === 'ailment'));
});

test('meta trigger anchor only discovers its actual event and persistent generator candidates', () => {
  const view = discover('cast-on-minion-death', {limit: 100});
  assert.equal(view.total, data.persistent.length);
  assert.ok(view.proposals.every(p => p.event === 'minion-death' && p.triggerId === 'cast-on-minion-death'));
  assert.ok(view.proposals.every(p => data.persistent.some(record => record.id === p.generatorId)));
});

test('support anchor evaluates generator and payoff roles separately', () => {
  const view = discover('controlled-destruction', {status: 'all', query: 'Spark', event: 'critical', limit: 100});
  assert.equal(view.proposals.length, 2);
  assert.equal(view.proposals.find(p => p.anchorRole === 'generator-support').status, 'blocked');
  assert.equal(view.proposals.find(p => p.anchorRole === 'payoff-support').status, 'needs-input');
  for (const proposal of view.proposals) {
    assert.ok([proposal.input.generatorSupportId, proposal.input.payoffSupportId].includes('controlled-destruction'));
    assert.equal(explorer.explore(proposal.input).chains.find(p => p.id.startsWith(proposal.generatorId) && p.event === proposal.event).status, proposal.status);
  }
});

test('unmodeled catalog items produce an explicit empty result', () => {
  const item = reference.entries.find(e => e.name === 'Ab Aeterno');
  assert.ok(item);
  const view = discover(item.id);
  assert.equal(view.anchorRole, 'unmodeled');
  assert.equal(view.total, 0);
  assert.deepEqual(view.proposals, []);
});

test('a payoff-only skill remains the selected socketed spell', () => {
  const view = discover('unearth', {limit: 100});
  assert.equal(view.anchorRole, 'payoff');
  assert.equal(view.payoffId, 'unearth');
  assert.ok(view.proposals.every(p => p.payoffId === 'unearth'));
  const blocked = discover('unearth', {status: 'blocked', event: 'minion-death', limit: 100});
  assert.equal(blocked.matched, data.persistent.length);
  assert.ok(blocked.proposals.every(p => p.reasons.some(reason => reason.includes('socket predicates'))));
});

test('pagination is stable and disjoint and filters keep excluded counts visible', () => {
  const first = discover('the-three-dragons', {limit: 8});
  const second = discover('the-three-dragons', {limit: 8, offset: 8});
  assert.ok(first.hasMore);
  assert.equal(first.matched, second.matched);
  assert.ok(second.proposals.every(p => !first.proposals.some(previous => previous.id === p.id)));
  assert.deepEqual(discover('the-three-dragons', {limit: 8}).proposals, first.proposals);
  assert.ok(first.blocked > 0);
  assert.ok(first.proposals.every(p => p.status === 'needs-input'));
});

test('changing the scenario or assigned support cannot reuse stale cached eligibility', () => {
  assert.equal(discover('spark', {event: 'critical'}).matched, 1);
  assert.equal(discover('spark', {event: 'critical', noCriticalHits: true}).matched, 0);
  assert.equal(discover('spark', {event: 'critical', generatorSupportId: 'controlled-destruction'}).matched, 0);
  assert.equal(discover('spark', {event: 'critical', payoffSupportId: 'controlled-destruction'}).matched, 1);
});

test('all suggestions are unconfirmed and are reproducible in the same workbench', () => {
  const view = discover('blueflame-bracers', {limit: 100});
  assert.equal(view.version, chainDiscoveryVersion);
  for (const proposal of view.proposals) {
    assert.equal(proposal.status, 'needs-input');
    assert.deepEqual(proposal.input.confirmedEvents, []);
    const matching = explorer.explore(proposal.input).chains.find(chain =>
      chain.event === proposal.event && JSON.stringify(chain.steps) === JSON.stringify(proposal.steps));
    assert.ok(matching);
    assert.equal(matching.status, proposal.status);
  }
});

test('invalid discovery selections and filters fail closed', () => {
  assert.throws(() => discover('missing'), /Unknown chain discovery anchor/);
  for (const options of [{limit: 0}, {limit: 101}, {offset: -1}, {status: 'verified'}, {event: 'hit'}, {query: 'a'.repeat(301)}, {noCriticalHits: 1}])
    assert.throws(() => discover('spark', options), /Invalid chain discovery/);
  assert.throws(() => discover('spark', {payoffId: 'lightning-arrow'}), /Unavailable discovery payoff/);
  assert.throws(() => discover('spark', {generatorSupportId: 'comet'}), /Unknown discovery support/);
});
