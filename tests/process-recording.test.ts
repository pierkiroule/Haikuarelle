import {describe,it,expect} from 'vitest';
import {replayTime,replaySample,thinFrames,type ProcessFrame} from '../src/dance/ProcessRecording';
const frames=(n:number)=>Array.from({length:n},(_,i)=>({time:i*100,image:new Blob([String(i)])}));
describe('real process replay',()=>{
 it('moves forward smoothly and holds the final composition for four seconds',()=>{
  expect(replayTime(0)).toBe(0);expect(replayTime(26)).toBe(1);expect(replayTime(30)).toBe(1);
  let prior=0;for(let t=0;t<=30;t+=.1){const progress=replayTime(t);expect(progress).toBeGreaterThanOrEqual(prior);prior=progress;}
  const captured=frames(100);expect(replaySample(captured,30)).toEqual({from:98,to:99,mix:1});
 });
 it('uses irregular capture timestamps and interpolation throughout the process',()=>{
  const captured=[{time:100,image:new Blob()},{time:200,image:new Blob()},{time:1100,image:new Blob()}];
  expect(replaySample(captured,13)).toEqual({from:1,to:2,mix:400/900});
  expect(replaySample(captured,0)).toEqual({from:0,to:0,mix:0});
 });
 it('bounds long recordings without losing their beginning or end',()=>{
  let captured=frames(1001);const first=captured[0],last=captured.at(-1);while(captured.length>240)captured=thinFrames(captured);
  expect(captured.length).toBeLessThanOrEqual(240);expect(captured[0]).toBe(first);expect(captured.at(-1)).toBe(last);
  expect(captured.every((frame,i)=>i===0||frame.time>captured[i-1].time)).toBe(true);
 });
 it('handles empty and single-frame histories safely',()=>{
  expect(replaySample([],5)).toEqual({from:0,to:0,mix:0});expect(replaySample(frames(1),20)).toEqual({from:0,to:0,mix:0});
 });
});

import {vi,afterEach} from 'vitest';
import {ProcessRecording} from '../src/dance/ProcessRecording';
afterEach(()=>vi.unstubAllGlobals());
function fakeCanvas(size=20){
 vi.stubGlobal('ImageData',class{});
 vi.stubGlobal('document',{createElement:()=>({width:0,height:0,getContext:()=>({putImageData(){}}),toBlob:(done:(blob:Blob)=>void)=>done(new Blob([new Uint8Array(size)]))})});
}
it('captures real pixel readbacks and keeps storage bounded over a long creation',async()=>{
 fakeCanvas(200000);const recorder=new ProcessRecording(),read=vi.fn(()=>({width:1,height:1,pixels:new Uint8Array(4)}));
 for(let i=0;i<1000;i++)await recorder.capture(read,i*300);
 await recorder.capture(read,300000,true);const captured=await recorder.snapshot();
 expect(captured.length).toBeLessThanOrEqual(360);expect(captured.reduce((s,f)=>s+f.image.size,0)).toBeLessThanOrEqual(32*1024*1024);
 expect(captured[0].time).toBe(0);expect(captured.at(-1)?.time).toBe(300000);expect(read.mock.calls.length).toBeLessThan(1000);
 recorder.reset();expect(await recorder.snapshot()).toEqual([]);recorder.dispose();
});
it('ignores a pending image from an erased painting',async()=>{
 fakeCanvas();let complete:(blob:Blob)=>void=()=>{};
 vi.stubGlobal('document',{createElement:()=>({getContext:()=>({putImageData(){}}),toBlob:(done:(blob:Blob)=>void)=>{complete=done;}})});
 const recorder=new ProcessRecording(),capture=recorder.capture(()=>({width:1,height:1,pixels:new Uint8Array(4)}),0);
 recorder.reset();complete(new Blob(['old']));await capture;expect(await recorder.snapshot()).toEqual([]);
});
it('reports capture failure once while allowing the painting flow to continue',async()=>{
 const error=vi.fn(),recorder=new ProcessRecording(error),read=()=>{throw Error('GPU unavailable');};
 await recorder.capture(read,0);await recorder.capture(read,300);expect(error).toHaveBeenCalledOnce();expect(await recorder.snapshot()).toEqual([]);
});
