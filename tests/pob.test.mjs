import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { analyze } from '../src/engine.mjs';
import { validateSnapshot, activationRecord, diffSnapshots } from '../src/data.mjs';
import { matchesTypeExpression, validateTypeExpression } from '../src/type-expression.mjs';
import { buildPobSnapshot, extractRecord } from '../src/pob-import.mjs';
const snapshot=JSON.parse(readFileSync(new URL('../data/snapshots/pob-bb52d6b-preview.json',import.meta.url)));
const result=(skill,support)=>analyze(snapshot,skill).results.find(r=>r.id===support);
test('Spark takes source spell supports, not attack supports', () => {
 assert.equal(result('spark','rapid-casting-1').status,'compatible');
 assert.equal(result('spark','controlled-destruction').status,'compatible');
 assert.equal(result('spark','rapid-attacks-1').status,'incompatible');
 assert.match(result('spark','controlled-destruction').warnings[0],/critical hits/);
});
test('Lightning Rod exclusions override projectile-speed compatibility', () => {
 assert.equal(result('lightning-rod','projectile-acceleration-1').status,'compatible');
 assert.equal(result('lightning-rod','chain-1').status,'incompatible');
 assert.match(result('lightning-rod','chain-1').reason,/ProjectileNoCollision/);
 assert.equal(result('lightning-rod','pierce-1').status,'incompatible');
});
test('nonprojectile Ice Nova cannot use Pierce; a melee attack cannot use casting speed', () => {
 assert.equal(result('ice-nova','pierce-1').status,'incompatible');
 assert.equal(result('leap-slam','rapid-casting-1').status,'incompatible');
 assert.equal(result('leap-slam','rapid-attacks-1').status,'compatible');
});
test('type match on Brutality preserves elemental and chaos tradeoffs', () => {
 const r=result('lightning-arrow','brutality-1'); assert.equal(r.status,'compatible');
 assert.equal(r.warnings.length,2); assert.match(r.warnings[0],/elemental damage/);
});
test('skill interactions expose conditions and pinned evidence in either direction', () => {
 for (const id of ['ice-nova','frostbolt']) {
  const r=analyze(snapshot,id); assert.equal(r.interactions[0].id,'ice-nova-frostbolt');
  assert.match(r.interactions[0].condition,/targeting/);
 }
 assert.match(analyze(snapshot,'lightning-arrow').interactions[0].explanation,/shortens the delay/);
 assert.match(analyze(snapshot,'lightning-arrow').evidenceUrl,/bb52d6b368307457eb9c54bb13f1829993d390b1/);
});
test('candidate output and pending target patch are explicit', () => {
 const r=analyze(snapshot,'spark');assert.equal(r.dataStatus,'candidate');assert.equal(r.patchValidation,'pending');
 assert.match(r.disclaimer,/not verified/);assert.throws(()=>activationRecord(snapshot,JSON.stringify(snapshot),true),/Only verified/);
 const next=structuredClone(snapshot);next.status='verified';next.review={by:'reviewer',at:'2026-10-12',notes:'test'};
 assert.throws(()=>validateSnapshot(next),/Patch validation/);
});
test('postfix logic handles OR defaults, nested AND and NOT', () => {
 assert.equal(matchesTypeExpression(['Spell','Attack'],['Attack']),true);
 assert.equal(matchesTypeExpression(['Damage','Spell','AND'],['Spell']),false);
 assert.equal(matchesTypeExpression(['Damage','Spell','AND'],['Damage','Spell']),true);
 assert.equal(matchesTypeExpression(['Spell','Instant','NOT','AND'],['Spell']),true);
 assert.equal(matchesTypeExpression([],['Spell']),false);
 for (const e of [['AND'],['NOT'],['Spell','OR'],['Spell','bad token']]) assert.throws(()=>validateTypeExpression(e));
});
test('source engine handles unsupported context and cannotBeSupported safely', () => {
 const a=structuredClone(snapshot);a.entities.find(e=>e.id==='spark').cannotBeSupported=true;
 assert.ok(analyze(a,'spark').results.every(r=>r.status==='incompatible'));
 const b=structuredClone(snapshot);b.entities.find(e=>e.id==='chain-1').compatibility.status='unknown';
 assert.equal(analyze(b,'spark').results.find(r=>r.id==='chain-1').status,'unknown');
});
test('interaction and patch review changes appear in snapshot diff', () => {
 const a=structuredClone(snapshot);a.interactions[0].condition+=' Verify target.';a.patchValidation.notes+=' Checked.';
 const diff=diffSnapshots(snapshot,a);assert.equal(diff.interactionsChanged,true);assert.equal(diff.patchValidationChanged,true);
});
test('source-backed validator rejects malformed expressions and broken interaction references', () => {
 const a=structuredClone(snapshot);a.entities.find(e=>e.kind==='support').compatibility.requiredTypes=['AND'];
 assert.throws(()=>validateSnapshot(a),/Malformed/);
 const b=structuredClone(snapshot);b.interactions[0].skillIds=['spark','missing'];assert.throws(()=>validateSnapshot(b),/interaction skills/);
});
const source=`-- Skill data (c) Grinding Gear Games
skills["TestSpell"] = {
\tname = "Test Spell",
\tskillTypes = { [SkillType.Spell] = true, [SkillType.Damage] = true, },
}
skills["TestSupport"] = {
\tname = "Test Support",
\tsupport = true,
\trequireSkillTypes = { SkillType.Spell, SkillType.Damage, SkillType.AND, },
\texcludeSkillTypes = { SkillType.Instant, },
\taddSkillTypes = { },
}
`;
const manifest={...JSON.parse(readFileSync(new URL('../data/imports/pob-preview.json',import.meta.url))),uniqueRecords:undefined,uniqueIdeas:undefined,records:[{id:'test-spell',effectId:'TestSpell',kind:'skill',path:'test.lua'},{id:'test-support',effectId:'TestSupport',kind:'support',path:'test.lua'}],interactions:[]};
test('narrow importer reads factual metadata without evaluating Lua', () => {
 const s=buildPobSnapshot(manifest,{'test.lua':source+'\nerror("This must never execute")\n'});
 assert.equal(s.entities.length,2);assert.deepEqual(s.entities[0].skillTypes,['Spell','Damage']);
 assert.equal(analyze(s,'test-spell').results[0].status,'compatible');
});
test('parser fails closed on dynamic fields, malformed input and duplicate records', () => {
 assert.throws(()=>buildPobSnapshot(manifest,{'test.lua':source.replace('SkillType.Instant,','something(),')}),/Unsupported/);
 assert.throws(()=>buildPobSnapshot(manifest,{'test.lua':source.replace('name = \"Test Spell\",','name = \"Test Spell\",\n\tcannotBeSupported = dynamic(),')}),/Unsupported boolean/);
 assert.throws(()=>buildPobSnapshot(manifest,{'test.lua':source.replace('name = "Test Spell"','name = os.execute("bad")')}),/Unsupported name/);
 assert.throws(()=>extractRecord(source+'skills["TestSpell"] = {\n}', 'TestSpell'),/duplicate/);
});
test('importer refuses stale interaction evidence and handles additional type context as unknown', () => {
 const m=structuredClone(manifest);m.interactions=[{id:'test',effectId:'TestSpell',requiredDescriptionFragments:['Frostbolt']}];
 assert.throws(()=>buildPobSnapshot(m,{'test.lua':source}),/metadata field description/);
 const s=buildPobSnapshot(manifest,{'test.lua':source.replace('addSkillTypes = { },','addSkillTypes = { SkillType.Projectile, },')});
 assert.equal(analyze(s,'test-spell').results[0].status,'unknown');
});
