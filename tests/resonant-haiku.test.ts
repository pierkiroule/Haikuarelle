import {describe,it,expect} from 'vitest';
import {readArtwork,makeResonantHaiku,morphicFamily,MORPHIC_LINES,BIRD_TITLE_REFERENCE,type ArtworkReading} from '../src/birds/artworkPoetry';
import {BIRD_POETICS} from '../src/birds/ornithopoetry';
import {fitPoem} from '../src/birds/poemPlacement';
const reading:ArtworkReading={tones:['blue'],coverage:.25,centerY:.5,islands:1,vertical:false,complexity:30,density:.4};
const marks=[{bird:'mesange' as const,seed:7,point:{x:.5,y:.5}}];
describe('a response from actual morphology and bird ecology',()=>{
 it('changes the central image with morphology at the same seed and bird',()=>{
  const islands={...reading,islands:4},branches={...reading,complexity:110};
  const a=makeResonantHaiku(marks,7,islands,'mesange')!,b=makeResonantHaiku(marks,7,branches,'mesange')!;
  expect(a.title).toContain('de la mésange bleue');expect(a.verses).toHaveLength(3);expect(a.verses[1]).not.toBe(b.verses[1]);expect(MORPHIC_LINES.islands).toContain(a.verses[1]);expect(MORPHIC_LINES.branching).toContain(b.verses[1]);
  expect(BIRD_POETICS.mesange.lines[0]).toContain(a.verses[0]);expect(BIRD_POETICS.mesange.lines[2]).toContain(a.verses[2]);expect(makeResonantHaiku(marks,7,islands,'mesange')).toEqual(a);
 });
 it('distinguishes white space, vertical movement and diffuse films',()=>{
  expect(morphicFamily({...reading,coverage:.03})).toBe('silence');expect(morphicFamily({...reading,vertical:true})).toBe('rising');expect(morphicFamily({...reading,diffuse:true})).toBe('veil');
 });
 it('reads different morphologies from actual pixels rather than just changing the seed',()=>{
  const frame=(branching:boolean)=>{const width=100,height=100,pixels=new Uint8Array(width*height*4);
   for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const ink=branching?(x>=48&&x<52&&y>=20&&y<80||x>=20&&x<80&&[25,35,45,55,65,75].some(k=>y>=k&&y<k+2)):(x>=30&&x<70&&y>=30&&y<70);
    pixels.set(ink?[70,130,190,255]:[247,244,236,255],(y*width+x)*4);
   }return readArtwork({width,height,pixels});};
  const compact=frame(false),branches=frame(true);expect(morphicFamily(branches)).toBe('branching');expect(morphicFamily(compact)).not.toBe('branching');
  expect(makeResonantHaiku(marks,7,branches,'mesange')!.verses[1]).not.toBe(makeResonantHaiku(marks,7,compact,'mesange')!.verses[1]);
 });
 it('always names the reference bird in the title with the correct French article',()=>{
  for(const bird of Object.keys(BIRD_TITLE_REFERENCE) as (keyof typeof BIRD_TITLE_REFERENCE)[]){
   const poem=makeResonantHaiku(marks,7,reading,bird)!;expect(poem.title).toContain(BIRD_TITLE_REFERENCE[bird]);
   expect(poem.title.length).toBeGreaterThan(BIRD_TITLE_REFERENCE[bird].length);
  }
 });
 it('does not generate words without a real painting',()=>{expect(makeResonantHaiku([],7,reading,'mesange')).toBeNull();expect(makeResonantHaiku(marks,7,{...reading,coverage:0},'mesange')).toBeNull();});
 it('clamps placement and reduces oversized text to preserve the signature strip',()=>{
  const p=fitPoem({x:1,y:1,size:.06},.5,.2);expect(p.x+.5).toBeLessThanOrEqual(.965);expect(p.y+.2).toBeLessThanOrEqual(.94);
  expect(fitPoem({x:0,y:0,size:.06},1.4,.4).size).toBeLessThan(.06);
 });
});
