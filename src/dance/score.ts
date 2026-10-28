export const VIDEO_SECONDS=30;
export function videoMime(supported:(mime:string)=>boolean):string|null{
 return ['video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/mp4;codecs=avc1,mp4a.40.2','video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'].find(supported)??null;
}
export function videoSize(coarse:boolean,memory?:number){return coarse||memory!==undefined&&memory<=4?{width:720,height:1280}:{width:1080,height:1920};}
