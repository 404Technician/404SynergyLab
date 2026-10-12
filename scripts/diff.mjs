import { readFile } from 'node:fs/promises';
import { diffSnapshots } from '../src/data.mjs';
const [a,b] = process.argv.slice(2);
if (!a || !b) throw new Error('Usage: node scripts/diff.mjs OLD.json NEW.json');
console.log(JSON.stringify(diffSnapshots(JSON.parse(await readFile(a)), JSON.parse(await readFile(b))), null, 2));
