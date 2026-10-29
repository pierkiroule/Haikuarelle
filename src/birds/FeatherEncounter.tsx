import {DepthCard} from '../ui/DepthCard';
import {useState,type CSSProperties} from 'react';
import {BIRD_BRUSHES,type Bird} from './catalog';
import {FeatherGlyph} from './FeatherGlyph';
import './encounter.css';
/** Independent CSS paths keep the encounter light; every feather is a real button. */
export function FeatherEncounter({onChoose}:{onChoose:(bird:Bird)=>void}){
  const [feathers]=useState(()=>{
    const birds=[...BIRD_BRUSHES];
    for(let i=birds.length-1;i>0;i--){const j=crypto.getRandomValues(new Uint32Array(1))[0]%(i+1);[birds[i],birds[j]]=[birds[j],birds[i]];}
    return birds.map(bird=>({bird,delay:-(crypto.getRandomValues(new Uint32Array(1))[0]%20000)/1000}));
  });
  return <div className="feather-encounter"><div className="feather-circle" role="group" aria-label={`${feathers.length} plumes à rencontrer`}><span className="encounter-heart" aria-hidden="true">•°</span>{feathers.map(({bird,delay},i)=>
    <div className={`feather-path gust-${i}`} key={bird.id} style={{'--still-x':`${Math.cos(i*Math.PI*2/feathers.length)*108}px`,'--still-y':`${Math.sin(i*Math.PI*2/feathers.length)*108}px`,'--flight':`${23+i*1.7}s`,'--delay':`${delay}s`,'--sway':`${3.4+i*.37}s`} as CSSProperties}>
      <DepthCard className="feather-position"><button className="feather-choice" data-bird={bird.id} aria-label={`Choisir la plume ${i+1}`} onClick={()=>onChoose(bird)}><FeatherGlyph bird={bird}/></button></DepthCard>
    </div>
  )}</div><p className="encounter-result">Attrape une plume au passage.<br/>Elle te confiera ses couleurs.</p></div>;
}
