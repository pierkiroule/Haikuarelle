import {describe,it,expect,vi} from 'vitest';
import {SpatialLandscape} from '../src/voyage/SpatialLandscape';
import type {BirdId} from '../src/birds/catalog';
import type {SoundSite} from '../src/voyage/sculpture';
const param=()=>({value:0,setTargetAtTime:vi.fn(),setValueAtTime:vi.fn(),linearRampToValueAtTime:vi.fn(),cancelScheduledValues:vi.fn()});
function setup(){
  const sources:{buffer:AudioBuffer|null;loop:boolean;connect:ReturnType<typeof vi.fn>;disconnect:ReturnType<typeof vi.fn>;start:ReturnType<typeof vi.fn>;stop:ReturnType<typeof vi.fn>;onended:(()=>void)|null}[]=[];
  const panners:{positionX:ReturnType<typeof param>;positionY:ReturnType<typeof param>;positionZ:ReturnType<typeof param>;panningModel:string;distanceModel:string;refDistance:number;connect:ReturnType<typeof vi.fn>;disconnect:ReturnType<typeof vi.fn>}[]=[];
  const listener=Object.fromEntries(['positionX','positionY','positionZ','forwardX','forwardY','forwardZ','upX','upY','upZ'].map(name=>[name,param()]));
  const context={state:'running',currentTime:0,destination:{},listener,resume:vi.fn(async()=>{}),close:vi.fn(),
    createGain:()=>({gain:param(),connect:vi.fn(),disconnect:vi.fn()}),
    createDynamicsCompressor:()=>({threshold:param(),knee:param(),ratio:param(),connect:vi.fn(),disconnect:vi.fn()}),
    createBufferSource:()=>{const s={buffer:null,loop:true,connect:vi.fn(),disconnect:vi.fn(),start:vi.fn(),stop:vi.fn(),onended:null};sources.push(s);return s;},
    createPanner:()=>{const p={positionX:param(),positionY:param(),positionZ:param(),panningModel:'',distanceModel:'',refDistance:0,connect:vi.fn(),disconnect:vi.fn()};panners.push(p);return p;},
  };
  const buffers=new Map<BirdId,AudioBuffer>(['geai','mesange','pie'].map(id=>[id as BirdId,{duration:id==='pie'?.853:3} as AudioBuffer]));
  const sites:SoundSite[]=[{bird:'geai',position:[0,0,0]},{bird:'mesange',position:[.3,0,0]},{bird:'pie',position:[-.3,0,0]},{bird:'geai',position:[.1,0,0]}];
  const sound=new SpatialLandscape(context as unknown as AudioContext,sites,buffers);
  return {sound,context,sources,panners,buffers};
}
describe('spatial bird landscape',()=>{
  it('plays a nearby intact recorded phrase with HRTF placement and the moving listener orientation',()=>{
    const t=setup();t.sound.tick([0,0,.8],[0,0,-1],[0,1,0]);
    expect(t.sources).toHaveLength(1);expect(t.sources[0].buffer).toBe(t.buffers.get('geai'));
    expect(t.sources[0].loop).toBe(false);expect(t.sources[0].start).toHaveBeenCalledWith(0);
    expect(t.panners[0].panningModel).toBe('HRTF');expect(t.panners[0].refDistance).toBe(.65);
    expect(t.context.listener.positionZ.setTargetAtTime).toHaveBeenCalledWith(.8,0,.04);
    expect(t.context.listener.forwardZ.setTargetAtTime).toHaveBeenCalledWith(-1,0,.04);
    t.context.currentTime=.2;t.sound.tick([0,0,-.8],[0,0,1],[0,1,0]);
    expect(t.context.listener.forwardZ.setTargetAtTime).toHaveBeenLastCalledWith(1,.2,.04);t.sound.dispose();
  });
  it('keeps far fields quiet and bounds polyphony and repeated instances of the same bird',()=>{
    const t=setup();t.sound.tick([0,0,8],[0,0,-1],[0,1,0]);expect(t.sources).toHaveLength(0);
    for(let i=0;i<12;i++){t.context.currentTime=i*.2;t.sound.tick([0,0,.7],[0,0,-1],[0,1,0]);}
    expect(t.sources).toHaveLength(3);expect(t.sound.activeVoices).toBe(3);
    expect(new Set(t.sources.map(s=>s.buffer)).size).toBe(3);t.sound.dispose();
  });
  it('leaves a natural breath between phrases, rather than looping or stuttering at the boundary',()=>{
    const t=setup();t.sound.tick([0,0,1.54],[0,0,-1],[0,1,0]);expect(t.sources).toHaveLength(1);
    t.sources[0].onended?.();t.context.currentTime=3.2;t.sound.tick([0,0,1.54],[0,0,-1],[0,1,0]);
    expect(t.sources).toHaveLength(1);
    t.context.currentTime=6;t.sound.tick([0,0,1.54],[0,0,-1],[0,1,0]);expect(t.sources).toHaveLength(2);t.sound.dispose();
  });
  it('stops sound on pause/mute and disposes every voice without closing the studio audio context',()=>{
    const t=setup();t.sound.tick([0,0,.7],[0,0,-1],[0,1,0]);t.sound.setPaused(true);
    expect(t.sources[0].stop).toHaveBeenCalled();t.context.currentTime=.2;t.sound.tick([0,0,.7],[0,0,-1],[0,1,0]);expect(t.sources).toHaveLength(1);
    t.sound.setMuted(true);t.sound.setPaused(false);t.context.currentTime=.5;t.sound.tick([0,0,.7],[0,0,-1],[0,1,0]);expect(t.sources).toHaveLength(1);
    t.sound.dispose();expect(t.sources[0].disconnect).toHaveBeenCalled();expect(t.sources[0].onended).toBeNull();expect(t.context.close).not.toHaveBeenCalled();
    t.context.currentTime=10;t.sound.tick([0,0,.7],[0,0,-1],[0,1,0]);expect(t.sources).toHaveLength(1);
  });
});
