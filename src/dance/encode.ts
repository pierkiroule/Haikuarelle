import {Output,BufferTarget,Mp4OutputFormat,WebMOutputFormat,CanvasSource,AudioBufferSource,getFirstEncodableAudioCodec,getFirstEncodableVideoCodec} from 'mediabunny';
import {VIDEO_SECONDS} from './score';
import type {DanceVideo} from './media';
/** Fixed timestamps preserve all 450 frames even on a slow GPU. */
export async function encodeDance(canvas:HTMLCanvasElement,draw:(time:number)=>void,buffer:AudioBuffer,signal:AbortSignal,onProgress:(n:number)=>void):Promise<DanceVideo>{
 const videoOptions={width:canvas.width,height:canvas.height,frameRate:30};
 const [avc,aac]=await Promise.all([getFirstEncodableVideoCodec(['avc'],videoOptions),getFirstEncodableAudioCodec(['aac'],{sampleRate:48000,numberOfChannels:2})]);
 const mp4=!!avc&&!!aac;
 const videoCodec=mp4?avc:await getFirstEncodableVideoCodec(['vp9','vp8'],videoOptions),audioCodec=mp4?aac:await getFirstEncodableAudioCodec(['opus'],{sampleRate:48000,numberOfChannels:2});
 if(!videoCodec||!audioCodec)throw new Error('L’encodage vidéo et audio est indisponible sur ce navigateur. La danse et le PNG restent disponibles.');
 const target=new BufferTarget(),output=new Output({target,format:mp4?new Mp4OutputFormat({fastStart:'in-memory'}):new WebMOutputFormat()});
 const video=new CanvasSource(canvas,{codec:videoCodec,bitrate:canvas.width>=1080?8_000_000:4_500_000,keyFrameInterval:1}),audio=new AudioBufferSource({codec:audioCodec,bitrate:128000});
 output.addVideoTrack(video,{frameRate:30});output.addAudioTrack(audio);
 const check=()=>{if(signal.aborted)throw new DOMException('Annulé','AbortError');};
 let audioWriting:Promise<void>|undefined;
 try{
  check();const context=new OfflineAudioContext(2,48000*VIDEO_SECONDS,48000),gain=context.createGain();gain.connect(context.destination);gain.gain.setValueAtTime(.7,0);gain.gain.setValueAtTime(.7,8.8);gain.gain.linearRampToValueAtTime(0,9);
  for(let t=0;t<9;t+=buffer.duration+.5){const source=context.createBufferSource();source.buffer=buffer;source.connect(gain);source.start(t);source.stop(Math.min(9,t+buffer.duration));}
  const soundtrack=await context.startRendering();check();await output.start();audioWriting=audio.add(soundtrack);void audioWriting.catch(()=>{});
  for(let frame=0;frame<VIDEO_SECONDS*30;frame++){
   check();draw(frame/30);await video.add(frame/30,1/30);onProgress((frame+1)/(VIDEO_SECONDS*30));
   if(frame%4===0)await new Promise<void>(resolve=>setTimeout(resolve,0));
  }
  await audioWriting;check();await output.finalize();check();if(!target.buffer?.byteLength)throw new Error('La vidéo est vide.');
  return {blob:new Blob([target.buffer],{type:mp4?'video/mp4':'video/webm'}),extension:mp4?'mp4':'webm'};
 }finally{if(output.state!=='finalized'&&output.state!=='canceled')await output.cancel().catch(()=>{});await audioWriting?.catch(()=>{});}
}
