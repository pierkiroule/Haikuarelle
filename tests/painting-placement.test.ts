import {paintingOnSheet,PAINTING_ZONE} from '../src/birds/artworkLayout';
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

it('reserves text bands even at maximum size and extreme placements',()=>{
 for(const scale of [.25,.6,1])for(const x of [-10,0,.5,10])for(const y of [-10,0,.5,10]){
  const p=paintingOnSheet(fitPainting({scale,x,y}));
  expect(p.y).toBeGreaterThanOrEqual(PAINTING_ZONE.y);
  expect(p.y+p.scale).toBeLessThanOrEqual(PAINTING_ZONE.y+PAINTING_ZONE.height+1e-12);
  expect(p.x).toBeGreaterThanOrEqual(PAINTING_ZONE.x);
  expect(p.x+p.scale).toBeLessThanOrEqual(1-PAINTING_ZONE.x);
 }
});
