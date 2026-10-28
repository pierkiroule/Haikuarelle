import {afterEach,it,expect,vi} from 'vitest';
import {DanceAudio} from '../src/dance/media';
afterEach(()=>vi.unstubAllGlobals());
it('plays one original phrase followed by three fading echoes and releases every source',async()=>{
 const nodes:{buffer:AudioBuffer|null;connect:ReturnType<typeof vi.fn>;start:ReturnType<typeof vi.fn>;stop:ReturnType<typeof vi.fn>;disconnect:ReturnType<typeof vi.fn>}[]=[],ramps=vi.fn(),close=vi.fn(async()=>{});
 vi.stubGlobal('AudioContext',class{
  currentTime=100;state='running';destination={};resume=vi.fn(async()=>{});close=close;
  createGain(){return {connect:vi.fn(),disconnect:vi.fn(),gain:{setValueAtTime:vi.fn(),linearRampToValueAtTime:ramps}};}
  createBufferSource(){const node={buffer:null,connect:vi.fn(),start:vi.fn(),stop:vi.fn(),disconnect:vi.fn()};nodes.push(node);return node;}
 });
 const audio=new DanceAudio(),buffer={duration:3} as AudioBuffer;await audio.unlock();audio.play(buffer);
 expect(nodes.length).toBe(4);expect(nodes.every(node=>node.buffer===buffer)).toBe(true);
 nodes.forEach((node,i)=>expect(node.start.mock.calls[0][0]).toBeCloseTo([100,103.45,106.1,108.75][i]));
 expect(nodes.at(-1)!.stop.mock.calls[0][0]).toBeLessThan(127);expect(ramps.mock.calls.filter(call=>call[0]>0).map(call=>call[0])).toEqual([.7,.29,.14,.055]);
 await audio.dispose();expect(nodes.every(node=>node.disconnect.mock.calls.length===1)).toBe(true);expect(close).toHaveBeenCalledOnce();
});
