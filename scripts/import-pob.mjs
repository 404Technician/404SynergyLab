import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { buildPobSnapshot } from '../src/pob-import.mjs';
const directory=process.argv[2];
if (!directory) throw new Error('Usage: node scripts/import-pob.mjs PATH-TO-POB-CHECKOUT [--check]');
const manifest=JSON.parse(await readFile(new URL('../data/imports/pob-preview.json',import.meta.url)));
const cwd=resolve(directory);
const revision=execFileSync('git',['rev-parse','HEAD'],{cwd,encoding:'utf8'}).trim();
if (revision !== manifest.revision) throw new Error(`Expected pinned PoB revision ${manifest.revision}; received ${revision}`);
const files={};
for (const path of new Set([...manifest.records,...(manifest.uniqueRecords ?? [])].map(r=>r.path))) {
  if (!/^src\/Data\/(Skills\/(act|sup)_(int|dex|str)|Uniques\/(ring|gloves))\.lua$/.test(path)) throw new Error('Unsupported source path');
  // Read committed bytes, so local uncommitted edits cannot enter the snapshot.
  files[path]=execFileSync('git',['show',`${manifest.revision}:${path}`],{cwd,encoding:'utf8',maxBuffer:16*1024*1024});
}
const snapshot=buildPobSnapshot(manifest,files);
const output=JSON.stringify(snapshot,null,2)+'\n';
const target=new URL(`../data/snapshots/${snapshot.id}.json`,import.meta.url);
if (process.argv.includes('--check')) {
  if (await readFile(target,'utf8') !== output) throw new Error('Committed snapshot differs from pinned-source import');
  console.log('Pinned-source reproduction matches exactly.');
} else {
  try {
    const previous=await readFile(target,'utf8');
    if (previous !== output) throw new Error('Refusing to overwrite historical snapshot; use a new snapshot id.');
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  await writeFile(target,output);
  console.log(`Imported ${snapshot.entities.length} records and ${snapshot.interactions.length} interactions as candidate data.`);
}
