import {describe,expect,it} from 'vitest';
import {makeArtworkPoetry,readArtwork,type PaintingFrame} from '../src/birds/artworkPoetry';
import type {BirdMark} from '../src/birds/haiku';
const mark:BirdMark={bird:'geai',point:{x:.5,y:.5},seed:42};
function sheet(regions:{x:number;y:number;w:number;h:number;color:number[]}[]=[]):PaintingFrame{
  const width=100,height=160,pixels=new Uint8Array(width*height*4);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const region=regions.find(r=>x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h);
    pixels.set([...(region?.color??[247,244,236]),255],(y*width+x)*4);
  }
  return {width,height,pixels};
}
describe('poetry reads the painted image',()=>{
  it('never invents a finished work from an empty sheet or missing audible marks',()=>{
    const blank=readArtwork(sheet());expect(blank.coverage).toBe(0);
    expect(makeArtworkPoetry([mark],42,blank)).toBeNull();
    const blue=readArtwork(sheet([{x:30,y:20,w:20,h:80,color:[70,130,190]}]));
    expect(makeArtworkPoetry([],42,blue)).toBeNull();
  });
  it('uses real colours rather than the identity of an unused bird',()=>{
    const blue=readArtwork(sheet([{x:30,y:20,w:20,h:80,color:[70,130,190]}]));
    const rose=readArtwork(sheet([{x:30,y:20,w:20,h:80,color:[210,90,135]}]));
    expect(blue.tones[0]).toBe('blue');expect(rose.tones[0]).toBe('rose');
    expect(makeArtworkPoetry([mark],42,blue)!.title).toMatch(/azur|ciel/);
    expect(makeArtworkPoetry([mark],42,rose)!.title).toMatch(/rose|pétales/);
  });
  it('responds to preserved whites, actual islands and vertical placement',()=>{
    const colors=[70,130,190],regions=[20,65,110].map(y=>({x:30,y,w:20,h:15,color:colors}));
    const reading=readArtwork(sheet(regions));expect(reading.islands).toBe(3);expect(reading.vertical).toBe(true);
    expect(makeArtworkPoetry([mark],42,reading)!.title).toMatch(/^(Archipel|Constellation|Îlots) /);
    const high=readArtwork(sheet([{x:20,y:5,w:60,h:55,color:colors}]));
    const low=readArtwork(sheet([{x:20,y:100,w:60,h:55,color:colors}]));
    expect(high.centerY).toBeLessThan(.4);expect(low.centerY).toBeGreaterThan(.65);
    expect(makeArtworkPoetry([mark],42,high)!.verses[2]).not.toBe(makeArtworkPoetry([mark],42,low)!.verses[2]);
  });
  it('returns a stable short title and three lines, without mutating the observation',()=>{
    const reading=readArtwork(sheet([{x:30,y:20,w:20,h:80,color:[70,130,190]}]));
    const before=structuredClone(reading),words=makeArtworkPoetry([mark],42,reading)!;
    expect(makeArtworkPoetry([mark],42,reading)).toEqual(words);expect(reading).toEqual(before);
    expect(words.title.length).toBeLessThan(36);expect(words.verses).toHaveLength(3);
    words.reading.tones.push('rose');expect(reading).toEqual(before);
  });
  it('recognizes overlapping pigments and keeps subtle paper variation out of the poem',()=>{
    const frame=sheet([{x:10,y:20,w:30,h:50,color:[70,130,190]},{x:60,y:20,w:30,h:50,color:[210,90,135]}]);
    const reading=readArtwork(frame);expect(reading.tones.sort()).toEqual(['blue','rose']);
    expect(makeArtworkPoetry([mark],42,reading)!.verses[1]).toBe('Le ciel recueille un pétale');
    expect(readArtwork(sheet([{x:10,y:10,w:80,h:130,color:[239,238,232]}])).coverage).toBe(0);
  });
  it('does not reject a real fine mark falling between analysis-grid samples',()=>{
    const width=300,height=600,pixels=new Uint8Array(width*height*4);
    for(let i=0;i<pixels.length;i+=4)pixels.set([247,244,236,255],i);
    pixels.set([30,40,40,255],(width+1)*4);
    const reading=readArtwork({width,height,pixels});expect(reading.coverage).toBeGreaterThan(0);
    expect(makeArtworkPoetry([mark],42,reading)).not.toBeNull();
  });
});
