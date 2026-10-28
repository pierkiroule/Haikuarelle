import {describe,it,expect} from 'vitest';
import {SignatureInk} from '../src/birds/SignatureInk';
import {PIE} from '../src/birds/catalog';
import type {AudioFrame} from '../src/audio/types';
const f=(i:number,energy=.8):AudioFrame=>({time:i/30,energy,active:true,rms:.1,bass:.2,mid:.5,treble:.3,brightness:.6,flux:i===8?.95:.1,width:0,balance:0});
const bird={...PIE,inkTool:true,color:'#82374a',pigmentSlot:31};
const make=(size=.5,opacity=.8)=>new SignatureInk(bird,7,{x:.5,y:.5},{palette:'plumages',format:'a4',wetness:.5,granulation:.8,complexity:.5},size,opacity);
describe('Ink sound calligraphy',()=>{
 it('writes a bounded, deterministic ribbon even under a stationary hand',()=>{
  const run=()=>{const s=make();return Array.from({length:60},(_,i)=>s.step(f(i),i/30));};
  const frames=run();expect(frames).toEqual(run());const points=frames.flatMap(frame=>frame.ink.flatMap(s=>s.points));
  expect(new Set(points.map(p=>p.x)).size).toBeGreaterThan(30);expect(points.every(p=>Math.abs(p.x-.5)<.06&&Math.abs(p.y-.5)<.06)).toBe(true);
  expect(frames.every(frame=>frame.segments.length<=2&&frame.ink.length===1)).toBe(true);
  expect(frames.flatMap(frame=>frame.segments).every(s=>s.slot===31&&!s.water&&s.waterAmount===0)).toBe(true);
 });
 it('lets the hand guide the next stroke and lifts across silence or a disconnected gesture',()=>{
  const s=make();s.step(f(0),0);s.move({x:.6,y:.5},.1);const guided=s.step(f(1),.1);expect(guided.ink[0].points.at(-1)!.x).toBeGreaterThan(.56);
  expect(s.step({...f(2),active:false},.2).ink).toEqual([]);s.move({x:.8,y:.6},.3,false);const next=s.step(f(3),.3).ink[0].points;expect(next[0]).toEqual(next.at(-1));
  expect(s.step(undefined,1).segments).toEqual([]);expect(make(.5,0).step(f(0),0).ink).toEqual([]);
 });
 it('transduces dynamics into width and preserves selected color, size and opacity',()=>{
  const soft=make(),loud=make();expect(loud.step(f(0,1),0).ink[0].width).toBeGreaterThan(soft.step(f(0,.1),0).ink[0].width);
  expect(make(1).step(f(0),0).ink[0].width).toBeGreaterThan(make(0).step(f(0),0).ink[0].width*3);
  const frame=make(.5,.4).step(f(0),0);expect(frame.ink[0].color).toEqual([130/255,55/255,74/255]);expect(frame.ink[0].opacity).toBeLessThanOrEqual(.4);
 });
});
