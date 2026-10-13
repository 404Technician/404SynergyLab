import test from 'node:test';
import assert from 'node:assert/strict';
import { readDiscoveryEntity, verifyDiscoveryEntity } from '../src/discovery-records.mjs';
const revision='a'.repeat(40);
const selection={id:'sample',effectId:'Sample',path:'src/Data/Skills/sample.lua',kind:'skill'};
const source=`-- Skill data (c) Grinding Gear Games
skills["Sample"] = {
\tname = "Sample",
\tdescription = "A test record",
\tskillTypes = { [SkillType.Spell] = true, [SkillType.CreatesMinion] = true, },
\tminionSkillTypes = { [SkillType.Attack] = true, },
}
`;
test('discovery parser keeps player and minion types separate and binds exact bytes',()=>{
 const e=readDiscoveryEntity(source,selection,revision);assert.deepEqual(e.skillTypes,['Spell','CreatesMinion']);assert.deepEqual(e.minionSkillTypes,['Attack']);
 verifyDiscoveryEntity(source,e,revision);assert.throws(()=>verifyDiscoveryEntity(source.replace('A test record','Changed'),e,revision),/source mismatch/);
 const changed=structuredClone(e);changed.skillTypes.push('Attack');assert.throws(()=>verifyDiscoveryEntity(source,changed,revision),/source mismatch/);
});
test('discovery parser rejects dynamic metadata instead of executing Lua',()=>{
 assert.throws(()=>readDiscoveryEntity(source.replace('"Sample",','getName(),'),selection,revision),/name/);
 assert.throws(()=>readDiscoveryEntity(source.replace('{ [SkillType.Attack] = true, }','getTypes()'),selection,revision),/type set/);
});
