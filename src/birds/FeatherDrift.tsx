/** Decorative only. CSS motion stays in the gutters, never in the GPU artwork. */
export function FeatherDrift(){
  return <div className="feather-drift" aria-hidden="true">{Array.from({length:6},(_,i)=><img key={i} src="/brand/plume-aquarelle.webp" alt="" width="28" height="28" draggable={false} style={{'--drift-delay':`${-i*5.3}s`,'--drift-duration':`${28+i*3}s`,'--drift-turn':`${i%2===0?22:-24}deg`} as React.CSSProperties}/>)}</div>;
}
