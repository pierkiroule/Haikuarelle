import type {AudioAnalysis} from '../audio/types';
export const DANCE_SECONDS=15,VIDEO_SECONDS=30;
export const clamp=(v:number,a=0,b=1)=>Math.max(a,Math.min(b,v));
/** Fixed visual clock shared by contemplation and export. */
export function visualTime(time:number){return Math.max(0,Math.min(VIDEO_SECONDS,time));}
export function soundAt(analysis:AudioAnalysis,time:number){
 if(time<0||time>=VIDEO_SECONDS)return {energy:0,bass:0,treble:0,flux:0};
 const local=time%(analysis.duration+.5),frame=local<analysis.duration?analysis.frames[Math.floor(local*30)]:undefined;
 const fade=clamp(Math.min(time/.35,(VIDEO_SECONDS-time)/.6));
 return {energy:(frame?.energy??0)*fade,bass:(frame?.bass??0)*fade,treble:(frame?.treble??0)*fade,flux:(frame?.flux??0)*fade};
}
/** A causal 600 ms envelope: deterministic even when exporting frames out of order. */
export function danceEnvelope(analysis:AudioAnalysis,time:number){
 const result={energy:0,bass:0,treble:0,flux:0};
 if(time<0||time>=VIDEO_SECONDS)return result;
 let weight=0;
 for(let i=0;i<18;i++){
  const position=time*30-i,index=Math.floor(position),fraction=position-index;
  const a=soundAt(analysis,(index+1e-7)/30),b=soundAt(analysis,(index+1+1e-7)/30),w=18-i;weight+=w;
  for(const key of ['energy','bass','treble','flux'] as const)result[key]+=(a[key]*(1-fraction)+b[key]*fraction)*w;
 }
 for(const key of ['energy','bass','treble','flux'] as const)result[key]/=weight;
 return result;
}
export function videoMime(supported:(mime:string)=>boolean):string|null{
 return ['video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/mp4;codecs=avc1,mp4a.40.2','video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'].find(supported)??null;
}
export function videoSize(coarse:boolean,memory?:number){return coarse||memory!==undefined&&memory<=4?{width:720,height:1280}:{width:1080,height:1920};}
