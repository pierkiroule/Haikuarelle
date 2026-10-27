import {describe,it,expect} from 'vitest';
import {fitPainting} from '../src/birds/PaintingPlacement';
describe('finished painting composition',()=>{
 it('keeps the complete painting inside the paper without changing its proportions',()=>{
  expect(fitPainting({x:.9,y:-.3,scale:.6})).toEqual({x:.4,y:0,scale:.6});
  expect(fitPainting({x:.2,y:.4,scale:1.4})).toEqual({x:0,y:0,scale:1});
 });
 it('sanitizes invalid values and keeps a usable minimum size',()=>{
  expect(fitPainting({x:NaN,y:Infinity,scale:NaN})).toEqual({x:0,y:0,scale:1});
  expect(fitPainting({x:.3,y:.4,scale:0})).toEqual({x:.3,y:.4,scale:.25});
 });
});
