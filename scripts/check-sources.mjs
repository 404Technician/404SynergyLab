import { readFile, mkdir, writeFile } from 'node:fs/promises';
const { sources } = JSON.parse(await readFile(new URL('../data/sources.json',import.meta.url)));
const report = [];
for (const source of sources) {
 const response = await fetch(`https://api.github.com/repos/${source.repository}/commits/${encodeURIComponent(source.ref)}`, {
  headers:{Accept:'application/vnd.github+json', ...(process.env.GITHUB_TOKEN ? {Authorization:`Bearer ${process.env.GITHUB_TOKEN}`} : {})}, signal:AbortSignal.timeout(20000)
 });
 if (!response.ok) throw new Error(`Source check failed for ${source.id}: HTTP ${response.status}`);
 const data = await response.json();
 if (!/^[a-f0-9]{40}$/.test(data.sha)) throw new Error('Invalid upstream revision');
 report.push({sourceId:source.id,observedCommit:data.sha,pinnedCommit:source.pinnedCommit,status:source.pinnedCommit === null ? 'baseline-needed' : source.pinnedCommit === data.sha ? 'unchanged' : 'changed',note:'Upstream commit change does not prove a new game patch.'});
}
await mkdir(new URL('../reports/',import.meta.url),{recursive:true});
await writeFile(new URL('../reports/sources.json',import.meta.url),JSON.stringify({checkedAt:new Date().toISOString(),sources:report},null,2));
console.log(JSON.stringify(report,null,2));
