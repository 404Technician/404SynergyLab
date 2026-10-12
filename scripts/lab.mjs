import { readFile } from 'node:fs/promises';
import { verifyAudit } from '../src/audit.mjs';
import { analyze } from '../src/engine.mjs';
const manifest=JSON.parse(await readFile(new URL('../data/imports/pob-preview.json',import.meta.url)));
const snapshotBytes=await readFile(new URL(`../data/snapshots/${manifest.id}.json`,import.meta.url));
const snapshot=JSON.parse(snapshotBytes);
const audit=JSON.parse(await readFile(new URL(`../data/audits/${manifest.id}.json`,import.meta.url)));
const auditResult=verifyAudit(snapshot,snapshotBytes,audit);
const args=process.argv.slice(2), skills=snapshot.entities.filter(e=>e.kind === 'skill');
if (args.includes('--list')) {
  console.log('Available skills:\n'+skills.map(e=>`  ${e.id.padEnd(18)} ${e.name}`).join('\n'));
} else {
  const id=args.find(a=>!a.startsWith('--')) || 'spark';
  const result=analyze(snapshot,id,{sidewaysCascade:args.includes('--sideways-cascade')});
  if (args.includes('--json')) console.log(JSON.stringify(result,null,2));
  else {
    console.log(`404 SYNERGY LAB — ${result.skill}\nTarget: ${result.league} / ${result.patch}\nSnapshot: ${result.snapshotId}\nCANDIDATE DATA — target patch not yet verified\n`);
    console.log(`Source metadata: ${auditResult.corroborated} records match the saved public-source cross-check (see npm run audit:check).`);
    console.log('SUPPORT TYPE CHECKS (compatibility is not a recommendation)');
    for (const r of result.results) {
      console.log(`\n[${r.status.toUpperCase()}] ${r.name}\n  ${r.reason}`);
      for (const warning of r.warnings ?? []) console.log(`  WARNING: ${warning}`);
    }
    console.log('\nSKILL INTERACTIONS RECORDED IN THE SOURCE');
    for (const interaction of result.interactions) { console.log(`\n${interaction.status.toUpperCase()}: ${interaction.skillIds.map(id=>skills.find(e=>e.id===id).name).join(' + ')}\n  ${interaction.explanation}\n  Condition: ${interaction.condition}\n  Evidence: ${interaction.evidenceUrl}`);
      for (const restriction of interaction.restrictions ?? []) console.log(`  Restriction source: ${restriction.evidenceUrl}`);
    }
    if (!result.interactions.length) console.log('  No reviewed interaction recorded for this skill yet.');
    console.log(`\nLimits: ${result.disclaimer}\nUse --json for evidence links, --list for skills, or --sideways-cascade to check that context.`);
  }
}
