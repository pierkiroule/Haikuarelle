import {describe,expect,it} from 'vitest';
import {segmentPayload,Kind,type Segment} from '../src/vendor/pigment-drift/paint/engine';
const paint:Segment={ax:10,ay:10,bx:30,by:10,radius:8,target:.7,strength:.4,kind:Kind.Paint,slot:5,fx:0,fy:0,coupling:0};
describe('GPU material payload',()=>{
  it('keeps pigment visible when a dry-paper stroke explicitly adds no water',()=>{
    const [,load,,flags]=segmentPayload({...paint,waterAmount:0});
    expect(load).toBe(.7);expect(flags%4).toBe(Kind.Paint);
    expect(Math.floor(flags/4)%64).toBe(5);
    expect(Math.floor(flags/256)%2).toBe(0);expect(flags).toBeGreaterThanOrEqual(512);
  });
  it('encodes the requested clear-water quantity rather than pigment',()=>{
    const [,amount,,flags]=segmentPayload({...paint,kind:Kind.Water,target:0,waterAmount:.2});
    expect(amount).toBe(.2);expect(flags%4).toBe(Kind.Water);
  });
  it('retains legacy load and wet-only restriction without an explicit quantity',()=>{
    const [,load,,flags]=segmentPayload({...paint,wetOnly:true});
    expect(load).toBe(.7);expect(Math.floor(flags/256)%2).toBe(1);expect(flags).toBeLessThan(512);
  });
});
