import type {PaintingFrame} from '../birds/artworkPoetry';
/** Extend only invisible texels. Regular UVs and mipmaps then have no white seams.
 * Called after meshing, on a worker-owned copy: paper holes remain empty. */
export function extendPigmentColours(frame:PaintingFrame,paper:string):void{
  const {width:w,height:h,pixels}=frame,n=w*h,filled=new Uint8Array(n),queue=new Uint32Array(n);
  const rgb=[1,3,5].map(i=>parseInt(paper.slice(i,i+2),16));let head=0,tail=0;
  for(let i=0;i<n;i++)if(pixels[i*4+3]>=128&&Math.max(rgb[0]-pixels[i*4],rgb[1]-pixels[i*4+1],rgb[2]-pixels[i*4+2])>=17)filled[i]=1;
  for(let i=0;i<n;i++)if(filled[i]&&(i%w>0&&!filled[i-1]||i%w<w-1&&!filled[i+1]||i>=w&&!filled[i-w]||i<n-w&&!filled[i+w]))queue[tail++]=i;
  const fill=(from:number,to:number)=>{if(filled[to])return;filled[to]=1;const a=from*4,b=to*4;pixels[b]=pixels[a];pixels[b+1]=pixels[a+1];pixels[b+2]=pixels[a+2];pixels[b+3]=255;queue[tail++]=to;};
  while(head<tail){const i=queue[head++],x=i%w;if(x>0)fill(i,i-1);if(x<w-1)fill(i,i+1);if(i>=w)fill(i,i-w);if(i<n-w)fill(i,i+w);}
}
