export const chainDiscoveryVersion = 'chain-discovery-1';

// Enumerate bounded experiments using the same checks as the manual workbench.
// No event confirmation is inherited from a different generator or suggestion.
export function createChainDiscovery(reference, explorer, data) {
  const entries = new Map(reference.entries.map(entry => [entry.id, entry]));
  const generatorIds = new Set(explorer.generators.map(entry => entry.id));
  const payoffIds = new Set(explorer.payoffs.map(entry => entry.id));
  const itemIds = new Set(explorer.items.map(entry => entry.id));
  const triggers = new Map(data.rules.map(rule => [rule.id, rule.event]));
  const remapperId = data.remapper.id;
  const converters = explorer.items.filter(entry => entry.id !== remapperId);
  const configurations = [
    {itemId: null, remap: false},
    ...explorer.items.map(entry => ({itemId: entry.id, remap: false})),
    ...converters.map(entry => ({itemId: entry.id, remap: true})),
  ];
  let cachedKey, cached;

  return function discover(anchorId, options = {}) {
    const anchor = entries.get(anchorId);
    if (!anchor) throw new Error('Unknown chain discovery anchor');
    const {
      payoffId = 'comet', generatorSupportId = null, payoffSupportId = null,
      noElementalDamage = false, noChaosDamage = false, noCriticalHits = false,
      status = 'potential', event = 'all', query = '', offset = 0, limit = 12,
    } = options;
    if (!payoffIds.has(payoffId)) throw new Error('Unavailable discovery payoff');
    if (!['potential', 'all', 'blocked', 'needs-input'].includes(status) ||
        !['all', 'ailment', 'critical', 'minion-death'].includes(event) ||
        typeof query !== 'string' || query.length > 300 ||
        !Number.isInteger(offset) || offset < 0 || !Number.isInteger(limit) || limit < 1 || limit > 100)
      throw new Error('Invalid chain discovery filters');
    for (const id of [generatorSupportId, payoffSupportId])
      if (id && entries.get(id)?.kind !== 'support') throw new Error('Unknown discovery support');
    if ([noElementalDamage, noChaosDamage, noCriticalHits].some(value => typeof value !== 'boolean'))
      throw new Error('Invalid chain discovery scenario');

    const context = {noElementalDamage, noChaosDamage, noCriticalHits};
    const key = JSON.stringify([anchorId, payoffId, generatorSupportId, payoffSupportId, context]);
    if (key !== cachedKey) {
      let generators = explorer.generators, selectedPayoff = payoffId, routes = configurations;
      let role = 'unmodeled';
      if (generatorIds.has(anchorId)) { generators = [anchor]; role = 'generator'; }
      else if (triggers.has(anchorId)) role = 'trigger';
      else if (payoffIds.has(anchorId)) { selectedPayoff = anchorId; role = 'payoff'; }
      else if (itemIds.has(anchorId)) {
        role = 'item';
        routes = configurations.filter(route => route.itemId === anchorId ||
          (anchorId === remapperId && route.remap));
      } else if (anchor.kind === 'support') role = 'support';

      const proposals = [], seen = new Set();
      if (role !== 'unmodeled') for (const generator of generators) for (const route of routes) {
        const assignments = role === 'support' ? [
          {generatorSupportId: anchorId, payoffSupportId, anchorRole: 'generator-support'},
          {generatorSupportId, payoffSupportId: anchorId, anchorRole: 'payoff-support'},
        ] : [{generatorSupportId, payoffSupportId, anchorRole: role}];
        for (const assignment of assignments) {
          const {anchorRole, ...supports} = assignment;
          const input = {generatorId: generator.id, payoffId: selectedPayoff, ...route, ...supports, confirmedEvents: []};
          for (const chain of explorer.explore({...input, ...context}).chains) {
            if (role === 'trigger' && chain.triggerId !== anchorId) continue;
            // A selected item must appear in the actual path, not only its input.
            if (role === 'item' && !chain.itemIds.includes(anchorId)) continue;
            const id = JSON.stringify([chain.id, supports.generatorSupportId, supports.payoffSupportId, anchorRole]);
            if (seen.has(id)) continue;
            seen.add(id);
            const names = [entries.get(chain.generatorId).name,
              ...chain.itemIds.map(id => entries.get(id).name),
              entries.get(chain.triggerId).name, entries.get(chain.payoffId).name];
            const supportNames = Object.values(supports).filter(Boolean).map(id => entries.get(id).name);
            proposals.push({...chain, id, input: {...input, focusEvent: chain.event}, anchorRole,
              title: names.join(' → '),
              searchText: [...names, ...supportNames, ...chain.steps, anchorRole].join(' ').toLowerCase()});
          }
        }
      }
      // Alphabetical browsing is not a ranking of damage or build viability.
      proposals.sort((a, b) => a.title.localeCompare(b.title, 'en') || a.id.localeCompare(b.id, 'en'));
      cached = {role, selectedPayoff, proposals}; cachedKey = key;
    }
    const search = query.trim().toLowerCase();
    const matched = cached.proposals.filter(proposal =>
      (status === 'all' || (status === 'potential' ? proposal.status !== 'blocked' : proposal.status === status)) &&
      (event === 'all' || proposal.event === event) && (!search || proposal.searchText.includes(search)));
    return {
      anchorId, anchorRole: cached.role, payoffId: cached.selectedPayoff,
      version: chainDiscoveryVersion, total: cached.proposals.length,
      blocked: cached.proposals.filter(proposal => proposal.status === 'blocked').length,
      matched: matched.length, proposals: matched.slice(offset, offset + limit),
      hasMore: offset + limit < matched.length, limits: data.limits,
    };
  };
}
