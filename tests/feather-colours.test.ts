import {describe,it,expect} from 'vitest';
import {BIRD_COLOURS} from '../src/birds/colourPalettes';
import {BIRD_BRUSHES} from '../src/birds/catalog';
import {PLUMAGE_PIGMENTS} from '../src/engine/palettes';
import {absorptionTable,MAX_PIGMENTS} from '../src/vendor/pigment-drift/paint/optics';
import {SoundStain} from '../src/birds/SoundStain';
import {WetPaper} from '../src/birds/WetPaper';
const settings={palette:'plumages',format:'portrait' as const,granulation:.8,wetness:.6,complexity:.5,ink:.6,resonance:.96};
describe('individual feathers from each real plumage',()=>{
 for(const bird of BIRD_BRUSHES)it(`${bird.name}: every separate colour paints alone, on wet and dry paper`,()=>{
  const colours=BIRD_COLOURS[bird.id]!;expect(colours.length).toBeGreaterThanOrEqual(6);
  const optical=[...PLUMAGE_PIGMENTS,...colours.map(c=>c.hex)];expect(optical.length).toBeLessThanOrEqual(MAX_PIGMENTS);
  expect(absorptionTable(optical,'#f7f4ec').slice(0,33)).toEqual(absorptionTable(PLUMAGE_PIGMENTS,'#f7f4ec').slice(0,33));
  for(let i=0;i<colours.length;i++)for(const wet of [false,true]){
   expect(colours[i].hex).toMatch(/^#[0-9A-F]{6}$/);
   const water=new WetPaper('portrait',Infinity);if(wet)water.add({x:.2,y:.5},{x:.8,y:.5},.2,.8,0);
   const slot=PLUMAGE_PIGMENTS.length+i,stain=new SoundStain({...bird,pigmentSlot:slot},42,{x:.5,y:.5},settings,water,.7);
   const frames=Array.from({length:30},(_,tick)=>stain.step({time:tick/30,rms:.2,energy:.8,bass:.1,mid:.5,treble:.4,brightness:.8,flux:.9,width:0,balance:0,active:true},tick/30));
   const paint=frames.flatMap(f=>f.segments).filter(s=>!s.water);expect(paint.length).toBeGreaterThan(0);
   expect(paint.every(s=>s.slot===slot)).toBe(true);expect(frames.flatMap(f=>f.ink)).toHaveLength(0);
  }
 });
});
