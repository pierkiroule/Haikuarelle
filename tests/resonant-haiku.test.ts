import {describe,it,expect} from 'vitest';
import {readArtwork,makeResonantHaiku,morphicFamily,MORPHIC_LINES,BIRD_TITLE_REFERENCE,type ArtworkReading} from '../src/birds/artworkPoetry';
import {RESONANT_STANZAS,SENSORY_OPENINGS} from '../src/birds/resonantLexicon';
const reading:ArtworkReading={tones:['blue'],coverage:.25,centerY:.5,islands:1,vertical:false,complexity:30,density:.4};
const marks=[{bird:'mesange' as const,seed:7,point:{x:.5,y:.5}}];
describe('a response from actual morphology and bird ecology',()=>{
 it('changes the central image with morphology at the same seed and bird',()=>{
  const islands={...reading,islands:4},branches={...reading,complexity:110};
  const a=makeResonantHaiku(marks,7,islands,'mesange')!,b=makeResonantHaiku(marks,7,branches,'mesange')!;
  expect(a.title).toContain('de la mésange bleue');expect(a.verses).toHaveLength(3);expect(a.verses[1]).not.toBe(b.verses[1]);expect(MORPHIC_LINES.islands).toContain(a.verses[1]);expect(MORPHIC_LINES.branching).toContain(b.verses[1]);
  expect(SENSORY_OPENINGS.mesange).toContain(a.verses[0]);expect(RESONANT_STANZAS.islands.some(s=>s.image===a.verses[1]&&s.echo===a.verses[2]&&a.title.startsWith(s.title+' '))).toBe(true);expect(makeResonantHaiku(marks,7,islands,'mesange')).toEqual(a);
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
 it('keeps every title attached to its complete sensory, rhyming couplet for every bird and morphology',()=>{
  const readings={islands:{...reading,islands:4},branching:{...reading,complexity:110},rising:{...reading,vertical:true},veil:{...reading,diffuse:true},shelter:{...reading,coverage:.6},silence:{...reading,coverage:.03},passage:reading};
  for(const [family,r] of Object.entries(readings)){
   const templates=RESONANT_STANZAS[family as keyof typeof RESONANT_STANZAS],seen=new Set<string>();
   for(const bird of Object.keys(BIRD_TITLE_REFERENCE) as (keyof typeof BIRD_TITLE_REFERENCE)[])for(let seed=0;seed<64;seed++){
    const poem=makeResonantHaiku(marks,seed,r,bird)!;
    const stanza=templates.find(s=>poem.title===`${s.title} ${BIRD_TITLE_REFERENCE[bird]}`);expect(stanza).toBeDefined();
    expect(poem.verses).toEqual([expect.any(String),stanza!.image,stanza!.echo]);expect(SENSORY_OPENINGS[bird]).toContain(poem.verses[0]);
    expect(poem.verses.join(' ')).not.toMatch(/undefined|\{|\}/);expect(poem.verses.every(line=>line.length<=48)).toBe(true);seen.add(stanza!.title);
   }
   expect(seen.size).toBe(templates.length);
  }
 });
 it('does not generate words without a real painting',()=>{expect(makeResonantHaiku([],7,reading,'mesange')).toBeNull();expect(makeResonantHaiku(marks,7,{...reading,coverage:0},'mesange')).toBeNull();});
});
