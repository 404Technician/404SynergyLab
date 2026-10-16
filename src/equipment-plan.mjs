export const equipmentCategories={body:'Body armour',helmet:'Helmet',gloves:'Gloves',boots:'Boots',amulet:'Amulet',belt:'Belt',ring:'Ring',wand:'Wand',mace:'Mace',staff:'Staff / quarterstaff',bow:'Bow',crossbow:'Crossbow',spear:'Spear',sceptre:'Sceptre',talisman:'Talisman',shield:'Shield',focus:'Focus',quiver:'Quiver',jewel:'Jewel',flask:'Flask / charm'};
const text=(v,max)=>typeof v==='string'&&v.length<=max;
export function validateEquipmentPlan(loadout){
 if(!loadout||!text(loadout.stamp,2000)||!loadout.stamp||!Array.isArray(loadout.items)||loadout.items.length>20)throw new Error('Invalid unique equipment plan (maximum 20 entries).');
 for(const i of loadout.items)if(!text(i.id,400)||!i.id||!text(i.name,200)||!text(i.base,200)||!Object.hasOwn(equipmentCategories,i.category)||typeof i.generated!=='boolean'||!Array.isArray(i.modifiers)||i.modifiers.length>100||i.modifiers.some(m=>!text(m,3000)))throw new Error('Invalid saved equipment item.');
 return loadout;
}
export function equipmentMatches(saved,current){return !!current&&JSON.stringify(saved)===JSON.stringify(current);}
export function analyzeEquipment(loadout,requiredItems=[]){
 validateEquipmentPlan(loadout);
 const findings=[],items=loadout.items,counts=new Map(),add=(level,code,message)=>findings.push({level,code,message});
 for(const i of items)counts.set(i.category,(counts.get(i.category)||0)+1);
 for(const [category,capacity] of Object.entries({body:1,helmet:1,gloves:1,boots:1,amulet:1,belt:1,ring:2}))if((counts.get(category)||0)>capacity)add('conflict','slot-'+category,equipmentCategories[category]+': '+counts.get(category)+' selected for '+capacity+' default '+(capacity===1?'slot':'slots')+'. Check any actual override separately.');
 for(const required of requiredItems)if(!items.some(i=>i.id===required.id))add('missing','required-'+required.id,'Required core item missing: '+required.name+'.');
 if((counts.get('ring')||0)>1&&items.some(i=>i.modifiers.some(m=>/can[’']t use other rings/i.test(m))))add('conflict','other-rings','A selected item says “Can\'t use other Rings”. Do not count both rings as active.');
 if(items.some(i=>['wand','mace','staff','bow','crossbow','spear','sceptre','talisman','shield','focus','quiver'].includes(i.category)))add('review','weapon-sets','Check the actual weapon type, hand use, off-hand pairing and active weapon set. These are not inferred from the catalog category.');
 if(items.some(i=>['jewel','flask'].includes(i.category)))add('review','variable-slots','Verify actual jewel sockets, flask/charm slots, item limits and belt requirements.');
 for(const i of items)if(i.generated||!i.modifiers.length)add('review','unexpanded-'+i.id,i.name+': actual generated or variant modifiers need a manual check.');
 return {findings,conflicts:findings.filter(f=>f.level==='conflict').length,missing:findings.filter(f=>f.level==='missing').length,reviews:findings.filter(f=>f.level==='review').length};
}
export function equipmentTestScope(test,loadout){
 if(!test?.loadout)return 'Equipment was not recorded for this test.';
 return equipmentMatches(test.loadout,loadout)?'Recorded equipment matches this planned setup.':'This test used different planned equipment. Repeat it for the current setup.';
}
