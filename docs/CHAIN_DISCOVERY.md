# Automatic chain discovery

Research-backed ideas are the default main view. Automatic candidates are available in the optional **Explore trigger candidates** panel. The catalog selector is an entry point to generated chain experiments, rather than requiring the user to choose all of the intermediate pieces manually. This feature introduces no additional game-mechanic assumptions: every proposal is evaluated by the same source-backed engine used by the manual workbench.

## Starting-point roles

| Selected source | Modeled role | What is searched |
| --- | --- | --- |
| Eligible player damage or persistent-minion generator | Generator | Direct event paths, modeled conversions, and optional Three Dragons remapping |
| One of the three modeled meta gems | Trigger | Eligible generators for that specific event |
| Socketable spell that is not an eligible generator | Payoff | Generator and item paths leading to that socketed spell |
| Modeled conversion unique | Equipped item | Generators with a qualifying component, with or without Three Dragons |
| The Three Dragons | Remapping helmet | Direct remapping and modeled converter/remapper pairs |
| Support | Generator support or payoff support | Two explicit role assignments, checked independently |
| Any other source | Unmodeled | No invented chain; the missing role is reported |

When a skill qualifies as both generator and payoff, generator is the starting-point role. To investigate it as a payoff, choose it in the workbench's socketed-payoff selector and use a different starting point. A catalog record cannot silently be omitted from a suggestion.

## Bounded search

For the selected payoff, the search enumerates the existing 84 generator candidates and 14 item configurations: no item, one of the seven modeled conversion/remapping uniques, or one of the six converters plus The Three Dragons. Generator or unique anchors narrow this search. Source predicates, ownership restrictions and event gates remain those described in [the chain research](CHAINS.md).

The 68 possible socketed spells can be explored through the payoff selector; the interface does not enumerate every payoff simultaneously. It also does not enumerate arbitrary rare modifiers, every unique modifier, several simultaneous supports, passive trees, resources, DPS or recursive trigger feedback. The full catalog remains larger than the modeled chain coverage.

Support and scenario selections affect every proposal. A support starting point replaces the support in its tested role and retains the current choice in the other role. The card states which role the anchor occupies. Controlled Destruction on a generator can therefore block a critical path while the same support on a separate payoff does not disable that generator.

## Browsing and trying an idea

The candidate panel defaults to unblocked but untested paths. Blocked paths are counted and can be inspected with the status filter; event and text filters narrow the results. Search includes skill, item, support, source-component and role text. Paths are sorted alphabetically and paginated in groups of eight. Changing the starting point, payoff, supports, scenario or filters returns to the first page. Pagination is not a recommendation score.

**Try this chain** transfers the exact generator, payoff, conversion/remapping selection and assigned supports to the workbench, then focuses the proposed event. Event confirmations are reset. Loading a proposal never upgrades it to a confirmed or verified build. The workbench can also switch back to all modeled events.

Source evidence and missing conditions remain attached to each suggestion, including actual actor/event attribution, target susceptibility, item variants, socket predicates, Energy, Spirit, costs and patch behavior. Existing rule limits and pending live verification remain unchanged.

Shared links preserve the starting point, payoff, assigned supports, focused event, scenario, search and filters, as well as source and discovery versions. Page position is intentionally not preserved. The current app rejects an unavailable discovery version or unsupported filter rather than substituting another search.

## Verification

Regression tests check anchor participation, generator/payoff/support roles, remapping order, persistent-minion candidates, blocked socket predicates, stable pagination, scenario cache invalidation, unmodeled sources and replaying proposals in the manual engine. Browser checks cover automatic catalog discovery, exact loading with cleared confirmations, payoff changes, shared filters and event focus, support role conflicts, pagination, narrow screens and invalid historical versions.

The existing provenance CI still reconstructs the pinned catalog/mechanics and checks chain source descriptions and predicates. This update does not add or broaden game rules; further mechanics should receive their own source research and validation before entering the search.

## Item and performance review

The v0.12 interface displays source item effects and role-specific support descriptions, and hides incompatible supports from new selections. Incompatible supports restored from an old link remain labeled as excluded. The selected catalog record and active event source are separate, explicit labels; selecting a modeled generator updates the manual event source and resets observations.

The workbench has an optional critical-hit cadence and Mana check based on user observations. Gas Arrow cloud poison is not counted as hit income. See [the focused review](GAS_ARROW_REVIEW.md).
