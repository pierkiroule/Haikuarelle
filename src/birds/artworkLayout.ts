/** Normalized sheet geometry, shared by the editor, PNG and process movie. */
export const ARTWORK_WHITE='#ffffff';
export const PAINTING_ZONE={x:.04,y:.14,width:.92,height:.64} as const;
export function paintingOnSheet(p:{x:number;y:number;scale:number}){
 const size=Math.min(PAINTING_ZONE.width,PAINTING_ZONE.height);
 return {x:(1-size)/2+p.x*size,y:PAINTING_ZONE.y+p.y*size,scale:p.scale*size};
}
