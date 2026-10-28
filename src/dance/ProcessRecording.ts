export interface ProcessFrame {time:number;image:Blob}
export interface ReplaySample {from:number;to:number;mix:number}
/** Preserve the whole chronology while bounding compressed storage on mobile. */
export function thinFrames(frames:ProcessFrame[]){return frames.filter((_,i)=>i===0||i===frames.length-1||i%2===0);}
export function replayTime(time:number,duration=30){const t=Math.max(0,Math.min(duration,time));return t<=duration/2?t/(duration/2):(duration-t)/(duration/2);}
export function replaySample(frames:readonly ProcessFrame[],time:number):ReplaySample{
 if(frames.length<2)return {from:0,to:0,mix:0};
 const target=frames[0].time+replayTime(time)*(frames.at(-1)!.time-frames[0].time);
 let to=frames.findIndex(f=>f.time>=target);if(to<0)to=frames.length-1;
 const from=Math.max(0,to-1),span=frames[to].time-frames[from].time;
 return {from,to,mix:span>0?Math.max(0,Math.min(1,(target-frames[from].time)/span)):0};
}
export class ProcessRecording {
 private frames:ProcessFrame[]=[];private interval=250;private last=-Infinity;private generation=0;private pending:Promise<void>|null=null;private failed=false;
 private canvas:HTMLCanvasElement|null=null;
 constructor(private unavailable:()=>void=()=>{}){}
 reset(){this.generation++;this.frames=[];this.interval=250;this.last=-Infinity;this.failed=false;}
 get available(){return this.frames.length>1;}
 async capture(read:()=>{width:number;height:number;pixels:Uint8Array},time:number,force=false){
  if(this.failed)return;
  if(this.pending){if(!force)return;await this.pending;}
  if(!force&&time-this.last<this.interval)return;
  const generation=this.generation;
  const task=(async()=>{try{
   const {width,height,pixels}=read();const canvas=this.canvas??=document.createElement('canvas');canvas.width=width;canvas.height=height;
   const ctx=canvas.getContext('2d');if(!ctx)throw Error('Capture indisponible');
   ctx.putImageData(new ImageData(new Uint8ClampedArray(pixels),width,height),0,0);
   const image=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('Capture indisponible')),'image/jpeg',.9));
   if(generation!==this.generation)return;
   // Replace a forced capture at the same instant rather than duplicating it.
   if(this.frames.at(-1)?.time===time)this.frames.pop();
   this.frames.push({time,image});this.last=time;
   while(this.frames.length>240||this.frames.length>2&&this.frames.reduce((s,f)=>s+f.image.size,0)>24*1024*1024){this.frames=thinFrames(this.frames);this.interval*=2;}
  }catch{if(generation===this.generation){this.failed=true;this.unavailable();}}})();
  this.pending=task;try{await task;}finally{if(this.pending===task)this.pending=null;}
 }
 async snapshot(){await this.pending;return this.frames.slice();}
 dispose(){this.reset();if(this.canvas)this.canvas.width=this.canvas.height=1;this.canvas=null;}
}
