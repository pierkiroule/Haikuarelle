import {describe,it,expect,vi} from 'vitest';
import {WaterSong} from '../src/birds/WaterSong';
import {BIRD_BRUSHES} from '../src/birds/catalog';
import type {BirdAudioBank,BirdPlayback} from '../src/birds/BirdAudioBank';
function setup(){
 let start:(sound:BirdPlayback)=>void=()=>{},end=()=>{};
 const bank={play:vi.fn(async(_id:unknown,onStart:typeof start,onEnd:()=>void)=>{start=onStart;end=onEnd;}),stop:vi.fn(()=>end()),submerge:vi.fn()};
 const painter={startWaterSong:vi.fn(),stopWaterSong:vi.fn()},events={preparing:vi.fn(),started:vi.fn(),stopped:vi.fn(),error:vi.fn()};
 const song=new WaterSong(bank as unknown as Pick<BirdAudioBank,'play'|'stop'|'submerge'>,painter,events);
 return {song,bank,painter,events,start:()=>start({analysis:{frames:[]},elapsed:()=>.2,audibility:()=>.6} as unknown as BirdPlayback),end:()=>end()};
}
describe('immersed water gesture',()=>{
 it('starts once for many move events and fades on release, without authorizing paint',async()=>{
  const h=setup();await h.song.begin(BIRD_BRUSHES[0]);h.start();await h.song.begin(BIRD_BRUSHES[0]);
  expect(h.bank.play).toHaveBeenCalledTimes(1);expect(h.bank.play.mock.calls[0]).toHaveLength(4);
  expect(h.painter.startWaterSong).toHaveBeenCalledOnce();h.song.release();expect(h.bank.submerge).toHaveBeenCalledOnce();expect(h.bank.stop).not.toHaveBeenCalled();
  h.end();expect(h.song.busy).toBe(false);expect(h.painter.stopWaterSong).toHaveBeenCalledOnce();
 });
 it('cancels an undecoded contact and ignores a late callback after release',async()=>{
  const h=setup();await h.song.begin(BIRD_BRUSHES[0]);h.song.release();h.start();
  expect(h.bank.stop).toHaveBeenCalledOnce();expect(h.painter.startWaterSong).not.toHaveBeenCalled();expect(h.song.busy).toBe(false);
 });
 it('does not stop another voice when the water gesture is inactive',()=>{const h=setup();h.song.cancel();expect(h.bank.stop).not.toHaveBeenCalled();});
});
