import {afterEach,beforeEach,describe,it,expect,vi} from 'vitest';
const h=vi.hoisted(()=>({frames:[] as number[],cancel:vi.fn(),finalize:vi.fn(),codec:'avc' as string|null,onFrame:()=>{},offline:[] as number[]}));
vi.mock('mediabunny',()=>({
 BufferTarget:class{buffer=new ArrayBuffer(12);},
 Mp4OutputFormat:class{},WebMOutputFormat:class{},
 Output:class{state='pending';target:{buffer:ArrayBuffer};constructor(options:{target:{buffer:ArrayBuffer}}){this.target=options.target;}addVideoTrack(){}addAudioTrack(){}async start(){this.state='started';}async finalize(){h.finalize();this.state='finalized';}async cancel(){h.cancel();this.state='canceled';}},
 CanvasSource:class{async add(time:number){h.frames.push(time);h.onFrame();}},AudioBufferSource:class{async add(){}},
 getFirstEncodableVideoCodec:async(codecs:string[])=>codecs[0]==='avc'?h.codec:'vp9',getFirstEncodableAudioCodec:async(codecs:string[])=>codecs[0]==='aac'?(h.codec?'aac':null):'opus',
}));
import {encodeDance} from '../src/dance/encode';
beforeEach(()=>{
 h.frames=[];h.cancel.mockClear();h.finalize.mockClear();h.codec='avc';h.onFrame=()=>{};
 vi.stubGlobal('OfflineAudioContext',class{
  constructor(...args:number[]){h.offline=args;}
  destination={};createGain(){return {connect(){},gain:{setValueAtTime(){},linearRampToValueAtTime(){}}};}
  createBufferSource(){return {buffer:null,connect(){},start(){},stop(){}};}async startRendering(){return {duration:30};}
 });
});
afterEach(()=>vi.unstubAllGlobals());
describe('fixed-timestamp dance video',()=>{
 it('encodes 900 frames for the full thirty-second loop',async()=>{
  const draw=vi.fn(),progress=vi.fn();const result=await encodeDance({width:1080,height:1920} as HTMLCanvasElement,draw,{duration:3} as AudioBuffer,new AbortController().signal,progress);
  expect(h.offline).toEqual([2,48000*30,48000]);expect(h.frames).toHaveLength(900);expect(h.frames[0]).toBe(0);expect(h.frames.at(-1)).toBe(899/30);expect(draw).toHaveBeenCalledWith(15);expect(progress).toHaveBeenLastCalledWith(1);expect(result.extension).toBe('mp4');expect(result.blob.type).toBe('video/mp4');expect(h.finalize).toHaveBeenCalledOnce();expect(h.cancel).not.toHaveBeenCalled();
 });
 it('waits for image decoding before encoding each frame',async()=>{
  let rendered=-1;const controller=new AbortController();
  h.onFrame=()=>{expect(rendered).toBe(h.frames.at(-1));if(h.frames.length===3)controller.abort();};
  const draw=async(time:number)=>{await Promise.resolve();rendered=time;};
  await expect(encodeDance({width:720,height:1280} as HTMLCanvasElement,draw,{duration:3} as AudioBuffer,controller.signal,()=>{})).rejects.toMatchObject({name:'AbortError'});
  expect(h.frames).toHaveLength(3);
 });
 it('uses a real WebM container if H264/AAC are unavailable',async()=>{
  h.codec=null;const result=await encodeDance({width:720,height:1280} as HTMLCanvasElement,()=>{},{duration:4} as AudioBuffer,new AbortController().signal,()=>{});
  expect(result.extension).toBe('webm');expect(result.blob.type).toBe('video/webm');
 });
 it('cancels the encoder and never finalizes an interrupted choreography',async()=>{
  const controller=new AbortController();h.onFrame=()=>controller.abort();
  await expect(encodeDance({width:720,height:1280} as HTMLCanvasElement,()=>{},{duration:4} as AudioBuffer,controller.signal,()=>{})).rejects.toMatchObject({name:'AbortError'});
  expect(h.cancel).toHaveBeenCalledOnce();expect(h.finalize).not.toHaveBeenCalled();expect(h.frames).toHaveLength(1);
 });
});
