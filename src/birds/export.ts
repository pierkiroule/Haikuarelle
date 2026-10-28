import {fitPainting,ORIGINAL_PAINTING,type PaintingPlacement} from './PaintingPlacement';
import {fixedPoetryLayout,POETRY_FONT,loadPoetryFont,POETRY_COLOR,POETRY_OPACITY,POETRY_LINE_HEIGHT} from './FixedPoetry';
/** Fixed handwritten title and verses; only the original painting is transformed. */
export async function exportResonantArtwork(painting:Blob,verses:readonly string[],title:string,paintingPlacement:PaintingPlacement=ORIGINAL_PAINTING):Promise<Blob>{
 await loadPoetryFont();
 const image=await createImageBitmap(painting),output=document.createElement('canvas');output.width=image.width;output.height=image.height;
 const ctx=output.getContext('2d');if(!ctx){image.close();throw new Error('Export indisponible.');}
 try{
  const p=fitPainting(paintingPlacement);ctx.fillStyle='#f7f5ed';ctx.fillRect(0,0,output.width,output.height);
  ctx.drawImage(image,p.x*output.width,p.y*output.height,p.scale*output.width,p.scale*output.height);
  const layout=fixedPoetryLayout((text,size)=>{ctx.font=`${size*output.width}px ${POETRY_FONT}`;return ctx.measureText(text).width/output.width;},title,verses,output.width/output.height);
  const drawBlock=(lines:readonly string[],relativeSize:number,y:number)=>{
   const size=relativeSize*output.width;ctx.fillStyle=POETRY_COLOR;ctx.font=`${size}px ${POETRY_FONT}`;ctx.textAlign='center';ctx.textBaseline='alphabetic';
   const metrics=ctx.measureText('Égj'),ascent=metrics.fontBoundingBoxAscent??size*.9,descent=metrics.fontBoundingBoxDescent??size*.2;
   const baseline=(size*POETRY_LINE_HEIGHT-ascent-descent)/2+ascent;
   lines.forEach((line,i)=>ctx.fillText(line,output.width/2,y*output.height+baseline+i*size*POETRY_LINE_HEIGHT));
  };
  ctx.globalAlpha=POETRY_OPACITY;
  drawBlock([title],layout.titleSize,layout.titleY);drawBlock(verses,layout.verseSize,layout.verseY);
  ctx.globalAlpha=1;
  ctx.fillStyle='rgba(163,68,61,.72)';ctx.textAlign='right';ctx.textBaseline='bottom';ctx.font=`${output.width*.026}px Georgia`;
  ctx.fillText('•°○',output.width*.97,output.height-output.width*.025);
  return await new Promise<Blob>((resolve,reject)=>output.toBlob(v=>v?resolve(v):reject(new Error('Export impossible.')),'image/png'));
 }finally{image.close();}
}
