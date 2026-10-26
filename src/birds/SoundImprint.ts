import type {AudioAnalysis,AudioFrame} from '../audio/types';
import {clamp} from '../engine/composition';

function quantile(values:number[],q:number):number{
  const sorted=values.filter(Number.isFinite).sort((a,b)=>a-b);
  return sorted[Math.floor((sorted.length-1)*q)]??0;
}

/**
 * Express the recorded phrase's dynamics in the useful range of a paintbrush.
 * RMS controls body, spectral attacks trigger local pigment blooms. The noise
 * floor remains gated; normalization never turns actual silence into a gesture.
 * This is an artistic mapping, not a change to the audio or the FFT analysis.
 */
export function soundImprint(analysis:AudioAnalysis):AudioFrame[]{
  const active=analysis.frames.filter(f=>f.active&&f.rms>0);
  const peak=Math.max(.0001,quantile(active.map(f=>f.rms),.95));
  const floor=Math.max(.0001,peak*.075,Math.min(quantile(active.map(f=>f.rms),.12)*1.3,peak*.19));
  let envelope=0,previous=0;
  return analysis.frames.map(frame=>{
    const sounding=frame.active&&frame.rms>floor;
    const relative=sounding?clamp((frame.rms-floor)/Math.max(.0001,peak-floor)):0;
    const target=Math.pow(relative,.62);
    envelope+=(target-envelope)*(target>envelope?.82:.48);
    const onset=analysis.onsets.some(t=>Math.abs(t-frame.time)<1/60);
    const rise=Math.max(0,target-previous);previous=target;
    const attack=sounding?clamp((onset?.66:0)+rise*2.2+Math.max(0,frame.flux-.32)*.62):0;
    return {...frame,active:sounding,energy:sounding?clamp(envelope):0,flux:attack};
  });
}
