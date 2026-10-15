import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {checksum} from '../src/data.mjs';
import {extractRecord} from '../src/pob-import.mjs';
import {buildSkillReviews} from '../src/skill-reviews-import.mjs';
import {validateSkillReviews,describeSkillReview,skillReviewVersion} from '../src/skill-reviews.mjs';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url)));
const reference=read('data/catalog/pob-bb52d6b-full-catalog1.json'),data=read('data/research/pob-bb52d6b-skill-reviews1.json'),mechanics=read('data/mechanics/pob-bb52d6b-mechanics1.json');
const entry=name=>reference.entries.find(e=>e.kind==='skill'&&e.name===name),guide=e=>describeSkillReview(e,data.entries.find(r=>r.id===e.id),mechanics.profiles.find(p=>p.id===e.id));
test('all 399 distinct catalog skills have source-bound practical guides',()=>{
 validateSkillReviews(reference,data);assert.equal(data.entries.length,399);assert.equal(new Set(data.entries.map(r=>r.id)).size,399);
 for(const e of reference.entries.filter(e=>e.kind==='skill')){const g=guide(e);assert.ok(g.role);assert.ok(g.practical.length);assert.ok(g.practical.every(t=>t.length>30));}
 assert.equal(data.entries.filter(e=>e.descriptionStatus==='recorded').length,398);
});
test('missing Ice Fragments description is explicit and does not invent independent casting',()=>{
 const g=guide(entry('Ice Fragments'));assert.equal(g.descriptionStatus,'missing');assert.match(g.warnings.join(' '),/no description/);assert.match(g.practical.join(' '),/Independent casting.*not established/);
});
test('bound monsters and duplicate display names retain their distinct identity',()=>{
 const templates=reference.entries.filter(e=>e.kind==='skill'&&e.name.includes('{0}'));assert.ok(templates.length>=2);
 for(const e of templates){assert.equal(guide(e).role,'Bound creature template');assert.match(guide(e).warnings.join(' '),/bound monster/);}
 const bolts=reference.entries.filter(e=>e.kind==='skill'&&e.name==='Lightning Bolt');assert.equal(bolts.length,2);assert.notEqual(bolts[0].id,bolts[1].id);for(const e of bolts)assert.ok(guide(e).practical.length);
});
test('guides retain socket, resource and non-triggerable restrictions without recommending combinations',()=>{
 assert.match(guide(entry('Reap')).warnings.join(' '),/cannot be Triggered/);
 assert.match(guide(entry('Spell Totem')).practical.join(' '),/charge counter[\s\S]*socket eligibility/);
 assert.match(guide(entry('Acidic Concoction')).practical.join(' '),/Mana Flask charges/);
 const plain=guide(entry("Wildwood's Gifts"));assert.equal(plain.practical.length,1);assert.ok(!('recipes' in plain));
});
test('incomplete, duplicate, stale and fabricated review descriptions fail validation',()=>{
 for(const change of [d=>d.entries.pop(),d=>d.entries[0]=d.entries[1],d=>d.entries[0].evidence.recordSha256='0'.repeat(64),d=>d.entries[0].fromItem='true',d=>d.entries[0].descriptionStatus='imagined',d=>d.entries.find(e=>e.descriptionStatus==='missing').description='fake']){const broken=structuredClone(data);change(broken);assert.throws(()=>validateSkillReviews(reference,broken));}
});
test('review importer reads exact descriptions, preserves missing fields and rejects changed files',()=>{
 const source='skills["One"] = {\n\tdescription = "Use a charge after 1.5 seconds. Cannot repeat.",\n}\nskills["Two"] = {\n\tname = "No description",\n}\n';
 const path='src/Data/Skills/test.lua',ref={id:'fixture',sourceRevision:'rev',sources:[{path,sha256:checksum(source)}],entries:['One','Two'].map(id=>{const r=extractRecord(source,id);return{id,kind:'skill',effectId:id,evidence:{path,line:r.line,recordSha256:checksum(r.text)}};})};
 const result=buildSkillReviews(ref,{[path]:source});assert.equal(result.id,skillReviewVersion);assert.equal(result.entries[0].description,'Use a charge after 1.5 seconds. Cannot repeat.');assert.equal(result.entries[1].description,null);
 assert.throws(()=>buildSkillReviews(ref,{[path]:source+' '}),/file changed/);
 const g=describeSkillReview({tags:[],name:'One'},result.entries[0],{skillTypes:[]});assert.ok(g.statements.includes('Cannot repeat.'));
});

test('item-granted spells do not become ordinary skill-gem recommendations',()=>{
 const reap=entry('Reap'),spark=entry('Spark');assert.equal(data.entries.find(e=>e.id===reap.id).fromItem,true);assert.equal(data.entries.find(e=>e.id===spark.id).fromItem,false);
 assert.match(guide(reap).warnings.join(' '),/Item-granted skill[\s\S]*manual or triggered/);
});
