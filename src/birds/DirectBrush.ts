import type {HaikuarelleEngine} from '../engine/WatercolorEngine';
import type {Point} from '../engine/types';
import type {Bird} from './catalog';
import type {BirdAudioBank} from './BirdAudioBank';

type Painter=Pick<HaikuarelleEngine,'startBirdBrush'|'moveBrush'|'liftBrush'|'stopBird'>;
type Sounds=Pick<BirdAudioBank,'play'|'stop'>;
interface Contact {point:Point;time:number;pressure:number}
interface Callbacks {preparing:(bird:Bird)=>void;started:(bird:Bird)=>void;stopped:()=>void;marked:(bird:Bird,point:Point,seed:number)=>void;error:(message:string)=>void}

/** Own gesture coordinator, not a Pigment Drift API. One contact owns one voice.
 * Async decoding never resurrects a released gesture. During loading only the
 * latest position is retained, so the brush cannot replay an old, hidden path.
 */
export class DirectBrush {
  private token=0;
  private down=false;
  private sounding=false;
  private latest:Contact|null=null;
  constructor(private sounds:Sounds,private painter:Painter,private callbacks:Callbacks){}
  async begin(bird:Bird,point:Point,time:number,pressure:number,seed:number,size:number,layer:number):Promise<void>{
    this.end();const token=++this.token;this.down=true;this.latest={point:{...point},time,pressure};
    this.callbacks.preparing(bird);
    try{
      await this.sounds.play(bird.id,sound=>{
        if(token!==this.token||!this.down)return;
        const ok=this.painter.startBirdBrush(sound.analysis,bird,seed,size,layer,sound.elapsed,origin=>{
          if(token===this.token&&this.down)this.callbacks.marked(bird,origin,seed);
        });
        if(!ok){this.end();this.callbacks.error('Ce chant ne contient pas de son exploitable. Choisissez une autre brosse.');return;}
        this.sounding=true;
        const at=this.latest;if(at)this.painter.moveBrush(at.point,at.time,at.pressure);
        this.callbacks.started(bird);
      },()=>{if(token===this.token)this.end();},{loop:true,breath:.28});
    }catch(error){
      if(token!==this.token)return;
      this.end();this.callbacks.error(error instanceof Error?error.message:'Le chant n’a pas pu démarrer.');
    }
  }
  move(point:Point,time:number,pressure=.5):void{
    if(!this.down)return;
    this.latest={point:{...point},time,pressure};
    if(this.sounding)this.painter.moveBrush(point,time,pressure);
  }
  breakPath():void{this.latest=null;this.painter.liftBrush();}
  end():void{
    this.token++;this.down=false;this.sounding=false;this.latest=null;
    this.sounds.stop();this.painter.stopBird();this.callbacks.stopped();
  }
}
