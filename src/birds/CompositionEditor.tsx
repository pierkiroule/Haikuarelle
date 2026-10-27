import {COMPOSITION_FONTS,type CompositionElement,type TextAppearance} from './compositionStyle';
interface Props{selected:CompositionElement;onSelect:(v:CompositionElement)=>void;appearance:TextAppearance;onAppearance:(p:TextAppearance)=>void;size:number;onSize:(n:number)=>void;onPosition:(v:'left'|'center'|'right')=>void;onReset:()=>void}
const labels={painting:'Peinture',title:'Titre',haiku:'Haïku'};
export function CompositionEditor({selected,onSelect,appearance,onAppearance,size,onSize,onPosition,onReset}:Props){
 const text=selected!=='painting';
 return <section className="composition-editor" aria-label="Éditeur de composition">
  <header><span>MISE EN PAGE</span><p>Un dernier geste pour composer.</p></header>
  <div className="composition-tabs" role="group" aria-label="Élément à modifier">{(['painting','title','haiku'] as const).map(id=><button key={id} aria-pressed={selected===id} onClick={()=>onSelect(id)}>{labels[id]}</button>)}</div>
  <p className="composition-hint">Glisse {selected==='painting'?'la peinture':selected==='title'?'le titre':'les trois vers'} sur la feuille, ou utilise les flèches.</p>
  <label className="haiku-size"><span>Taille {selected==='painting'?'de la peinture':selected==='title'?'du titre':'du haïku'} <output>{text?size:`${size} %`}</output></span><input aria-label={`Taille ${selected==='painting'?'de la peinture':selected==='title'?'du titre':'du haïku'}`} type="range" min={text?16:25} max={text?60:100} value={size} onChange={e=>onSize(Number(e.target.value))}/></label>
  {text&&<><label className="composition-font">Typographie<select aria-label="Typographie" value={appearance.font} onChange={e=>onAppearance({...appearance,font:e.target.value as TextAppearance['font']})}>{Object.entries(COMPOSITION_FONTS).map(([id,f])=><option key={id} value={id}>{f.label}</option>)}</select></label>
  <fieldset className="composition-colors"><legend>Couleur du texte</legend><div>{['#35483e','#202b35','#78504a','#4c577a','#8b672f','#f5f0df'].map(c=><button key={c} aria-label={`Couleur ${c}`} aria-pressed={appearance.color===c} style={{backgroundColor:c}} onClick={()=>onAppearance({...appearance,color:c})}/>)}<input type="color" aria-label="Couleur personnalisée du texte" value={appearance.color} onChange={e=>onAppearance({...appearance,color:e.target.value})}/></div></fieldset>
  <fieldset><legend>Alignement des lignes</legend><div className="composition-segments">{(['left','center','right'] as const).map((a,i)=><button key={a} aria-pressed={appearance.align===a} onClick={()=>onAppearance({...appearance,align:a})}>{['Gauche','Centré','Droite'][i]}</button>)}</div></fieldset></>}
  <fieldset><legend>Position sur la feuille</legend><div className="composition-segments">{(['left','center','right'] as const).map((a,i)=><button key={a} onClick={()=>onPosition(a)}>{['À gauche','Au centre','À droite'][i]}</button>)}</div></fieldset>
  <button className="continue-art composition-reset" onClick={onReset}>Réinitialiser {selected==='painting'?'la peinture':selected==='title'?'le titre':'le haïku'}</button>
 </section>;
}
