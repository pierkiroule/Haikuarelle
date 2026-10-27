import {it,expect,vi} from 'vitest';
import {WetPaper} from '../src/birds/WetPaper';
import {ResonantWater} from '../src/birds/ResonantWater';
import type {AudioFrame} from '../src/audio/types';
const frame:AudioFrame={time:0,active:true,energy:1,flux:.8,brightness:.7,centroid:.5,flatness:.2} as unknown as AudioFrame;
it('localizes a landscape voice in its wet basin and caches connectivity between audio frames',()=>{
 const water=new WetPaper('a4',Infinity);water.add({x:.2,y:.4},{x:.3,y:.4},.08,.45,0);water.add({x:.8,y:.4},{x:.8,y:.4},.08,.45,0);
 const region=vi.spyOn(water,'region'),response=new ResonantWater(7),origin={x:.2,y:.4};
 let currents:ReturnType<ResonantWater['step']>['currents']=[];
 for(let i=0;i<7;i++)currents=response.step({...frame,time:i/30},i/30,water,1/30,origin).currents;
 expect(currents.length).toBeGreaterThan(0);expect(currents.every(c=>c.point.x<.5)).toBe(true);expect(region).toHaveBeenCalledTimes(1);
 response.step({...frame,time:.4},.4,water,1/30,origin);expect(region).toHaveBeenCalledTimes(2);
});
it('a voice anchored on dry paper cannot activate an unrelated wet pool',()=>{
 const water=new WetPaper('a4',Infinity);water.add({x:.8,y:.8},{x:.8,y:.8},.05,.45,0);
 const response=new ResonantWater(2);expect(response.step(frame,0,water,1/30,{x:.1,y:.1}).currents).toHaveLength(0);
});
