import {useRef,useState,type ReactNode} from 'react';
import './welcome.css';
import {useMediaPreference} from '../ui/useMediaPreference';
import {ARTIST_NAME} from '../brand';
import {Presentation} from './Presentation';
import {WatercolourLogo} from './WatercolourLogo';

export function ArtisticWelcome({children}:{children:ReactNode}){
 const track=useRef<HTMLDivElement>(null),[page,setPage]=useState(0);
 const reduced=useMediaPreference('(prefers-reduced-motion: reduce)');
 const go=(index:number)=>{const element=track.current;if(!element)return;element.scrollTo({left:element.clientWidth*index,behavior:reduced?'instant':'smooth'});};
 return <section className="bird-selection artistic-welcome" aria-labelledby="welcome-title">
  <div className="welcome-opening">
   <div className="welcome-intro">
    <WatercolourLogo/>
    <p className="welcome-kicker">Une création artistique</p>
    <h1 id="welcome-title">Haïkuarelle</h1>
    <p className="welcome-subtitle">L’art de la résonance avec le vivant.</p>
    <p className="welcome-question">Et si l’on pouvait peindre avec le chant des oiseaux ?</p>
    <div className="welcome-links"><a className="welcome-link" href="#rencontrer-plume">Rencontrer une plume <span aria-hidden="true">↗</span></a>
<Presentation/></div>
   </div>
   <div id="rencontrer-plume" className="welcome-feathers" aria-label="Rencontrer une plume">{children}</div>
  </div>
  <section className="intention-carousel" aria-labelledby="intention-title" aria-roledescription="carrousel">
   <header className="intention-carousel-heading"><h2 id="intention-title">L’intention artistique</h2><span aria-hidden="true">{String(page+1).padStart(2,'0')} / 03</span></header>
   <div ref={track} className="intention-track" tabIndex={0} aria-label="L’intention en trois pages. Utilisez les flèches gauche et droite." onScroll={e=>{const el=e.currentTarget;setPage(Math.max(0,Math.min(2,Math.round(el.scrollLeft/Math.max(1,el.clientWidth)))));}} onKeyDown={e=>{if(e.target!==e.currentTarget)return;if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();go(Math.max(0,Math.min(2,page+(e.key==='ArrowRight'?1:-1))));}else if(e.key==='Home'||e.key==='End'){e.preventDefault();go(e.key==='Home'?0:2);}}}>
   <article className="intention-slide" role="group" aria-roledescription="diapositive" aria-label="1 sur 3 : La résonance">
   <p className="welcome-kicker">L’art de la résonance avec le vivant.</p>
   <div className="welcome-statement">
   <p>À la croisée de l’art sonore, de l’aquarelle et de la poésie, <em>Haïkuarelle</em> propose une autre manière de créer : non plus représenter le vivant, mais composer avec lui.</p>
   <p>Le chant devient matière picturale. L’eau, les pigments et vos gestes lui répondent. Entre intention et imprévu, une œuvre unique prend forme.</p>
  </div>
   </article>
   <article className="intention-slide" role="group" aria-roledescription="diapositive" aria-label="2 sur 3 : Trois temps pour créer">
  <section className="welcome-process" aria-labelledby="welcome-process-title">
   <h2 id="welcome-process-title">Trois temps pour créer</h2>
   <ol>
    <li><span className="welcome-number">01</span><h3>Rencontrer</h3><p>Choisissez une plume. Découvrez un oiseau, son chant et ses couleurs.</p></li>
    <li><span className="welcome-number">02</span><h3>Composer</h3><p>Peignez avec le chant. Laissez l’eau, les pigments et vos gestes faire émerger une aquarelle.</p></li>
    <li><span className="welcome-number">03</span><h3>Résonner</h3><p>Un haïku prolonge votre création et lui donne un nouvel écho poétique.</p></li>
   </ol>
  </section>
   </article>
   <article className="intention-slide" role="group" aria-roledescription="diapositive" aria-label="3 sur 3 : L’art comme rencontre">
  <section className="welcome-meeting" aria-labelledby="welcome-meeting-title">
   <h2 id="welcome-meeting-title">L’art comme rencontre</h2>
   <p>Sans besoin de savoir peindre, chacun peut explorer ce que le vivant éveille en lui.</p>
   <p>Ici, l’art ne consiste pas à tout maîtriser, mais à faire place à ce qui résonne.</p>
   <p className="welcome-closing">Une personne, un oiseau, un peu d’eau et le temps d’un chant.</p>
  </section>
   <p className="intention-signature">Une création de <strong>{ARTIST_NAME}</strong> <span aria-hidden="true">•°</span></p>
   </article>
   </div>
   <nav className="intention-navigation" aria-label="Pages de l’intention artistique"><button aria-label="Page précédente" disabled={page===0} onClick={()=>go(page-1)}>←</button><div className="intention-dots">{['La résonance','Trois temps pour créer','L’art comme rencontre'].map((label,index)=><button key={label} aria-label={`Lire : ${label}`} aria-current={page===index?'true':undefined} onClick={()=>go(index)}><span/></button>)}</div><button aria-label="Page suivante" disabled={page===2} onClick={()=>go(page+1)}>→</button></nav>
  </section>
 </section>;
}
