// Original category artwork. Visual themes are presentation hints, never mechanic rules.
const ns='http://www.w3.org/2000/svg';
const paths={
 gem:'M12 2 21 8 18 19 12 23 6 19 3 8Zm-9 6h18M12 2 8 8l4 15 4-15Z',
 cold:'M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M8 4l4 3 4-3M8 20l4-3 4 3M3 11l4-2-1-5M18 20l-1-5 4-2M3 13l4 2-1 5M18 4l-1 5 4 2',
 fire:'M13 2c2 6-5 6-1 11 2-1 3-3 3-5 5 4 7 10 2 13-6 4-16-2-12-8 0 4 3 4 3 1-1-5 5-7 5-12Z',
 lightning:'m13 2-9 12h7l-1 8L21 9h-8Z',
 chaos:'M12 3c7 0 11 8 6 13-4 4-10 2-10-2 0-5 7-5 7-1 0 2-3 3-4 1M6 4 3 7l3 3M18 20l3-3-3-3M5 18c-4-5-2-10 1-12',
 minion:'M7 16C0 11 5 3 12 3s12 8 5 13v5H7Zm0-6 2 2m8-2-2 2m-5 6v3m4-3v3m-3-6 1-2 1 2',
 bow:'M7 3c15 2 15 16 0 18l5-9Zm-4 9h18m-4-4 4 4-4 4',
 crossbow:'M3 7c3-6 15-6 18 0l-9 3Zm9 3v12m-4-8h8m-7 8h6',
 spear:'m14 3 6-1-2 6-4-1Zm1 3L3 21m3-6 3 3',
 staff:'M15 2 21 6 17 12 11 8Zm1 9L5 22M12 4l7 5M3 18l4 4',
 wand:'m6 20 10-13m-4-4 1 3m6-3-2 2m4 5-3-1M3 17l4 3M4 4v4M2 6h4',
 mace:'m10 2 7 2 4 7-6 5-7-3-3-7Zm1 13L4 22m-2-3 4 4',
 shield:'m12 2 9 4-2 10-7 6-7-6L3 6Zm0 4v11M7 9h10',
 focus:'M12 2 21 12 12 22 3 12Zm-4 8 4-4 4 4-4 8Zm-6 2h6m8 0h6',
 helmet:'M4 16V9a8 8 0 0 1 16 0v7l-5 5v-8l-3 3-3-3v8Zm0-8 5 2m11-2-5 2M12 1v9',
 body:'m8 3 4 3 4-3 6 5-3 5-2-2v11H7V11l-2 2-3-5Zm-1 8h10M9 7l3 3 3-3',
 gloves:'M7 20 3 13c-1-3 2-4 4 0V5c0-3 3-3 3 0v6-8c0-2 3-2 3 0v8-7c0-2 3-2 3 0v8-5c0-2 3-2 3 0v9l-3 5H8Z',
 boots:'M7 2h10v12l5 3v4H3v-6l4-3Zm0 6h10M3 18h19M8 3l4 5',
 ring:'M8 9a8 8 0 1 0 8 0M8 5l4-3 4 3-4 6Zm0 0h8',
 amulet:'M5 2v5l7 8 7-8V2M12 10l5 7-5 5-5-5Z',
 belt:'M2 7h20v10H2Zm5 0v10m10-10v10M9 9h6v6H9Zm3 3h7',
 flask:'M9 2h6m-5 0v7L4 18q-1 4 3 4h10q4 0 3-4l-6-9V2M7 15h10M9 5h6',
 quiver:'m6 8 12 3-3 11-11-3Zm3 0 3-6 1 4 3-3-1 6M6 14l10 3',
 talisman:'M4 3c0 7 3 14 8 19 5-5 8-12 8-19l-5 7-3-3-3 3Zm8 8v6',
 support:'m12 2 9 5v10l-9 5-9-5V7Zm0 4 5 3v6l-5 3-5-3V9Zm-9 6h4m10 0h4',
 physical:'m14 2 7 7-5 5-5-5ZM13 12 4 21m-2-4 5 5M10 4l10 10',
};
export function visualTheme(record){
 if(record.kind==='unique')return {symbol:paths[record.category]?record.category:'gem',tone:'unique'};
 if(record.kind==='support')return {symbol:'support',tone:'support'};
 const tags=record.tags||record.skillTypes||[];
 for(const [tag,symbol,tone] of [['Minion','minion','minion'],['Cold','cold','cold'],['Lightning','lightning','lightning'],['Fire','fire','fire'],['Chaos','chaos','chaos'],['Bow','bow','physical'],['Crossbow','crossbow','physical'],['Spear','spear','physical'],['Physical','physical','physical']])if(tags.includes(tag))return {symbol,tone};
 return {symbol:'gem',tone:'skill'};
}
export function recordVisual(record,size='small'){
 const {symbol,tone}=visualTheme(record),box=document.createElement('span');box.className='record-art record-art--'+size+' tone-'+tone;box.setAttribute('aria-hidden','true');
 const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.35');svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');svg.setAttribute('focusable','false');
 const path=document.createElementNS(ns,'path');path.setAttribute('d',paths[symbol]);svg.append(path);box.append(svg);return box;
}
export function combinationVisual(idea){
 const box=document.createElement('ul');box.className='combination-art';box.setAttribute('aria-label','Combination components');
 const records=[...(idea.items|| (idea.item?[{...idea.item,kind:'unique'}]:[])),...idea.skills];
 records.forEach(r=>{
  const node=document.createElement('li');node.className='combination-node';
  const copy=document.createElement('span');copy.className='component-copy';
  const kind=document.createElement('small');kind.textContent=r.kind==='unique'?'UNIQUE':'SKILL';
  const name=document.createElement('span');name.textContent=r.name;
  copy.append(kind,name);node.append(recordVisual(r,'node'),copy);box.append(node);
 });
 return box;
}

// A decorative spell seal made from original geometry and the record's category glyph.
export function recordScene(record){
 const {symbol,tone}=visualTheme(record),box=document.createElement('div');box.className='record-scene tone-'+tone;box.setAttribute('aria-hidden','true');
 const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 280 230');svg.setAttribute('fill','none');svg.setAttribute('focusable','false');
 const shape=(tag,attrs)=>{const node=document.createElementNS(ns,tag);for(const [key,value] of Object.entries(attrs))node.setAttribute(key,String(value));svg.append(node);return node;};
 shape('path',{d:'M0 46h280M0 92h280M0 138h280M0 184h280M46 0v230M92 0v230M138 0v230M184 0v230M230 0v230',stroke:'currentColor',opacity:'.06'});
 for(const [radius,opacity] of [[85,.22],[71,.12],[55,.3]])shape('circle',{cx:140,cy:115,r:radius,stroke:'currentColor',opacity});
 shape('path',{d:'m140 17 85 49v98l-85 49-85-49V66Z',stroke:'currentColor',opacity:'.24'});
 shape('path',{d:'m140 40 65 75-65 75-65-75Z',fill:'currentColor',opacity:'.05'});
 shape('path',{d:'m140 26 4 7-4 7-4-7Zm0 164 4 7-4 7-4-7ZM49 111l7 4-7 4-7-4Zm182 0 7 4-7 4-7-4Z',fill:'currentColor',opacity:'.85'});
 shape('path',{d:paths[symbol],transform:'translate(95 70) scale(3.75)',stroke:'currentColor','stroke-width':'.8','stroke-linecap':'round','stroke-linejoin':'round'});
 for(const [cx,cy,r] of [[36,45,2],[236,38,1.5],[251,175,2],[42,190,1.5],[205,198,1],[77,28,1]])shape('circle',{cx,cy,r,fill:'currentColor',opacity:'.6'});
 box.append(svg);return box;
}
