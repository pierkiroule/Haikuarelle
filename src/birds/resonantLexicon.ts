import type {BirdId} from './catalog';
/** Original sensory openings, rooted in each bird's habitat and behaviour. */
export const SENSORY_OPENINGS:Record<BirdId,readonly [string,string,string]>={
 geai:['Un gland tiède au creux du bec','Sous le chêne, un cri de soie','La mousse embaume les glands'],
 mesange:['Au nid, la mousse est tiède','Deux griffes au parfum d’écorce','Un ventre de soleil frémit'],
 bouvreuil:['Un bourgeon fond sous le bec','Le verger siffle à voix douce','Une braise au creux des haies'],
 sittelle:['Tête en bas, l’écorce crisse','Au nid, l’argile est encore tiède','Une noisette au goût de bois'],
 picvert:['Un rire roule dans l’herbe','Sous le bec, la terre est fraîche','Les fourmis froissent le pré'],
 rougegorge:['La bêche ouvre un parfum d’humus','Une braise chante dans le givre','Le lierre réchauffe un nid'],
 corneille:['Le labour fume sous le bec','Deux voix de suie dans les champs','Le nid craque au peuplier'],
 pie:['Les brindilles craquent au nid','Du lait, de l’encre sur l’aile','La haie crépite de cris'],
 merle:['Un bec d’or froisse les feuilles','La pluie parfume le jardin','Un sifflet mûrit dans le soir'],
 rossignol:['La ronce est chaude dans la nuit','Une gorge fait mûrir l’ombre','Sous les feuilles, la nuit palpite'],
 fauvette:['Le sureau tache un petit bec','Un chant frissonne dans les ronces','Le buisson sent la baie mûre'],
 hirondelle:['Au nid, la boue garde le frais','Une aile effleure l’étang','La grange sent la paille chaude'],
 etourneau:['Mille ailes froissent les roseaux','Une gorge emprunte mille voix','La nuée sent venir le soir'],
 chouette:['Un duvet boit la nuit fraîche','Au creux du hêtre, un souffle chaud','La lisière murmure au nid'],
 hibou:['Les aiguilles embaument le repos','Un froissement au ras du pré','Deux ailes écoutent la nuit'],
};
/** Title and closing couplet are selected together, never recombined at random.
 * Rhymes are audible echoes, not spelling suffixes; these are free three-line
 * poems, without claiming a strict 5/7/5 metre. Dream images remain metaphors.
 */
export const RESONANT_STANZAS={
 islands:[
  {title:'L’archipel',image:'L’archipel goûte le sel',echo:'Un nid rêve au bord du ciel'},
  {title:'Les rives',image:'Les rives boivent la lumière',echo:'Une aile y rêve une rivière'},
  {title:'Les escales',image:'Aux escales, l’odeur du soir',echo:'Un chant déplie un fruit tout noir'},
 ],
 branching:[
  {title:'Les racines',image:'Les racines ont goût de terre',echo:'Un chant y couve une lumière'},
  {title:'Les chemins',image:'Les chemins sentent le froment',echo:'Un bec y sème un firmament'},
  {title:'La ramure',image:'La ramure frissonne d’or',echo:'Une graine y rêve encore'},
 ],
 rising:[
  {title:'L’élan',image:'L’élan soulève un vent de miel',echo:'Une aile en déplie le ciel'},
  {title:'La cime',image:'La cime a la fraîcheur du vent',echo:'Un chant la traverse en rêvant'},
  {title:'L’ascension',image:'L’ascension fait vibrer la nuit',echo:'Une étoile au bec devient fruit'},
 ],
 veil:[
  {title:'Le souffle',image:'Le souffle a la douceur du soir',echo:'Un nid flotte en velours noir'},
  {title:'La brume',image:'La brume a le parfum des fleurs',echo:'Une aile y dénoue ses couleurs'},
  {title:'Le voile',image:'Le voile frissonne de pluie',echo:'Un œuf de lune au fond reluit'},
 ],
 shelter:[
  {title:'Le refuge',image:'Le refuge a la chaleur du pain',echo:'Un chant y réchauffe le matin'},
  {title:'L’abri',image:'Dans l’abri monte un goût de terre',echo:'Un duvet y garde la lumière'},
  {title:'Le berceau',image:'Le berceau sent la mousse tendre',echo:'Le ciel s’y couche en duvet de cendre'},
 ],
 silence:[
  {title:'Le silence',image:'Le silence a goût de miel',echo:'Une plume y recoud le ciel'},
  {title:'L’attente',image:'L’attente sent la terre noire',echo:'Un œuf y rêve sa mémoire'},
  {title:'La veille',image:'La veille a la douceur du soir',echo:'Un chant s’y glisse en velours noir'},
 ],
 passage:[
  {title:'Le passage',image:'Le passage sent l’herbe amère',echo:'Une aile y renverse la lumière'},
  {title:'La traversée',image:'La traversée frissonne au vent',echo:'Un nid dérive au firmament'},
  {title:'La lisière',image:'La lisière a la fraîcheur du soir',echo:'Le jour y rêve un autre miroir'},
 ],
} as const;
