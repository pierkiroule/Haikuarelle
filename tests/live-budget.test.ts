import {describe,it,expect} from 'vitest';
import {LiveBudget} from '../src/engine/LiveBudget';
describe('sustained live rendering pressure',()=>{
 it('ignores isolated hitches and keeps fluid screens at their selected quality',()=>{
  const budget=new LiveBudget();for(let i=0;i<200;i++)expect(budget.observe(i%20===0?80:16)).toBe(false);expect(budget.scale).toBe(1);
  for(const ms of [NaN,Infinity,-1,0,3000])expect(budget.observe(ms)).toBe(false);
 });
 it('reduces only after sustained slowness and waits before another reduction',()=>{
  const budget=new LiveBudget();for(let i=0;i<23;i++)expect(budget.observe(60)).toBe(false);
  expect(budget.observe(60)).toBe(true);expect(budget.scale).toBeLessThan(1);const scale=budget.scale;
  for(let i=0;i<60;i++)expect(budget.observe(60)).toBe(false);expect(budget.scale).toBe(scale);
  for(let i=0;i<500;i++)budget.observe(500);expect(budget.scale).toBe(.36);
 });
});
