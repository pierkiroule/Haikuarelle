import {useRef} from 'react';
import './therapistGuide.css';
/** User-authored clinical guide: rendered as semantic text, without interpretation. */
export function TherapistGuide(){
 const root=useRef<HTMLDetailsElement>(null);
 return <details ref={root} id="guide-therapeute" className="therapist-guide" open={new URLSearchParams(location.search).get('guide')==='1'}>
  <summary><span><strong>Accompagner une séance</strong><small>Un guide pratique pour les thérapeutes et les accompagnants.</small></span><span className="therapist-guide-toggle" aria-hidden="true">＋</span></summary>
  <div className="therapist-guide-content">
   <p className="welcome-kicker">HAÏKUARELLE •°</p>
   <h2>Guide pratique du thérapeute</h2>
   <a className="therapist-guide-download" href="/guide-therapeute.pdf" download="Haikuarelle-guide-du-therapeute.pdf"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M12 3v12m-4-4 4 4 4-4M5 16v5h14v-5"/></svg><span>Télécharger le guide illustré <small>PDF · 5 pages · format A4</small></span></a>
<p>Une médiation artistique, relationnelle et psychoéducative en psychiatrie et pédopsychiatrie.</p>
<p>Public : enfants, adolescents et adultes, en psychiatrie, pédopsychiatrie ou psychothérapie.</p>
<p>Durée indicative : 10 à 30 minutes, adaptable.</p>
<p>Objectif : proposer une expérience créative pour faciliter la rencontre, soutenir l&#x27;expression et explorer certaines habiletés psychosociales.</p>
<p>Inspirée du squiggle de Winnicott, Haïkuarelle invite le patient à composer avec les chants d&#x27;oiseaux, l&#x27;eau, les pigments et l&#x27;imprévisible.</p>
<p>L&#x27;œuvre n&#x27;est ni un test ni un support d&#x27;interprétation diagnostique.</p>
<h3 id="guide-section-1">1. La posture du thérapeute</h3>
<p>Observer → Accueillir → Relancer → Relier.</p>
<p>Le thérapeute accompagne sans diriger. Il peut intervenir lorsqu&#x27;une réaction, une émotion ou une initiative apparaît.</p>
<p>Il privilégie les questions ouvertes, les commentaires descriptifs et les silences.</p>
<p>Une relance n&#x27;est jamais obligatoire.</p>
<h3 id="guide-section-2">2. Le guide des relances</h3>
<div className="therapist-table" role="region" tabIndex={0} aria-label="Tableau : 2. Le guide des relances"><table><thead><tr><th scope="col">Ce qui se passe</th><th scope="col">Relance possible</th><th scope="col">Ce que l&#x27;on peut explorer</th></tr></thead><tbody>
<tr><th scope="row">Le patient hésite</th><td>« On peut essayer, juste pour voir. »</td><td>Confiance, initiative</td></tr>
<tr><th scope="row">Il veut tout maîtriser</th><td>« Qu&#x27;est-ce que tu aimerais contrôler, et qu&#x27;est-ce que tu pourrais laisser évoluer ? »</td><td>Contrôle, incertitude</td></tr>
<tr><th scope="row">Il semble frustré</th><td>« Ce n&#x27;est pas ce que tu attendais ? »</td><td>Frustration, émotions</td></tr>
<tr><th scope="row">Il veut recommencer</th><td>« Qu&#x27;est-ce que tu aimerais faire autrement ? »</td><td>Ajustement, flexibilité</td></tr>
<tr><th scope="row">Il s&#x27;impatiente</th><td>« Qu&#x27;est-ce qui change si on laisse un peu de temps ? »</td><td>Attente, temporalité</td></tr>
<tr><th scope="row">Il se dévalorise</th><td>« Y a-t-il quelque chose que tu as aimé faire ? »</td><td>Rapport à soi, estime de soi</td></tr>
<tr><th scope="row">Il reste silencieux</th><td>« On peut simplement regarder ensemble. »</td><td>Présence, relation</td></tr>
<tr><th scope="row">Il manifeste du plaisir</th><td>« Qu&#x27;est-ce qui te plaît particulièrement ? »</td><td>Ressources, émotions positives</td></tr>
<tr><th scope="row">Il imagine une histoire</th><td>« Qu&#x27;est-ce que cela t&#x27;évoque ? »</td><td>Imaginaire, symbolisation</td></tr>
<tr><th scope="row">Il sollicite beaucoup d&#x27;aide</th><td>« Tu préfères qu&#x27;on cherche ensemble ou que tu essaies d&#x27;abord ? »</td><td>Autonomie, alliance</td></tr>
<tr><th scope="row">Il refuse une proposition</th><td>« D&#x27;accord. Comment préfères-tu faire ? »</td><td>Choix, affirmation de soi</td></tr>
<tr><th scope="row">Il est surpris par le résultat</th><td>« Qu&#x27;est-ce que cette surprise te donne envie de faire ? »</td><td>Curiosité, créativité</td></tr>
</tbody></table></div>
<p>Attention : ces situations n&#x27;indiquent pas à elles seules un fonctionnement psychologique particulier. Elles constituent des points d&#x27;appui possibles pour le dialogue.</p>
<h3 id="guide-section-3">3. Les cinq moments de la médiation</h3>
<div className="therapist-table" role="region" tabIndex={0} aria-label="Tableau : 3. Les cinq moments de la médiation"><table><thead><tr><th scope="col">Moment</th><th scope="col">Relance simple</th><th scope="col">Intérêt possible</th></tr></thead><tbody>
<tr><th scope="row">Écouter les chants</th><td>« Qu&#x27;est-ce qui attire ton attention ? »</td><td>Attention sensorielle</td></tr>
<tr><th scope="row">Créer avec les pigments</th><td>« Qu&#x27;as-tu envie d&#x27;essayer ? »</td><td>Initiative et pouvoir d&#x27;agir</td></tr>
<tr><th scope="row">Laisser évoluer la peinture</th><td>« Qu&#x27;est-ce qui te surprend ? »</td><td>Incertitude et adaptation</td></tr>
<tr><th scope="row">Rencontrer le haïku</th><td>« Ces mots t&#x27;évoquent quelque chose ? »</td><td>Imaginaire et symbolisation</td></tr>
<tr><th scope="row">Partager l&#x27;expérience</th><td>« Qu&#x27;aimerais-tu retenir de ce moment ? »</td><td>Expression et appropriation</td></tr>
</tbody></table></div>
<p>Le thérapeute adapte le langage, la durée et le niveau de sollicitation à l&#x27;âge, aux capacités et à l&#x27;état clinique du patient.</p>
<h3 id="guide-section-4">4. Les six ressources psychosociales</h3>
<p>La médiation peut ouvrir un travail autour de six dimensions, sans chercher à les mesurer.</p>
<div className="therapist-table" role="region" tabIndex={0} aria-label="Tableau : 4. Les six ressources psychosociales"><table><thead><tr><th scope="col">Ressource</th><th scope="col">Expérience proposée</th></tr></thead><tbody>
<tr><th scope="row">Oser</th><td>Essayer sans garantie de réussite</td></tr>
<tr><th scope="row">Choisir</th><td>Décider et agir sur son environnement</td></tr>
<tr><th scope="row">Ressentir</th><td>Reconnaître ses réactions et ses émotions</td></tr>
<tr><th scope="row">S&#x27;ajuster</th><td>Composer avec l&#x27;imprévisible</td></tr>
<tr><th scope="row">Patienter</th><td>Expérimenter l&#x27;attente et la transformation</td></tr>
<tr><th scope="row">Exprimer</th><td>Donner une forme sensible ou symbolique à son expérience</td></tr>
</tbody></table></div>
<p>Ces ressources ne sont pas des résultats thérapeutiques garantis. Elles représentent des possibilités de travail clinique.</p>
<h3 id="guide-section-5">5. Le débriefing en trois questions</h3>
<p>À la fin de l&#x27;expérience, trois questions suffisent :</p>
<p>1. Le vécu : « Comment as-tu vécu ce moment ? »</p>
<p>2. La surprise : « Qu&#x27;est-ce qui t&#x27;a surpris ou marqué ? »</p>
<p>3. La résonance : « Est-ce que cela te fait penser à quelque chose dans ta vie ? »</p>
<p>La troisième question est facultative. Le patient peut préférer ne pas verbaliser.</p>
<h3 id="guide-section-6">6. Quelques précautions cliniques</h3>
<ul><li>Ne pas interpréter les couleurs, les formes ou les choix esthétiques comme des signes diagnostiques.</li></ul>
<ul><li>Respecter le silence, le refus de participer et le rythme du patient.</li></ul>
<ul><li>Adapter les stimulations sonores et visuelles aux sensibilités individuelles.</li></ul>
<ul><li>Éviter de provoquer volontairement une frustration pour observer une réaction.</li></ul>
<ul><li>Accueillir les émotions difficiles sans chercher à les transformer immédiatement en apprentissage.</li></ul>
<ul><li>Ne pas assimiler le plaisir de créer à une amélioration clinique démontrée.</li></ul>
<h3 id="guide-section-7">7. Après la séance : trois repères pour le thérapeute</h3>
<p>Sans score ni grille standardisée, le professionnel peut retenir :</p>
<p>Ce qui a émergé : un geste, une parole, une émotion, une interaction.</p>
<p>Ce qui a fait rencontre : un moment de partage, de surprise, de plaisir ou de difficulté.</p>
<p>Ce qui pourrait être prolongé : une ressource, une question ou une expérience à reprendre en séance.</p>
<h3 id="guide-section-8">Le principe fondateur</h3>
<p>Haïkuarelle n&#x27;est pas une épreuve pour révéler le fonctionnement du patient. C&#x27;est une expérience artistique partagée qui peut ouvrir des espaces d&#x27;expression, de relation et de découverte de soi.</p>
<p>Le thérapeute ne cherche pas à décoder l&#x27;œuvre. Il accompagne ce qui se vit autour d&#x27;elle.</p>
<p>La médiation conserve ainsi trois fonctions complémentaires : brise-glace relationnel, espace de créativité et support psychoéducatif.</p>
   <button className="therapist-guide-close" onClick={()=>{if(root.current){root.current.open=false;root.current.querySelector('summary')?.focus();root.current.scrollIntoView({block:'start'});}}}>Replier le guide</button>
  </div>
 </details>;
}
