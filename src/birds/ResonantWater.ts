import type {AudioFrame} from '../audio/types';
import type {Point} from '../engine/types';
import type {WetPaper} from './WetPaper';
export interface WaterCurrent {point:Point;radius:number;vx:number;vy:number;coupling:number}
export interface WaterPulse {point:Point;radius:number;duration:number}
/** Audio excites the existing fluid solver, not a decorative render animation. */
export class ResonantWater {
 private energy=0;private brightness=.5;private lastAudioTime=-1;private lastPulse=-Infinity;
 constructor(private seed:number){}
 step(frame:AudioFrame|undefined,time:number,water:WetPaper,dt=1/30):{currents:WaterCurrent[];pulse?:WaterPulse}{
  const active=!!frame?.active&&frame.energy>0;
  const target=active?Math.min(1,Math.max(0,frame.energy)):0;
  this.energy+=(target-this.energy)*(1-Math.exp(-dt/(target>this.energy ? .10 : .38)));
  if(active)this.brightness+=(Math.min(1,Math.max(0,frame.brightness))-this.brightness)*(1-Math.exp(-dt/.18));
  const fresh=active&&frame.time!==this.lastAudioTime;
  if(active)this.lastAudioTime=frame.time;
  if(this.energy<.002)return {currents:[]};
  const sites=water.resonantSites(time),phase=(this.seed%997)*.017;
  const currents=sites.map((s,i)=>{
   const amount=Math.min(1,s.amount/.45),t=time*(.35+.45*this.brightness)+phase+i*2.1;
   const angle=Math.sin(t*.73)*1.4+t*.35;
   const speed=(.028*this.energy)*Math.sqrt(amount);
   return {point:s.point,radius:s.radius*(.65+.35*this.brightness),vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,
    coupling:(.30*this.energy)*amount};
  });
  if(fresh&&frame.flux>.55&&target>.2&&time-this.lastPulse>.32&&sites.length){
   this.lastPulse=time;const s=sites[Math.floor((frame.time*7+this.seed)%sites.length)];
   return {currents,pulse:{point:s.point,radius:s.radius*(.12+.28*frame.flux)*Math.sqrt(Math.min(1,s.amount/.45)),duration:.5+.35*(1-this.brightness)}};
  }
  return {currents};
 }
}
