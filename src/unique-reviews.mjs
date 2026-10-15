// Guides inspect source modifiers. They never infer a skill partner from a shared tag.
const metadata=/^(?:Has Alt Variant|Selected (?:Alt )?Variant|Selected Alt Variant (?:Two|Three)|Version:|Crafted:)/;
export function uniqueModifiers(detail,variant='Current'){
 return (detail?.modifiers||[]).filter(m=>!metadata.test(m.text)&&(!m.variants.length||m.variants.includes(variant))&&(!m.versions?.length||m.versions.includes('Current')));
}
const checks=[
 [/Convert|Converted|instead of|Contributes to/i,'Damage routing','Inspect the affected skill component before and after equipping. Conversion, extra damage and ailment contribution are different rules; do not transfer player modifiers to minions.'],
 [/Gain .*as [Ee]xtra|added .*damage|Adds .*Damage/,'Added / extra damage','Check the actual damage base and scope: attacks, spells, this weapon or a named skill. Extra damage does not replace the original damage type.'],
 [/Trigger|Energy Generation|Energy spent/,'Trigger setup','Verify the exact qualifying event, socket eligibility, Energy threshold and actual cost. A granted skill alone is not an automatic trigger or a recursive loop.'],
 [/Grants Skill/,'Skill access','Obtain the granted skill from this exact item and inspect its level, weapon requirements and manual or triggered activation.'],
 [/Poison|Bleed|Ignit|Chill|Freez|Frozen|Shock|Electrocut|Ailment/,'Ailment interaction','Confirm application, eligible damage, magnitude, duration and the target threshold. Damage contributing to an ailment does not itself supply a chance to apply it.'],
 [/Critical|Critically/,'Critical-hit interaction','Measure repeatable critical hits on a durable target. Critical chance, damage bonus and a first-hit condition are separate; damage over time does not repeatedly crit.'],
 [/Minion|Companion|Allies/,'Minions / allies','Check the exact recipient and reservation. Your hits, your minions’ hits and nearby allies are different scopes. Test command behavior and minion survival.'],
 [/Presence|metres|Radius/,'Range / positioning','Test inside and outside the stated range, including a moving target. Presence is a condition, not automatic full-arena coverage.'],
 [/Charge|Rage|Glory|Combo|Rhythm|Runic Binding/,'Resource cycle','Measure generation, consumption and any forced loss over several cycles, including a boss without adds. Starting at the cap does not prove repeatable supply.'],
 [/Flask|Charm/,'Flasks / charms','Check charges, activation conditions and duration. Spending flask charges through a skill is not necessarily using a flask.'],
 [/Life|Mana|Energy Shield|Runic Ward|Recoup|Leech|Regenerat|Recharge/,'Recovery / costs','Track actual costs and recovery delays with this item equipped. Recoup, recharge, regeneration and leech do not replace each other.'],
 [/Block|Parry|Parried|Shield Skills/,'Block / Parry','Check whether blocking or shield skills are allowed. Parry, ordinary block and taking damage from a blocked hit are separate conditions.'],
 [/Armour|Evasion|Resistance|Deflect|Damage Reduction|Damage taken/,'Defence','Compare the resulting character defences and actual incoming damage. Account for reduced caps, lost recovery and damage taken as another type.'],
 [/Cooldown|Skill Speed|Attack Speed|Cast Speed|Perfect Timing/,'Timing','Compare actual cooldown, action time and release timing. A faster action or longer timing window does not remove costs or guarantee the timing bonus.'],
 [/Jewel|Sockets|Socket|Historic|Conquered|Passive/,'Sockets / passives','Inspect the real socket contents, passive allocation and radius. No generated jewel roll or passive transformation is simulated here.'],
 [/Strength|Dexterity|Intelligence|Attribute/,'Attributes','Check the resulting attribute requirements and the actual scaling base, including any penalties to other attributes.'],
 [/Rarity|Light Radius|Movement|Sprint|Dodge|Tailwind|Onslaught/,'Utility / movement','Compare the real utility and uptime against the item slot it replaces. Utility stats alone do not establish a damage combination.'],
];
const caveats={
 'Plaguefinger':'This item forbids Elemental Ailments. Its poison-magnitude rule still needs an actual way to inflict Poison.',
 'Saffell\'s Frame':'Cannot Block: do not propose Cast on Block as a working payoff from this shield.',
 'Redemption':'Cannot load or fire Ammunition: use an eligible grenade route; ordinary ammunition attacks are excluded.',
 'Cospri\'s Will':'Infinite Curse duration conflicts with payoffs requiring half of the Curse duration to expire. Do not assume an infinite-duration Curse becomes eligible for Hexblast.',
 'Ungil\'s Harmony':'No Critical Damage Bonus: a critical-hit trigger may still be relevant, but critical damage scaling needs a separate assessment.',
 'Indigon':'Mana recovery other than Regeneration cannot recover Mana. Do not budget Mana Flasks or Remnants as working recovery.',
 'Thief\'s Torment':'Cannot use other Rings. Include the lost second ring when comparing both offence and defence.',
 'The Wailing Wall':'Cannot use Shield Skills despite the granted Raise Shield entry. A grant does not override this restriction.',
 'Tyranny\'s Grip':'Cannot use Projectile Attacks despite the granted Spear Throw entry. Verify a non-projectile spear route.',
 'The Prisoner\'s Manacles':'Cannot Immobilise enemies. Do not propose Freeze, Pin or another immobilisation payoff without resolving this restriction.',
 'Kaom\'s Heart':'No Spirit: check every intended persistent skill, reservation and minion before using this body armour.',
 'Gravebind':'Kill credit alone does not establish that you made a melee kill, a critical hit or the killing attack.',
 'Blackflame':'The Ignite deals Chaos damage; the Fire hit itself is not converted by this rule. Compare the much shorter Ignite duration and maintain actual Ignite uptime.',
 'Blistering Bond':'Fire damage contributing to Bleeding magnitude does not itself grant Bleeding chance.',
 'The Rat Cage':'Only Fire damage from Hits is taken as Physical damage. Fire damage over time is outside this modifier.',
 'Hateforge':'Reaching maximum Rage consumes all Rage and grants a random Charge. Do not assume a reliable chosen Charge or permanent maximum Rage.',
 'Voll\'s Protector':'A chance to gain a Charge needs repeated qualifying critical hits; it does not guarantee maximum Charges before each spender.',
 'Widowhail':'Scaling equipped Quiver bonuses requires a real quiver; it does not invent base weapon damage or a skill effect.',
 'Yriel\'s Fostering':'The two Companions must be of different types; this does not allow two copies of the same Companion.',
};
export function describeUniqueReview(entry,detail){
 if(entry?.kind!=='unique'||!detail||detail.id!==entry.id||detail.kind!=='unique'||detail.evidence?.recordSha256!==entry.evidence.recordSha256)throw new Error('Invalid unique guide provenance');
 if(detail.generated)return {status:'generated',roles:['Generated item family'],effects:[],conditions:[],warnings:['Generated modifiers are not expanded in the pinned source snapshot. Inspect the actual rolled item before assigning a skill partner.'],practical:['Record the actual modifiers, sockets and rolls, then check each named requirement. This family entry does not establish a fixed combination.']};
 const effects=uniqueModifiers(detail),text=effects.map(m=>m.text).join('\n'),matched=checks.filter(([pattern])=>pattern.test(text));
 const variants=[...new Set(detail.modifiers.flatMap(m=>m.variants))],versions=[...new Set(detail.modifiers.flatMap(m=>m.versions||[]))],warnings=[];
 if(versions.length)warnings.push('Source versions differ. Only Current-version modifiers are used here; historical versions remain in the source stats.');
 if(variants.length)warnings.push(variants.includes('Current')?'This guide uses common modifiers plus the source Current variant. Historical and alternate variants are listed separately below.':'No single Current variant is defined. This guide covers common modifiers only; inspect the named alternatives below before choosing a setup.');
 if(caveats[entry.name])warnings.push(caveats[entry.name]);
 const conditions=effects.filter(m=>/cannot|can't|no |lose|sacrifice|reduced|less |instead|only|while|when|if |per |maximum|limit/i.test(m.text)).map(m=>m.text);
 return {status:'fixed',roles:matched.length?matched.map(([,role])=>role):['Item stats / utility'],effects,conditions,warnings,practical:matched.length?matched.map(([, ,check])=>check):['Compare the exact item rolls, requirements and occupied slot with your current equipment. No specific skill interaction is established by these stats alone.']};
}
