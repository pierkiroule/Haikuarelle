import {VIDEO_SECONDS,videoMime} from './score';
/** Whole bird phrases, separated by silence; never reverse the recording. */
export class DanceAudio{
 readonly context=new AudioContext();private sources:AudioBufferSourceNode[]=[];private gain:GainNode|null=null;
 async unlock(){await this.context.resume();if(this.context.state!=='running')throw new Error('Touche à nouveau pour autoriser le chant.');}
 play(buffer:AudioBuffer,destination:AudioNode=this.context.destination){
  this.stop();const ctx=this.context,start=ctx.currentTime,gain=ctx.createGain();this.gain=gain;gain.connect(destination);if(destination!==ctx.destination)gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(.7,start+.35);gain.gain.setValueAtTime(.7,start+VIDEO_SECONDS-.6);gain.gain.linearRampToValueAtTime(0,start+VIDEO_SECONDS);
  for(let t=0;t<VIDEO_SECONDS;t+=buffer.duration+.5){const source=ctx.createBufferSource();source.buffer=buffer;source.connect(gain);source.start(start+t);source.stop(start+Math.min(VIDEO_SECONDS,t+buffer.duration));this.sources.push(source);}
 }
 stop(){for(const source of this.sources){try{source.stop();}catch{/* Already ended. */}source.disconnect();}this.sources=[];this.gain?.disconnect();this.gain=null;}
 async dispose(){this.stop();if(this.context.state!=='closed')await this.context.close();}
}
export interface DanceVideo{blob:Blob;extension:'mp4'|'webm'}
/** One replay, one video/audio clock; no concatenation of MediaRecorder fragments. */
async function recordRealtimeDance(canvas:HTMLCanvasElement,draw:(time:number)=>void|Promise<void>,audio:DanceAudio,buffer:AudioBuffer,signal:AbortSignal,onProgress:(n:number)=>void):Promise<DanceVideo>{
 if(typeof MediaRecorder==='undefined'||!canvas.captureStream)throw new Error('Ce navigateur ne permet pas la vidéo. La danse et le PNG restent disponibles.');
 const mime=videoMime(value=>MediaRecorder.isTypeSupported(value));if(!mime)throw new Error('Aucun format vidéo compatible sur ce navigateur.');
 await audio.unlock();if(signal.aborted)throw new DOMException('Annulé','AbortError');
 await draw(0);if(signal.aborted)throw new DOMException('Annulé','AbortError');
 const destination=audio.context.createMediaStreamDestination(),stream=canvas.captureStream(30);destination.stream.getAudioTracks().forEach(track=>stream.addTrack(track));
 let recorder:MediaRecorder|undefined,frame=0,timer:ReturnType<typeof setTimeout>|undefined;
 try{
  recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:canvas.width>=1080?12_000_000:6_500_000,audioBitsPerSecond:128000});const chunks:BlobPart[]=[];
  return await new Promise<DanceVideo>((resolve,reject)=>{
   const recording=recorder!;let ended=false;
   const fail=(error:Error)=>{if(ended)return;ended=true;reject(error);};
   const abort=()=>fail(new DOMException('Annulé','AbortError'));
   signal.addEventListener('abort',abort,{once:true});
   recording.ondataavailable=event=>{if(event.data.size)chunks.push(event.data);};
   recording.onerror=()=>fail(new Error('L’enregistrement vidéo a échoué. Tu peux réessayer.'));
   recording.onstop=()=>{signal.removeEventListener('abort',abort);if(ended)return;ended=true;const blob=new Blob(chunks,{type:recording.mimeType});if(!blob.size)reject(new Error('La vidéo est vide. Réessaie.'));else resolve({blob,extension:recording.mimeType.includes('mp4')?'mp4':'webm'});};
   const start=audio.context.currentTime;recording.start(250);audio.play(buffer,destination);
   let lastFrame=-1;
   const step=async()=>{if(ended)return;try{const time=Math.min(VIDEO_SECONDS,audio.context.currentTime-start);if(time-lastFrame<1/30&&time<VIDEO_SECONDS){frame=requestAnimationFrame(step);return;}lastFrame=time;await draw(time);if(ended)return;onProgress(time/VIDEO_SECONDS);if(time>=VIDEO_SECONDS){recording.stop();return;}frame=requestAnimationFrame(step);}catch(error){fail(error instanceof Error?error:new Error('Le rendu a été interrompu.'));}};
   frame=requestAnimationFrame(step);timer=setTimeout(()=>fail(new Error('L’export a été interrompu. Garde cet écran ouvert puis réessaie.')),(VIDEO_SECONDS+7)*1000);
  });
 }finally{cancelAnimationFrame(frame);clearTimeout(timer);if(recorder&&recorder.state!=='inactive')recorder.stop();stream.getTracks().forEach(track=>track.stop());destination.disconnect();audio.stop();}
}

export async function recordDance(canvas:HTMLCanvasElement,draw:(time:number)=>void|Promise<void>,audio:DanceAudio,buffer:AudioBuffer,signal:AbortSignal,onProgress:(n:number)=>void):Promise<DanceVideo>{
 audio.stop();
 if(typeof VideoEncoder!=='undefined'&&typeof AudioEncoder!=='undefined'){
  const {encodeDance}=await import('./encode');if(signal.aborted)throw new DOMException('Annulé','AbortError');
  return encodeDance(canvas,draw,buffer,signal,onProgress);
 }
 return recordRealtimeDance(canvas,draw,audio,buffer,signal,onProgress);
}
