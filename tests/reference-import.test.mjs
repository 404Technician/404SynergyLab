import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReferenceCatalog } from '../src/reference-import.mjs';
const revision='a'.repeat(40);
const manifest={schemaVersion:1,id:'test-catalog',revision,repository:'Example/Source',targetLeague:'Test',targetPatch:'test',retrievedAt:'2026-10-13',gemPath:'Gems.lua',skillPaths:['Skills.lua'],uniquePaths:['Items.lua'],specialUniquePaths:['Special/Generated.lua']};
const gems=`-- Gem data (c) Grinding Gear Games
return {
\t["GemA"] = {
\t\tname = "Sample",
\t\tgrantedEffectId = "SamplePlayer",
\t\tgemType = "Spell",
\t\ttagString = "Fire, Projectile",
\t},
}
`;
const skills=`-- Skill data (c) Grinding Gear Games
skills["SamplePlayer"] = {
\tname = "Sample",
\tskillTypes = { [SkillType.Spell] = true, },
}
`;
const items=`-- Item data (c) Grinding Gear Games
return {
[[
Sample Unique
Sample Base
Variant: Pre 0.1
Variant: Current
]],
}
`;
const generated=`local sample = {
\t\t"Generated Unique",
\t\t"Diamond",
\t}
table.insert(data.uniques.generated, table.concat(sample, "\\n"))
`;
const files={'Gems.lua':gems,'Skills.lua':skills,'Items.lua':items,'Special/Generated.lua':generated};
const snapshot={entities:[]},discovery={items:[],extraSkills:[],extraSupports:[]};
test('catalog import is deterministic and includes generated headers without executing Lua',()=>{
 const a=buildReferenceCatalog(manifest,files,snapshot,discovery),b=buildReferenceCatalog(manifest,files,snapshot,discovery);
 assert.deepEqual(a,b);assert.deepEqual(a.counts,{skill:1,support:0,unique:2});
 assert.equal(a.entries.find(e=>e.name==='Generated Unique').generated,true);
 assert.deepEqual(a.entries.find(e=>e.name==='Sample Unique').variants,['Pre 0.1','Current']);
});
test('missing referenced effects fail rather than silently lose registered gems',()=>{
 const bad={...files,'Skills.lua':skills.replace('SamplePlayer','OtherPlayer')};
 assert.throws(()=>buildReferenceCatalog(manifest,bad,snapshot,discovery),/Missing registered gem effect/);
});
test('dynamic gem names are rejected instead of executed',()=>{
 assert.throws(()=>buildReferenceCatalog(manifest,{...files,'Gems.lua':gems.replace('name = "Sample"','name = dangerous()')},snapshot,discovery),/Unsupported catalog field/);
});
test('same-file duplicate declarations follow Lua last-assignment behavior and record overrides',()=>{
 const duplicate=gems.replace('\n}','\n\t["GemA"] = {\n\t\tname = "Replacement",\n\t\tgrantedEffectId = "SamplePlayer",\n\t\tgemType = "Spell",\n\t},\n}');
 const a=buildReferenceCatalog(manifest,{...files,'Gems.lua':duplicate},snapshot,discovery);
 assert.equal(a.coverage.gemRecords,1);assert.equal(a.coverage.gemDeclarations,2);assert.equal(a.coverage.gemOverrides.length,1);
 assert.equal(a.entries.find(e=>e.kind==='skill').name,'Replacement');
});

test('new research using an existing canonical unique ID does not rewrite the source snapshot',()=>{
 const before=buildReferenceCatalog(manifest,files,snapshot,discovery),item=before.entries.find(e=>e.name==='Sample Unique');
 const researched={...discovery,items:[{id:item.id,name:item.name}]};
 assert.deepEqual(buildReferenceCatalog(manifest,files,snapshot,researched),before);
 const alias=buildReferenceCatalog(manifest,files,snapshot,{...discovery,items:[{id:'sample-unique',name:item.name}]}).entries.find(e=>e.name===item.name);
 assert.equal(alias.id,'sample-unique');assert.equal(alias.reviewedId,'sample-unique');
});
