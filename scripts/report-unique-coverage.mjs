import {readFile,writeFile} from 'node:fs/promises';
import {renderUniqueCoverageReport} from '../src/unique-audit.mjs';
import {validateUniqueCombos} from '../src/unique-combos.mjs';
const root=new URL('../',import.meta.url),read=async p=>JSON.parse(await readFile(new URL(p,root)));
const reference=await read('data/catalog/pob-bb52d6b-full-catalog1.json'),details=await read('data/research/pob-bb52d6b-details2.json'),curated=await read('data/discovery/catalog.json'),reviews=await read('data/research/pob-bb52d6b-skill-reviews1.json');
const data=validateUniqueCombos(reference,details,reviews,await read('data/discovery/pob-bb52d6b-unique-combos2.json'));
const report=renderUniqueCoverageReport(reference,details,curated,data),target=new URL('docs/UNIQUE_COVERAGE.md',root);
if(process.argv.includes('--check')){if(await readFile(target,'utf8')!==report)throw new Error('Unique coverage report is stale');console.log('All '+reference.counts.unique+' unique coverage rows match the recorded recipes.');}
else{await writeFile(target,report);console.log('Wrote coverage for all '+reference.counts.unique+' uniques.');}
