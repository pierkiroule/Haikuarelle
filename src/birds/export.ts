import {POEM_LINE_HEIGHT,type PoemPlacement} from './poemPlacement';
/** Composite the whole paper at its current resolution: no added title/bands. */
export async function exportResonantArtwork(painting:Blob,verses:readonly string[],placement:PoemPlacement):Promise<Blob>{
 await document.fonts?.ready;
 const image=await createImageBitmap(painting),output=document.createElement('canvas');output.width=image.width;output.height=image.height;
 const ctx=output.getContext('2d');if(!ctx){image.close();throw new Error('Export indisponible.');}
 try{
  ctx.drawImage(image,0,0);
  const size=placement.size*output.width;ctx.fillStyle='#35483e';ctx.font=`${size}px Georgia`;ctx.textAlign='left';ctx.textBaseline='alphabetic';
  const metrics=ctx.measureText('Égj'),ascent=metrics.fontBoundingBoxAscent??size*.9,descent=metrics.fontBoundingBoxDescent??size*.2;
  const baseline=(size*POEM_LINE_HEIGHT-ascent-descent)/2+ascent;
  verses.forEach((line,i)=>ctx.fillText(line,placement.x*output.width,placement.y*output.height+baseline+i*size*POEM_LINE_HEIGHT));
  ctx.fillStyle='rgba(163,68,61,.72)';ctx.textAlign='right';ctx.textBaseline='bottom';ctx.font=`${output.width*.026}px Georgia`;
  ctx.fillText('•°○',output.width*.97,output.height-output.width*.025);
  return await new Promise<Blob>((resolve,reject)=>output.toBlob(v=>v?resolve(v):reject(new Error('Export impossible.')),'image/png'));
 }finally{image.close();}
}
