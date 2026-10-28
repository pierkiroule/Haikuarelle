import type {AudioAnalysis} from '../audio/types';
export const DANCE_SECONDS=9,VIDEO_SECONDS=15;
export const DANCE_TOOLS=[
 {id:'wave',name:'Onduler',hint:'Fais courir des vagues dans la couleur.'},
 {id:'attract',name:'Attirer',hint:'Soulève la matière vers ton geste.'},
 {id:'twist',name:'Tournoyer',hint:'Entraîne la couleur dans un tourbillon.'},
 {id:'vibrate',name:'Vibrer',hint:'Fais frémir les détails avec le chant.'},
 {id:'fly',name:'Envoler',hint:'Déploie la matière dans l’espace.'},
] as const;
export type DanceTool=typeof DANCE_TOOLS[number]['id'];
export interface DanceGesture{time:number;x:number;y:number;tool:DanceTool;strength:number}
export const clamp=(v:number,a=0,b=1)=>Math.max(a,Math.min(b,v));
/** Fixed 30 Hz score: pointer hardware cannot inflate memory or change replay. */
export function addGesture(score:DanceGesture[],gesture:DanceGesture){
 if(![gesture.time,gesture.x,gesture.y,gesture.strength].every(Number.isFinite)||gesture.time<0||gesture.time>=DANCE_SECONDS)return;
 const g={...gesture,x:clamp(gesture.x),y:clamp(gesture.y),strength:clamp(gesture.strength)};
 const last=score.at(-1);
 if(last&&Math.floor(last.time*30)===Math.floor(g.time*30))score[score.length-1]=g;
 else if(!last||g.time>=last.time)score.push(g);
}
export function gestureFor(score:readonly DanceGesture[],tool:DanceTool,time:number):[number,number,number]{
 for(let i=score.length-1;i>=0;i--){const g=score[i];if(g.time<=time&&g.tool===tool){const age=time-g.time;return [g.x,g.y,g.strength*Math.exp(-age*2.2)*clamp((DANCE_SECONDS-time)/.5)];}}
 return [.5,.5,0];
}
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
