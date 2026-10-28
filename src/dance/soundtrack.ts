import {VIDEO_SECONDS} from './score';
export interface EchoPhrase {start:number;duration:number;level:number}
/** One intact sample, three decaying answers, then silence. Long samples use shorter echo tails. */
export function echoPhrases(duration:number):EchoPhrase[]{
 const phrases:EchoPhrase[]=[{start:0,duration:Math.min(duration,VIDEO_SECONDS-3),level:.7}];
 let start=phrases[0].duration+.45;
 for(const level of [.29,.14,.055]){
  const remaining=VIDEO_SECONDS-3-start;
  if(remaining<=.1)break;
  const length=Math.min(duration,2.2,remaining/(4-phrases.length));phrases.push({start,duration:length,level});start+=length+.45;
 }
 return phrases;
}
export function scheduleSoundtrack(context:BaseAudioContext,buffer:AudioBuffer,destination:AudioNode,start=0){
 const nodes:{source:AudioBufferSourceNode;gain:GainNode}[]=[];
 for(const phrase of echoPhrases(buffer.duration)){
  const source=context.createBufferSource(),gain=context.createGain(),t=start+phrase.start,fade=Math.min(.3,phrase.duration/3);
  source.buffer=buffer;source.connect(gain);gain.connect(destination);
  gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(phrase.level,t+fade);
  gain.gain.setValueAtTime(phrase.level,t+Math.max(fade,phrase.duration-fade));gain.gain.linearRampToValueAtTime(0,t+phrase.duration);
  source.start(t,Math.max(0,buffer.duration-phrase.duration));source.stop(t+phrase.duration);nodes.push({source,gain});
 }
 return nodes;
}
