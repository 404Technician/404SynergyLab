import { readFile, readdir } from 'node:fs/promises';
import { validateSnapshot, checksum } from '../src/data.mjs';
const root = new URL('../data/snapshots/',import.meta.url);
const snapshots = new Map();
for (const name of await readdir(root)) {
 if (!name.endsWith('.json')) continue;
 const bytes = await readFile(new URL(name,root));
 const s = validateSnapshot(JSON.parse(bytes));
 if (snapshots.has(s.id)) throw new Error('Duplicate snapshot id');
 snapshots.set(s.id,{s,bytes});
 console.log(`Valid: ${s.id} (${s.status})`);
}
const active = JSON.parse(await readFile(new URL('../data/active.json',import.meta.url)));
if (active.snapshotId !== null) {
 const record = snapshots.get(active.snapshotId);
 if (!record || record.s.status !== 'verified' || checksum(record.bytes) !== active.sha256 || record.s.rulesVersion !== active.rulesVersion) throw new Error('Invalid active snapshot');
} else console.log('No verified snapshot active.');
