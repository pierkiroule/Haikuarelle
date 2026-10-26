import {createRng} from '../vendor/pigment-drift/engine/params';
import type {BirdId} from './catalog';
import type {Point} from '../engine/types';
export interface BirdMark {bird:BirdId;point:Point;seed:number}
const openings:Record<BirdId,string>={
  rougegorge:'Au bord du matin',merle:'Un chant dans le bleu',rossignol:'Un éclat de nuit',fauvette:'Le vent sous les pins',
  hirondelle:'Sur le fil du jour',geai:'L’écho prend son vol',etourneau:'Le bois se souvient',chouette:'Un soir de velours',hibou:'Sous le ciel d’ardoise',corneille:'Un trait dans la nuit',
  mesange:'Un trille dans l’air',bouvreuil:'Le rose s’endort',sittelle:'Au creux de l’écorce',picvert:'Un rire sous bois',pie:'Des perles dans l’air',
};
const colors:Record<string,string>={estuaire:'Bientôt l’or rencontre le bleu',lichen:'La mousse se souvient de toi',argile:'L’argile se souvient de toi',brume:'Le silence épouse tes mains',ambre:'Le soleil se pose sur l’eau'};
/** Original, local poetic grammar: choices and placement shape the three verses. */
export function makeHaiku(marks:BirdMark[],palette:string,seed:number):[string,string,string]|null{
  if(!marks.length)return null;
  const counts=new Map<BirdId,number>();for(const mark of marks)counts.set(mark.bird,(counts.get(mark.bird)??0)+1);
  const dominant=[...counts].sort((a,b)=>b[1]-a[1]).map(([id])=>id);
  const rng=createRng(seed^marks.reduce((h,m)=>(Math.imul(h,31)^m.seed)>>>0,0));
  const most=counts.get(dominant[0])!,leaders=dominant.filter(id=>counts.get(id)===most);
  const bird=leaders[Math.floor(rng()*leaders.length)];
  const y=marks.reduce((sum,m)=>sum+m.point.y,0)/marks.length;
  const endings=y<.4?['Un ciel dans la main','Tout le jour est bleu']:y>.65?['L’eau retient ton nom','Un reflet demeure']:['Le vent se souvient','Le blanc nous répond','Ton souffle est resté'];
  const plumage:Partial<Record<BirdId,string>>={corneille:'Ton encre murmure au matin',rougegorge:'Le feu se repose dans l’eau',geai:'Le bleu se déplie dans l’eau',mesange:'Le soleil traverse le bleu',bouvreuil:'La cendre accueille la pivoine',sittelle:'Un peu de feu dans l’ardoise',picvert:'L’or frissonne au creux des mousses',pie:'Le noir éveille le papier'};
  return [openings[bird],palette==='plumages'?(plumage[bird]??colors.estuaire):(colors[palette]??colors.estuaire),endings[Math.floor(rng()*endings.length)]];
}
