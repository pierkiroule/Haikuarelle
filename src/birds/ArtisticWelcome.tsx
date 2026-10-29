import {useRef,type ReactNode} from 'react';
import './welcome.css';
import {ARTIST_NAME} from '../brand';
import {WatercolourLogo} from './WatercolourLogo';

export function ArtisticWelcome({children}:{children:ReactNode}){
 const intention=useRef<HTMLDialogElement>(null);
 return <section className="bird-selection artistic-welcome" aria-labelledby="welcome-title">
  <div className="welcome-opening">
   <div className="welcome-intro">
    <WatercolourLogo/>
    <p className="welcome-kicker">Une création artistique</p>
    <h1 id="welcome-title">Haïkuarelle</h1>
    <p className="welcome-subtitle">L’art de la résonance avec le vivant.</p>
    <p className="welcome-question">Et si l’on pouvait peindre avec le chant des oiseaux ?</p>
    <div className="welcome-links"><a className="welcome-link" href="#rencontrer-plume">Rencontrer une plume <span aria-hidden="true">↗</span></a>
    <button className="welcome-intention-link" aria-haspopup="dialog" onClick={()=>intention.current?.showModal()}>L’intention artistique <span aria-hidden="true">＋</span></button></div>
   </div>
   <div id="rencontrer-plume" className="welcome-feathers" aria-label="Rencontrer une plume">{children}</div>
  </div>
  <dialog ref={intention} className="intention-dialog" aria-labelledby="intention-title" onClick={event=>{if(event.target!==event.currentTarget)return;const r=event.currentTarget.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)event.currentTarget.close();}}>
   <div className="intention-heading"><p className="welcome-kicker">Une création artistique</p><button className="intention-close" aria-label="Fermer l’intention artistique" autoFocus onClick={()=>intention.current?.close()}>×</button></div>
   <h2 id="intention-title">L’art de la résonance<br/>avec le vivant.</h2>
   <div className="welcome-statement">
   <p>À la croisée de l’art sonore, de l’aquarelle et de la poésie, <em>Haïkuarelle</em> propose une autre manière de créer : non plus représenter le vivant, mais composer avec lui.</p>
   <p>Le chant devient matière picturale. L’eau, les pigments et vos gestes lui répondent. Entre intention et imprévu, une œuvre unique prend forme.</p>
  </div>
  <section className="welcome-process" aria-labelledby="welcome-process-title">
   <h2 id="welcome-process-title">Trois temps pour créer</h2>
   <ol>
    <li><span className="welcome-number">01</span><h3>Rencontrer</h3><p>Choisissez une plume. Découvrez un oiseau, son chant et ses couleurs.</p></li>
    <li><span className="welcome-number">02</span><h3>Composer</h3><p>Peignez avec le chant. Laissez l’eau, les pigments et vos gestes faire émerger une aquarelle.</p></li>
    <li><span className="welcome-number">03</span><h3>Résonner</h3><p>Un haïku prolonge votre création et lui donne un nouvel écho poétique.</p></li>
   </ol>
  </section>
  <section className="welcome-meeting" aria-labelledby="welcome-meeting-title">
   <h2 id="welcome-meeting-title">L’art comme rencontre</h2>
   <p>Sans besoin de savoir peindre, chacun peut explorer ce que le vivant éveille en lui.</p>
   <p>Ici, l’art ne consiste pas à tout maîtriser, mais à faire place à ce qui résonne.</p>
   <p className="welcome-closing">Une personne, un oiseau, un peu d’eau et le temps d’un chant.</p>
  </section>
   <p className="intention-signature">Une création de <strong>{ARTIST_NAME}</strong> <span aria-hidden="true">•°</span></p>
  </dialog>
 </section>;
}
