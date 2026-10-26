import {useState,type CSSProperties} from 'react';
import {BIRD_BRUSHES,type Bird,type BirdId} from './catalog';
import {FeatherGlyph} from './FeatherGlyph';
import {BIRD_COLOURS} from './colourPalettes';
import './encounter.css';
/** Independent CSS paths keep the encounter light; every feather is a real button. */
export function FeatherEncounter({onChoose,selected}:{onChoose:(bird:Bird)=>void;selected?:BirdId}){
  const [paused,setPaused]=useState(false);
  const bird=BIRD_BRUSHES.find(b=>b.id===selected);
  return <div className="feather-encounter"><div className={`feather-circle ${paused?'is-paused':''}`} role="group" aria-label="Huit plumes à rencontrer"><span className="encounter-heart" aria-hidden="true">•°</span>{BIRD_BRUSHES.map((b,i)=>
    <div className="feather-path" key={b.id} style={{'--phase':`${i*45}deg`,'--orbit':`${26+i*2}s`,'--radius':`${i%2?96:65}px`,'--sway':`${4+i*.4}s`} as CSSProperties}>
      <div className="feather-position"><button className={`feather-choice ${bird?.id===b.id?'is-chosen':''}`} aria-label={`Choisir la plume ${b.name}`} aria-pressed={bird?.id===b.id} onClick={()=>{onChoose(b);}}><FeatherGlyph bird={b}/><span className="feather-label">{b.name}</span></button></div>
    </div>
  )}</div><button className="feather-motion" aria-pressed={paused} onClick={()=>setPaused(value=>!value)}>{paused?'Laisser virevolter':'Suspendre les plumes'}</button><div className="encounter-result" role="status" aria-live="polite" aria-atomic="true">{bird?<><strong>{bird.name}</strong><span>{bird.gesture}</span><span className="encounter-pigments" aria-hidden="true">{BIRD_COLOURS[bird.id]?.map(c=><i key={c.hex} style={{background:c.hex}}/>)}</span></>:<span>Touche une plume qui t’attire.<br/>Son chant viendra à ta rencontre.</span>}</div></div>;
}
