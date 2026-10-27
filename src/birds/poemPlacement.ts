export interface PoemPlacement {x:number;y:number;size:number}
export const POEM_LINE_HEIGHT=1.6;
export const POEM_MARGIN=.035;
/** Relative to the whole paper; reserve the bottom strip for •°○. */
export function fitPoem(p:PoemPlacement,width:number,height:number):PoemPlacement{
 const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
 const size=clamp(p.size*Math.min(1,.93/Math.max(width,.001),.90/Math.max(height,.001)),.016,.06);
 return {size,x:clamp(p.x,POEM_MARGIN,Math.max(POEM_MARGIN,.965-width)),y:clamp(p.y,POEM_MARGIN,Math.max(POEM_MARGIN,.94-height))};
}
