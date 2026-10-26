import {createRng} from '../vendor/pigment-drift/engine/params';
import type {BirdMark} from './haiku';

export type Tone='blue'|'rose'|'ember'|'moss'|'ochre'|'ink'|'silver';
export interface PaintingFrame {width:number;height:number;pixels:Uint8Array}
export interface ArtworkReading {tones:Tone[];coverage:number;centerY:number;islands:number;vertical:boolean}
export interface ArtworkPoetry {title:string;verses:[string,string,string];reading:ArtworkReading}
const clamp=(n:number)=>Math.max(0,Math.min(1,n));

function toneOf(r:number,g:number,b:number):Tone {
  const max=Math.max(r,g,b),min=Math.min(r,g,b),delta=max-min;
  if(max<105)return 'ink';
  if(delta<18||delta/Math.max(max,1)<.11)return max<162?'ink':'silver';
  let h=max===r?(g-b)/delta+(g<b?6:0):max===g?(b-r)/delta+2:(r-g)/delta+4;h*=60;
  return h<28||h>=358?'ember':h<67?'ochre':h<163?'moss':h<282?'blue':'rose';
}

/** Read the actual dry GPU image in paper coordinates, not an imagined scene.
 * A small, fixed grid ignores paper tooth and keeps the usual read lightweight.
 * Only broad colour, white space and connected painted regions are retained.
 */
export function readArtwork(frame:PaintingFrame,paper='#f7f4ec'):ArtworkReading {
  const {width,height,pixels}=frame;
  if(width<1||height<1||pixels.length!==width*height*4)throw new Error('Image de peinture invalide.');
  const rgb=[1,3,5].map(i=>parseInt(paper.slice(i,i+2),16));
  const step=Math.max(1,Math.ceil(Math.max(width,height)/144));
  const cols=Math.ceil(width/step),rows=Math.ceil(height/step),mask=new Uint8Array(cols*rows);
  const weights=new Map<Tone,number>();let painted=0,total=0,weightedY=0,mass=0;
  let left=1,right=0,top=1,bottom=0;
  for(let gy=0;gy<rows;gy++)for(let gx=0;gx<cols;gx++){
    const x=Math.min(width-1,gx*step+Math.floor(step/2)),y=Math.min(height-1,gy*step+Math.floor(step/2)),i=(y*width+x)*4;
    total++;if(pixels[i+3]<128)continue;
    const distance=Math.max(...rgb.map((c,j)=>c-pixels[i+j]));
    if(distance<17)continue;
    const weight=distance/255,tone=toneOf(pixels[i],pixels[i+1],pixels[i+2]);
    weights.set(tone,(weights.get(tone)??0)+weight);painted++;mask[gy*cols+gx]=1;
    mass+=weight;weightedY+=weight*y/height;
    left=Math.min(left,x/width);right=Math.max(right,x/width);top=Math.min(top,y/height);bottom=Math.max(bottom,y/height);
  }
  // A single fine filament can fall between grid samples. Before declaring an
  // image empty, scan for a real visible pixel; never demand a broad brush mark.
  if(!painted){
    for(let i=0;i<pixels.length;i+=4){
      if(pixels[i+3]<128||Math.max(rgb[0]-pixels[i],rgb[1]-pixels[i+1],rgb[2]-pixels[i+2])<17)continue;
      return {tones:[toneOf(pixels[i],pixels[i+1],pixels[i+2])],coverage:1/(width*height),centerY:Math.floor(i/4/width)/height,islands:1,vertical:false};
    }
  }
  // Count regions large enough to read as islands, not individual speckles.
  let islands=0;const queue:number[]=[];
  for(let i=0;i<mask.length;i++)if(mask[i]){
    mask[i]=0;queue.length=0;queue.push(i);
    for(let q=0;q<queue.length;q++){
      const n=queue[q],x=n%cols,y=Math.floor(n/cols);
      for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]){
        const xx=x+dx,yy=y+dy;if(xx<0||xx>=cols||yy<0||yy>=rows)continue;
        const j=yy*cols+xx;if(mask[j]){mask[j]=0;queue.push(j);}
      }
    }
    if(queue.length>=5)islands++;
  }
  const ranked=[...weights].sort((a,b)=>b[1]-a[1]);
  const tones=ranked.filter(([,w])=>w>=mass*.10).slice(0,2).map(([t])=>t);
  return {tones:tones.length?tones:['silver'],coverage:painted/total,centerY:mass?weightedY/mass:.5,islands,
    vertical:painted>0&&(bottom-top)*height>(right-left)*width*1.25};
}

const openings:Record<Tone,string[]>={
  blue:['Un ciel dans la main','Le bleu prend son vol'],rose:['Un pétale au vent','Le jour devient rose'],
  ember:['Un éclat de feu','Un feu dans la main'],moss:['Le vent dans les bois','Un jardin prend l’air'],
  ochre:['Le jour dans tes mains','L’or au bord du jour'],ink:['Un trait dans la nuit','L’ombre ouvre ses bras'],
  silver:['Le gris touche l’eau','Un matin sans bruit'],
};
const middles:Record<Tone,string[]>={
  blue:['Le bleu garde un peu de ciel','Un chant se déplie dans l’eau'],rose:['La cendre accueille une fleur','Le rose se pose et respire'],
  ember:['La braise se confie à l’eau','Un peu de feu devient rivage'],moss:['L’or frissonne au creux des mousses','Le vert se souvient de la pluie'],
  ochre:['L’eau recueille un peu de soleil','L’ocre veille au bord des ombres'],ink:['L’encre dénoue ses chemins','La nuit laisse passer le jour'],
  silver:['La brume effleure le papier','L’eau garde la trace d’un chant'],
};
const meetings:Partial<Record<string,string>>={
  'blue+ember':'La braise rencontre le ciel','blue+ochre':'Un peu de soleil dans le bleu',
  'blue+rose':'Le ciel recueille un pétale','blue+moss':'La forêt se mêle au ciel',
  'ember+ink':'Un feu sous la cendre demeure','ink+rose':'La nuit s’ouvre sur une fleur',
  'rose+silver':'La cendre accueille la pivoine','ember+silver':'Un peu de feu dans la brume',
  'moss+ochre':'L’or frissonne au creux des mousses','blue+silver':'La brume repose sur l’eau',
};
const nouns:Record<Tone,string[]>={blue:['d’azur','de ciel'],rose:['de rose','de pétales'],ember:['de braise','de feu'],moss:['de mousse','de sous-bois'],ochre:['d’or','d’ambre'],ink:['d’ombre','de nuit'],silver:['de brume','de silence']};

/** Original local verse grammar. Generate only on finalization; no external AI,
 * diagnosis, image recognition claim, or random poem changing during a stroke.
 */
export function makeArtworkPoetry(marks:readonly BirdMark[],seed:number,reading:ArtworkReading):ArtworkPoetry|null {
  if(!marks.length||reading.coverage<=0)return null;
  const hash=marks.reduce((h,m)=>Math.imul(h^m.seed,16777619)>>>0,seed>>>0);
  const rng=createRng(hash^Math.round(reading.coverage*1000)^Math.round(reading.centerY*100));
  const pick=<T,>(items:readonly T[]):T=>items[Math.floor(rng()*items.length)];
  const tone=reading.tones[0]??'silver';
  const place=pick(reading.islands>=3?['Archipel','Constellation','Îlots']:reading.coverage<.08?['Souffle','Une trace','Murmure']:reading.vertical?['L’envol','Une aile','L’élan']:['Lisière','Rivage','Le passage']);
  const title=`${place} ${pick(nouns[tone])}`;
  const pair=[...reading.tones.slice(0,2)].sort().join('+');
  const second=meetings[pair]??pick(middles[tone]);
  const endings=reading.coverage<.12?['Le blanc nous répond','L’espace est resté']:reading.islands>=3?['Entre deux silences','Des îles sans nom']:reading.centerY<.40?['Un ciel dans la main','Le jour peut venir']:reading.centerY>.65?['Un reflet demeure','L’eau retient le jour']:['Le vent se souvient','Un rivage attend'];
  const first=pick(openings[tone]);
  return {title,verses:[first,second,pick(endings.filter(line=>line!==first))],reading:{...reading,tones:[...reading.tones]}};
}
