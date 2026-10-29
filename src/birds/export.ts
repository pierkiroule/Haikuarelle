import {ARTWORK_WHITE,paintingOnSheet} from './artworkLayout';
import {fitPainting,ORIGINAL_PAINTING,type PaintingPlacement} from './PaintingPlacement';
import {fixedPoetryLayout,POETRY_FONT,loadPoetryFont,POETRY_COLOR,POETRY_OPACITY,POETRY_LINE_HEIGHT} from './FixedPoetry';
/** Fixed handwritten title and verses; only the original painting is transformed. */
export async function exportResonantArtwork(painting:Blob,verses:readonly string[],title:string,paintingPlacement:PaintingPlacement=ORIGINAL_PAINTING):Promise<Blob>{
 await loadPoetryFont();
 const image=await createImageBitmap(painting),output=document.createElement('canvas');output.width=image.width;output.height=image.height;
 const ctx=output.getContext('2d');if(!ctx){image.close();throw new Error('Export indisponible.');}
 try{
  const p=paintingOnSheet(fitPainting(paintingPlacement));ctx.fillStyle=ARTWORK_WHITE;ctx.fillRect(0,0,output.width,output.height);
  ctx.drawImage(image,p.x*output.width,p.y*output.height,p.scale*output.width,p.scale*output.height);
  drawArtworkWords(ctx,output.width,output.height,title,verses);
  return await new Promise<Blob>((resolve,reject)=>output.toBlob(v=>v?resolve(v):reject(new Error('Export impossible.')),'image/png'));
 }finally{image.close();}
}

/** Shared by the downloadable PNG and the final film frame. */
export function drawArtworkWords(ctx:CanvasRenderingContext2D,width:number,height:number,title:string,verses:readonly string[],alpha=1){
 ctx.save();
  const layout=fixedPoetryLayout((text,size)=>{ctx.font=`${size*width}px ${POETRY_FONT}`;return ctx.measureText(text).width/width;},title,verses,width/height);
  const drawBlock=(lines:readonly string[],relativeSize:number,y:number)=>{
   const size=relativeSize*width;ctx.fillStyle=POETRY_COLOR;ctx.font=`${size}px ${POETRY_FONT}`;ctx.textAlign='center';ctx.textBaseline='alphabetic';
   const metrics=ctx.measureText('Égj'),ascent=metrics.fontBoundingBoxAscent??size*.9,descent=metrics.fontBoundingBoxDescent??size*.2;
   const baseline=(size*POETRY_LINE_HEIGHT-ascent-descent)/2+ascent;
   lines.forEach((line,i)=>ctx.fillText(line,width/2,y*height+baseline+i*size*POETRY_LINE_HEIGHT));
  };
  ctx.globalAlpha=POETRY_OPACITY*alpha;
  drawBlock([title],layout.titleSize,layout.titleY);drawBlock(verses,layout.verseSize,layout.verseY);
  ctx.globalAlpha=alpha;
  ctx.fillStyle='rgba(163,68,61,.72)';ctx.textAlign='right';ctx.textBaseline='bottom';ctx.font=`${width*.026}px Georgia`;
  ctx.fillText('•°○',width*.97,height-width*.025);
 ctx.restore();
}
