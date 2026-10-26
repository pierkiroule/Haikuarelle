import type {AnalysisInput} from '../src/audio/types';
export function signal(kind:'bass'|'treble'|'pulses'|'music'|'silence',duration=15):AnalysisInput{
  const rate=16000,length=Math.round(duration*rate),left=new Float32Array(length),right=new Float32Array(length);
  const frequencies=[146.832,174.614,220,261.626,293.665];
  let state=72814;
  for(let i=0;i<length;i++){
    const t=i/rate;let value=0,pan=0;
    if(kind==='bass')value=.24*Math.sin(2*Math.PI*110*t);
    if(kind==='treble')value=.24*Math.sin(2*Math.PI*3500*t);
    if(kind==='pulses'){
      const age=t%.5,attack=Math.exp(-age*70)*(1-Math.exp(-age*1500));
      value=.5*attack*(Math.sin(2*Math.PI*90*t)+.3*Math.sin(2*Math.PI*2900*t));
    }
    if(kind==='music'){
      const phrase=Math.min(4,Math.floor(t/3)),f=frequencies[phrase];
      const swell=.5-.5*Math.cos(2*Math.PI*(t%3)/3);
      const breath=t>6.65&&t<7.55?0:1;
      state=(Math.imul(state,1664525)+1013904223)>>>0;
      const noise=state/4294967296*2-1;
      const age=t%.625,pluck=Math.exp(-age*15)*(1-Math.exp(-age*300));
      value=breath*((.07+.12*swell)*Math.sin(2*Math.PI*f*t)+.055*Math.sin(2*Math.PI*f*1.5*t)+.032*Math.sin(2*Math.PI*f*2*t)+pluck*(.13*Math.sin(2*Math.PI*72*t)+.025*noise));
      value*=Math.min(1,t/.45,(15-t)/1.0);
      pan=.28*Math.sin(t*.63);
    }
    left[i]=value*(1-pan);right[i]=value*(1+pan);
  }
  return {left,right,sampleRate:rate};
}
