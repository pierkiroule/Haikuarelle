import type {BirdId} from './catalog';
import type {ArtworkReading,Tone} from './artworkPoetry';
export type NatureFamily='islands'|'branching'|'rising'|'veil'|'shelter'|'silence'|'passage';
export interface HabitatVerse{place:string;echo:string;affinities:readonly string[]}
const habitats=(text:string):HabitatVerse[]=>text.trim().split('\n').map(row=>{const [place,echo,affinities]=row.split('|');return {place,echo,affinities:affinities.split(',')};});
/** Imaginary lieux-dits evoke French countryside, never claimed as geolocation.
 * Each place and living gesture is authored together, not randomly spliced. */
export const NATURE_HABITATS:Partial<Record<BirdId,readonly HabitatVerse[]>>={
 mesange:habitats(`Dans le creux du pommier|la mésange retourne une feuille|shelter,branching
À la fourche du bouleau|deux griffes font frémir les chatons|branching,rising
Au Clos des Bourgeons|un bec délivre un peu de pollen|islands,silence
Sous la mousse du nid|un duvet garde la chaleur du jour|shelter,veil
Dans les saules de la combe|une aile essuie la rosée|veil,passage
Au revers des feuilles tendres|la chenille retient son souffle|branching,silence
Près du vieux poirier|un ventre jaune approche le printemps|rising,passage
Aux Prés des Chatons|une mésange éprouve la brindille|islands,branching
Au creux du frêne fendu|un brin de laine devient refuge|shelter,silence
Sur la pointe du rameau|le bourgeon oscille sous les griffes|rising,passage
Dans la haie d’aubépine|une aile bleue soulève la bruine|veil,branching
À la Fontaine aux Mousses|un petit bec recueille le matin|islands,veil`),
 rougegorge:habitats(`Au pied du lierre ancien|le rouge-gorge écoute la terre|shelter,silence
Dans le chemin creux|un pas soulève une odeur d’humus|passage,veil
Au Clos des Ronces|une gorge réchauffe le givre|branching,shelter
Près de la bêche au repos|un œil attend le ver sous la motte|islands,silence
Sous la racine du hêtre|le nid tient dans un pli de feuilles|shelter,branching
Au jardin des Gelées|une poitrine orange défie le froid|silence,veil
Dans le sureau dénudé|une note partage le crépuscule|rising,branching
Au bord du potager|le limon luit sous un bec patient|passage,islands
À la Combe aux Merises|une baie mûre retient la lumière|islands,shelter
Sous le talus de fougères|les radicelles entourent le duvet|branching,shelter
Dans la haie après l’averse|le rouge-gorge secoue ses plumes|veil,passage
Sur la pierre du gué|une petite braise attend l’aurore|rising,silence`),
 merle:habitats(`Sous le lilas mouillé|le merle retourne une feuille|veil,shelter
Au sommet du vieux frêne|un sifflet arrondit le soir|rising,silence
Près du lavoir désert|un bec d’or écoute le ruissellement|passage,islands
Dans le Clos des Sureaux|une baie assombrit le bord du bec|islands,shelter
Au creux de la charmille|la boue du nid garde sa fraîcheur|shelter,branching
Derrière le muret moussu|un lombric dénoue la terre|branching,passage
Dans le verger après la pluie|le merle entrouvre un fruit tombé|islands,veil
Au chemin des Prunelles|un appel traverse les épines|branching,passage
Sous les feuilles de novembre|un bec soulève le parfum des bois|veil,shelter
Sur la branche du noyer|la flûte noire accueille l’aube|rising,silence
À la Source aux Merles|la rosée roule entre deux pierres|islands,veil
Dans la haie de buis|un nid de terre attend les petits|shelter,silence`),
 moineau:habitats(`Sous la tuile du grenier|le moineau réchauffe la paille|shelter,silence
Sur le fil entre deux poteaux|un pépiement rejoint les champs|passage,rising
Aux Longs Sillons|le grain craque dans un petit bec|passage,branching
Au pied du mur de pierres|un bain de poussière ébouriffe l’aile|veil,islands
Dans la grange entrouverte|une plume se mêle au foin|shelter,veil
Au Clos des Épis|la troupe glane au bord du chaume|islands,passage
Sur la barrière du pré|un moineau secoue la bruine|rising,veil
Dans la haie d’églantier|des voix se serrent avant la nuit|branching,shelter
À la croisée des chemins|un brin de paille trouve son nid|passage,branching
Près du vieux pressoir|une graine roule sous les griffes|islands,silence
Aux Prés de la Meule|le vent froisse un épi oublié|rising,veil
Dans le lierre de la ferme|un duvet abrite le froid|shelter,silence`),
 rossignol:habitats(`Au creux du taillis|le rossignol fait frémir la nuit|shelter,veil
Dans la Combe aux Aubépines|un trille entrouvre la fraîcheur|branching,passage
Sous la ronce fleurie|le nid écoute au ras des racines|shelter,branching
Au bord de la saulaie|une gorge fait mûrir la lune|veil,rising
À la Fontaine des Veilles|une note rejoint le ruissellement|passage,islands
Dans les orties de la berge|un bec recueille un insecte|branching,silence
Au chemin des Églantines|la queue rousse effleure les épines|passage,branching
Sous le sureau de mai|une flûte habite la pénombre|shelter,veil
Près du gué couvert de feuilles|le chant traverse la rosée|islands,passage
Dans le vallon sans lune|le rossignol soulève un pan d’ombre|veil,silence
À la lisière des Trembles|une branche frémit sans vent|rising,branching
Au ras de la feuille morte|le nid garde une chaleur secrète|shelter,silence`),
 etourneau:habitats(`Sur le fil des prés|les étourneaux rassemblent le soir|passage,islands
Au creux du vieux frêne|un bec apporte une herbe tendre|shelter,silence
Aux Prés Longs|la nuée se replie dans la bruine|veil,islands
Dans les roseaux du val|mille griffes bercent la nuit|branching,shelter
Au Clos des Baies|un fruit mûr teinte le bout du bec|islands,silence
Dans le chaume après l’averse|des becs entrouvrent le sol|passage,branching
Au-dessus de la saulaie|le vol se rassemble puis se dénoue|rising,islands
Sur le peuplier des Vannes|une gorge emprunte la voix du vent|rising,passage
Dans la prairie de givre|un reflet vert traverse le noir|veil,silence
Au vallon des Roseaux|la nuée frôle les tiges sèches|branching,veil
Sous la tuile de la grange|un cliquetis réchauffe le nid|shelter,silence
Près de la mare aux joncs|un peuple d’ailes plisse le ciel|islands,passage`),
 geai:habitats(`À la fourche du chêne|le geai déploie un éclat d’azur|branching,rising
Dans la Combe aux Glands|un bec enfouit l’automne|islands,shelter
Sous la fougère rousse|une réserve attend son arbre|branching,silence
Au chemin des Châtaigniers|un cri rauque traverse les feuilles|passage,veil
Dans le houppier du hêtre|une aile fait trembler les faînes|rising,branching
Au Clos des Chênes|la mousse recouvre un petit oubli|shelter,veil
Sur la souche fendue|un gland tourne au bord du bec|islands,silence
À la lisière des Bruyères|le geai avertit tout le sous-bois|passage,branching
Dans les feuilles de novembre|une plume bleue effleure la rouille|veil,islands
Au Bois des Réserves|un chêne sommeille sous la terre|shelter,silence
Sur la branche du coudrier|un regard suit la pluie qui vient|rising,veil
Derrière le talus de mousse|le bec replie un secret de glands|shelter,passage`),
 bouvreuil:habitats(`Dans le verger de givre|le bouvreuil détache un bourgeon|silence,islands
Au Clos des Prunelliers|un sifflement adoucit les épines|branching,shelter
Sur la branche du poirier|un pétale effleure le masque noir|rising,veil
Sous la haie de charmille|deux poitrines rapprochent le froid|shelter,silence
Au chemin des Corolles|un bec goûte la fin de l’hiver|passage,islands
Dans le sorbier des prés|une graine roule sous la langue|islands,branching
À la Combe aux Bourgeons|le rose affleure entre les branches|branching,veil
Au creux du genévrier|le nid se tient contre les aiguilles|shelter,silence
Près de la source gelée|une note de flûte entrouvre le jour|passage,veil
Sur le pommier sans feuilles|un couple siffle à voix basse|rising,shelter
Dans les ronces du talus|le duvet recueille un peu de neige|veil,branching
Au bord du verger délaissé|le bourgeon cède sous le bec|passage,silence`),
 sittelle:habitats(`Dans la fente du vieux chêne|la sittelle cale une faîne|shelter,branching
Tête en bas contre le tronc|deux griffes explorent l’écorce|rising,passage
Au Bois des Noisettes|une coque éclate dans le silence|islands,silence
Au seuil d’un frêne creux|un bec maçonne une porte d’argile|shelter,veil
Dans la Combe aux Hêtres|une note dévale le bois|rising,branching
Sous le lichen du pommier|un insecte frémit dans sa fissure|branching,silence
Sur la souche du chemin|la graine attend son bec patient|islands,passage
Au Clos des Faînes|l’écorce garde une petite réserve|shelter,islands
Dans la fourche du noyer|un éclat de coque rejoint la mousse|branching,passage
Au bord du bois de brume|la sittelle retourne la verticale|rising,veil
Contre le charme noueux|un sifflet suit les plis du tronc|branching,veil
Dans l’arbre du Vieux Gué|une porte de boue abrite le duvet|shelter,silence`),
 picvert:habitats(`Au pied du pommier creux|le pic vert écoute les fourmis|shelter,silence
Dans la prairie du talus|une langue explore la terre meuble|passage,branching
Aux Prés des Fourmis|un rire roule au ras de l’herbe|islands,passage
Sur la souche de la clairière|une griffe éprouve le bois tendre|rising,shelter
Au creux du saule ancien|la chambre garde une odeur de sève|shelter,branching
Dans la Combe aux Pommiers|un éclair vert ondule entre les troncs|passage,rising
Près du chemin de sable|la fourmilière entrouvre ses galeries|branching,islands
Au bord du pré mouillé|le bec recueille la fraîcheur du sol|veil,passage
Dans le verger des Rires|un appel rebondit contre l’écorce|islands,rising
Sous la butte de bruyère|la terre abrite un peuple minuscule|shelter,branching
Sur la branche sans feuilles|le pic vert laisse passer l’averse|rising,veil
À la lisière des Genêts|un rire vert allège le matin|silence,veil`),
 corneille:habitats(`Au bord du labour neuf|la corneille retourne une motte|passage,islands
Sur le peuplier des vents|le nid éprouve la hauteur|rising,shelter
Aux Longs Sillons|un bec patient interroge la glèbe|branching,passage
Dans la lande après la pluie|une aile noire recueille un reflet|veil,silence
Sur la pierre du vieux gué|deux sentinelles regardent l’eau|islands,silence
Au Clos des Chaumes|le vent ébouriffe le jais des plumes|passage,veil
Dans la fourche du grand frêne|une branche rejoint le nid|branching,shelter
Au chemin des Terres Noires|un pas dénoue la peau du champ|passage,branching
Sur la pointe du rocher|la corneille mesure le vent|rising,silence
Dans le vallon des Brouillards|un cri ouvre un passage dans le gris|veil,passage
Près du pré aux peupliers|un couple veille au-dessus des herbes|rising,shelter
Sous le ciel des Guérets|une graine disparaît dans le sillon|islands,branching`),
 pie:habitats(`Sur le fil entre deux poteaux|la pie équilibre un reflet de pluie|passage,silence
Au Clos des Ronces|une brindille rejoint le toit du nid|branching,shelter
Dans la fourche du peuplier|un dos d’encre laisse perler l’eau|rising,veil
Sur le muret de pierres sèches|la queue accompagne un petit bond|islands,passage
Au chemin des Épines|un cri de crécelle secoue la haie|branching,passage
Dans le pré après l’averse|un éclat vert se cache dans le noir|veil,islands
À la Combe aux Reflets|une aile entrouvre un pli d’azur|veil,rising
Près du lavoir moussu|le blanc des plumes attrape le jour|islands,silence
Sous le toit de brindilles|les petits attendent dans les feuilles|shelter,branching
Au-dessus du vieux prunier|le couple emprunte le même passage|rising,passage
Sur la barrière des Prés Hauts|une patte retient l’instant du vent|rising,silence
Dans la haie du Gué des Saules|la pie recoud une voûte d’épines|shelter,branching`),
};

export const NATURE_PIGMENTS:Record<Tone,readonly string[]>={
 blue:['d’azur','de brume bleue','de bleuet'],rose:['de bruyère','de rose sauvage','de pétales roses'],ember:['de terre rousse','de braise','d’argile rouge'],moss:['de mousse','de lichen vert','de feuilles vertes'],ochre:['de pollen','d’ocre','de genêt'],ink:['de suie','de charbon','d’ombre noire'],silver:['de givre','de cendre grise','de brume grise'],
};
/** Shape words are geometric metaphors, not claims of object recognition. */
export const NATURE_SHAPES:Record<NatureFamily,readonly {title:string;motion:string}[]>={
 islands:[{title:'Les îlots',motion:'se répondent'},{title:'Les graines',motion:'se dispersent'},{title:'Les pierres',motion:'espacent le jour'},{title:'Les clairières',motion:'gardent le ciel'}],
 branching:[{title:'La ramure',motion:'se déploie'},{title:'Les radicelles',motion:'cherchent la pluie'},{title:'Les nervures',motion:'se ramifient'},{title:'Les ronces',motion:'étirent leurs fils'}],
 rising:[{title:'La cime',motion:'soulève le jour'},{title:'La tige',motion:'cherche le ciel'},{title:'La pousse',motion:'monte dans l’air'},{title:'Le peuplier',motion:'s’étire au vent'}],
 veil:[{title:'La brume',motion:'se dilue'},{title:'La rosée',motion:'affleure'},{title:'La buée',motion:'flotte encore'},{title:'La bruine',motion:'efface ses rives'}],
 shelter:[{title:'Le bosquet',motion:'recueille l’ombre'},{title:'Le sous-bois',motion:'se resserre'},{title:'La motte',motion:'garde la pluie'},{title:'Le feuillage',motion:'abrite le soir'}],
 silence:[{title:'La graine',motion:'repose seule'},{title:'La feuille',motion:'retient le jour'},{title:'La goutte',motion:'veille dans le blanc'},{title:'La brindille',motion:'effleure le vide'}],
 passage:[{title:'Le sillage',motion:'traverse le jour'},{title:'Le ruisseau',motion:'déplie son cours'},{title:'La lisière',motion:'laisse passer l’air'},{title:'Le sentier',motion:'sinue dans le blanc'}],
};
export function composeNaturePoem(bird:BirdId,reading:ArtworkReading,family:NatureFamily,rng:()=>number){
 const options=NATURE_HABITATS[bird];if(!options)return null;
 // Bias toward compatible places without excluding quieter, less usual scenes.
 const weights=options.map(h=>h.affinities.includes(family)?4:1);let draw=rng()*weights.reduce((a,b)=>a+b,0),habitat=options[options.length-1];
 for(let i=0;i<options.length;i++){draw-=weights[i];if(draw<0){habitat=options[i];break;}}
 const choose=<T,>(items:readonly T[])=>items[Math.floor(rng()*items.length)];
 const shape=choose(NATURE_SHAPES[family]),tone=reading.tones[0]??'silver';
 const roots=(text:string)=>text.toLocaleLowerCase('fr').split(/[^a-zà-ÿ]+/).filter(w=>w.length>=4).map(w=>w.replace(/s$/,''));
 const pigments=NATURE_PIGMENTS[tone].filter(p=>!roots(p).some(w=>roots(shape.title).includes(w)));
 const pigment=choose(pigments.length?pigments:NATURE_PIGMENTS[tone]);
 const secondary=reading.tones[1],other=secondary&&secondary!==tone?choose(NATURE_PIGMENTS[secondary]):null;
 // Two observed colours coexist; do not invent an unmeasured spatial relation.
 let image=other?`${shape.title} ${pigment} et ${other}`:`${shape.title} ${pigment} ${shape.motion}`;
 if(image.length>48)image=`${shape.title} ${pigment} ${shape.motion}`;
 return {title:`${shape.title} ${pigment}`,verses:[habitat.place,image,habitat.echo] as [string,string,string]};
}
