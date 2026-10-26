import {createRng} from '../vendor/pigment-drift/engine/params';
import type {BirdId} from './catalog';

interface BirdPoetics {titles:readonly string[];lines:readonly [readonly string[],readonly string[],readonly string[]]}
/** Original verses rooted in habitat, feeding, nesting and seasonal life.
 * Each position is a complete image, not a bird name pasted into a colour poem.
 */
export const BIRD_POETICS:Record<BirdId,BirdPoetics>={
  geai:{titles:['La mémoire des chênes','Les glands oubliés','Un bois en devenir'],lines:[
    ['Au pli de la chênaie','Un geai traverse les branches','Sous les feuilles du chêne'],
    ['Un gland dort dans la terre','Le geai enfouit son automne','Un cri déplie la lisière'],
    ['L’oubli fera forêt','Un chêne attend sous la mousse','La terre garde une réserve']]},
  mesange:{titles:['Le berceau de l’écorce','La branche suspendue','Les faims du vieux pommier'],lines:[
    ['Au trou du vieux pommier','Une mésange sous la branche','Au seuil du nid de mousse'],
    ['Une chenille au bout du bec','La branche tient dans deux griffes','Des becs s’ouvrent dans le bois'],
    ['Le nid respire dans l’écorce','Une graine traverse l’hiver','Le jardin retrouve ses ailes']]},
  bouvreuil:{titles:['Les bourgeons du verger','Le sifflet des haies','Deux ombres au verger'],lines:[
    ['Dans les haies du verger','Deux bouvreuils entre les ronces','Un sifflet au fond des branches'],
    ['Un bourgeon cède au bec','Le bouvreuil égrène la haie','Deux souffles passent de branche en branche'],
    ['Le verger garde leur sifflet','Une graine reste au buisson','Les bourgeons attendent la pluie']]},
  sittelle:{titles:['La tête vers la terre','Le secret des fentes','L’argile au seuil du nid'],lines:[
    ['Sur le tronc du vieux hêtre','La sittelle descend le chêne','Dans la fente de l’écorce'],
    ['La tête cherche vers la terre','Une noisette tient dans le bois','Un peu de boue resserre le nid'],
    ['L’écorce garde une réserve','Un appel remonte le tronc','L’argile protège les petits']]},
  picvert:{titles:['Le rire dans la prairie','La route des fourmis','Le sol sous les ailes'],lines:[
    ['Au bord du pré tranquille','Un pic vert dans l’herbe courte','Sous les pommiers de la prairie'],
    ['La langue rejoint les fourmis','Un rire traverse le verger','Le bec entrouvre la terre'],
    ['Les fourmis rentrent sous l’herbe','Le pré garde un éclat de rire','Un vieux tronc abrite le nid']]},
  rougegorge:{titles:['La veille du jardin','Le royaume des feuilles','Un chant contre le froid'],lines:[
    ['Au bord de la bêche','Un rouge-gorge dans la haie','Sous les feuilles du jardin'],
    ['Un ver paraît dans la terre','Le chant dessine un territoire','Le rouge-gorge veille au passage'],
    ['Un chant demeure en hiver','La haie recueille un nid caché','La terre remuée se repose']]},
  corneille:{titles:['Les veilleurs du labour','La mémoire des champs','Le vent des grands nids'],lines:[
    ['Deux corneilles sur le labour','En haut du peuplier','À la lisière des champs'],
    ['Un bec retourne une motte','Le couple veille sur les branches','Un cri franchit les sillons'],
    ['Le grand nid tient dans le vent','Les champs gardent leurs sentinelles','Deux ombres reprennent le ciel']]},
  pie:{titles:['Le toit des brindilles','Les chemins de la haie','La famille des rameaux'],lines:[
    ['Deux pies longent la haie','Dans la fourche de l’épine','Un pas de pie dans la prairie'],
    ['Le nid se couvre de brindilles','Un cri rassemble les rameaux','Une pie retourne les feuilles'],
    ['Un toit protège les petits','La haie se souvient des passages','La famille rejoint les branches']]},
  merle:{titles:['La pluie sous les feuilles','Le soir des jardins','Les baies de la haie'],lines:[
    ['Un merle au pied des haies','Sur le faîte du jardin','Dans les feuilles après la pluie'],
    ['Un ver traverse la litière','Le bec soulève une feuille','Le chant rejoint le soir'],
    ['Une baie demeure à la branche','Le jardin écoute encore','La pluie entrouvre la terre']]},
  rossignol:{titles:['La nuit des fourrés','Le retour aux ronces','Une gorge dans la nuit'],lines:[
    ['Dans l’épaisseur des ronces','Un rossignol sous les feuilles','Au retour des nuits tièdes'],
    ['Le chant déborde le fourré','Une gorge éclaire la nuit','Le nid se cache près du sol'],
    ['Les ronces gardent leur secret','Un long voyage attend les ailes','La nuit écoute sous les feuilles']]},
  fauvette:{titles:['Le passage des baies','La voix des buissons','Un nid dans les ronces'],lines:[
    ['Une fauvette au fond des haies','Au creux d’un buisson dense','Dans les feuilles du sureau'],
    ['Un chant remue les feuillages','Le bec recueille une baie','Les brindilles portent le nid'],
    ['Les graines voyagent avec l’aile','Le buisson garde une voix','Une baie promet un autre arbre']]},
  hirondelle:{titles:['Le fil des retours','La boue devenue berceau','Le ciel au ras des prés'],lines:[
    ['Sous la poutre de la grange','Une hirondelle au-dessus du pré','Au fil du long voyage'],
    ['La boue devient un berceau','Le bec recueille l’insecte en vol','Un virage effleure l’étang'],
    ['La grange attendra le retour','Le vent prolonge le voyage','Un nid se souvient des ailes']]},
  etourneau:{titles:['La nuit en murmuration','Les fruits et la nuée','Le dortoir des roseaux'],lines:[
    ['Des étourneaux dans le pré','Au seuil du grand dortoir','Une nuée au-dessus des roseaux'],
    ['Les becs entrouvrent le sol','Mille ailes changent de direction','Une gorge emprunte d’autres voix'],
    ['Le soir rassemble les ailes','Les roseaux abritent la nuit','La nuée rejoint son repos']]},
  chouette:{titles:['Le creux du vieil arbre','La veille des lisières','La nuit entre deux ailes'],lines:[
    ['Une chouette au creux du hêtre','Au bord du bois nocturne','Dans le silence des grands arbres'],
    ['Un cri répond depuis la lisière','L’aile écoute au ras du sol','Le vieux tronc abrite les petits'],
    ['Le sous-bois retrouve son souffle','La cavité retient la chaleur','La nuit referme ses branches']]},
  hibou:{titles:['Le repos des conifères','Les oreilles de la nuit','Le pré sous les étoiles'],lines:[
    ['Un hibou dans les conifères','À la lisière du pré','Sous la ramure immobile'],
    ['Un campagnol froisse les herbes','Deux ailes écoutent la prairie','Un ancien nid devient refuge'],
    ['Les branches abritent le repos','La nuit reprend son murmure','Le jour le cache dans les aiguilles']]},
};

/** A trio contributes one living image per verse, including unpainted choices.
 * A single-species work explores three moments of the same bird's life.
 */
export function composeBirdPoem(birds:readonly BirdId[],seed:number):{title:string;verses:[string,string,string]}|null{
  const ids=[...new Set(birds)].filter(id=>id in BIRD_POETICS).slice(0,3);
  if(!ids.length)return null;
  const hash=ids.reduce((h,id)=>[...id].reduce((n,c)=>Math.imul(n^c.charCodeAt(0),16777619)>>>0,h),seed>>>0);
  const rng=createRng(hash),pick=<T,>(items:readonly T[]):T=>items[Math.floor(rng()*items.length)];
  for(let i=ids.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]];}
  const profiles=ids.map(id=>BIRD_POETICS[id]);
  const verses=[0,1,2].map(i=>pick(profiles[i%profiles.length].lines[i])) as [string,string,string];
  return {title:pick(profiles[0].titles),verses};
}
