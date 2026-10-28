/** Optional local murmurs. A single source serializes narration without blocking painting. */
export class VocalGuidance {
 private context:AudioContext|null=null;
 private source:AudioBufferSourceNode|null=null;
 private gain:GainNode|null=null;
 private queue:number[]=[];
 private seen=new Set<number>();
 private unlocked=false;
 private enabled=true;
 private busy=false;
 private generation=0;
 private controller:AbortController|null=null;
 constructor(private duck:(active:boolean)=>void,private unavailable:()=>void=()=>{}){}
 request(step:number){if(!this.enabled||this.seen.has(step))return;this.seen.add(step);this.queue.push(step);void this.next();}
 unlock(){if(!this.enabled||typeof AudioContext==='undefined')return;this.context??=new AudioContext();void this.context.resume().then(()=>{this.unlocked=this.context?.state==='running';void this.next();}).catch(()=>{});}
 setEnabled(value:boolean){this.enabled=value;if(!value)this.stop();else if(this.context)this.unlock();}
 reset(){this.stop();this.seen.clear();}
 private async next(){
  if(this.busy||!this.enabled||!this.unlocked||!this.context||!this.queue.length)return;
  this.busy=true;const token=this.generation,context=this.context,step=this.queue.shift()!;
  const controller=new AbortController();this.controller=controller;
  try{
   const response=await fetch(`/vocaux/Vocal${String(step).padStart(2,'0')}.mp3`,{signal:controller.signal});
   if(!response.ok)throw new Error('Vocal unavailable');
   const buffer=await context.decodeAudioData(await response.arrayBuffer());
   if(token!==this.generation||!this.enabled)return;
   const source=context.createBufferSource(),gain=context.createGain(),t=context.currentTime,fade=Math.min(.25,buffer.duration/3);
   source.buffer=buffer;source.connect(gain);gain.connect(context.destination);
   gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(.85,t+fade);gain.gain.setValueAtTime(.85,t+Math.max(fade,buffer.duration-fade));gain.gain.linearRampToValueAtTime(0,t+buffer.duration);
   this.source=source;this.gain=gain;this.duck(true);
   await new Promise<void>(resolve=>{source.onended=()=>resolve();this.finish=resolve;source.start();});
  }catch(error){if(!controller.signal.aborted)this.unavailable();}
  finally{if(token===this.generation){this.source?.disconnect();this.gain?.disconnect();this.source=null;this.gain=null;this.finish=null;this.busy=false;this.duck(false);void this.next();}}
 }
 private finish:(()=>void)|null=null;
 stop(){this.generation++;this.queue=[];this.controller?.abort();if(this.source){try{this.source.stop();}catch{}this.source.disconnect();}this.gain?.disconnect();this.finish?.();this.finish=null;this.source=null;this.gain=null;this.busy=false;this.duck(false);}
 destroy(){this.stop();void this.context?.close();this.context=null;this.unlocked=false;}
}
