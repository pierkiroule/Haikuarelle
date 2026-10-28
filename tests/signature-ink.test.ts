import {BIRD_COLOURS} from '../src/birds/colourPalettes';
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
  expect(new Set(points.map(p=>p.x)).size).toBeGreaterThan(30);expect(points.every(p=>Math.hypot(p.x-.5,(p.y-.5)*1980/1400)<.241)).toBe(true);
  expect(frames.every(frame=>frame.segments.length<=6&&frame.ink.length<=2)).toBe(true);
  expect(frames.flatMap(frame=>frame.segments).every(s=>s.slot===31&&!s.water&&s.waterAmount===0)).toBe(true);
 });
 it('ignores all pointer movement, continues flying in silence, but lifts the ink',()=>{
  const a=make(),b=make();expect(a.step(f(0),0)).toEqual(b.step(f(0),0));a.move({x:.9,y:.1},.1,false);expect(a.step(f(1),.1)).toEqual(b.step(f(1),.1));
  const before=a.flight!.point;expect(a.step({...f(2),active:false},.2).ink).toEqual([]);expect(a.flight!.point).not.toEqual(before);
  expect(a.step(undefined,1).ink).toEqual([]);expect(a.flight).toBeNull();expect(make(.5,0).step(f(0),0).ink).toEqual([]);
 });
 it('changes flight extent without changing nib width and stays on paper near a corner',()=>{
  const small=make(0),large=make(1);let sm=0,lg=0;
  for(let i=0;i<240;i++){const a=small.step(f(i),i/30),b=large.step(f(i),i/30);expect(a.ink[0].width).toBe(b.ink[0].width);sm=Math.max(sm,Math.abs(a.point!.x-.5));lg=Math.max(lg,Math.abs(b.point!.x-.5));}
  expect(lg).toBeGreaterThan(sm*3);
  const corner=new SignatureInk(bird,7,{x:.025,y:.025},{palette:'plumages',format:'a4',wetness:.5,granulation:.8,complexity:.5},1);
  for(let i=0;i<240;i++){const p=corner.step(f(i),i/30).point!;expect(p.x).toBeGreaterThanOrEqual(.025);expect(p.y).toBeGreaterThanOrEqual(.025);expect(p.x).toBeLessThanOrEqual(.975);expect(p.y).toBeLessThanOrEqual(.975);}
 });
 it('transduces dynamics into width and preserves selected color, size and opacity',()=>{
  const soft=make(),loud=make();expect(loud.step(f(0,1),0).ink[0].width).toBeGreaterThan(soft.step(f(0,.1),0).ink[0].width);
  expect(make(1).step(f(0),0).ink[0].width).toBe(make(0).step(f(0),0).ink[0].width);
  const frame=make(.5,.4).step(f(0),0);expect(frame.ink[0].color).toEqual([130/255,55/255,74/255]);expect(frame.ink[0].opacity).toBeLessThanOrEqual(.4);
 });
});

it('makes strong sonic pressure contrasts and uses only the selected bird plumage',()=>{
 const b={...PIE,inkTool:true};const s=new SignatureInk(b,17,{x:.5,y:.5},{palette:'plumages',format:'a4',granulation:.8,wetness:.5,complexity:.5});
 const frames=Array.from({length:180},(_,i)=>s.step({...f(i,i%20<5?1:.12),flux:i%20===0?.98:.1},i/30));
 const widths=frames.flatMap(fr=>fr.ink.slice(0,1).map(k=>k.width));expect(Math.max(...widths)).toBeGreaterThan(Math.min(...widths)*6);
 const allowed=BIRD_COLOURS.pie!.map(c=>c.hex.toLowerCase());for(const frame of frames)for(const k of frame.ink){const hex='#'+k.color!.map(c=>Math.round(c*255).toString(16).padStart(2,'0')).join('');expect(allowed).toContain(hex);}
 expect(frames.some(fr=>fr.feedback.splashes===5)).toBe(true);
});

it('does not report a pigment mark when the nib tears away on a falling transient',()=>{
 const s=make();const frame=s.step({...f(0,.08),flux:.5},0);expect(frame.ink).toEqual([]);expect(frame.segments).toEqual([]);expect(frame.point).toBeNull();expect(s.flight).not.toBeNull();
});
