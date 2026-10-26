import {describe,it,expect} from 'vitest';
import {LivingBreath} from '../src/birds/LivingBreath';
describe('living breath',()=>{
 it('requires movement over wet paper and forgets lifted gestures',()=>{
  const b=new LivingBreath();expect(b.move({x:.4,y:.5},0,.5,.45)).toBeNull();
  expect(b.move({x:.45,y:.5},30,.5,0)).toBeNull();
  expect(b.move({x:.45,y:.5},60,.5,.45)).toBeNull();
  b.reset();expect(b.move({x:.6,y:.5},90,.5,.45)).toBeNull();
 });
 it('follows the gesture, scales with velocity and caps sudden fast drags',()=>{
  const run=(dx:number,dt:number)=>{const b=new LivingBreath();b.move({x:.4,y:.5},0,.5,.45);return b.move({x:.4+dx,y:.5},dt,.5,.45)!;};
  const slow=run(.01,100),fast=run(.01,20),jump=run(.5,1);
  expect(slow.vx).toBeGreaterThan(0);expect(slow.vy).toBe(0);expect(fast.vx).toBeGreaterThan(slow.vx);
  expect(Math.hypot(jump.vx,jump.vy)).toBeLessThanOrEqual(.24);expect(run(-.01,20).vx).toBeLessThan(0);
 });
 it('weakens on nearly dry paper and rejects stale or invalid samples',()=>{
  const b=new LivingBreath();b.move({x:.4,y:.5},0,.5,.45);
  expect(b.move({x:.41,y:.5},30,.5,.015)!.coupling).toBeGreaterThan(.055);
  expect(b.move({x:.42,y:.5},60,.5,.015)!.coupling).toBeLessThan(.086);
  expect(b.move({x:.42,y:.5},500,.5,.45)).toBeNull();
  expect(b.move({x:NaN,y:.5},530,.5,.45)).toBeNull();
  expect(b.move({x:.42,y:.5},560,.5,.45)).toBeNull();
 });
});

it('gives the first movement an impulse, then settles and renews it after lifting',()=>{
 const b=new LivingBreath();b.move({x:.4,y:.5},0,.5,.45);
 const first=b.move({x:.41,y:.5},30,.5,.45)!;
 for(let time=60;time<=300;time+=30)b.move({x:.4+time*.0003,y:.5},time,.5,.45);
 const settled=b.move({x:.5,y:.5},330,.5,.45)!;
 expect(first.coupling).toBeGreaterThan(settled.coupling*1.25);
 expect(first.coupling).toBeLessThanOrEqual(.86);
 b.reset();b.move({x:.4,y:.5},500,.5,.45);
 expect(b.move({x:.41,y:.5},530,.5,.45)!.coupling).toBeCloseTo(first.coupling);
});
