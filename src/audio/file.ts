import {ANALYSIS_RATE, EXCERPT_SECONDS, type AudioAnalysis, type AnalysisInput} from './types';
export interface AudioDocument {name:string;buffer:AudioBuffer;duration:number}

/** Decoding is offline and resampled to 16 kHz to bound PCM memory. */
export async function openAudio(file:File):Promise<AudioDocument>{
  if(!file.size)throw new Error('Ce fichier audio est vide.');
  if(file.size>50*1024*1024)throw new Error('Choisissez un fichier de moins de 50 Mo.');
  if(typeof OfflineAudioContext==='undefined')throw new Error('Ce navigateur ne permet pas le décodage audio.');
  const context=new OfflineAudioContext(2,1,ANALYSIS_RATE);
  let buffer:AudioBuffer;
  try{buffer=await context.decodeAudioData(await file.arrayBuffer());}
  catch{throw new Error('Impossible de lire ce fichier. Essayez un MP3 ou un WAV valide.');}
  if(!Number.isFinite(buffer.duration)||buffer.duration<.15)throw new Error('L’extrait audio est trop court.');
  return {name:file.name,buffer,duration:buffer.duration};
}

export function excerptPCM(document:AudioDocument,start:number):AnalysisInput{
  const rate=document.buffer.sampleRate;
  const latest=Math.max(0,document.duration-EXCERPT_SECONDS);
  const begin=Math.round(Math.max(0,Math.min(Number.isFinite(start)?start:0,latest))*rate);
  const end=Math.min(document.buffer.length,begin+Math.round(EXCERPT_SECONDS*rate));
  return {left:document.buffer.getChannelData(0).slice(begin,end),right:document.buffer.numberOfChannels>1?document.buffer.getChannelData(1).slice(begin,end):undefined,sampleRate:rate};
}

/** One request owns one worker. Abort terminates analysis and releases the PCM copy. */
export function analyzeExcerpt(document:AudioDocument,start:number,signal?:AbortSignal):Promise<AudioAnalysis>{
  return new Promise((resolve,reject)=>{
    if(signal?.aborted){reject(new DOMException('Analyse annulée','AbortError'));return;}
    const input=excerptPCM(document,start);
    const worker=new Worker(new URL('./analysis.worker.ts',import.meta.url),{type:'module'});
    const abort=()=>{worker.terminate();reject(new DOMException('Analyse annulée','AbortError'));};
    const clean=()=>{worker.terminate();signal?.removeEventListener('abort',abort);};
    signal?.addEventListener('abort',abort,{once:true});
    worker.onmessage=(event:MessageEvent<{analysis?:AudioAnalysis;error?:string}>)=>{
      clean();if(event.data.analysis)resolve(event.data.analysis);else reject(new Error(event.data.error||'L’analyse audio a échoué.'));
    };
    worker.onerror=()=>{clean();reject(new Error('L’analyse locale n’a pas pu démarrer.'));};
    const transfer:Transferable[]=[input.left.buffer];if(input.right)transfer.push(input.right.buffer);
    worker.postMessage(input,transfer);
  });
}

/** Audition is optional. The pictorial score never depends on this audio clock. */
export class ExcerptPlayer{
  private context:AudioContext|null=null;
  private source:AudioBufferSourceNode|null=null;
  private gain:GainNode|null=null;
  private sequence=0;
  async play(document:AudioDocument,start:number,onEnded:()=>void):Promise<void>{
    this.stop();const token=this.sequence;
    this.context??=new AudioContext();await this.context.resume();
    if(token!==this.sequence)return;
    const source=this.context.createBufferSource();source.buffer=document.buffer;
    const gain=this.context.createGain();gain.gain.value=.7;this.gain=gain;
    source.connect(gain);gain.connect(this.context.destination);
    source.onended=()=>{source.disconnect();gain.disconnect();if(this.source===source){this.source=null;this.gain=null;onEnded();}};
    this.source=source;
    const duration=Math.min(EXCERPT_SECONDS,document.duration-start);
    source.start(0,start,duration);
  }
  stop():void{this.sequence++;if(this.source){this.source.onended=null;try{this.source.stop();}catch{}this.source.disconnect();this.source=null;}this.gain?.disconnect();this.gain=null;}
  destroy():void{this.stop();void this.context?.close();this.context=null;}
}
