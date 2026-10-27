import type {BirdAudioBank} from '../birds/BirdAudioBank';
import type {BirdId} from '../birds/catalog';
import type {HaikuarelleEngine} from '../engine/WatercolorEngine';
import type {Point} from '../engine/types';
import {EXHIBITION,lifetime,pigmentSurvival} from './lifecycle';
interface Memory {id:number;bird:BirdId;point:Point;born:number;last:number}
/** A call-and-response score: one hand phrase and one fading memory at most. */
export class Soundscape {
 private memories:Memory[]=[];private serial=0;private next=0;private disposed=false;private generation=0;private pending=false;private previous:BirdId|null=null;
 constructor(private bank:BirdAudioBank,private painter:HaikuarelleEngine){}
 remember(bird:BirdId,point:Point,now:number):void{
  this.memories=this.memories.filter(m=>now-m.born<lifetime()).slice(-(EXHIBITION.maxMemories-1));
  this.memories.push({id:++this.serial,bird,point:{...point},born:Math.floor(now/EXHIBITION.bucket)*EXHIBITION.bucket,last:-Infinity});this.next=Math.max(this.next,now+EXHIBITION.answerGap);
 }
 async tick(now:number):Promise<void>{
  this.memories=this.memories.filter(m=>now-m.born<lifetime());
  if(this.disposed||this.pending||document.hidden||now<this.next||this.bank.mainBusy||this.bank.replyBusy)return;
  const candidates=this.memories.filter(m=>now-m.born>5&&now-m.born<lifetime()-EXHIBITION.answerDuration).sort((a,b)=>(a.bird===this.previous?1:0)-(b.bird===this.previous?1:0)||a.last-b.last);
  const m=candidates[0];if(!m)return;
  const age=now-m.born,volume=.26*pigmentSurvival(age)*(1-.55*Math.min(1,age/lifetime()));
  m.last=now;this.previous=m.bird;this.next=now+EXHIBITION.answerGap+Math.min(6,age*.1);this.pending=true;
  const key=`memory-${m.id}`,generation=this.generation;
  try{await this.bank.playReply(m.bird,m.point,volume,sound=>{
    if(this.disposed||generation!==this.generation)return;
    this.painter.hearLandscape(key,sound.analysis,sound.elapsed,()=>this.painter.livingSeconds<m.born+lifetime()?sound.audibility?.()??0:0,m.point);
  },()=>this.painter.forgetLandscape(key));}finally{this.pending=false;}
 }
 silence():void{this.generation++;this.bank.stopReplies();for(const m of this.memories)this.painter.forgetLandscape(`memory-${m.id}`);}
 destroy():void{this.disposed=true;this.silence();this.memories=[];}
 get count():number{return this.memories.length;}
}
