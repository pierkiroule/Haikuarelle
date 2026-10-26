import {describe,expect,it} from 'vitest';
import {excerptPCM,type AudioDocument} from '../src/audio/file';
function document(duration=23):{doc:AudioDocument;left:Float32Array;right:Float32Array}{
  const length=duration*16000,left=Float32Array.from({length},(_,i)=>i/length),right=left.map(v=>-v);
  const buffer={sampleRate:16000,length,numberOfChannels:2,duration,getChannelData:(channel:number)=>channel?right:left} as AudioBuffer;
  return {doc:{name:'test.mp3',duration,buffer},left,right};
}
describe('15-second selection from a decoded recording',()=>{
  it('cuts both channels at the chosen offset and keeps the recording intact',()=>{
    const {doc,left,right}=document(),excerpt=excerptPCM(doc,3.25);
    expect(excerpt.left.length).toBe(240000);expect(excerpt.right!.length).toBe(240000);
    expect(excerpt.left[0]).toBe(left[52000]);expect(excerpt.right![239999]).toBe(right[291999]);
    excerpt.left.fill(0);expect(left[52000]).not.toBe(0);
  });
  it('bounds invalid offsets to the first or last complete window',()=>{
    const {doc,left}=document();
    expect(excerptPCM(doc,-20).left[0]).toBe(left[0]);
    expect(excerptPCM(doc,999).left[0]).toBe(left[128000]);
    expect(excerptPCM(doc,NaN).left.length).toBe(240000);
  });
  it('retains the true length of short files',()=>{
    const {doc}=document(2);
    expect(excerptPCM(doc,30).left.length).toBe(32000);
  });
});
