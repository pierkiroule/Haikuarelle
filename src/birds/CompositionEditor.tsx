interface Props{size:number;onSize:(n:number)=>void;onReset:()=>void}
export function CompositionEditor({size,onSize,onReset}:Props){
 return <section className="composition-editor" aria-label="Placement de la peinture">
  <header><span>MISE EN PAGE</span><p>Une place pour ta peinture.</p></header>
  <p className="composition-hint">Glisse la peinture sur la feuille, ou utilise les flèches. La peinture reste dans son espace central, entre le titre et les trois vers.</p>
  <label className="haiku-size"><span>Taille de la peinture <output>{size} %</output></span><input aria-label="Taille de la peinture" type="range" min="25" max="100" value={size} onChange={e=>onSize(Number(e.target.value))}/></label>
  <button className="continue-art composition-reset" onClick={onReset}>Recentrer la peinture · taille ajustée</button>
 </section>;
}
