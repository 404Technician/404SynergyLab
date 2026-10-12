import { readFile, mkdir, copyFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { verifyAudit } from '../src/audit.mjs';
export async function buildWeb() {
  const root=new URL('../',import.meta.url),dist=new URL('dist/',root);
  const manifest=JSON.parse(await readFile(new URL('data/imports/pob-preview.json',root)));
  const snapshotBytes=await readFile(new URL(`data/snapshots/${manifest.id}.json`,root));
  const snapshot=JSON.parse(snapshotBytes);
  const audit=JSON.parse(await readFile(new URL(`data/audits/${manifest.id}.json`,root)));
  const review=verifyAudit(snapshot,snapshotBytes,audit);
  const pkg=JSON.parse(await readFile(new URL('package.json',root)));
  await mkdir(new URL('src/',dist),{recursive:true});await mkdir(new URL('data/',dist),{recursive:true});
  for(const name of ['index.html','styles.css','app.mjs'])await copyFile(new URL(`web/${name}`,root),new URL(name,dist));
  for(const name of ['engine.mjs','validation.mjs','type-expression.mjs','combination.mjs'])await copyFile(new URL(`src/${name}`,root),new URL(`src/${name}`,dist));
  await writeFile(new URL('data/snapshot.json',dist),snapshotBytes);
  await writeFile(new URL('data/build.json',dist),JSON.stringify({appVersion:pkg.version,snapshotId:snapshot.id,snapshotSha256:audit.snapshotSha256,corroborated:review.corroborated},null,2)+'\n');
  return dist;
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {await buildWeb();console.log('Built the audited browser lab in dist/.');}
