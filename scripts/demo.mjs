import { readFile } from 'node:fs/promises';
import { analyze } from '../src/engine.mjs';
const s = JSON.parse(await readFile(new URL('../data/snapshots/fixture-v1.json', import.meta.url)));
console.log(JSON.stringify(analyze(s, process.argv[2] || 'demo-projectile'),null,2));
