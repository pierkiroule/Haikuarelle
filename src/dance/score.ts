import type {AudioAnalysis} from '../audio/types';
export const DANCE_SECONDS=9,VIDEO_SECONDS=15;
export const clamp=(v:number,a=0,b=1)=>Math.max(a,Math.min(b,v));
export function soundAt(analysis:AudioAnalysis,time:number){
 if(time<0||time>=DANCE_SECONDS)return {energy:0,bass:0,treble:0,flux:0};
 const local=time%(analysis.duration+.5),frame=local<analysis.duration?analysis.frames[Math.floor(local*30)]:undefined;
 const fade=clamp((DANCE_SECONDS-time)/.2);
 return {energy:(frame?.energy??0)*fade,bass:(frame?.bass??0)*fade,treble:(frame?.treble??0)*fade,flux:(frame?.flux??0)*fade};
}
export function videoMime(supported:(mime:string)=>boolean):string|null{
 return ['video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/mp4;codecs=avc1,mp4a.40.2','video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'].find(supported)??null;
}
export function videoSize(coarse:boolean,memory?:number){return coarse||memory!==undefined&&memory<=4?{width:720,height:1280}:{width:1080,height:1920};}
