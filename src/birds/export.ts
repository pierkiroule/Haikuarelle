import {COMPOSITION_FONTS,DEFAULT_TEXT,type TextAppearance} from './compositionStyle';
import {fitPainting,type PaintingPlacement} from './PaintingPlacement';
import {POEM_LINE_HEIGHT,type PoemPlacement} from './poemPlacement';
/** Composite the whole paper at its current resolution: independent title and verses, without added bands. */
export async function exportResonantArtwork(painting:Blob,verses:readonly string[],placement:PoemPlacement,title?:{text:string;placement:PoemPlacement},paintingPlacement?:PaintingPlacement,appearance?:{title:TextAppearance;haiku:TextAppearance}):Promise<Blob>{
 await document.fonts?.ready;
 const image=await createImageBitmap(painting),output=document.createElement('canvas');output.width=image.width;output.height=image.height;
 const ctx=output.getContext('2d');if(!ctx){image.close();throw new Error('Export indisponible.');}
 try{
  if(paintingPlacement){const p=fitPainting(paintingPlacement);ctx.fillStyle='#f7f5ed';ctx.fillRect(0,0,output.width,output.height);ctx.drawImage(image,p.x*output.width,p.y*output.height,p.scale*output.width,p.scale*output.height);}else ctx.drawImage(image,0,0);
  const drawBlock=(lines:readonly string[],p:PoemPlacement,boldItalic=false,style=DEFAULT_TEXT)=>{
   const size=p.size*output.width;ctx.fillStyle=style.color;ctx.font=`${boldItalic?'italic bold ':''}${size}px ${COMPOSITION_FONTS[style.font].canvas}`;ctx.textAlign=style.align;ctx.textBaseline='alphabetic';
   const metrics=ctx.measureText('Égj'),ascent=metrics.fontBoundingBoxAscent??size*.9,descent=metrics.fontBoundingBoxDescent??size*.2;
   const baseline=(size*POEM_LINE_HEIGHT-ascent-descent)/2+ascent;
   const width=Math.max(...lines.map(line=>ctx.measureText(line).width||0));
   const anchor=p.x*output.width+(style.align==='center'?width/2:style.align==='right'?width:0);
   lines.forEach((line,i)=>ctx.fillText(line,anchor,p.y*output.height+baseline+i*size*POEM_LINE_HEIGHT));
  };
  if(title)drawBlock([title.text],title.placement,true,appearance?.title);
  drawBlock(verses,placement,false,appearance?.haiku);
  ctx.fillStyle='rgba(163,68,61,.72)';ctx.textAlign='right';ctx.textBaseline='bottom';ctx.font=`${output.width*.026}px Georgia`;
  ctx.fillText('•°○',output.width*.97,output.height-output.width*.025);
  return await new Promise<Blob>((resolve,reject)=>output.toBlob(v=>v?resolve(v):reject(new Error('Export impossible.')),'image/png'));
 }finally{image.close();}
}
