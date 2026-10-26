# V5 — Pinceau libre & trois plumages

## Comportement

La trajectoire vient du pointeur. Le chant contrôle la matière sur cette trajectoire : énergie, attaques, fréquences et silences du vrai enregistrement. Il n’existe plus de tracé précomposé dans le parcours principal.

Trois oiseaux ont été retenus pour leurs signatures sonores et leurs plumages : corneille (noir dense), rouge-gorge (orange, gris latéral, blanc du papier), geai (bleu et encre fine). Trois canaux de pigments constants suffisent à préserver et mélanger ces couleurs. Un changement de pad n’applique aucune recoloration globale aux marques précédentes.

Lenteur : brosse large et lavis. Vitesse : rayon jusqu’à environ cinq fois plus fin, projections directionnelles espacées. La vitesse est mesurée en longueurs du petit côté de la feuille par seconde, indépendamment du format ou de la résolution d’affichage. Le stylet module aussi la pression. Les événements coalescés sont pris en compte ; la file reste bornée, sans émission incontrôlée de gouttes.

Un appui active la voix. Un autre appui sur le même pad arrête la voix. Les phrases se répètent avec une respiration : 1,05 s pour corneille et rouge-gorge, 1,25 s pour le geai. Le tempo, la hauteur et le signal original sont conservés. Arrêt au bout de 90 s ou en quittant l’onglet. Le moteur lit l’horloge réelle du contexte audio, y compris les suspensions.

Sans voix audible, sans entrée de pointeur ou pendant une respiration, il n’y a aucun dépôt. La diffusion de l’eau déjà posée reste visible jusqu’au séchage. Relâcher, sortir du papier ou laisser un intervalle prolongé rompt la liaison entre les positions. La capture du pointeur et `touch-action: none` permettent de glisser au doigt sans déplacer la page ; les contrôles et marges restent utilisables pour défiler.

Le haïku apparaît au premier dépôt réellement envoyé au moteur. Il répond aux oiseaux dominants, à leur couleur et aux positions des gestes. Les trois pads restent accessibles dans une rangée fixe sur mobile. Le plein écran conserve le dessin libre et propose Terminer pendant le chant.

## Implémentation

`ResonantBrush` prépare au maximum quatre paires de segments eau/pigment par pas. Le rouge-gorge ajoute son lavis gris latéral : 12 segments, plus au maximum 3 projections. Les uniformes restent dans la limite amont de 16. Les gouttes sont de vrais petits dépôts sur le champ de pigments et subissent la même diffusion.

`FineInkRenderer.appendStrokes` ajoute uniquement les nouveaux sommets avec `bufferSubData`, dans un tampon GPU à capacité croissante. L’encre reste incluse dans la capture haute résolution. Un plafond de 12 000 petits traits borne l’encre d’une session ; l’aquarelle continue à fonctionner ensuite.

Le shader de simulation de Pigment Drift est conservé. La largeur, la pression, les couleurs et la force des dépôts sont alimentées par la façade de l’application.

## Vérifications — 25 octobre 2026

- 54 tests : grammaires conservées, analyse/découpe audio, formats, calcul de vitesse/rayon, pression, queue bornée, budgets GPU, projections, trois pigments, trajectoire réelle, levée et silence, lecture avant peinture, horloge réelle, suspension audio, boucle/respiration et arrêt à 90 s.
- TypeScript strict et build de production Vite.
- Trois fichiers réellement préchargés et décodés dans le navigateur. Lecture en boucle observée pour le geai (cycle 1,99 s) et le rouge-gorge (cycle 4,08 s), avec états de respiration et interruption. Arrêt explicite vérifié.
- Mobile contrôlé dans un cadre de 390 × 844 : trois pads sur une rangée, toile portrait 9:16, largeur de document égale à celle du viewport, grand écran et sortie par Échap.
- Le navigateur de contrôle ne dispose pas de WebGL2. Il affiche le message GPU prévu ; aucune fluidité intégrée sur téléphone n’est revendiquée.
- Le vrai moteur TypeScript a reçu des trajectoires de pointeur synthétiques à 120 Hz, comme entrées de validation. Tous ses appels WebGL, dont les mises à jour du tampon d’encre, ont été enregistrés puis rejoués sur Mesa EGL/llvmpipe.
- Rendus examinés : corneille lente, corneille vive sur un parcours comparable, rouge-gorge, geai, puis signature associant les trois pads. La finesse supérieure du geste rapide, les petites projections, l’orange et son bord gris, le noir dense et le bleu sont visibles. Images et gros plan inspectés.
- Export GPU de la signature : 2 304 × 4 096, PNG complet décodé. Le composant d’assemblage avec le haïku est conservé de V4, où le résultat 2 304 × 4 741 avait été encodé et relu dans le navigateur.

Voir `motion-validation-egl.json` pour les dimensions et SHA-256, et `motion-studies/` pour les images. Les trajectoires de contrôle sont définies dans `scripts/render-offscreen.ts`, mode `motion` ; ce sont des entrées de test, pas des œuvres préchargées dans l’atelier.

## Limites

La sensation tactile, la latence et la fluidité sur un téléphone physique restent à évaluer. Une machine lente peut faire évoluer l’eau plus lentement que le son. La file bornée privilégie les positions récentes ; l’horloge audio courante empêche de continuer à déposer un ancien chant après son arrêt. Les petites coupures suivent les silences du fichier à la résolution de l’analyse (30 Hz).

Une seed ne suffit pas à restituer une performance manuelle. Conserver les événements de geste et les temps de lecture sera nécessaire pour ajouter ultérieurement un replay exact de session. Les palettes sont des interprétations picturales des plumages, pas un relevé colorimétrique scientifique.
