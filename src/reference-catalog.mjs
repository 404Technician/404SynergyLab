const text=x=>typeof x==='string'&&x.trim().length>0;
const url=x=>text(x)&&/^https:\/\//.test(x);
const fingerprint=x=>/^[a-f0-9]{64}$/.test(x);
export function validateReferenceCatalog(c) {
 if(c?.schemaVersion!==1||c.status!=='candidate'||!text(c.id)||!text(c.targetPatch)||!text(c.targetLeague)||!/^[a-f0-9]{40}$/.test(c.sourceRevision))throw new Error('Invalid full catalog version');
 if(!Array.isArray(c.entries)||!c.entries.length||!Array.isArray(c.sources)||!c.sources.length)throw new Error('Missing full catalog records');
 const sources=new Map();for(const source of c.sources){if(!text(source.path)||sources.has(source.path)||!fingerprint(source.sha256)||!url(source.url))throw new Error('Invalid full catalog source');sources.set(source.path,source);}
 const ids=new Set(),counts={skill:0,support:0,unique:0};
 for(const e of c.entries){
  if(!text(e.id)||ids.has(e.id)||!text(e.name)||!['skill','support','unique'].includes(e.kind)||!text(e.category)||e.availability!=='unverified')throw new Error('Invalid full catalog entry');ids.add(e.id);counts[e.kind]++;
  if(!Array.isArray(e.tags)||!e.tags.every(text)||new Set(e.tags).size!==e.tags.length)throw new Error('Invalid full catalog tags');
  if(!e.evidence||!sources.has(e.evidence.path)||!Number.isInteger(e.evidence.line)||e.evidence.line<1||!url(e.evidence.url)||!fingerprint(e.evidence.recordSha256))throw new Error('Invalid full catalog evidence');
  if(e.kind==='unique'&&(!text(e.base)||!Array.isArray(e.variants)||!e.variants.every(text)||typeof e.generated!=='boolean'))throw new Error('Invalid full catalog unique');
 }
 if(JSON.stringify(counts)!==JSON.stringify(c.counts))throw new Error('Full catalog count mismatch');
 if(c.coverage?.gemRecords!==c.entries.filter(e=>e.origin==='gem').length||c.coverage?.uniqueRecords!==counts.unique)throw new Error('Full catalog coverage mismatch');
 return c;
}
export function referenceEntries(c,kind,query='',category='') {
 if(!['skill','support','unique'].includes(kind))throw new Error('Invalid catalog kind');
 const q=query.trim().toLowerCase();
 return c.entries.filter(e=>e.kind===kind&&(!category||e.category===category)&&(!q||[e.name,e.category,e.base??'',...e.tags].join(' ').toLowerCase().includes(q)));
}
export function resolveReference(c,kind,id) {
 const entries=c.entries.filter(e=>e.kind===kind);
 return entries.find(e=>e.id===id)||entries.find(e=>e.reviewedId===id);
}
