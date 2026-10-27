import {SilenceSun} from './Ritual';
/** Follows physical simulation ticks; there is no separate cosmetic timer. */
export function DryingProgress({progress,onResume}:{progress:number;onResume:()=>void}){
 const value=Number.isFinite(progress)?Math.max(0,Math.min(1,progress)):0;
 return <section className="artwork-drying drying-progress" aria-label="Séchage en cours">
  <span className="drying-sun" aria-hidden="true"><SilenceSun/></span>
  <div className="drying-track"><span className="drying-label">Séchage</span><progress aria-label="Séchage de l’œuvre" max="1" value={value}/></div>
  <span className="drying-percent" aria-hidden="true">{value>=1?100:Math.floor(value*100)} %</span>
  <button onClick={onResume} aria-label="Reprendre la plume" title="Reprendre la plume">Reprendre</button>
 </section>;
}
