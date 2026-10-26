import {useEffect,useRef,useState} from 'react';
import {BIRD_BRUSHES,type Bird} from './catalog';
import {FeatherGlyph} from './FeatherGlyph';
import {PLUMAGE_PIGMENTS} from '../engine/palettes';
import './wheel.css';
/** Rejection sampling keeps every species equally likely. */
export function randomBirdIndex(count:number,draw=()=>crypto.getRandomValues(new Uint32Array(1))[0]):number{
  if(!Number.isInteger(count)||count<1||count>0x100000000)throw new Error('Nombre d’oiseaux invalide.');
  const ceiling=Math.floor(0x100000000/count)*count;let value:number;
  do{value=draw();}while(value>=ceiling);
  return value%count;
}
export function BirdWheel({onSpin,onChoose}:{onSpin:()=>void;onChoose:(bird:Bird)=>void}){
  const [spinning,setSpinning]=useState(false),[rotation,setRotation]=useState(0),[bird,setBird]=useState<Bird|null>(null);
  const timer=useRef<ReturnType<typeof setTimeout>|null>(null),locked=useRef(false);
  useEffect(()=>()=>{if(timer.current!==null)clearTimeout(timer.current);},[]);
  const spin=()=>{
    if(locked.current)return;locked.current=true;onSpin();setBird(null);setSpinning(true);
    const index=randomBirdIndex(BIRD_BRUSHES.length),step=360/BIRD_BRUSHES.length;
    setRotation(previous=>previous+1800+((360-index*step-previous%360)%360+360)%360);
    timer.current=setTimeout(()=>{const chosen=BIRD_BRUSHES[index];setBird(chosen);setSpinning(false);locked.current=false;onChoose(chosen);},matchMedia('(prefers-reduced-motion: reduce)').matches?100:3200);
  };
  return <div className="bird-lottery"><div className="wheel-pointer" aria-hidden="true">▾</div><div className={`bird-wheel ${spinning?'is-spinning':''}`} style={{transform:`rotate(${rotation}deg)`}} aria-hidden="true">{BIRD_BRUSHES.map((b,i)=><span key={b.id} className="wheel-feather" style={{transform:`rotate(${i*360/BIRD_BRUSHES.length}deg) translateY(-112px) rotate(${-i*360/BIRD_BRUSHES.length}deg)`}}><FeatherGlyph bird={b}/></span>)}<span className="wheel-heart">•°</span></div><button className="wheel-spin" onClick={spin} disabled={spinning}>{spinning?'Le hasard déploie ses ailes…':bird?'Confier à nouveau au hasard':'Tourner la roue'}</button><div className="wheel-result" role="status" aria-live="polite" aria-atomic="true">{bird?<><strong>{bird.name}</strong><span>{bird.gesture}</span><span className="pad-pigments" aria-hidden="true">{(bird.plumage??[bird.slot]).map(slot=><i key={slot} style={{background:PLUMAGE_PIGMENTS[slot]}}/>)}</span></>:<span>{spinning?'Une rencontre se prépare.':'Huit présences possibles. Une seule rencontre.'}</span>}</div></div>;
}
