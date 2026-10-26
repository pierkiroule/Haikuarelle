export const RITUAL=[
  {stage:'choose',name:'Les oiseaux',title:'Trois plumes sonores qui t’inspirent',hint:'Trois présences, trois couleurs. Écoute-les bientôt se rencontrer sur le papier.'},
  {stage:'water',name:'L’eau',title:'Dépose l’eau résonante sur ta toile',hint:'Effleure le papier pour y déposer de l’eau claire. Aucun chant, aucun pigment. Tu peux aussi passer directement au papier sec.'},
  {stage:'paint',name:'Les chants',title:'Dépose les chants des oiseaux',hint:'Dépose un chant ou glisse la plume, sur le sec comme dans l’eau. Le sample entier anime le geste. Dans l’eau, le pigment s’étale et rejoint ses contours.'},
  {stage:'drying',name:'Le soleil',title:'Laisse sécher sous le soleil du silence',hint:'Les chants se taisent. L’eau se retire, les contours se précisent et la matière révèle ses détails. Les mots viendront quand le papier sera sec.'},
  {stage:'finished',name:'Le partage',title:'Partager ton haïkuarelle',hint:'Un titre, trois vers et la trace de tes oiseaux. À offrir, à garder, à laisser voyager.'},
] as const;
export type RitualStage=typeof RITUAL[number]['stage'];
export function RitualProgress({stage}:{stage:RitualStage}){
  const current=RITUAL.findIndex(step=>step.stage===stage);
  return <nav className="ritual-progress" aria-label="Les cinq temps de ton haïkuarelle"><ol>{RITUAL.map((step,index)=><li key={step.stage} aria-current={index===current?'step':undefined} className={index<current?'ritual-done':''} title={step.title}><span className="ritual-step-number" aria-hidden="true">{index<current?'✓':String(index+1).padStart(2,'0')}</span><span aria-hidden="true">{step.name}</span><span className="sr-only">{step.title}</span></li>)}</ol></nav>;
}
export function WaterDrop({className=''}:{className?:string}){
  return <svg className={className} viewBox="0 0 32 40" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" aria-hidden="true"><path d="M16 3C14 11 5 18 5 25a11 11 0 0 0 22 0c0-7-9-14-11-22Z" fill="currentColor" fillOpacity=".06"/><path d="M10 25c0 4 2 6 5 7"/></svg>;
}
export function SilenceSun(){
  return <svg className="silence-sun" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" aria-hidden="true"><circle cx="32" cy="32" r="13" fill="currentColor" fillOpacity=".08"/><circle cx="32" cy="32" r="8" strokeOpacity=".3"/>{Array.from({length:12},(_,i)=><path key={i} d="M32 7v6" transform={`rotate(${i*30} 32 32)`}/>)}</svg>;
}
