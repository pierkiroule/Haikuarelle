/** Bounds ignore the paper tooth while retaining a generous margin for pale washes. */
export function paintingBounds(pixels:Uint8ClampedArray,width:number,height:number,paper:number[]){
 let left=width,right=-1,top=height,bottom=-1;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=(y*width+x)*4,d=Math.hypot(...paper.map((v,c)=>Math.max(0,v-pixels[i+c]/255)));if(d>.05){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}}
 if(right<left)return {x:0,y:0,width:1,height:1};
 const padx=Math.max(width*.04,(right-left+1)*.18),pady=Math.max(height*.04,(bottom-top+1)*.18);
 const x=Math.max(0,left-padx),y=Math.max(0,top-pady);
 return {x:x/width,y:y/height,width:(Math.min(width,right+1+padx)-x)/width,height:(Math.min(height,bottom+1+pady)-y)/height};
}
