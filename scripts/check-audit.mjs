import { readFile } from 'node:fs/promises';
import { verifyAudit } from '../src/audit.mjs';
const manifest=JSON.parse(await readFile(new URL('../data/imports/pob-preview.json',import.meta.url)));
const bytes=await readFile(new URL(`../data/snapshots/${manifest.id}.json`,import.meta.url));
const audit=JSON.parse(await readFile(new URL(`../data/audits/${manifest.id}.json`,import.meta.url)));
const result=verifyAudit(JSON.parse(bytes),bytes,audit);
console.log(`Stored source cross-check: ${result.corroborated}/${result.corroborated} factual records match.`);
console.log(`Target patch validation: ${result.patchStatus}. This check does not fetch live source data.`);
for (const issue of result.unresolved) console.log(`Remaining: ${issue}`);
