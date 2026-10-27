import type {HaikuarelleEngine} from '../engine/WatercolorEngine';
import type {Bird} from './catalog';
import type {BirdAudioBank} from './BirdAudioBank';
import type {Point} from '../engine/types';
type Painter=Pick<HaikuarelleEngine,'startSoundStain'|'moveSoundStain'|'stopBird'>;
type Sounds=Pick<BirdAudioBank,'play'|'stop'>&Partial<Pick<BirdAudioBank,'fadeStop'>>;
interface Callbacks{preparing:(bird:Bird)=>void;started:(bird:Bird)=>void;stopped:()=>void;marked:(bird:Bird,point:Point,seed:number)=>void;error:(message:string)=>void}
/** A tap owns a complete phrase. Pointer movement and release do not own its lifetime. */
export class SoundDeposit{
  private token=0;
  private active=false;
  private pendingPoint:Point|null=null;
  private started=false;
  constructor(private sounds:Sounds,private painter:Painter,private callbacks:Callbacks){}
  get busy():boolean{return this.active;}
  async place(bird:Bird,point:Point,seed:number,size:number,layer:number,opacity=1):Promise<void>{
    if(this.active){this.callbacks.error('Laisse ce chant résonner jusqu’au bout avant le prochain dépôt.');return;}
    const token=++this.token;this.active=true;this.started=false;this.pendingPoint=null;this.callbacks.preparing(bird);
    try{
      await this.sounds.play(bird.id,sound=>{
        if(token!==this.token||!this.active)return;
        const ok=this.painter.startSoundStain(sound.analysis,bird,{...point},seed,size,layer,sound.elapsed,origin=>{
          if(token===this.token&&this.active)this.callbacks.marked(bird,origin,seed);
        },opacity,sound.audibility);
        if(!ok){this.cancel();this.callbacks.error('Ce chant ne peut pas démarrer. Réessaie ce dépôt.');return;}
        this.started=true;
        if(this.pendingPoint)this.painter.moveSoundStain(this.pendingPoint,false);
        this.callbacks.started(bird);
      },()=>{if(token===this.token){this.active=false;this.painter.stopBird();this.callbacks.stopped();}});
    }catch(error){
      if(token!==this.token)return;
      this.cancel();this.callbacks.error(error instanceof Error?error.message:'Le chant n’a pas pu démarrer.');
    }
  }
  move(point:Point,connect=true):void{
    if(!this.active)return;
    if(this.started)this.painter.moveSoundStain(point,connect);
    else this.pendingPoint={...point};
  }
  /** Explicit interruption only: reset, Escape, hidden tab or disposal. */
  cancel(fade=false):void{this.token++;this.active=false;this.pendingPoint=null;this.started=false;if(fade&&this.sounds.fadeStop)this.sounds.fadeStop();else this.sounds.stop();this.painter.stopBird();this.callbacks.stopped();}
}
