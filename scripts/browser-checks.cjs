const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const {mkdir}=require('node:fs/promises');
const path=require('node:path');
const {chromium}=require(require.resolve('playwright',{paths:[process.cwd(),process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES].filter(Boolean)}));
let checks=0;
async function main(){
 const server=spawn(process.execPath,['scripts/serve-web.mjs'],{env:{...process.env,PORT:'0'},stdio:['ignore','pipe','pipe']});
 let browser;
 try{
  const base=await new Promise((resolve,reject)=>{let output='';const timer=setTimeout(()=>reject(new Error('Server startup timed out')),15000);server.stdout.on('data',chunk=>{output+=chunk;const match=output.match(/http:\/\/127\.0\.0\.1:\d+/);if(match){clearTimeout(timer);resolve(match[0]);}});server.on('exit',code=>{clearTimeout(timer);reject(new Error(`Server exited: ${code}`));});server.stderr.on('data',chunk=>process.stderr.write(chunk));});
  browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE ? {executablePath:process.env.CHROMIUM_EXECUTABLE} : {})});
  const traversal=await fetch(base+'/%2e%2e%2fpackage.json');assert.equal(traversal.status,403);checks++;console.log('PASS: server blocks encoded directory traversal');
  const privateFile=await fetch(base+'/package.json');assert.equal(privateFile.status,404);checks++;console.log('PASS: server exposes only the browser build');
  const context=await browser.newContext({viewport:{width:1440,height:1050},permissions:['clipboard-read','clipboard-write']});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);await page.locator('#workspace').waitFor({state:'visible'});
  assert.equal(await page.locator('#skill-title').textContent(),'Spark');assert.match(await page.locator('#data-notice').textContent(),/CANDIDATE DATA/);checks++;console.log('PASS: default Spark and candidate-data notice');
  assert.equal(await page.locator('.support-card').count(),8);checks++;console.log('PASS: all support cards loaded');
  await page.locator('[data-filter="compatible"]').click();assert.equal(await page.locator('.support-card.incompatible').count(),0);checks++;console.log('PASS: type-match filter');
  await page.locator('#support-search').fill('Brutality');assert.equal(await page.locator('.support-card').count(),1);assert.match(await page.locator('.warning').first().textContent(),/elemental/);checks++;console.log('PASS: support search keeps tradeoff visible');
  await page.locator('#support-search').fill('does-not-exist');assert.equal(await page.locator('.empty-support').count(),1);checks++;console.log('PASS: empty filter state');
  await page.locator('#support-search').fill('');await page.locator('[data-filter="all"]').click();
  await page.locator('.skill-button[data-id="ice-nova"]').click();assert.equal(await page.locator('#context-control').isVisible(),true);
  await page.locator('#sideways-cascade').check();assert.match(await page.locator('[data-interaction="ice-nova-frostbolt"] .connection-label').textContent(),/BLOCKED/);checks++;console.log('PASS: cascade context blocks the recorded interaction');
  await page.locator('#share').click();const shared=await page.evaluate(()=>navigator.clipboard.readText());assert.match(shared,/skill=ice-nova/);assert.match(shared,/snapshot=pob-bb52d6b-review1/);assert.match(shared,/cascade=sideways/);checks++;console.log('PASS: shared link preserves skill, snapshot and context');
  const restored=await context.newPage();await restored.goto(shared);await restored.locator('#workspace').waitFor({state:'visible'});assert.equal(await restored.locator('#sideways-cascade').isChecked(),true);checks++;console.log('PASS: shared link restores the selection');await restored.close();
  await page.locator('#skill-search').fill('lightning');assert.equal(await page.locator('.skill-button:visible').count(),2);checks++;console.log('PASS: skill search');
  await page.locator('.skill-button[data-id="lightning-arrow"]').click();assert.match(await page.locator('#interactions').textContent(),/Lightning Rod/);assert.equal(await page.locator('#context-control').isVisible(),false);assert.equal(await page.locator('#share').textContent(),'Copy link ↗');checks++;console.log('PASS: switching skills updates interactions and context controls');
  await page.locator('#skill-search').fill('');
  if(process.env.SCREENSHOT_DIR){await mkdir(process.env.SCREENSHOT_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.SCREENSHOT_DIR,'desktop.png'),fullPage:true});}
  await page.setViewportSize({width:390,height:844});await page.locator('.skill-button[data-id="ice-nova"]').click();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth),true);checks++;console.log('PASS: narrow screen has no horizontal overflow');
  if(process.env.SCREENSHOT_DIR)await page.screenshot({path:path.join(process.env.SCREENSHOT_DIR,'mobile.png'),fullPage:true});
  await page.goto(`${base}/?snapshot=missing&skill=spark`);await page.locator('#load-error').waitFor({state:'visible'});assert.equal(await page.locator('#workspace').isVisible(),false);checks++;console.log('PASS: unavailable historical snapshot hides results');
  await page.route('**/data/snapshot.json',async route=>{const response=await route.fetch();const text=await response.text();await route.fulfill({response,body:text+' '});});
  await page.goto(base);await page.locator('#load-error').waitFor({state:'visible'});assert.match(await page.locator('#load-error').textContent(),/saved source review/);assert.equal(await page.locator('#workspace').isVisible(),false);checks++;console.log('PASS: tampered dataset hides results');
  assert.deepEqual(errors,[]);checks++;console.log('PASS: no browser script errors');console.log(`${checks} browser checks passed.`);
 } finally {if(browser)await browser.close();server.kill();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
