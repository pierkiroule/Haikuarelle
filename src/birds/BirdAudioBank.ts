import {openAudio,analyzeExcerpt,type AudioDocument} from '../audio/file';
import type {AudioAnalysis} from '../audio/types';
import {BIRD_PADS,type BirdId} from './catalog';
export interface BirdSound {document:AudioDocument;analysis:AudioAnalysis}
export interface BirdPlayback extends BirdSound {elapsed:()=>number;cycleDuration:number;audibility?:()=>number}
/** Local licensed recordings, decoded once. Audio starts only inside an explicit encounter or canvas gesture. */
export class BirdAudioBank{
  private cache=new Map<BirdId,Promise<BirdSound>>();
  private loops=new Map<string,AudioBuffer>();
  private controller=new AbortController();
  private context:AudioContext|null=null;
  private source:AudioBufferSourceNode|null=null;
  private gain:GainNode|null=null;
  private filter:BiquadFilterNode|null=null;
  private immersion:{level:()=>number;release:()=>void}|null=null;
  private ended:(()=>void)|null=null;
  private token=0;
  private disposed=false;
  private timer:ReturnType<typeof setTimeout>|null=null;
  prepare(id:BirdId):Promise<BirdSound>{
    const cached=this.cache.get(id);if(cached)return cached;
    const promise=(async()=>{
      const response=await fetch(`/birds/${id}.mp3`,{signal:this.controller.signal});
      if(!response.ok)throw new Error('Cet oiseau n’a pas pu être chargé. Réessayez.');
      const document=await openAudio(new File([await response.blob()],`${id}.mp3`,{type:'audio/mpeg'}));
      const analysis=await analyzeExcerpt(document,0,this.controller.signal);
      return {document,analysis};
    })();
    this.cache.set(id,promise);promise.catch(()=>this.cache.delete(id));return promise;
  }
  async preload(onReady:(id:BirdId)=>void):Promise<void>{
    let index=0;
    await Promise.all(Array.from({length:3},async()=>{
      while(index<BIRD_PADS.length&&!this.disposed){const bird=BIRD_PADS[index++];try{await this.prepare(bird.id);if(!this.disposed)onReady(bird.id);}catch{/* A tap can retry an individual recording. */}}
    }));
  }
  async unlock():Promise<void>{
    if(this.disposed)return;
    this.context??=new AudioContext();await this.context.resume();
  }
  async play(id:BirdId,onStart:(sound:BirdPlayback)=>void,onEnd:()=>void,options:{loop?:boolean;breath?:number;immersed?:boolean}={}):Promise<void>{
    if(this.disposed)return;
    this.stop();const token=this.token;
    // Request resume before awaiting fetch/decode to preserve mobile gesture authorization.
    this.context??=new AudioContext();const resume=this.context.resume();
    const [sound]=await Promise.all([this.prepare(id),resume]);
    if(this.disposed||token!==this.token)return;
    if(this.context.state!=='running')throw new Error('Touche à nouveau le papier pour autoriser le son.');
    const source=this.context.createBufferSource(),gain=this.context.createGain();
    const context=this.context,original=sound.document.buffer;
    let cycleDuration=sound.document.duration;
    if(options.loop){
      // Natural breath between intact recorded phrases. Silence is also silent paint.
      const gap=Math.max(.08,Math.min(2,options.breath??(id==='geai'?1.25:1.05))),length=original.length+Math.round(gap*original.sampleRate);
      const key=`${id}:${gap}`;
      let padded=this.loops.get(key);
      if(!padded){
        padded=context.createBuffer(original.numberOfChannels,length,original.sampleRate);
        for(let channel=0;channel<original.numberOfChannels;channel++)padded.copyToChannel(original.getChannelData(channel),channel);
        this.loops.set(key,padded);
      }
      source.buffer=padded;source.loop=true;cycleDuration=padded.duration;
    }else source.buffer=original;
    let audibility:(()=>number)|undefined;
    if(options.immersed){
      const filter=context.createBiquadFilter();this.filter=filter;filter.type='lowpass';filter.Q.value=.55;
      const start=context.currentTime,duration=cycleDuration,attack=Math.min(.28,duration*.3),tail=Math.min(.35,duration*.3);
      let releaseAt:number|null=null,releaseLevel=1,releaseDuration=.65;
      audibility=()=>{
        if(context.state!=='running')return 0;
        const t=context.currentTime-start,natural=Math.max(0,Math.min(1,t/attack,(duration-t)/tail));
        return releaseAt===null?natural:Math.max(0,Math.min(natural,releaseLevel*(1-(context.currentTime-releaseAt)/releaseDuration)));
      };
      filter.frequency.setValueAtTime(450,start);filter.frequency.exponentialRampToValueAtTime(1700,start+attack);
      gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(.48,start+attack);
      gain.gain.setValueAtTime(.48,start+Math.max(attack,duration-tail));gain.gain.linearRampToValueAtTime(0,start+duration);
      const level=audibility;
      this.immersion={level,release:()=>{
        if(releaseAt!==null)return;
        releaseLevel=level();releaseAt=context.currentTime;releaseDuration=Math.max(.01,Math.min(.65,start+duration-releaseAt));
        gain.gain.cancelScheduledValues(releaseAt);gain.gain.setValueAtTime(.48*releaseLevel,releaseAt);gain.gain.linearRampToValueAtTime(0,releaseAt+releaseDuration);
        filter.frequency.cancelScheduledValues(releaseAt);filter.frequency.setValueAtTime(Math.max(450,filter.frequency.value),releaseAt);filter.frequency.exponentialRampToValueAtTime(350,Math.min(releaseAt+.6,start+duration));
        source.stop(Math.min(releaseAt+.67,start+duration+.01));
      }};
      source.connect(filter);filter.connect(gain);
    }else{gain.gain.value=.72;source.connect(gain);}
    gain.connect(context.destination);
    this.source=source;this.gain=gain;this.ended=onEnd;
    source.onended=()=>{source.disconnect();gain.disconnect();if(this.source===source){this.filter?.disconnect();this.filter=null;this.immersion=null;this.source=null;this.gain=null;const done=this.ended;this.ended=null;done?.();}};
    const started=context.currentTime;
    try{
      source.start();onStart({...sound,cycleDuration,audibility,elapsed:()=>{if(context.state!=='running')return -1;const elapsed=Math.max(0,context.currentTime-started);return options.loop?elapsed%cycleDuration:elapsed;}});
      if(options.loop&&this.source===source&&token===this.token)this.timer=setTimeout(()=>this.stop(),90000);
    }catch(error){this.stop();throw error;}
  }
  submerge():void{this.immersion?.release();}
  stop():void{
    this.token++;
    if(this.timer!==null){clearTimeout(this.timer);this.timer=null;}
    if(this.source){this.source.onended=null;try{this.source.stop();}catch{}this.source.disconnect();this.source=null;}
    this.gain?.disconnect();this.gain=null;this.filter?.disconnect();this.filter=null;this.immersion=null;
    const done=this.ended;this.ended=null;done?.();
  }
  destroy():void{this.disposed=true;this.controller.abort();this.stop();this.loops.clear();this.cache.clear();void this.context?.close();this.context=null;}
}
