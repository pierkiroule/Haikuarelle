# Plume d’Haïkuarelle

Un rituel poétique en cinq temps : rencontrer un oiseau au hasard, accueillir son haïku, créer avec l’eau et le chant, laisser sécher sous le soleil du silence, puis partager son haïkuarelle. Les titres et les trois vers puisent dans la vie de l’oiseau rencontré : milieux, nourriture, nidification, gestes, saisons et voyages. Le haïku précède la peinture ; ses vers restent les mêmes pendant la création et au partage. Le titre se révèle après le séchage.

React + Vite + TypeScript. Simulation et rendu WebGL2 fondés sur Paint Studio / Pigment Drift (MIT). Sans backend, service payant ni appel à une IA.

Atelier en ligne : https://haikuarelle-atelier-v1.pluckyslug4.chatgpt.site

Ce dépôt contient la version complète 1.10.1 : moteur, chants locaux, licences, documentation et tests. Les archives ZIP générées, les grands rendus intermédiaires de validation et la configuration propre à l’hébergement ChatGPT sont exclus. Les études légères et les rapports de validation sont inclus.

## Installation

Node.js 20.19+ ou 22.12+.

```bash
npm ci
npm run dev
```

```bash
npm test
npm run build
npm run preview
```

## Le rituel

1. **Une plume sonore confiée au hasard.** Tourner la roue désigne équitablement un seul des huit oiseaux et joue son vrai chant en aperçu. La rotation respecte la réduction des animations. Un nouveau tirage remplace le précédent ; une seule plume accompagne ensuite toute l’œuvre. L’audio est autorisé dès le geste initial, pour les navigateurs mobiles. Le titre (« La mémoire du geai », « La veille du rouge-gorge »…) et les trois vers explorent l’univers de cet oiseau.
2. **Un haïku pour ouvrir le voyage.** Trois vers liés à la vie et à l’univers de l’oiseau apparaissent avant tout dépôt. Le titre reste réservé pour la fin. « Entrer dans l’atelier » ouvre la toile.
3. **Fais dialoguer l’eau et le chant.** Une palette de deux pastilles — goutte et plume — reste accessible pendant toute la création. La goutte propose taille et quantité d’eau ; la plume propose taille et opacité. On peut peindre à sec, mouiller avant, revenir humidifier les pigments et alterner les outils sur la même toile. Changer d’outil et déposer de l’eau ne coupent pas un sample en cours ; l’eau persiste jusqu’au séchage volontaire. Les réglages se referment hors du menu ou avec Échap. « Mon haïku » permet de relire discrètement les vers. Les pigments conservent la palette du plumage en zones voisines, sans changement des couleurs déjà déposées.
4. **Laisse sécher sous le soleil du silence.** « Laisser sécher » devient disponible après la fin du chant. La progression suit le séchage réel, sans minuterie artificielle. Le titre apparaît quand la peinture est sèche, accompagné du haïku initial. « Reprendre la plume » permet de continuer.
5. **Partager ton haïkuarelle.** Partager le PNG avec le titre, l’œuvre, les trois vers et la dédicace facultative via le menu natif du navigateur. Si le partage de fichiers n’est pas disponible, l’image est téléchargée. « Garder l’image · PNG » permet toujours de télécharger directement. Annuler le partage ne déclenche pas de téléchargement.

### Le voyage en sculpture, à 360°

Après le titre et le haïku, **« Mon voyage sur haïkuarelle virtuelle en 360 »** ouvre une sculpture colorée issue de la peinture finale. Le blanc devient du vide, les trous restent traversants et les taches séparées restent des îlots distincts. Deux faces symétriques, d’épaisseur liée à la densité des pigments, se rejoignent sur tous les contours : le volume est fermé, sans plaque de papier. La densité est adoucie avant extrusion pour éviter les pointes et le gaufrage. La couleur conserve la texture de l’aquarelle.

Une caméra parcourt automatiquement les faces, les côtés et les ramifications dans un ciel étoilé. Glisser suspend le vol et permet de tourner librement ; les boutons permettent de reprendre, recommencer ou couper les chants. La préférence de réduction des mouvements ouvre une vue immobile, avec démarrage du vol sur demande.

Les samples réellement utilisés sont attachés aux positions peintes, avec spatialisation Web Audio HRTF, atténuation par la distance, fondus et respirations entre les phrases. Trois voix différentes au maximum peuvent se superposer ; chaque sample reste entier et sans boucle. Les sons s’arrêtent à la pause, au masquage de l’onglet et à la fermeture. Le retour retrouve l’aquarelle et le haïku intacts. Le casque rend la localisation plus perceptible.

Three.js se charge uniquement à l’ouverture du voyage. Le maillage est préparé dans un worker à résolution bornée ; renderer, géométrie, textures, contrôles et contexte audio du voyage sont libérés à la fermeture. Les essais automatiques vérifient fermeture du maillage, symétrie, trous, îlots, trajectoire, limitation des voix et conservation de la peinture. Avec Vite démarré, `python scripts/check-voyage.py` vérifie le viewer de production sur ordinateur et mobile avec de vrais samples (Python Playwright et Chromium requis).

La goutte de la palette permet de réhumidifier le papier sans effacer les pigments. « Effacer tout » conserve l’oiseau et revient à la création avec la goutte active. « Nouvelle œuvre » recommence le rituel avec une nouvelle graine. La plume animée suit le contact au pixel près ; les animations respectent la préférence de réduction des mouvements. Le logo aquarellé est servi en WebP sans perte. Six particules de plumes légères restent derrière l’interface, dans les marges ; elles sont absentes de l’œuvre exportée et désactivées en mode Toile seule ou avec la réduction des mouvements.

Un clic sur la brosse ouvre son menu contextuel : taille et opacité sont mémorisées séparément pour chaque oiseau pendant la session. Échap, le bouton de fermeture ou un clic hors du menu le referme. Seules la taille et l’opacité sont proposées : la matière est accordée en interne au chant. Son énergie ouvre le lavis, ses attaques animent les marges humides et son timbre fait varier la diffusion. Les réglages de la plume modifient les nouveaux dépôts, sans altérer les traces existantes.

Les attaques ouvrent des lobes humides irréguliers plutôt que des filaments. Les contours combinent plusieurs échelles de festons ; les auréoles de séchage varient en largeur, continuité et espacement. La Pie projette des points séparés, jamais de ligne continue, avec au plus huit gouttelettes par salve. Elle utilise un cri réel de Pie bavarde (*Pica pica*) enregistré par naturenotesuk (Freesound 555096, copie publique CC0 conservée localement). Cet extrait bref de 0,853 s est joué entier, sans répétition artificielle.

L’oiseau reste fixe pendant les dépôts. Avant le premier geste, **Retrouver la roue** permet un nouveau tirage. Le parcours complet et sa vérification sont dans [Trois oiseaux, une œuvre](docs/TROIS-OISEAUX-UNE-OEUVRE.md).

Choisir une brosse ne joue rien. Aucun pigment n’est créé avant le démarrage réussi de la source audio, dans ses silences ou si la lecture est bloquée. Lever la main ne coupe plus le dépôt sonore. Le dépôt attend le démarrage réel du sample ; le relâchement ne l’annule pas pendant son décodage. Échap, le bouton d’interruption ou le masquage de l’onglet peuvent arrêter explicitement le chant.

| Sample | Signature |
| --- | --- |
| Corneille | Noir de carbone, encre et éclats denses. |
| Rouge-gorge | Orange chaud, lavis gris et blanc préservé. |
| Geai | Bleu minéral, projections et nervures vives. |
| Mésange bleue | Céruléum, jaune doux, dentelles et ponctuation noire. |
| Bouvreuil | Rose pivoine, gris perle et ardoise, lavis de velours. |
| Sittelle | Gris bleuté, ocre roux, ramures et accents fins. |
| Pic vert | Vert mousse, jaune lichen, vagues et rares points carmin. |
| Pie | Projections de petites gouttelettes noires de tailles variées ; cri réel de Pie bavarde, naturenotesuk, CC0. |

Chants réels intégrés localement : trois sous CC0, quatre sous CC BY-SA 3.0/4.0 avec leurs attributions et conditions. Sources et adaptations dans `public/birds/credits.html` et `credits.json`. Aucun appel distant pendant la peinture, aucune clé externe. La mésange provient de Xeno-canto XC125793, via son dépôt libre sur Wikimedia Commons.

## Pigments et signatures

Onze pigments stables cohabitent sur la même feuille. Le moteur amont transporte désormais, dans son champ existant, les coefficients d’absorption RGB des couleurs déposées. Changer de pad ne change pas les couleurs précédentes. Les couleurs secondaires occupent des zones cohérentes et ne se mélangent qu’au contact. Le blanc reste celui du papier.

Documentation et planche des quatre nouveautés : [Sept plumages](docs/SEPT-PLUMAGES.md).

## Affichage

Correctif V11.1 : la toile garde le même gabarit entre peinture, séchage et révélation des mots. Son bitmap GPU est isolé dans une couche positionnée pour éviter que sa définition interne pilote la hauteur du cadre. Portrait 9:16 et paysage 16:9 sont conservés. Le titre et le haïku restent hors de la toile. Les contrôles de géométrie sont documentés dans [Proportions de la feuille](docs/PROPORTIONS-DE-LA-FEUILLE.md).


Portrait 9:16 ou paysage 16:9, grand écran et commandes tactiles. Champ QHD 1 440 × 2 560 lorsque le GPU le permet ; export de peinture 2 304 × 4 096 en portrait, puis marge du haïku (2 304 × 5 110 au total, titre et haïku inclus). L’eau claire est plus contrastée et s’efface en séchant. Le papier est fin, sans quadrillage. Les lavis utilisent une concentration continue pour éviter les bandes artificielles. Les échanges entre cellules voisines et diagonales évitent les sous-grilles laissées par les anciens pas de diffusion. Au grossissement et à l’export, une reconstruction cubique positive adoucit les cellules sans accentuer leurs carrés.

`1` : choisir la plume sonore. Sur la feuille, maintenir espace/Entrée et utiliser les flèches pour peindre au clavier. Relâcher la touche lève le pinceau. `F` : grand écran. `Échap` : lever le pinceau et sortir du grand écran.

## Filaments et geste direct

`ResonantBrush` réutilise les vrais segments eau/peinture du moteur. Trois échantillons de trajet par pas, compagnons de plumage compris, puis jets courbes effilés et gouttelettes : au plus seize segments. Les filaments sont des pigments transportés par le fluide, même avec l’encre fine à zéro. Les couleurs stables et les alphas de séchage V8/V7 sont conservés. Les boucles audio préparées sont réutilisées entre les contacts.

Contrôles, exemples et limites : [Pinceau sonore](docs/PINCEAU-SONORE.md).

## Séchage et détails

Le séchage utilise un bruit organique à support triangulaire, une accentuation modérée et un éclairage du grain très discret pour éviter le gaufrage carré. Les gradients sont lus dans le même champ reconstruit que la couleur, sans réaccentuer la grille. Quatre masques alpha procéduraux font émerger des variations de densité dans une même teinte, des délavages, des auréoles internes et des poches minérales. Un dépôt de bord suit le vrai contour du pigment et se renforce quand l’eau se retire. Les zones calmes et les blancs restent présents. Le réglage **Grain & relief** module l’intensité de cette matière. **Netteté** renforce progressivement le contraste local du pigment, les contours et les auréoles à mesure que l’eau se retire. **Seuil des détails** sélectionne les poches minérales : une valeur plus élevée privilégie les dépôts les plus marqués. Ces réglages agissent sur le rendu courant et sur le PNG, sans rejouer les gestes. L’atlas de séchage est échantillonné à la résolution d’affichage, plafonnée à 1 440 × 2 560 pixels équivalents (environ 14 Mio RGBA8). Il est précalculé une fois par placement de feuille ; aucune étape supplémentaire de simulation fluide n’est ajoutée. Les textures restent procédurales, sans promesse de reproduction physique exacte.

Comparaisons et limites V10 : [Netteté au séchage](docs/NETTETE-ET-EFFACEMENT.md).

Selon la graine, un petit groupe de trois à sept gouttelettes peut se projeter hors de l’eau, pendant le chant. Il ne s’agit pas d’une animation permanente de particules. Les exemples PNG transparents sont dans `public/textures/` ; le moteur crée ses propres variantes pour chaque feuille.

Comparaisons sur le même champ de pigment, gros plan 4K et vérifications : [la matière au séchage](docs/SECHAGE-ET-MATIERE.md).

## Code et vérification

Régression visuelle WebGL facultative : lancer `npm run dev`, puis `python scripts/check-plumage-render.py` (Python Playwright et Chromium requis). Le contrôle vérifie que la diffusion ne laisse pas de sous-grille, que le bleu/jaune/gris de la mésange est réellement visible dans le rendu, et capture les états humide et sec dans `/tmp`.

- `src/birds/WetPaper.ts` : guide borné de l’eau et évaporation.
- `src/birds/SoundDeposit.ts` : un contact place un sample entier ; refus du papier sec et des dépôts simultanés.
- `src/birds/DirectBrush.ts`, `ResonantBrush.ts`, `sonicFilament.ts` : ancien geste continu conservé dans l’API.
- `src/birds/SoundStain.ts` : tache sonore locale, dépôts secs ou humides, lavis et sédiments.
- `src/birds/SoundImprint.ts` : enveloppe et attaques extraites du vrai signal.
- `src/birds/BirdAudioBank.ts` : cache des enregistrements et horloge réelle.
- `src/engine/WatercolorEngine.ts` : façade du PaintEngine réel et simulation fixe 30 Hz.
- `src/vendor/pigment-drift/paint/` : moteur et shaders conservés, adaptations dans `patches/pigment-drift.patch`.
- `src/engine/FineInkRenderer.ts` : encre fine GPU, incluse dans l’export.
- `src/birds/artworkPoetry.ts` : lecture du rendu final et composition avec l’oiseau tiré au sort.
- `src/birds/ornithopoetry.ts` : scènes ornithologiques originales pour quinze espèces ; chaque oiseau du trio apporte une image au poème.
- `src/birds/ArtworkWords.tsx`, `export.ts` : révélation des mots et carte PNG.
- `src/birds/haiku.ts` : grammaire historique conservée.

Le détail des contrôles, de l’API, des rendus et des limites est dans [Eau & chant](docs/EAU-ET-CHANT.md). L’audit des deux moteurs, la licence et les conditions de réutilisation sont dans [l’audit Pigment Drift](docs/AUDIT-PIGMENT-DRIFT.md).

La graine est déterministe pour une carte d’eau, des paramètres et des timings identiques. La graine seule ne mémorise pas un geste manuel. Les différences de calcul entre GPU restent possibles. WebGL2 et les cibles flottantes sont nécessaires ; la fluidité doit encore être vérifiée sur téléphone physique.

Les anciens studios restent accessibles par `/?mp3` et `/?validation`. Les versions antérieures sont documentées dans `docs/`.

## Licence

Pigment Drift, commit `61d3cf57d5273105d7b9985973e4648d7a553c83`, © 2026 ossianravn et contributeurs, MIT. Notices conservées dans `THIRD-PARTY-NOTICES.md`, `src/vendor/pigment-drift/LICENSE` et `public/PIGMENT-DRIFT-LICENSE.txt`. Les trois premiers enregistrements sont CC0 ; les quatre nouveaux extraits sont CC BY-SA, chacun sous la licence de son original. Les limites du modèle de pigment et des textures procédurales sont détaillées dans l’audit.

### Qualité du voyage sur mobile et ordinateur

La sculpture utilise une capture dédiée de 2048 à 3072 pixels sur son grand côté, limitée par le GPU, indépendante de la résolution du maillage (224 à 384). Les UV restent continus jusque sur les contours : les couleurs sont prolongées dans les texels invisibles en worker avant génération des mipmaps, sans remplir les trous de la géométrie ni modifier la peinture originale. Une DataTexture évite la copie intermédiaire dans un canvas. Le filtrage anisotrope et un budget de pixels adapté à la surface de l’écran limitent les coûts GPU. Ces profils sont des budgets prudents, pas une garantie de cadence sur tous les téléphones.

### Les couleurs séparées du plumage

Toucher la plume ouvre son nuancier : six à huit couleurs par oiseau, soit 59 teintes nommées au total. Choisir une teinte ferme le menu et colore la plume ; les prochains dépôts utilisent uniquement ce pigment, avec le même chant et la même gestuelle. « Tout le plumage » rétablit la brosse multicolore. La sélection ne modifie jamais les dépôts précédents. Les teintes claires sont des lavis transparents, pas une gouache blanche opaque. Les HEX sont des approximations artistiques ; les reflets de pie et de corneille ne simulent pas une iridescence physique.

La table optique est fixée pour l’oiseau sur la feuille vierge, avec les onze pigments historiques suivis des six à huit pigments dédiés. Changer de teinte ne change pas cette table. Le shader dispose de 32 emplacements sans ajouter de champ de simulation ni de texture par couleur.
