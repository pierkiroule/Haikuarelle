import {APP_NAME} from '../brand';
/** Add the original verses below the real GPU painting, at its export resolution. */
export async function exportSignatureCard(painting:Blob,verses:readonly string[],paper:string,seed:number,dedication='',title='',reserveTitle=false):Promise<Blob>{
  const image=await createImageBitmap(painting);
  const output=document.createElement('canvas'),footer=Math.round(image.width*.28),header=title||reserveTitle?Math.round(image.width*.16):0;
  output.width=image.width;output.height=image.height+footer+header;
  const ctx=output.getContext('2d');
  if(!ctx){image.close();throw new Error('Export indisponible.');}
  try{
  ctx.fillStyle=paper;ctx.fillRect(0,0,output.width,output.height);ctx.drawImage(image,0,header);
  if(title){ctx.fillStyle='#46554d';ctx.textAlign='center';ctx.font=`${output.width*.045}px Georgia`;ctx.fillText(title,output.width/2,header*.62,output.width*.86);}
  ctx.fillStyle='#46554d';ctx.textAlign='center';ctx.font=`${output.width*.038}px Georgia`;
  verses.forEach((line,index)=>ctx.fillText(line,output.width/2,output.height-footer+output.width*(.065+index*.057)));
  ctx.fillStyle='#909785';ctx.font=`${output.width*.009}px sans-serif`;
  ctx.fillText(`${dedication.trim()?`Pour ${dedication.trim()} · `:''}${APP_NAME}  ·  ${seed.toString(16).toUpperCase()}`,output.width/2,output.height-footer*.12);
  ctx.fillStyle='rgba(163,68,61,.72)';ctx.textAlign='right';ctx.font=`${image.width*.028}px Georgia`;
  ctx.fillText('•°○',image.width*.97,output.height-image.width*.025);
  return await new Promise<Blob>((resolve,reject)=>output.toBlob(value=>value?resolve(value):reject(new Error('Export impossible.')),'image/png'));
  }finally{image.close();}
}
