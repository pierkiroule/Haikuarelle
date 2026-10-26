import type {Bird} from './catalog';
import type {BirdAudioBank} from './BirdAudioBank';
import type {HaikuarelleEngine} from '../engine/WatercolorEngine';
/** One immersed phrase per water contact; release fades rather than restarting. */
export class WaterSong{
 private active=false;private started=false;private token=0;
 constructor(private bank:Pick<BirdAudioBank,'play'|'stop'|'submerge'>,private painter:Pick<HaikuarelleEngine,'startWaterSong'|'stopWaterSong'>,private events:{preparing:()=>void;started:()=>void;stopped:()=>void;error:(message:string)=>void}){}
 get busy(){return this.active;}
 async begin(bird:Bird){
  if(this.active)return;
  this.active=true;this.started=false;const token=++this.token;this.events.preparing();
  try{
   await this.bank.play(bird.id,sound=>{
    if(token!==this.token)return;
    this.started=true;this.painter.startWaterSong(sound.analysis,sound.elapsed,sound.audibility);this.events.started();
   },()=>{if(token===this.token){this.active=false;this.started=false;this.painter.stopWaterSong();this.events.stopped();}},{immersed:true});
  }catch(error){if(token===this.token){this.cancel();this.events.error(error instanceof Error?error.message:'Le chant immergé ne peut pas démarrer.');}}
 }
 release(){if(!this.active)return;if(!this.started)this.cancel();else this.bank.submerge();}
 cancel(){if(!this.active)return;this.token++;this.active=false;this.started=false;this.bank.stop();this.painter.stopWaterSong();this.events.stopped();}
}
