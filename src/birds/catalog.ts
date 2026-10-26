export type BirdId='rougegorge'|'merle'|'rossignol'|'fauvette'|'hirondelle'|'geai'|'etourneau'|'chouette'|'hibou'|'corneille'|'mesange'|'bouvreuil'|'sittelle'|'picvert'|'pie';
export interface Bird {id:BirdId;name:string;latin:string;gesture:string;motif:'plume'|'trille'|'branche'|'voile';slot:number;angle:number;color:string;source:string;author:string;plumage?:number[];signature?:'lace'|'velvet'|'twig'|'ripple'}
const base='https://bigsoundbank.com/';
export const PIE:Bird={id:'pie',name:'Pie',latin:'Pica pica',gesture:'Noir · pluie de gouttelettes',motif:'trille',slot:0,angle:.2,color:'#252b2c',plumage:[0],source:'https://freesound.org/people/naturenotesuk/sounds/555096/',author:'naturenotesuk'};
export const BIRDS:Bird[]=[
  {id:'rougegorge',name:'Rouge-gorge',latin:'Erithacus rubecula',gesture:'Une plume de lumière',motif:'plume',slot:1,angle:-.65,color:'#ae775a',source:base+'robin-4-s1670.html',author:'Joseph SARDIN'},
  {id:'merle',name:'Merle noir',latin:'Turdus merula',gesture:'Un lavis profond',motif:'voile',slot:0,angle:.28,color:'#5c747b',source:base+'common-blackbird-30-s3503.html',author:'Le tiroir du fond'},
  {id:'rossignol',name:'Rossignol',latin:'Luscinia megarhynchos',gesture:'Des filaments d’encre',motif:'trille',slot:0,angle:-.3,color:'#7d7f99',source:base+'common-nightingale-2-s3087.html',author:'Joseph SARDIN'},
  {id:'fauvette',name:'Fauvette',latin:'Sylvia atricapilla',gesture:'Une ramure légère',motif:'branche',slot:1,angle:-1.1,color:'#819279',source:base+'eurasian-blackcap-1-s3466.html',author:'Le tiroir du fond'},
  {id:'hirondelle',name:'Hirondelle',latin:'Hirundo rustica',gesture:'Un élan dans l’eau',motif:'plume',slot:0,angle:-.9,color:'#748f97',source:base+'swallows-2-s1016.html',author:'Joseph SARDIN'},
  {id:'geai',name:'Geai',latin:'Garrulus glandarius',gesture:'Un éclat minéral',motif:'branche',slot:2,angle:.6,color:'#9a9474',source:base+'eurasian-jay-2-s3454.html',author:'Joseph SARDIN & Axeline T.'},
  {id:'etourneau',name:'Étourneau',latin:'Sturnus vulgaris',gesture:'Des murmures mêlés',motif:'trille',slot:1,angle:.1,color:'#8b846c',source:base+'starlings-few-s1903.html',author:'Joseph SARDIN'},
  {id:'chouette',name:'Chouette',latin:'Strix aluco',gesture:'Un voile de nuit',motif:'voile',slot:0,angle:1.05,color:'#747c90',source:base+'tawny-owl-2-s1764.html',author:'Joseph SARDIN'},
  {id:'hibou',name:'Hibou',latin:'Asio otus',gesture:'Une terre tranquille',motif:'voile',slot:2,angle:-.4,color:'#96856f',source:base+'long-eared-owl-1-s0936.html',author:'Joseph SARDIN'},
  {id:'corneille',name:'Corneille',latin:'Corvus corone',gesture:'Une nervure d’ombre',motif:'branche',slot:0,angle:.8,color:'#6f7670',source:base+'carrion-crow-3-s3463.html',author:'Le tiroir du fond'},
  {id:'mesange',name:'Mésange bleue',latin:'Cyanistes caeruleus',gesture:'Bleu · jaune & dentelles',motif:'trille',slot:3,angle:-.8,color:'#397fa7',plumage:[3,4,6,0],signature:'lace',source:'https://commons.wikimedia.org/wiki/File:Cyanistes_caeruleus_-_Eurasian_Blue_Tit_XC125793.ogg',author:'Dan Stowell · XC125793'},
  {id:'bouvreuil',name:'Bouvreuil',latin:'Pyrrhula pyrrhula',gesture:'Rose · gris & velours',motif:'voile',slot:5,angle:.2,color:'#ba667d',plumage:[5,6,7],signature:'velvet',source:'https://commons.wikimedia.org/wiki/File:Bullfinch_(Pyrrhula_pyrrhula)_(W1CDR0001509_BD14).ogg',author:'Aubrey John Williams · The British Library Board'},
  {id:'sittelle',name:'Sittelle',latin:'Sitta europaea',gesture:'Ardoise · roux & ramures',motif:'branche',slot:7,angle:-1.1,color:'#758795',plumage:[7,8,0],signature:'twig',source:'https://commons.wikimedia.org/wiki/File:Eurasian_Nuthatch_(Sitta_europaea)_(W1CDR0001520_BD24).ogg',author:'Aubrey John Williams · The British Library Board'},
  {id:'picvert',name:'Pic vert',latin:'Picus viridis',gesture:'Mousse · jaune & carmin',motif:'plume',slot:9,angle:.6,color:'#788647',plumage:[9,4,10],signature:'ripple',source:'https://commons.wikimedia.org/wiki/File:Picus_viridis-Clapiers_2018_04_21.ogg',author:'Manudouz'},
  PIE,
];
export const birdFor=(id:BirdId)=>BIRDS.find(b=>b.id===id)!;
/** Three initial pads. The seven brushes share one stable optical pigment table. */
export const BIRD_PADS:Bird[]=[
  {...birdFor('corneille'),name:'Corneille',gesture:'Noir · encre & éclats',color:'#344247',plumage:[0,7,6]},
  {...birdFor('rougegorge'),gesture:'Orange · gris & réserves',color:'#bd6545',plumage:[1,6,0]},
  {...birdFor('geai'),gesture:'Bleu · brun & traits vifs',color:'#4a83a7',plumage:[2,8,5,0]},
];
export const BIRD_BRUSHES:Bird[]=[...BIRD_PADS,...BIRDS.filter(b=>!!b.signature),PIE];
