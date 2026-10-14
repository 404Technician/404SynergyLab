import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {buildExperimentDetails} from '../src/experiment-details-import.mjs';
const root = new URL('../', import.meta.url), directory = process.argv[2];
if (!directory) throw new Error('Pass the pinned PoB checkout directory.');
const reference = JSON.parse(await readFile(new URL('data/catalog/pob-bb52d6b-full-catalog1.json', root)));
const cwd = resolve(directory);
if (execFileSync('git', ['rev-parse', 'HEAD'], {cwd, encoding: 'utf8'}).trim() !== reference.sourceRevision) throw new Error('Experiment detail source revision mismatch');
const files = {};
for (const source of reference.sources) files[source.path] = await readFile(resolve(cwd, source.path), 'utf8');
const data = buildExperimentDetails(reference, files), bytes = JSON.stringify(data) + '\n';
const target = new URL('data/research/' + data.id + '.json', root);
if (process.argv.includes('--check')) {
  if (await readFile(target, 'utf8') !== bytes) throw new Error('Experiment details differ from pinned source reconstruction');
  console.log('Unique modifiers, support descriptions and Gas Arrow distinctions match the pinned source.');
} else {
  await mkdir(new URL('data/research/', root), {recursive: true}); await writeFile(target, bytes);
  console.log('Imported ' + data.entries.length + ' experiment detail records.');
}
