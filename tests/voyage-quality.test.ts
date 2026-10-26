import {describe,it,expect} from 'vitest';
import {voyageQuality,renderPixelRatio} from '../src/voyage/quality';
import {extendPigmentColours} from '../src/voyage/texture';
import {randomBirdIndex} from '../src/birds/BirdWheel';
describe('bounded mobile rendering and faithful pigment projection',()=>{
 it('keeps mobile budgets bounded independently of texture detail',()=>{
  const low=voyageQuality(true,4,2),desktop=voyageQuality(false,12,16);
  expect(low.textureSize).toBeLessThan(desktop.textureSize);expect(low.resolution).toBeLessThan(desktop.resolution);
  const dpr=renderPixelRatio(2400,1800,3,low.pixelBudget,low.maxDpr);
  expect(2400*1800*dpr*dpr).toBeLessThanOrEqual(low.pixelBudget+1);
 });
 it('extends invisible texels without changing a single painted pixel',()=>{
  const pixels=new Uint8Array([247,244,236,255,40,90,130,255,247,244,236,255]);
  extendPigmentColours({width:3,height:1,pixels},'#f7f4ec');
  expect([...pixels]).toEqual([40,90,130,255,40,90,130,255,40,90,130,255]);
 });
 it('leaves an empty painting empty',()=>{
  const pixels=new Uint8Array([247,244,236,255]);extendPigmentColours({width:1,height:1,pixels},'#f7f4ec');
  expect([...pixels]).toEqual([247,244,236,255]);
 });
 it('rejects biased random tails and can choose every available bird',()=>{
  const values=[0xffffffff,8];expect(randomBirdIndex(3,()=>values.shift()!)).toBe(2);
  for(let i=0;i<8;i++)expect(randomBirdIndex(8,()=>i)).toBe(i);
  expect(()=>randomBirdIndex(0)).toThrow();
 });
});
