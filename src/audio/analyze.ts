import {FEATURE_RATE, EXCERPT_SECONDS, type AnalysisInput, type AudioAnalysis, type AudioFrame} from './types';
const N = 1024;
const clamp = (n: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, n));
const window = Float64Array.from({length:N}, (_, i) => .5 - .5 * Math.cos(2 * Math.PI * i / (N - 1)));

/** Radix-2 FFT. No network, ML model, AudioContext clock or random source. */
function fft(real: Float64Array, imag: Float64Array): void {
  for (let i=1,j=0; i<N; i++) {
    let bit=N>>1;
    for (;j&bit;bit>>=1) j^=bit;
    j^=bit;
    if (i<j) {[real[i],real[j]]=[real[j],real[i]];[imag[i],imag[j]]=[imag[j],imag[i]];}
  }
  for (let len=2; len<=N; len*=2) {
    const angle=-2*Math.PI/len, wr=Math.cos(angle),wi=Math.sin(angle);
    for (let i=0;i<N;i+=len) {
      let ar=1,ai=0;
      for (let j=0;j<len/2;j++) {
        const a=i+j,b=a+len/2,br=real[b]*ar-imag[b]*ai,bi=real[b]*ai+imag[b]*ar;
        real[b]=real[a]-br;imag[b]=imag[a]-bi;real[a]+=br;imag[a]+=bi;
        const t=ar*wr-ai*wi;ai=ar*wi+ai*wr;ar=t;
      }
    }
  }
}
function quantile(xs:number[],q:number):number {
  if (!xs.length) return 0;
  const a=[...xs].sort((x,y)=>x-y);
  return a[Math.min(a.length-1,Math.floor(q*(a.length-1)))];
}

/** Stereo powers are combined AFTER the FFT: antiphase stereo cannot cancel. */
export function analyzePCM({left,right,sampleRate}:AnalysisInput):AudioAnalysis {
  if (!Number.isFinite(sampleRate)||sampleRate<8000||!left.length) throw new Error('Extrait audio vide ou fréquence invalide.');
  const length=Math.min(left.length,Math.floor(EXCERPT_SECONDS*sampleRate));
  if (right&&right.length<length) throw new Error('Canaux audio de longueurs différentes.');
  const duration=length/sampleRate, frameCount=Math.ceil(duration*FEATURE_RATE);
  const frames:AudioFrame[]=[],rawFlux:number[]=[];
  const real=new Float64Array(N),imag=new Float64Array(N),power=new Float64Array(N/2);
  const previous=new Float64Array(N/2);
  let seed=0x811c9dc5;
  // Quantized PCM fingerprint, independent of filename, timestamps and metadata.
  for(let i=0;i<length;i+=4)for(const channel of right?[left,right]:[left]){
    const v=Math.round(clamp(Number.isFinite(channel[i])?channel[i]:0,-1,1)*32767);
    seed=Math.imul(seed^(v&255),0x01000193);seed=Math.imul(seed^((v>>8)&255),0x01000193);
  }
  for(let k=0;k<frameCount;k++){
    const start=Math.round(k*sampleRate/FEATURE_RATE),center=Math.min(length-1,start+Math.round(sampleRate/FEATURE_RATE/2));
    let energyL=0,energyR=0,side=0,count=0;
    const stop=Math.min(length,Math.round((k+1)*sampleRate/FEATURE_RATE));
    for(let i=start;i<stop;i++){
      const l=Number.isFinite(left[i])?left[i]:0,r=right?(Number.isFinite(right[i])?right[i]:0):l;
      energyL+=l*l;energyR+=r*r;side+=(l-r)*(l-r);count++;
    }
    const rms=Math.sqrt((energyL+energyR)/Math.max(1,count*2));
    power.fill(0);
    for(const channel of right?[left,right]:[left]){
      imag.fill(0);
      for(let i=0;i<N;i++){
        const at=center+i-N/2;
        real[i]=(at>=0&&at<length&&Number.isFinite(channel[at])?channel[at]:0)*window[i];
      }
      fft(real,imag);
      for(let i=1;i<N/2;i++)power[i]+=(real[i]*real[i]+imag[i]*imag[i])/(N*N*(right?2:1));
    }
    let bass=0,mid=0,treble=0,centroid=0,totalMagnitude=0,flux=0;
    for(let i=2;i<N/2;i++){
      const frequency=i*sampleRate/N,magnitude=Math.sqrt(power[i]);
      if(frequency<250)bass+=power[i];else if(frequency<1800)mid+=power[i];else treble+=power[i];
      centroid+=frequency*magnitude;totalMagnitude+=magnitude;
      flux+=Math.max(0,magnitude-previous[i]);previous[i]=magnitude;
    }
    const total=bass+mid+treble;
    const brightness=totalMagnitude>1e-8?clamp(Math.log2(1+centroid/totalMagnitude/120)/6):0;
    frames.push({time:k/FEATURE_RATE,rms,energy:0,bass:total>1e-12?bass/total:0,mid:total>1e-12?mid/total:0,treble:total>1e-12?treble/total:0,brightness,flux:0,
      width:Math.sqrt(clamp(side/Math.max(1e-12,2*(energyL+energyR)))),
      balance:clamp((energyR-energyL)/Math.max(1e-12,energyL+energyR),-1,1),active:false});
    rawFlux.push(flux);
  }
  const p90=quantile(frames.map(f=>f.rms),.9),flux90=quantile(rawFlux,.9);
  const activeFloor=Math.max(.00008,p90*.018);
  for(let i=0;i<frames.length;i++){
    const f=frames[i],relative=clamp(f.rms/Math.max(.0001,p90));
    f.active=f.rms>activeFloor;
    f.energy=f.active?clamp(Math.pow(f.rms,.55)*1.65)*(.65+.35*relative):0;
    f.flux=f.active?clamp(rawFlux[i]/Math.max(.002,flux90*1.65)):0;
  }
  const candidates:number[]=[];
  for(let i=2;i<frames.length-2;i++)if(frames[i].active&&frames[i].energy>.025&&frames[i].flux>.32&&frames[i].flux>=frames[i-1].flux&&frames[i].flux>frames[i+1].flux)candidates.push(i);
  const selected:number[]=[];
  for(const index of candidates.sort((a,b)=>frames[b].flux-frames[a].flux)){
    if(selected.every(i=>Math.abs(i-index)>FEATURE_RATE*.24))selected.push(index);
    if(selected.length===28)break;
  }
  const active=frames.filter(f=>f.active),avg=(key:keyof AudioFrame)=>active.reduce((s,f)=>s+Number(f[key]),0)/Math.max(1,active.length);
  const waveform=Array.from({length:150},(_,k)=>{
    const a=Math.floor(k*length/150),b=Math.floor((k+1)*length/150);let sum=0;
    for(let i=a;i<b;i++){const l=left[i]||0,r=right?(right[i]||0):l;sum+=(l*l+r*r)/2;}
    return Math.sqrt(sum/Math.max(1,b-a));
  });
  const maximum=Math.max(.0001,...waveform);
  return {version:1,seed:seed>>>0,duration,frames,waveform:waveform.map(v=>clamp(v/maximum)),onsets:selected.sort((a,b)=>a-b).map(i=>frames[i].time),summary:{energy:avg('energy'),bass:avg('bass'),treble:avg('treble'),brightness:avg('brightness'),width:avg('width'),silence:1-active.length/frames.length,contrast:clamp((quantile(frames.map(f=>f.rms),.9)-quantile(frames.map(f=>f.rms),.1))/Math.max(.0001,p90))}};
}
