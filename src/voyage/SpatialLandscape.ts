import type {BirdId} from '../birds/catalog';
import type {SoundSite,Vec3} from './sculpture';

interface Voice {source:AudioBufferSourceNode;gain:GainNode;panner:PannerNode;bird:BirdId}
/** Independent, bounded soundscape: intact real samples, HRTF positioning,
 * at most three voices and a natural breath before the same bird calls again.
 * It borrows its context from the opening gesture; dispose never touches the
 * painting's audio bank or context.
 */
export class SpatialLandscape {
  private master:GainNode;
  private limiter:DynamicsCompressorNode;
  private voices=new Set<Voice>();
  private next=new Map<BirdId,number>();
  private enabled=true;
  private paused=false;
  private disposed=false;
  private last=-Infinity;
  constructor(private context:AudioContext,private sites:readonly SoundSite[],private buffers:ReadonlyMap<BirdId,AudioBuffer>){
    this.master=context.createGain();this.master.gain.value=.85;
    this.limiter=context.createDynamicsCompressor();this.limiter.threshold.value=-16;this.limiter.knee.value=18;this.limiter.ratio.value=4;
    this.master.connect(this.limiter);this.limiter.connect(context.destination);
  }
  get activeVoices():number{return this.voices.size;}
  setMuted(muted:boolean):void{this.enabled=!muted;if(muted)this.stopVoices();}
  setPaused(paused:boolean):void{this.paused=paused;if(paused)this.stopVoices();}
  async resume():Promise<void>{if(!this.disposed)await this.context.resume();}
  tick(position:Vec3,forward:Vec3,up:Vec3):void{
    if(this.disposed||this.context.state!=='running')return;
    const time=this.context.currentTime,listener=this.context.listener;
    if(listener.positionX){
      for(const [params,values] of [[['positionX','positionY','positionZ'],position],[['forwardX','forwardY','forwardZ'],forward],[['upX','upY','upZ'],up]] as const)
        params.forEach((name,i)=>listener[name].setTargetAtTime(values[i],time,.04));
    }else {listener.setPosition(...position);listener.setOrientation(...forward,...up);}
    if(!this.enabled||this.paused||time-this.last<.18||this.voices.size>=3)return;
    this.last=time;
    const active=new Set([...this.voices].map(v=>v.bird));
    const near=this.sites.map(site=>({site,distance:Math.hypot(...site.position.map((v,i)=>v-position[i]))}))
      .filter(({site,distance})=>distance<1.55&&!active.has(site.bird)&&(this.next.get(site.bird)??0)<=time&&this.buffers.has(site.bird))
      .sort((a,b)=>a.distance-b.distance)[0];
    if(!near)return;
    const {site}=near,buffer=this.buffers.get(site.bird)!;
    const source=this.context.createBufferSource(),gain=this.context.createGain(),panner=this.context.createPanner();
    source.buffer=buffer;source.loop=false;panner.panningModel='HRTF';panner.distanceModel='inverse';
    panner.refDistance=.65;panner.rolloffFactor=1.25;panner.maxDistance=10;panner.coneInnerAngle=360;panner.coneOuterAngle=360;
    panner.positionX.value=site.position[0];panner.positionY.value=site.position[1];panner.positionZ.value=site.position[2];
    const end=time+buffer.duration;
    gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(.8,time+Math.min(.08,buffer.duration/4));
    gain.gain.setValueAtTime(.8,Math.max(time+.08,end-.12));gain.gain.linearRampToValueAtTime(0,end);
    source.connect(gain);gain.connect(panner);panner.connect(this.master);
    const voice={source,gain,panner,bird:site.bird};this.voices.add(voice);this.next.set(site.bird,end+2.5);
    source.onended=()=>{this.voices.delete(voice);source.disconnect();gain.disconnect();panner.disconnect();};
    try{source.start(time);}catch{this.voices.delete(voice);source.onended=null;source.disconnect();gain.disconnect();panner.disconnect();}
  }
  private stopVoices():void{
    const time=this.context.currentTime;
    for(const voice of this.voices){
      voice.gain.gain.cancelScheduledValues(time);voice.gain.gain.setTargetAtTime(0,time,.012);
      try{voice.source.stop(time+.06);}catch{/* Already ended. */}
    }
  }
  dispose():void{
    if(this.disposed)return;this.disposed=true;
    for(const v of this.voices){v.source.onended=null;try{v.source.stop();}catch{/* Ended. */}v.source.disconnect();v.gain.disconnect();v.panner.disconnect();}
    this.voices.clear();this.master.disconnect();this.limiter.disconnect();
  }
}
