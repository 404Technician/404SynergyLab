import { readFile } from 'node:fs/promises';
import { analyze } from '../src/engine.mjs';
const manifest=JSON.parse(await readFile(new URL('../data/imports/pob-preview.json',import.meta.url)));
const snapshot=JSON.parse(await readFile(new URL(`../data/snapshots/${manifest.id}.json`,import.meta.url)));
const args=process.argv.slice(2), skills=snapshot.entities.filter(e=>e.kind === 'skill');
if (args.includes('--list')) {
  console.log('Available skills:\n'+skills.map(e=>`  ${e.id.padEnd(18)} ${e.name}`).join('\n'));
} else {
  const id=args.find(a=>!a.startsWith('--')) || 'spark';
  const result=analyze(snapshot,id);
  if (args.includes('--json')) console.log(JSON.stringify(result,null,2));
  else {
    console.log(`404 SYNERGY LAB — ${result.skill}\nTarget: ${result.league} / ${result.patch}\nSnapshot: ${result.snapshotId}\nCANDIDATE DATA — target patch not yet verified\n`);
    console.log('SUPPORT TYPE CHECKS (compatibility is not a recommendation)');
    for (const r of result.results) {
      console.log(`\n[${r.status.toUpperCase()}] ${r.name}\n  ${r.reason}`);
      for (const warning of r.warnings ?? []) console.log(`  WARNING: ${warning}`);
    }
    console.log('\nSKILL INTERACTIONS RECORDED IN THE SOURCE');
    for (const interaction of result.interactions) console.log(`\n${interaction.skillIds.map(id=>skills.find(e=>e.id===id).name).join(' + ')}\n  ${interaction.explanation}\n  Condition: ${interaction.condition}\n  Evidence: ${interaction.evidenceUrl}`);
    if (!result.interactions.length) console.log('  No reviewed interaction recorded for this skill yet.');
    console.log(`\nLimits: ${result.disclaimer}\nUse --json for all evidence links, or --list for other skills.`);
  }
}
