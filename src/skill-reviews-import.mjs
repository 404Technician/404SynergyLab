import {checksum} from './data.mjs';
import {extractRecord} from './pob-import.mjs';
import {skillReviewVersion,validateSkillReviews} from './skill-reviews.mjs';
export function buildSkillReviews(reference,files){
 const paths=new Set(reference.entries.filter(e=>e.kind==='skill').map(e=>(e.effectEvidence||e.evidence).path));
 for(const path of paths){const source=reference.sources.find(s=>s.path===path);if(typeof files[path]!=='string'||!source||checksum(files[path])!==source.sha256)throw new Error('Skill review source file changed');}
 const entries=reference.entries.filter(e=>e.kind==='skill').map(entry=>{
  const evidence=entry.effectEvidence||entry.evidence,record=extractRecord(files[evidence.path],entry.effectId);
  if(checksum(record.text)!==evidence.recordSha256||record.line!==evidence.line)throw new Error('Skill review record changed: '+entry.id);
  const fromItemLiteral=record.text.match(/^\tfromItem = (.+),\r?$/m)?.[1]??'false';
  if(!['true','false'].includes(fromItemLiteral))throw new Error('Unsupported item-skill flag');
  const fromItem=fromItemLiteral==='true';
  const literal=record.text.match(/^\tdescription = (.+),\r?$/m)?.[1];
  if(literal===undefined)return {id:entry.id,description:null,descriptionStatus:'missing',fromItem,evidence:{recordSha256:evidence.recordSha256}};
  let description;try{description=JSON.parse(literal);}catch{throw new Error('Unsupported skill review description');}
  return {id:entry.id,description,descriptionStatus:'recorded',fromItem,evidence:{recordSha256:evidence.recordSha256}};
 });
 return validateSkillReviews(reference,{schemaVersion:1,id:skillReviewVersion,referenceId:reference.id,sourceRevision:reference.sourceRevision,entries});
}
