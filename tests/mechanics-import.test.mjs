import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { buildMechanics } from '../src/mechanics-import.mjs';
const hash=s=>createHash('sha256').update(s).digest('hex');
const block='Test item\nTest base\n100% of Lightning Damage Converted to Cold Damage\n100% of Parry Physical Damage Converted to Cold Damage\n{variant:2}Grants Skill: Level (1-20) Test Skill\nTrigger Test Skill Skill on Critical Hit\n';
const path='src/Data/Uniques/test.lua',source='-- Item data (c) Grinding Gear Games\nreturn {\n[[\n'+block+']]\n}\n';
const reference={id:'ref',sourceRevision:'a'.repeat(40),sources:[{path,sha256:hash(source)}],entries:[{id:'item',kind:'unique',generated:false,evidence:{path,line:3,recordSha256:hash(block),url:'https://example.com/item#L3'}}]};
test('mechanic importer preserves variant scope and ignores an unsupported damage actor',()=>{
 const data=buildMechanics(reference,{[path]:source}),mechanics=data.profiles[0].mechanics;
 assert.equal(mechanics.filter(m=>m.kind==='conversion').length,1);
 assert.equal(mechanics.find(m=>m.kind==='conversion').scope,'player');
 assert.deepEqual(mechanics.find(m=>m.kind==='grant').variants,[2]);
 assert.equal(mechanics.find(m=>m.kind==='trigger').requiresCritical,true);
});
test('mechanic extraction binds source files and unique records instead of trusting names',()=>{
 assert.throws(()=>buildMechanics(reference,{[path]:source+' '}),/fingerprint/);
 const wrong=structuredClone(reference);wrong.entries[0].evidence.recordSha256='0'.repeat(64);
 assert.throws(()=>buildMechanics(wrong,{[path]:source}),/Missing unique/);
});
