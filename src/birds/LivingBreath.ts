import type {Point} from '../engine/types';
import type {WaterCurrent} from './ResonantWater';
/** Pointer velocity becomes bounded local air pressure; timestamps are milliseconds. */
export class LivingBreath {
 private startedAt=0;
 private wetCarry:{point:Point;time:number;amount:number}|null=null;
 private previous:{point:Point;time:number}|null=null;
 reset(){this.previous=null;this.startedAt=0;this.wetCarry=null;}
 move(point:Point,time:number,size:number,moisture:number,metric={x:1,y:1}):WaterCurrent|null{
  if(![point.x,point.y,time,size,moisture].every(Number.isFinite)){this.reset();return null;}
  const old=this.previous;if(!old||time-old.time>250)this.startedAt=time;this.previous={point:{...point},time};
  if(!old||time<=old.time||time-old.time>250)return null;
  const dx=(point.x-old.point.x)*metric.x,dy=(point.y-old.point.y)*metric.y,distance=Math.hypot(dx,dy);
  if(distance<.0001)return null;
  const speed=Math.min(.24,distance/Math.max(.008,(time-old.time)/1000)*.38);
  const radius=.025+.105*Math.max(0,Math.min(1,size));
  if(moisture>=.008)this.wetCarry={point:{...point},time,amount:moisture};
  else{
    const carry=this.wetCarry;
    if(!carry||time-carry.time>220||Math.hypot((point.x-carry.point.x)*metric.x,(point.y-carry.point.y)*metric.y)>radius*1.8)return null;
    moisture=carry.amount*(1-(time-carry.time)/220);
  }
  const wet=Math.min(1,moisture/.15);
  const attack=.65+.35*Math.exp(-Math.max(0,time-this.startedAt)/170);
  return {point:{...point},radius,vx:dx/distance*speed,vy:dy/distance*speed,coupling:.86*wet*attack};
 }
}
