import { checksum } from './data.mjs';
import { validateReferenceCatalog } from './reference-catalog.mjs';

function quoted(record,key,indent,optional=false) {
 const matches=[...record.matchAll(new RegExp('^'+indent+key+' = (.+),\\r?$','gm'))];
 if(optional&&!matches.length)return null;
 if(matches.length!==1||!/^"(?:[^"\\]|\\.)*"$/.test(matches[0][1]))throw new Error('Unsupported catalog field: '+key);
 return JSON.parse(matches[0][1]);
}
const compare=(a,b)=>a<b?-1:a>b?1:0;
function blocks(source,pattern) {
 const starts=[...source.matchAll(pattern)];
 return starts.map((m,i)=>({key:m[1],text:source.slice(m.index,starts[i+1]?.index??source.length),line:source.slice(0,m.index).split('\n').length}));
}
export function buildReferenceCatalog(manifest,files,snapshot,discovery) {
 if(manifest.schemaVersion!==1||!/^[a-f0-9]{40}$/.test(manifest.revision))throw new Error('Full catalog requires a pinned source');
 const paths=[manifest.gemPath,...manifest.skillPaths,...manifest.uniquePaths,...manifest.specialUniquePaths];
 if(new Set(paths).size!==paths.length)throw new Error('Duplicate catalog source path');
 for(const path of paths)if(typeof files[path]!=='string')throw new Error('Missing full catalog source: '+path);
 const sourceUrl=path=>'https://github.com/'+manifest.repository+'/blob/'+manifest.revision+'/'+path;
 const sources=paths.map(path=>({path,sha256:checksum(files[path]),url:sourceUrl(path)})).sort((a,b)=>compare(a.path,b.path));
 const reviewed=[...snapshot.entities,...discovery.extraSkills,...discovery.extraSupports];
 const effects=new Map(),effectOverrides=[];
 for(const path of manifest.skillPaths){
  const source=files[path];if(!source.includes('Skill data (c) Grinding Gear Games'))throw new Error('Missing catalog skill notice');
  for(const record of blocks(source,/^skills\["([A-Za-z0-9_]+)"\] = \{/gm)){
   if(effects.has(record.key)) {const previous=effects.get(record.key);if(previous.path!==path)throw new Error('Ambiguous cross-file catalog effect: '+record.key);effectOverrides.push({effectId:record.key,path,previousLine:previous.line,line:record.line});}
   effects.set(record.key,{...record,path});
  }
 }
 const entries=[],usedIds=new Set(),representedEffects=new Set();
 const idFor=(fallback,reviewedId)=>{const id=reviewedId&&!usedIds.has(reviewedId)?reviewedId:fallback;if(usedIds.has(id))throw new Error('Duplicate imported reference: '+id);usedIds.add(id);return id;};
 const gems=files[manifest.gemPath];if(!gems.includes('Gem data (c) Grinding Gear Games'))throw new Error('Missing catalog gem notice');
 const gemDeclarations=blocks(gems,/^\t\["([^"]+)"\] = \{/gm),gemMap=new Map(),gemOverrides=[];
 for(const gem of gemDeclarations){if(gemMap.has(gem.key))gemOverrides.push({gemId:gem.key,previousLine:gemMap.get(gem.key).line,line:gem.line});gemMap.set(gem.key,gem);}
 const gemBlocks=[...gemMap.values()];
 for(const gem of gemBlocks) {
  const name=quoted(gem.text,'name','\\t\\t'),effectId=quoted(gem.text,'grantedEffectId','\\t\\t'),gemType=quoted(gem.text,'gemType','\\t\\t');
  const effect=effects.get(effectId);if(!effect)throw new Error('Missing registered gem effect: '+effectId);
  representedEffects.add(effectId);
  const kind=gemType==='Support'?'support':'skill';
  const match=reviewed.find(e=>e.kind===kind&&e.evidence.effectId===effectId);
  const tagLiteral=quoted(gem.text,'tagString','\\t\\t',true)||'';
  const tags=[...new Set(tagLiteral.split(/,\s*/).filter(Boolean))];
  const weaponRequirements=quoted(gem.text,'weaponRequirements','\\t\\t',true);
  entries.push({id:idFor('gem:'+encodeURIComponent(gem.key),match?.id),name,kind,category:gemType,tags,origin:'gem',effectId,gemId:gem.key,
   ...(match?{reviewedId:match.id}:{}),...(weaponRequirements?{weaponRequirements}:{}),legacy:/^\tlegacy = true,/m.test(effect.text),availability:'unverified',
   evidence:{path:manifest.gemPath,line:gem.line,recordSha256:checksum(gem.text),url:sourceUrl(manifest.gemPath)+'#L'+gem.line},
   effectEvidence:{path:effect.path,line:effect.line,recordSha256:checksum(effect.text),url:sourceUrl(effect.path)+'#L'+effect.line}});
 }
 // Include named, nonhidden player/item effects not registered as standalone gems.
 // Minion AI effects are only indexed when a registered gem explicitly points to them.
 let extraEffects=0;
 for(const [effectId,effect] of effects) {
  if(representedEffects.has(effectId)||effect.path.endsWith('/minion.lua')||/^\t(?:hidden|support) = true,/m.test(effect.text))continue;
  const name=quoted(effect.text,'name','\\t',true);if(!name)continue;
  const match=reviewed.find(e=>e.kind==='skill'&&e.evidence.effectId===effectId);
  const types=effect.text.match(/^\tskillTypes = (.+),$/m)?.[1]??'';
  const tags=[...new Set([...types.matchAll(/SkillType\.([A-Za-z0-9_]+)/g)].map(m=>m[1]))];
  entries.push({id:idFor('effect:'+effectId,match?.id),name,kind:'skill',category:/^\tfromItem = true,/m.test(effect.text)?'Item skill':'Source effect',tags,origin:'effect',effectId,...(match?{reviewedId:match.id}:{}),legacy:/^\tlegacy = true,/m.test(effect.text),availability:'unverified',evidence:{path:effect.path,line:effect.line,recordSha256:checksum(effect.text),url:sourceUrl(effect.path)+'#L'+effect.line}});
  extraEffects++;
 }
 let staticUniques=0,generatedUniques=0;
 for(const path of [...manifest.uniquePaths,...manifest.specialUniquePaths.filter(p=>!p.endsWith('/Generated.lua'))]) {
  const source=files[path];
  for(const m of source.matchAll(/\[\[\r?\n([\s\S]*?)\]\]/g)) {
   const lines=m[1].trimEnd().split(/\r?\n/),name=lines[0],base=lines[1];
   if(!name||!base)throw new Error('Missing unique header');
   const match=discovery.items.find(e=>e.name===name);
   const category=path.split('/').at(-1).replace('.lua','');
   entries.push({id:idFor('unique:'+category+':'+encodeURIComponent(name)+':'+encodeURIComponent(base),match?.id),name,base,kind:'unique',category,tags:[],origin:'unique',generated:false,
    variants:lines.filter(l=>l.startsWith('Variant: ')).map(l=>l.slice(9)),...(lines.find(l=>l.startsWith('League: '))?{league:lines.find(l=>l.startsWith('League: ')).slice(8)}:{}),
    ...(match?{reviewedId:match.id}:{}),availability:'unverified',evidence:{path,line:source.slice(0,m.index).split('\n').length,recordSha256:checksum(m[1]),url:sourceUrl(path)+'#L'+source.slice(0,m.index).split('\n').length}});
   staticUniques++;
  }
 }
 for(const path of manifest.specialUniquePaths.filter(p=>p.endsWith('/Generated.lua'))) {
  const source=files[path];
  const inserts=[...source.matchAll(/table\.insert\(data\.uniques\.generated, table\.concat\((\w+), "\\n"\)\)/g)].map(m=>m[1]);
  for(const variable of inserts){
   const match=source.match(new RegExp('local '+variable+' = \\{([\\s\\S]*?)\\n\\t\\}'));
   if(!match)throw new Error('Unsupported generated unique header');
   const lines=[...match[1].matchAll(/^\s*"((?:[^"\\]|\\.)*)",?$/gm)].map(m=>JSON.parse('"'+m[1]+'"'));
   if(lines.length<2)throw new Error('Missing generated unique name');
   const [name,base]=lines,known=discovery.items.find(e=>e.name===name),category=base==='Abyssal Signet'?'ring':base==='Ornate Ringmail'?'body':'jewel';
   entries.push({id:idFor('unique:generated:'+encodeURIComponent(name),known?.id),name,base,kind:'unique',category,tags:[],origin:'generated-unique',generated:true,variants:[],...(known?{reviewedId:known.id}:{}),availability:'unverified',evidence:{path,line:source.slice(0,match.index).split('\n').length,recordSha256:checksum(match[0]),url:sourceUrl(path)+'#L'+source.slice(0,match.index).split('\n').length}});
   generatedUniques++;
  }
 }
 const order=(a,b)=>compare(a.kind,b.kind)||compare(a.name.toLowerCase(),b.name.toLowerCase())||compare(a.id,b.id);entries.sort(order);
 const counts={skill:entries.filter(e=>e.kind==='skill').length,support:entries.filter(e=>e.kind==='support').length,unique:entries.filter(e=>e.kind==='unique').length};
 return validateReferenceCatalog({schemaVersion:1,id:manifest.id,status:'candidate',targetLeague:manifest.targetLeague,targetPatch:manifest.targetPatch,sourceRevision:manifest.revision,retrievedAt:manifest.retrievedAt,sources,counts,
  coverage:{gemRecords:gemBlocks.length,gemDeclarations:gemDeclarations.length,gemOverrides,effectOverrides,extraEffects,staticUniques,generatedUniques,uniqueRecords:staticUniques+generatedUniques,scope:'All registered Gems.lua records; nonhidden named player/item effects; all static unique blocks and generated unique family headers in the declared pinned source files. Availability and modifier behavior are not verified.'},entries});
}
