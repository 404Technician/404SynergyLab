import {checksum} from './data.mjs';
import {validateExperimentDetails} from './experiment-details.mjs';

export function buildExperimentDetails(reference, files) {
  const records = new Map(), blocks = new Map();
  for (const source of reference.sources) {
    const text = files[source.path];
    if (typeof text !== 'string' || checksum(text) !== source.sha256) throw new Error('Experiment detail source fingerprint mismatch');
    if (source.path.includes('/Skills/')) {
      const starts = [...text.matchAll(/^skills\["([A-Za-z0-9_]+)"\] = \{/gm)];
      starts.forEach((match, index) => records.set(match[1], text.slice(match.index, starts[index + 1]?.index ?? text.length)));
    }
    if (source.path.includes('/Uniques/')) for (const match of text.matchAll(/\[\[\r?\n([\s\S]*?)\]\]/g))
      blocks.set(source.path + ':' + checksum(match[1]), match[1]);
  }
  const selected = reference.entries.filter(e => ['unique', 'support'].includes(e.kind) || ['gas-arrow', 'flame-wall', 'cast-on-critical'].includes(e.id));
  const entries = selected.map(entry => {
    const sourceEvidence = entry.effectEvidence || entry.evidence, evidence = {recordSha256: sourceEvidence.recordSha256};
    if (entry.kind === 'unique') {
      if (entry.generated) return {id: entry.id, kind: entry.kind, generated: true, modifiers: [], evidence};
      const block = blocks.get(entry.evidence.path + ':' + entry.evidence.recordSha256);
      if (!block) throw new Error('Missing unique detail record');
      const lines = block.trim().split(/\r?\n/), variants = lines.filter(line => line.startsWith('Variant: ')).map(line => line.slice(9));
      const modifiers = lines.slice(2).filter(line => line.trim() && !/^(Variant:|League:|Source:|Implicits:)/.test(line)).map(raw => ({
        text: raw.replace(/^(?:\{[^}]+\})+/, ''),
        variants: [...raw.matchAll(/\{variant:([0-9,]+)\}/g)].flatMap(match => match[1].split(',').map(n => variants[Number(n) - 1] || 'Source variant ' + n)),
      }));
      return {id: entry.id, kind: entry.kind, generated: false, modifiers, evidence};
    }
    const record = records.get(entry.effectId);
    if (!record || checksum(record) !== evidence.recordSha256) throw new Error('Effect detail record changed: ' + entry.id);
    const literal = record.match(/^\tdescription = (.+),\r?$/m)?.[1];
    if (literal === undefined) return {id: entry.id, kind: entry.kind, description: null, descriptionStatus: 'missing', evidence};
    let description;
    try { description = JSON.parse(literal); } catch { throw new Error('Unsupported source description: ' + entry.id); }
    return {id: entry.id, kind: entry.kind, description, descriptionStatus: 'recorded', evidence};
  });
  const gas = records.get('GasArrowPlayer'), critical = records.get('MetaCastOnCritPlayer');
  if (!gas?.includes('"display_skill_poisons_without_hit"') || !gas.includes('label = "Poison Cloud"') || !gas.includes('"active_skill_base_physical_damage_%_to_convert_to_fire", 100') || !critical?.includes('Critically Hit enemies'))
    throw new Error('Gas Arrow hit/detonation review changed');
  const gasArrow = {
    cloudHits: false,
    summary: 'Gas Arrow has separate arrow, poison-cloud and explosion components. The poison cloud poisons without hitting; it is not a continuous critical-hit generator.',
    detonation: 'An Ignited enemy touching the cloud or a Detonator hit is required for the explosion. Burning or Fire damage alone does not prove that condition.',
    critical: 'Do not count poison applications as critical hits for Cast on Critical. Test an actual arrow or explosion hit separately; detonation frequency, weapon crit and Energy gain still need checking.',
    evidenceUrls: [reference.entries.find(e => e.id === 'gas-arrow').effectEvidence.url, reference.entries.find(e => e.id === 'cast-on-critical').effectEvidence.url],
  };
  if (!records.get('SupportAmbushPlayer')?.includes('enemies on full life.') || !critical.includes('generic_ongoing_trigger_maximum_energy_is_total_of_socketed_skills') || !critical.includes('cast_on_crit_gain_X_centienergy_per_monster_power_on_crit') || !records.get('SupportMetaCastOnCritPlayer')?.includes('\"trigger_meta_gem_damage_+%_final\", -20')) throw new Error('Critical-hit cadence research changed');
  const critNotes = ['Cast on Critical gains Energy from actual critical hits; its source Energy gain depends on enemy power.', 'The source maximum Energy is the total of the socketed skills. Use the Energy threshold shown for your actual socketed setup.', 'A first-hit critical bonus such as Ambush against full-life enemies does not establish sustained critical-hit frequency against a boss.'];
  critNotes.push('The pinned Cast on Critical socket support records 20% less triggered damage. Confirm your actual patch tooltip; triggering alone is not a damage upgrade.');
  return validateExperimentDetails(reference, {schemaVersion: 1, id: 'pob-bb52d6b-details1', referenceId: reference.id, sourceRevision: reference.sourceRevision, entries, gasArrow, critNotes});
}
