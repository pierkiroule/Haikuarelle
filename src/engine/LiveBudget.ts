/** Reduce only the screen buffer after sustained slow frames; never resample wet pigments. */
export class LiveBudget{
 scale=1;private slow=0;private cooldown=0;
 observe(milliseconds:number):boolean{
  if(!Number.isFinite(milliseconds)||milliseconds<=0||milliseconds>1000)return false;
  if(this.cooldown>0){this.cooldown--;return false;}
  this.slow=milliseconds>45?this.slow+1:Math.max(0,this.slow-2);
  if(this.slow<24||this.scale<=.36)return false;
  this.scale=Math.max(.36,this.scale*.72);this.slow=0;this.cooldown=60;return true;
 }
}
