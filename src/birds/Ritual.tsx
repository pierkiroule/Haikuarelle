export const RITUAL=[
  {stage:'choose',name:'La rencontre',title:'Une plume sonore qui t’attire',hint:'Choisis une plume parmi celles qui virevoltent. Un seul oiseau te confie les couleurs de son plumage et son univers poétique.'},
  {stage:'paint',name:'La création',title:'Fais dialoguer l’eau et le chant',hint:'Choisis la goutte ou la plume dans la palette. Ajoute de l’eau avant ou après le chant, sur le sec comme sur les pigments. L’eau reste présente jusqu’au séchage volontaire.'},
  {stage:'drying',name:'Le soleil',title:'Laisse sécher sous le soleil du silence',hint:'Les chants se taisent. L’eau se retire, les contours se précisent et la matière révèle ses détails. La matière se précise avant de révéler ses mots.'},
  {stage:'finished',name:'Le partage',title:'Trois lignes en résonance',hint:'Révèle le haïku inspiré de ta peinture, déplace-le, ajuste sa taille puis valide son placement pour partager l’œuvre signée •°○.'},
] as const;
export type RitualStage=typeof RITUAL[number]['stage'];
export function RitualProgress({stage}:{stage:RitualStage}){
  const current=RITUAL.findIndex(step=>step.stage===stage);
  return <nav className="ritual-progress" aria-label="Les quatre temps de ton haïkuarelle"><ol>{RITUAL.map((step,index)=><li key={step.stage} aria-current={index===current?'step':undefined} className={index<current?'ritual-done':''} title={step.title}><span className="ritual-step-number" aria-hidden="true">{index<current?'✓':String(index+1).padStart(2,'0')}</span><span aria-hidden="true">{step.name}</span><span className="sr-only">{step.title}</span></li>)}</ol></nav>;
}
export function WaterDrop({className=''}:{className?:string}){
  return <svg className={className} viewBox="0 0 32 40" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" aria-hidden="true"><path d="M16 3C14 11 5 18 5 25a11 11 0 0 0 22 0c0-7-9-14-11-22Z" fill="currentColor" fillOpacity=".06"/><path d="M10 25c0 4 2 6 5 7"/></svg>;
}
export function SilenceSun(){
  return <svg className="silence-sun" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" aria-hidden="true"><circle cx="32" cy="32" r="13" fill="currentColor" fillOpacity=".08"/><circle cx="32" cy="32" r="8" strokeOpacity=".3"/>{Array.from({length:12},(_,i)=><path key={i} d="M32 7v6" transform={`rotate(${i*30} 32 32)`}/>)}</svg>;
}
