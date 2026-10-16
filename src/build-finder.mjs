// Editorial labels describe the recorded core interaction, never a complete build.
export const finderVersion = 'directions1';
export const finderLabels = {
 style: {all:'Any playstyle',ranged:'Ranged attacks',caster:'Caster',minions:'Minions',melee:'Melee',utility:'Defensive / utility'},
 control: {all:'Any controls',low:'One active skill core',sequence:'Manual sequence',trigger:'Event-triggered follow-up',passive:'Reserved / passive core'},
 gear: {all:'Any unique requirement',none:'No unique required',required:'Requires a unique'}
};
export const buildDirections = [
 ['gas-arrow-radiant-grief','ranged','low','Ignited enemies must touch the cloud inside your Presence. Bow required.'],
 ['gas-arrow-flame-wall','ranged','sequence','Ignite the enemy with Flame Wall, then place gas. Bow required.'],
 ['cold-fireball-comet','caster','trigger','Manually cast Fireball; Comet needs real ailments, Energy, Spirit and Mana.'],
 ['unearth-bone-bombs','minions','low','Unearth needs remains, Infernal Legion I and Minion Instability; explosions need actual Low Life.'],
 ['sacrifice-bone-army','minions','sequence','Sacrifice, eligible reviving undead and Spirit are required; consuming the army removes protection.'],
 ['persistent-death-comet','minions','trigger','A persistent minion must actually be killed; revival, Energy and triggered Mana costs limit the cycle.'],
 ['living-lightning-arrow','ranged','low','A Bow and Living Lightning are required; the hit must deal actual Lightning damage.'],
 ['review-frost-darts-chill','caster','sequence','Apply real Chill with Frostbolt before Frost Darts hits; this does not supply Cold Infusions.'],
 ['review-bitter-darts','caster','sequence','Bitter Dead needs corpses and Ward; enemies must stay near a core for its Chill.'],
 ['review-grim-cascade','melee','sequence','Quarterstaff and Ward required. The final Glacial Cascade spike must hit the Ice Crystal.'],
 ['review-ghost-wind','utility','passive','Reserve both buffs with Spirit, a martial weapon and recoverable ES; stage-loss timing is untested.'],
 ['coverage-review-veil-elemental','caster','sequence','Apply Elemental Weakness, then kill a cursed enemy with Spark; curse delay, limit and range still apply.'],
 ['coverage-review-veil-enfeeble','utility','sequence','Apply Enfeeble before the cursed enemy dies; spread needs another enemy nearby.'],
 ['coverage-review-powertread-illusion','caster','sequence','Roll, let an enemy destroy the illusion, collect the Remnant, then retain charges for Spark crits.'],
 ['coverage-review-vis-reavers','minions','passive','Reserve Skeletal Reavers with Spirit; compare their damage gain against lost Life and revive downtime.'],
 ['coverage-review-myris-fear','melee','low','Both uniques and a Quarterstaff are required. Crushing Fear needs a real low-life cull and kill.'],
 ['unique-audit-64','utility','trigger','Equip Svalinn, socket a legal spell and actually block hits; Energy, Mana and damage taken still need testing.']
].map(([recipeId,style,control,requirement])=>Object.freeze({recipeId,style,control,requirement,testStatus:'Source checked · game test pending'}));
export function validateFinderFilters(input={}) {
 const output={};
 for(const key of Object.keys(finderLabels)) {
  const value=input[key]??'all';
  if(!Object.hasOwn(finderLabels[key],value))throw new Error('Invalid build finder '+key+' filter.');
  output[key]=value;
 }
 return output;
}
export function filterBuildDirections(directions,filters={}) {
 const f=validateFinderFilters(filters);
 return directions.filter(d=>(f.style==='all'||d.style===f.style)&&(f.control==='all'||d.control===f.control)&&(f.gear==='all'||(f.gear==='required'?d.idea.items.length>0:d.idea.items.length===0)));
}
// Resolve against active recipes. Missing records must never become plausible-looking cards.
export function resolveBuildDirections(resolve) {
 const seen=new Set();
 return buildDirections.map(d=>{
  if(seen.has(d.recipeId))throw new Error('Duplicate build direction');seen.add(d.recipeId);
  const idea=resolve(d.recipeId);
  if(!idea?.skills?.length||!idea.buildPlan?.firstTest)throw new Error('Missing build direction recipe: '+d.recipeId);
  const items=idea.items||(idea.item?[idea.item]:[]);
  return {...d,idea:{...idea,items}};
 });
}
