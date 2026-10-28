import {APP_NAME,publicSiteAddress} from '../brand';
import {loadPoetryFont,POETRY_FONT} from '../birds/FixedPoetry';
import {fitPainting,ORIGINAL_PAINTING,type PaintingPlacement} from '../birds/PaintingPlacement';
import type {BirdSound} from '../birds/BirdAudioBank';
import type {ArtworkPoetry} from '../birds/artworkPoetry';
import {replaySample,replayTime,type ProcessFrame} from './ProcessRecording';
export interface DanceCredit {author:string;license:string;source:string}
/** The real captured painting, forward then reverse. No geometry or synthetic motion. */
export class DanceRenderer {
 private cache=new Map<number,Promise<ImageBitmap>>();private disposed=false;private drawVersion=0;
 private constructor(readonly canvas:HTMLCanvasElement,private frames:ProcessFrame[],private poetry:ArtworkPoetry,private paper:string,private credit:DanceCredit,private placement:PaintingPlacement){}
 static async create(canvas:HTMLCanvasElement,painting:Blob,poetry:ArtworkPoetry,_sound:BirdSound,paper:string,credit:DanceCredit,frames:ProcessFrame[]=[],placement=ORIGINAL_PAINTING){
  if(frames.length<2)throw Error('Ce film nécessite un enregistrement du processus de création.');
  await loadPoetryFont();const captured=frames.slice();captured[captured.length-1]={...captured.at(-1)!,image:painting};
  const renderer=new DanceRenderer(canvas,captured,poetry,paper,credit,fitPainting(placement));await renderer.image(0);return renderer;
 }
 private image(index:number){
  let image=this.cache.get(index);
  if(!image){image=createImageBitmap(this.frames[index].image).then(bitmap=>{if(this.disposed){bitmap.close();throw Error('Film fermé');}return bitmap;});this.cache.set(index,image);}
  return image;
 }
 async draw(time:number){
  if(this.disposed)return;
  const version=++this.drawVersion;
  const sample=replaySample(this.frames,time),[first,second]=await Promise.all([this.image(sample.from),this.image(sample.to)]);
  if(this.disposed||version!==this.drawVersion)return;
  // Only the current pair and two neighbours remain decoded, even for long creations.
  for(const [index,promise]of this.cache)if(Math.abs(index-sample.from)>1&&Math.abs(index-sample.to)>1){this.cache.delete(index);void promise.then(image=>image.close()).catch(()=>{});}
  const ctx=this.canvas.getContext('2d',{alpha:false});if(!ctx)throw Error('Le film ne peut pas être affiché.');
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  const w=this.canvas.width,h=this.canvas.height,ratio=first.width/first.height;
  ctx.globalAlpha=1;ctx.fillStyle='#fafbf9';ctx.fillRect(0,0,w,h);
  const height=Math.min(h*.62,w*.90/ratio),width=height*ratio,x=(w-width)/2,y=h*.46-height/2;
  ctx.fillStyle=this.paper;ctx.fillRect(x,y,width,height);
  const p=this.placement;
  const paint=(image:ImageBitmap,alpha:number)=>{ctx.save();ctx.beginPath();ctx.rect(x,y,width,height);ctx.clip();ctx.globalAlpha=alpha;ctx.drawImage(image,x+p.x*width,y+p.y*height,width*p.scale,height*p.scale);ctx.restore();};
  paint(first,1);if(sample.to!==sample.from)paint(second,sample.mix);
  const text=(value:string,at:number,size:number,color='#35483e',alpha=.8)=>{ctx.save();ctx.fillStyle=color;ctx.globalAlpha=alpha;ctx.textAlign='center';ctx.textBaseline='middle';const unit=Math.min(w,h*9/16);ctx.font=`${size*unit}px ${POETRY_FONT}`;const measured=ctx.measureText(value).width;if(measured>w*.88)ctx.font=`${size*unit*w*.88/measured}px ${POETRY_FONT}`;ctx.fillText(value,w/2,h*at);ctx.restore();};
  const poemAlpha=.8*Math.max(0,Math.min(1,(replayTime(time)-.72)/.24));
  text(this.poetry.title,.10,.05,'#35483e',poemAlpha);
  this.poetry.verses.forEach((verse,i)=>text(verse,.795+i*.030,.037,'#35483e',poemAlpha));
  ctx.save();ctx.fillStyle='rgba(163,68,61,.72)';ctx.textAlign='right';ctx.font=`${width*.032}px Georgia`;ctx.fillText('•°○',x+width*.97,y+height-height*.018);ctx.restore();
  // Persistent promotional watermark is burned into every frame, including downloads.
  ctx.save();const label='CRÉEZ AVEC LE CHANT DES OISEAUX';
  ctx.fillStyle='rgba(250,251,249,.82)';ctx.fillRect(w*.06,h*.897,w*.88,h*.059);ctx.restore();
  text(APP_NAME+' · •°○',.912,.029,'#725d55',.65);
  text(label,.933,.016,'#6f7b74',.58);text(publicSiteAddress(location.href),.950,.016,'#6f7b74',.58);
  text(this.credit.author+' · '+this.credit.license,.966,.017,'#6f7b74',.6);text(this.credit.source.replace(/^https?:\/\//,''),.985,.014,'#6f7b74',.55);
 }
 dispose(){this.disposed=true;for(const promise of this.cache.values())void promise.then(image=>image.close()).catch(()=>{});this.cache.clear();this.frames=[];}
}
