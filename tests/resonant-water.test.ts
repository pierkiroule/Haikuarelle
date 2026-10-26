import {describe,it,expect} from 'vitest';
import {ResonantWater} from '../src/birds/ResonantWater';
import {WetPaper} from '../src/birds/WetPaper';
import type {AudioFrame} from '../src/audio/types';
const note=(time=0,energy=.8,flux=.1,brightness=.6):AudioFrame=>({time,rms:.2,energy,flux,brightness,active:true,bass:.2,mid:.5,treble:.3,width:0,balance:0});
const pool=(amount=.45)=>{const w=new WetPaper('portrait',Infinity);w.add({x:.35,y:.5},{x:.65,y:.5},.12,amount,0);return w;};
describe('the song excites the water already on the paper',()=>{
 it('makes no current in dry cotton, or before any sound',()=>{
  expect(new ResonantWater(1).step(note(),0,new WetPaper()).currents).toEqual([]);
  expect(new ResonantWater(1).step(undefined,0,pool()).currents).toEqual([]);
 });
 it('moves even for a stationary gesture and scales with energy and water quantity',()=>{
  const run=(energy:number,amount:number)=>{const r=new ResonantWater(1),w=pool(amount);let response=r.step(note(0,energy),0,w);for(let i=1;i<30;i++)response=r.step(note(i/30,energy),i/30,w);return response.currents[0];};
  const strong=run(.9,.45),quiet=run(.15,.45),little=run(.9,.08);
  expect(Math.hypot(strong.vx,strong.vy)).toBeGreaterThan(Math.hypot(quiet.vx,quiet.vy));
  expect(strong.coupling).toBeGreaterThan(little.coupling);expect(Math.hypot(little.vx,little.vy)).toBeLessThan(Math.hypot(strong.vx,strong.vy));
 });
 it('changes current paths with timbre and is deterministic',()=>{
  const run=(brightness:number)=>{const r=new ResonantWater(42),w=pool();return Array.from({length:60},(_,i)=>r.step(note(i/30,.8,.1,brightness),i/30,w));};
  expect(run(.2)).toEqual(run(.2));expect(run(.2).at(-1)).not.toEqual(run(.9).at(-1));
 });
 it('triggers one bounded push on a fresh attack, not on repeated rendering of the same audio frame',()=>{
  const r=new ResonantWater(4),w=pool();expect(r.step(note(0,.8,.9),0,w).pulse).toBeDefined();
  expect(r.step(note(0,.8,.9),.5,w).pulse).toBeUndefined();
  expect(r.step(note(.6,.8,.9),.6,w).pulse).toBeDefined();
 });
 it('lets currents die away in silence without consuming or adding water',()=>{
  const r=new ResonantWater(1),w=pool(),p={x:.5,y:.5},initial=w.at(p,0);
  for(let i=0;i<30;i++)r.step(note(i/30),i/30,w);
  const start=r.step(undefined,1,w).currents[0];const later=r.step(undefined,1.5,w,.5).currents[0];
  expect(Math.hypot(later.vx,later.vy)).toBeLessThan(Math.hypot(start.vx,start.vy));
  let result=r.step(undefined,2,w);for(let i=0;i<120;i++)result=r.step(undefined,2+i/30,w);
  expect(result.currents).toEqual([]);expect(result.pulse).toBeUndefined();expect(w.at(p,6)).toBe(initial);
 });
 it('limits force sites and excludes evaporated water',()=>{
  const w=new WetPaper('portrait',1);for(let i=0;i<20;i++)w.add({x:.1+i*.04,y:.2},{x:.1+i*.04,y:.8},.06,.45,0);
  expect(w.resonantSites(0).length).toBeLessThanOrEqual(3);expect(w.resonantSites(10)).toEqual([]);
 });
});
