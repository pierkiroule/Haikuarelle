/** All durations use elapsed wall seconds, including time spent in a hidden tab. */
export const EXHIBITION={wet:20,dry:20,fade:20,bucket:3,idle:45,warning:12,answerGap:6,answerDuration:3.5,maxMemories:32} as const;
export interface Life {wet:number;dry:number;fade:number;bucket:number}
export const lifetime=(c:Life=EXHIBITION)=>c.wet+c.dry+c.fade;
export function pigmentSurvival(age:number,c:Life=EXHIBITION):number {
 const t=Math.max(0,Math.min(1,(age-c.wet-c.dry)/c.fade));return (1-t)*(1-t)*(1+2*t);
}
export function waterSurvival(age:number,c:Life=EXHIBITION):number {
 const t=Math.max(0,Math.min(1,(age-c.wet*.65)/(c.wet*.35)));return (1-t)*(1-t)*(1+2*t);
}
/** Absolute epochs prevent a new gesture from refreshing an existing bucket.
 * Deposits are quantized conservatively to 3 s: expiry is at most 3 s early.
 * One recycled GPU layer per bucket, never one full texture per gesture. */
export class TraceClock {
 readonly capacity:number;
 constructor(readonly config:Life=EXHIBITION){this.capacity=Math.ceil(lifetime(config)/config.bucket)+1;}
 epoch(now:number):number{return Math.floor(now/this.config.bucket);}
 age(epoch:number,now:number):number{return Math.max(0,now-epoch*this.config.bucket);}
 alive(epoch:number,now:number):boolean{return this.age(epoch,now)<lifetime(this.config);}
 ratio(epoch:number,from:number,to:number,water=false):number {
  const survival=water?waterSurvival:pigmentSurvival;
  const a=survival(this.age(epoch,from),this.config),b=survival(this.age(epoch,to),this.config);
  return a>1e-8?Math.min(1,b/a):0;
 }
}
