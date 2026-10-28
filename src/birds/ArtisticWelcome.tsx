import type {ReactNode} from 'react';
import './welcome.css';

export function ArtisticWelcome({children}:{children:ReactNode}){
 return <section className="bird-selection artistic-welcome" aria-labelledby="welcome-title">
  <div className="welcome-opening">
   <div className="welcome-intro">
    <p className="welcome-kicker">Une création artistique</p>
    <h1 id="welcome-title">Plume d’Haïkuarelle <span>•°</span></h1>
    <p className="welcome-subtitle">L’art de la résonance avec le vivant.</p>
    <p className="welcome-question">Et si l’on pouvait peindre avec le chant des oiseaux ?</p>
    <a className="welcome-link" href="#rencontrer-plume">Rencontrer une plume <span aria-hidden="true">↗</span></a>
   </div>
   <div id="rencontrer-plume" className="welcome-feathers" aria-label="Rencontrer une plume">{children}</div>
  </div>
  <div className="welcome-statement">
   <p>À la croisée de l’art sonore, de l’aquarelle et de la poésie, <em>Plume d’Haïkuarelle</em> propose une autre manière de créer : non plus représenter le vivant, mais composer avec lui.</p>
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
 </section>;
}
