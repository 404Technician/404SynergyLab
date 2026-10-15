export const skillReviewVersion='pob-bb52d6b-skill-reviews1';
export function validateSkillReviews(reference,data){
 if(data?.schemaVersion!==1||data.id!==skillReviewVersion||data.referenceId!==reference.id||data.sourceRevision!==reference.sourceRevision)throw new Error('Skill review version mismatch');
 const expected=reference.entries.filter(e=>e.kind==='skill'),seen=new Set();
 if(!Array.isArray(data.entries)||data.entries.length!==expected.length)throw new Error('Incomplete skill review coverage');
 for(const review of data.entries){
  const entry=expected.find(e=>e.id===review.id),evidence=entry?.effectEvidence||entry?.evidence;
  if(typeof review.fromItem!=='boolean'||!entry||seen.has(review.id)||review.evidence?.recordSha256!==evidence.recordSha256)throw new Error('Invalid skill review provenance');seen.add(review.id);
  if(!((review.descriptionStatus==='recorded'&&typeof review.description==='string'&&review.description.length)||(review.descriptionStatus==='missing'&&review.description===null)))throw new Error('Invalid skill review description');
 }
 return data;
}
// These are practical source checks, not automatically generated build recommendations.
const checks=[
 [/Corpse|Corpses/,'Use an actual available corpse. Observe whether it is consumed, and how you will obtain the next one against an isolated boss.'],
 [/Power Charge|Frenzy Charge|Endurance Charge/,'Watch the charge counter before and after use. Separate charge generation from charge consumption and measure the repeatable supply.'],
 [/Runic Ward|\bWard\b/,'Measure the actual Runic Ward cost and recovery. Do not count recovering Ward as spending Ward or assume overflow removes the cost.'],
 [/Mana Flask/,'Track Mana Flask charges across repeated uses and recovery; a full flask at the start does not establish sustain.'],
 [/Primed/,'Wait for the exact Primed indicator named in the source. Partial buildup is not a completed condition.'],
 [/Parried|parry/i,'Confirm a successful Parry and its debuff. Ordinary block, evasion and dodge are not interchangeable with Parried.'],
 [/Blood Loss|Bleeding/,'Distinguish applying Bleeding from accumulated Blood Loss, and check whether the payoff consumes the existing Bleed.'],
 [/Ice Fragments|Ice Crystals/,'Check the exact object type and whether it survives the payoff. Ice Fragments and Ice Crystals are not interchangeable.'],
 [/Glory|Fury/,'Measure the named resource from the stated qualifying event. Activation at a full meter does not establish permanent uptime.'],
 [/\bRage\b/,'Measure Rage generation, spending and any Life loss. Start with and without Rage rather than assuming the cap is always available.'],
 [/Infusion/,'Generate and collect the required Infusion before use. Check which element is spent and whether another skill already consumed it.'],
 [/Perfect Timing/,'Compare a correctly timed release with an ordinary release; the larger payoff must actually satisfy Perfect Timing.'],
 [/Channell?ing|Channel/,'Measure channel duration, resource drain and interruption safety. Continuing effects are not necessarily separate casts by you.'],
 [/on Command|Commanded|Command/,'Test the actual command, target selection and cooldown separately from the minion’s ordinary autonomous actions.'],
 [/socketed|Socketed/,'Verify the exact socket eligibility and the socketed skill’s weapon, cost and cooldown restrictions. A shared display tag is not sufficient.'],
 [/Remnant/,'Generate and collect a real Remnant. Check its type, location and duration; an uncollected Remnant has not supplied its resource.'],
 [/Ground|ground surface/i,'Check the actual ground surface and its overlap or duration. An ailment on an enemy is not necessarily a ground surface.'],
 [/Heavy Stun|Stun buildup/,'Observe actual Stun buildup and the Heavy Stun event; avoid spending a Primed window with the wrong skill.'],
 [/Freeze|Frozen|Shock|Ignite|Electrocut|Poison/,'Confirm the exact ailment on the intended target and any consumption. A damage type or a chance to inflict it does not prove it occurred.'],
 [/Block|Shield raised/,'Use a predictable Blockable attack in a low-risk test and watch Heavy Stun buildup. Do not extrapolate to unBlockable damage.'],
 [/Presence/,'Measure the actual Presence range with the intended target. Outside-range behavior and moving targets need a separate test.'],
 [/replaces? your dodge|dodge roll/i,'Check the replacement movement and cooldown. Do not assume every roll-dependent effect treats a replacement as a normal dodge roll.'],
 [/Life|Energy Shield|Mana/,'Inspect actual resource changes over a short repeatable interval, including any reservation, recovery delay or Life cost.'],
];
export function describeSkillReview(entry,review,profile){
 const text=review.description||'',types=profile.skillTypes||[],tags=entry.tags||[];
 let role='Active skill';
 if(review.descriptionStatus==='missing')role='Description unavailable';
 else if(entry.name.includes('{0}'))role='Bound creature template';
 else if(types.includes('Meta')||/socketed|Socketed/.test(text))role='Socketed-skill setup';
 else if(entry.category==='Mark'||tags.includes('Mark'))role='Mark setup';
 else if(tags.includes('Curse'))role='Curse / enemy debuff';
 else if(profile.minionContext||entry.category==='Minion')role='Minion / command';
 else if(/While active|Emit an Aura/.test(text)||entry.category==='Buff')role='Buff / ongoing effect';
 else if(tags.includes('Travel'))role='Movement / positioning';
 else if(types.includes('Attack'))role='Attack';
 else if(types.includes('Spell'))role='Spell';
 const practical=checks.filter(([pattern])=>pattern.test(text)).map(([,message])=>message);
 if(!practical.length)practical.push('Test the skill alone on a durable target. Observe its actual effect, resource cost and timing before assigning it a build role.');
 if(review.descriptionStatus==='missing')practical.splice(0,practical.length,'Inspect the source record and its producer skills first. Independent casting and a valid combination are not established by this catalog entry.');
 if(entry.name.includes('{0}'))practical.unshift('Bind the actual monster or Companion first, then inspect its real attacks, command behavior and costs.');
 const statements=text.split(/(?<=[.!?])\s+(?=[A-Z])/).map(s=>s.trim()).filter(s=>/cannot|can only|requires|consum|instead|if |while |does not|must |only |not |when /i.test(s));
 const warnings=[];
 if(review.fromItem&&review.descriptionStatus==='recorded'&&!entry.name.includes('{0}'))warnings.push('Item-granted skill: obtain the actual granting item, verify its variant and check whether access is manual or triggered. Catalog inclusion does not make this an independently available skill gem.');
 if(entry.weaponRequirements)warnings.push('Requires '+entry.weaponRequirements+'. Check all proposed partners against this weapon setup.');
 if(entry.name.includes('{0}'))warnings.push('This is a bound-creature template. The bound monster determines its actual attacks and behavior; no fixed monster ability is inferred.');
 if(review.descriptionStatus==='missing')warnings.push('The pinned source has no description for this record. Its independent use and interactions remain unresolved; no replacement description or combination is invented.');
 if(profile.cannotBeSupported)warnings.push('The source marks this skill as unable to receive supports.');
 if(/Cannot be Triggered/.test(text))warnings.push('This source explicitly says the skill cannot be Triggered.');
 return {role,practical,statements,warnings,descriptionStatus:review.descriptionStatus};
}
