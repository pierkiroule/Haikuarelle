import {BIRD_POETICS,composeBirdPoem} from './ornithopoetry';
import type {BirdId} from './catalog';
import type {BirdMark} from './haiku';

export type Tone='blue'|'rose'|'ember'|'moss'|'ochre'|'ink'|'silver';
export interface PaintingFrame {width:number;height:number;pixels:Uint8Array}
export interface ArtworkReading {tones:Tone[];coverage:number;centerY:number;islands:number;vertical:boolean;centerX?:number;density?:number;complexity?:number;diffuse?:boolean}
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
  const weights=new Map<Tone,number>();let painted=0,total=0,weightedY=0,weightedX=0,mass=0;
  let left=1,right=0,top=1,bottom=0;
  for(let gy=0;gy<rows;gy++)for(let gx=0;gx<cols;gx++){
    const x=Math.min(width-1,gx*step+Math.floor(step/2)),y=Math.min(height-1,gy*step+Math.floor(step/2)),i=(y*width+x)*4;
    total++;if(pixels[i+3]<128)continue;
    const distance=Math.max(...rgb.map((c,j)=>c-pixels[i+j]));
    if(distance<17)continue;
    const weight=distance/255,tone=toneOf(pixels[i],pixels[i+1],pixels[i+2]);
    weights.set(tone,(weights.get(tone)??0)+weight);painted++;mask[gy*cols+gx]=1;
    mass+=weight;weightedY+=weight*y/height;weightedX+=weight*x/width;
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
  let perimeter=0;
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++)if(mask[y*cols+x]){
    for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]])if(x+dx<0||y+dy<0||x+dx>=cols||y+dy>=rows||!mask[(y+dy)*cols+x+dx])perimeter++;
  }
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
  return {tones:tones.length?tones:['silver'],coverage:painted/total,centerY:mass?weightedY/mass:.5,islands,centerX:mass?weightedX/mass:.5,density:painted?mass/painted:0,complexity:painted?perimeter*perimeter/painted:0,diffuse:painted>0&&mass/painted<.23,
    vertical:painted>0&&(bottom-top)*height>(right-left)*width*1.25};
}

/** Finalization ties original ecological verses to the chosen trio. The actual
 * image still gates publication and seeds variation, but colour cannot replace
 * the lives of the birds the user chose. */
export function makeArtworkPoetry(marks:readonly BirdMark[],seed:number,reading:ArtworkReading,selected:readonly BirdId[]=[]):ArtworkPoetry|null {
  if(!marks.length||reading.coverage<=0)return null;
  const hash=marks.reduce((h,m)=>Math.imul(h^m.seed,16777619)>>>0,seed>>>0);
  const words=composeBirdPoem(selected.length?selected:marks.map(m=>m.bird),hash^Math.round(reading.coverage*1000)^Math.round(reading.centerY*100));
  return words?{...words,reading:{...reading,tones:[...reading.tones]}}:null;
}

/** Readable morphic families: structure chooses the relation, the bird supplies
 * the living place and ecological closing. No remote service or colour=emotion rule. */
export const MORPHIC_LINES={
 islands:['D’île en île, un appel','Les silences se répondent','Chaque rive attend une aile'],
 branching:['L’eau invente des racines','Un souffle ouvre les branches','Les chemins se cherchent encore'],
 rising:['Un souffle remonte la sève','La lumière cherche une cime','Le silence prend de la hauteur'],
 veil:['Le vent défait les frontières','L’eau garde un passage ouvert','Les contours deviennent souffle'],
 shelter:['L’ombre rassemble ses graines','Un abri se ferme au vent','Le silence habite un creux'],
 silence:['Une présence entre deux souffles','Le blanc retient une aile','Un appel agrandit le silence'],
 passage:['Un passage traverse l’eau','Le vent prolonge une branche','La lumière rejoint la lisière'],
} as const;
export function morphicFamily(r:ArtworkReading):keyof typeof MORPHIC_LINES{
 if(r.islands>=3)return 'islands';
 if((r.complexity??0)>85)return 'branching';
 if(r.coverage<.07)return 'silence';
 if(r.vertical)return 'rising';
 if(r.diffuse)return 'veil';
 if(r.coverage>.4&&(r.density??0)>.35)return 'shelter';
 return 'passage';
}
export function makeResonantHaiku(marks:readonly BirdMark[],seed:number,reading:ArtworkReading,bird:BirdId):ArtworkPoetry|null{
 if(!marks.length||reading.coverage<=0)return null;
 const family=morphicFamily(reading),ecology=BIRD_POETICS[bird];
 let hash=marks.reduce((h,m)=>Math.imul(h^m.seed,16777619)>>>0,seed>>>0);
 hash=(hash^Math.round(reading.coverage*10000)^Math.round(reading.centerY*1000)^Math.round((reading.complexity??0)*10))>>>0;
 const choose=(lines:readonly string[],shift:number)=>lines[(hash>>>shift)%lines.length];
 return {title:'',verses:[choose(ecology.lines[0],0),choose(MORPHIC_LINES[family],7),choose(ecology.lines[2],14)],reading:{...reading,tones:[...reading.tones]}};
}
