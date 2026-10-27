import {describe,it,expect} from 'vitest';
import {TraceClock,lifetime,waterSurvival,pigmentSurvival,EXHIBITION} from '../src/exhibition/lifecycle';
describe('independent ephemeral trace epochs',()=>{
 it('holds water, dries it locally, then removes pigment later',()=>{
  expect(lifetime()).toBe(60);expect(waterSurvival(10)).toBe(1);expect(waterSurvival(20)).toBe(0);
  expect(pigmentSurvival(20)).toBe(1);expect(pigmentSurvival(40)).toBe(1);
  expect(pigmentSurvival(50)).toBeCloseTo(.5);expect(pigmentSurvival(60)).toBe(0);
 });
 it('never renews the epoch of an overlapping older deposit',()=>{
  const clock=new TraceClock(),old=clock.epoch(0),fresh=clock.epoch(30);
  expect(clock.alive(old,60)).toBe(false);expect(clock.alive(fresh,60)).toBe(true);
  expect(clock.ratio(old,40,50)).toBeCloseTo(.5);expect(clock.ratio(fresh,40,50)).toBe(1);
 });
 it('accounts for a hidden-tab jump without replaying a minute of physics',()=>{
  const clock=new TraceClock();expect(clock.ratio(0,12,70)).toBe(0);expect(clock.alive(0,70)).toBe(false);
 });
 it('has bounded three-second quantization with no extended lifetime',()=>{
  const clock=new TraceClock();let active:number[]=[];
  for(let now=0;now<3600;now+=.7){
   active=active.filter(epoch=>clock.alive(epoch,now));const epoch=clock.epoch(now);if(!active.includes(epoch))active.push(epoch);
   expect(active.length).toBeLessThanOrEqual(clock.capacity);
   expect(clock.age(epoch,now)).toBeLessThan(EXHIBITION.bucket);
   expect(clock.alive(epoch,now+60)).toBe(false);
  }
 });
 it('compounds survival ratios consistently regardless of frame rate',()=>{
  const clock=new TraceClock();let pigment=1,water=1;
  for(let t=1;t<=59;t++){pigment*=clock.ratio(0,t-1,t);water*=clock.ratio(0,t-1,t,true);}
  expect(pigment).toBeCloseTo(pigmentSurvival(59),12);expect(water).toBe(0);
 });
});
