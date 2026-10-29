import {BIRD_BRUSHES} from '../src/birds/catalog';
import {describe,it,expect} from 'vitest';
import {readArtwork,makeResonantHaiku,morphicFamily,BIRD_TITLE_REFERENCE,type ArtworkReading} from '../src/birds/artworkPoetry';
import {NATURE_HABITATS,NATURE_PIGMENTS,NATURE_SHAPES} from '../src/birds/naturePoetry';
import {RESONANT_STANZAS,SENSORY_OPENINGS} from '../src/birds/resonantLexicon';
const reading:ArtworkReading={tones:['blue'],coverage:.25,centerY:.5,islands:1,vertical:false,complexity:30,density:.4};
const marks=[{bird:'mesange' as const,seed:7,point:{x:.5,y:.5}}];
describe('a response from actual morphology and bird ecology',()=>{
 it('changes the central image with morphology at the same seed and bird',()=>{
  const islands={...reading,islands:4},branches={...reading,complexity:110};
  const a=makeResonantHaiku(marks,7,islands,'mesange')!,b=makeResonantHaiku(marks,7,branches,'mesange')!;
  expect(a.title).toContain('de la mésange bleue');expect(a.verses).toHaveLength(3);expect(a.verses[1]).not.toBe(b.verses[1]);
  expect(NATURE_SHAPES.islands.some(s=>a.verses[1].startsWith(s.title))).toBe(true);expect(NATURE_SHAPES.branching.some(s=>b.verses[1].startsWith(s.title))).toBe(true);
  expect(NATURE_HABITATS.mesange!.some(h=>h.place===a.verses[0]&&h.echo===a.verses[2])).toBe(true);expect(makeResonantHaiku(marks,7,islands,'mesange')).toEqual(a);
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
 it('keeps a coherent refuge and bird gesture while grounding title and image in observed form and colour',()=>{
  const readings={islands:{...reading,islands:4},branching:{...reading,complexity:110},rising:{...reading,vertical:true},veil:{...reading,diffuse:true},shelter:{...reading,coverage:.6},silence:{...reading,coverage:.03},passage:reading};
  for(const [family,r] of Object.entries(readings))for(const bird of BIRD_BRUSHES)for(let seed=0;seed<32;seed++){
   const poem=makeResonantHaiku(marks,seed,r,bird.id)!;
   expect(NATURE_HABITATS[bird.id]!.some(h=>h.place===poem.verses[0]&&h.echo===poem.verses[2])).toBe(true);
   expect(NATURE_SHAPES[family as keyof typeof NATURE_SHAPES].some(s=>poem.title.startsWith(s.title+' ')&&poem.verses[1].startsWith(s.title+' '))).toBe(true);
   expect(NATURE_PIGMENTS.blue.some(p=>poem.title.includes(p)&&poem.verses[1].includes(p))).toBe(true);
   expect(poem.verses.join(' ')).not.toMatch(/undefined|\{|\}/);expect(poem.verses.every(line=>line.length<=48)).toBe(true);
  }
 });
 it('offers varied reachable places and gestures for every active bird',()=>{
  for(const bird of BIRD_BRUSHES){
   const poems=new Set<string>(),places=new Set<string>(),titles=new Set<string>();
   expect(NATURE_HABITATS[bird.id]).toHaveLength(12);
   for(let seed=0;seed<512;seed++){
    const poem=makeResonantHaiku(marks,seed,{...reading,coverage:.03},bird.id)!;
    poems.add(poem.verses.join(' / '));places.add(poem.verses[0]);titles.add(poem.title);
   }
   expect(poems.size).toBeGreaterThan(100);expect(places.size).toBe(12);expect(titles.size).toBeGreaterThanOrEqual(8);
  }
 });
 it('changes the visual image with dominant colour, not just the random seed',()=>{
  for(const tone of Object.keys(NATURE_PIGMENTS) as (keyof typeof NATURE_PIGMENTS)[]){
   const poem=makeResonantHaiku(marks,7,{...reading,tones:[tone]},'mesange')!;
   expect(NATURE_PIGMENTS[tone].some(p=>poem.verses[1].includes(p)&&poem.title.includes(p))).toBe(true);
  }
  const poem=makeResonantHaiku(marks,7,{...reading,tones:['blue','ochre']},'mesange')!;
  expect(NATURE_PIGMENTS.blue.some(p=>poem.verses[1].includes(p))).toBe(true);
  expect(NATURE_PIGMENTS.ochre.some(p=>poem.verses[1].includes(p))).toBe(true);
 });
 it('keeps new rural scenes compact and unique, with places and echoes authored together',()=>{
  for(const habitats of Object.values(NATURE_HABITATS)){
   expect(new Set(habitats.map(h=>h.place)).size).toBe(habitats.length);
   expect(habitats.every(h=>h.place.length<=48&&h.echo.length<=48&&h.affinities.length>0)).toBe(true);
  }
 });
 it('keeps authored variants unique, compact and substantial in all seven morphic families',()=>{
  for(const stanzas of Object.values(RESONANT_STANZAS)){
   expect(stanzas).toHaveLength(12);expect(new Set(stanzas.map(s=>s.title)).size).toBe(12);
   expect(new Set(stanzas.map(s=>s.image+' / '+s.echo)).size).toBe(12);
   expect(stanzas.every(s=>s.image.length<=48&&s.echo.length<=48)).toBe(true);
  }
  for(const lines of Object.values(SENSORY_OPENINGS)){expect(new Set(lines).size).toBe(lines.length);expect(lines.every(line=>line.length<=48)).toBe(true);}
 });
 it('does not generate words without a real painting',()=>{expect(makeResonantHaiku([],7,reading,'mesange')).toBeNull();expect(makeResonantHaiku(marks,7,{...reading,coverage:0},'mesange')).toBeNull();});
});
