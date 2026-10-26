# Haïkuarelle des trois oiseaux

Un rituel poétique en cinq temps : choisir trois oiseaux, déposer l’eau du silence, peindre leurs chants, laisser sécher sous le soleil du silence, puis partager son haïkuarelle. Les mots naissent des couleurs et des formes réellement déposées sur le papier.

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

1. **Choisis trois oiseaux qui t’inspirent.** Trois choix distincts parmi les huit plumes. Aucun chant ne joue pendant la sélection.
2. **Dépose l’eau du silence sur ta toile.** Maintenir et glisser dépose de l’eau claire dans la simulation, sans son ni pigment. Au clavier, maintenir espace ou Entrée et utiliser les flèches. L’eau est conservée au repos ; « Inviter les chants » devient disponible après le premier dépôt.
3. **Dépose les chants des oiseaux.** Choisir une plume puis glisser sur le papier. Le chant guide l’énergie, la diffusion et les contours des nouveaux dépôts. Les trois plumes restent fixes ; taille et opacité sont les seuls réglages accessibles.
4. **Laisse sécher sous le soleil du silence.** « Laisser sécher » coupe le chant et les dépôts. La progression suit le séchage réel, sans minuterie artificielle. Le titre et le haïku apparaissent quand la peinture est sèche. « Reprendre la plume » permet de continuer.
5. **Partager ton haïkuarelle.** Partager le PNG avec le titre, l’œuvre, les trois vers et la dédicace facultative via le menu natif du navigateur. Si le partage de fichiers n’est pas disponible, l’image est téléchargée. « Garder l’image · PNG » permet toujours de télécharger directement. Annuler le partage ne déclenche pas de téléchargement.

« Effacer tout » conserve le trio et revient à l’eau du silence. « Nouvelle œuvre » recommence le rituel avec une nouvelle graine. La plume animée suit le contact au pixel près ; les animations respectent la préférence de réduction des mouvements.

Un clic sur une des trois brosses ouvre son menu contextuel : taille et opacité sont mémorisées séparément pour chaque oiseau pendant la session. Échap, le bouton de fermeture ou un clic hors du menu le referme. Seules la taille et l’opacité sont proposées : la matière est accordée en interne au chant. Son énergie ouvre le lavis, ses attaques animent les marges humides et son timbre fait varier la diffusion. Les réglages de la plume modifient les nouveaux dépôts, sans altérer les traces existantes.

Les filaments sont plus courts et réservés aux attaques fortes espacées d’au moins 0,85 s. Les contours combinent plusieurs échelles de festons ; les auréoles de séchage varient en largeur, continuité et espacement. La Pie projette des points séparés, jamais de ligne continue, avec au plus huit gouttelettes par salve. Son rythme sonore local est synthétique et ne représente pas un enregistrement animal.

Le trio reste fixe pendant la peinture. Avant le premier geste, **Modifier le trio** permet de revenir au choix. Le parcours complet et sa vérification sont dans [Trois oiseaux, une œuvre](docs/TROIS-OISEAUX-UNE-OEUVRE.md).

Choisir une brosse ne joue rien. Aucun pigment n’est créé avant le démarrage réussi de la source audio, dans ses silences, après la levée ou si la lecture est bloquée. Pendant un contact prolongé, la phrase intacte se répète avec 0,28 s de respiration silencieuse ; arrêt de sécurité après 90 s. Un chargement tardif ne rejoue pas un geste déjà relâché.

| Sample | Signature |
| --- | --- |
| Corneille | Noir de carbone, encre et éclats denses. |
| Rouge-gorge | Orange chaud, lavis gris et blanc préservé. |
| Geai | Bleu minéral, projections et nervures vives. |
| Mésange bleue | Céruléum, jaune doux, dentelles et ponctuation noire. |
| Bouvreuil | Rose pivoine, gris perle et ardoise, lavis de velours. |
| Sittelle | Gris bleuté, ocre roux, ramures et accents fins. |
| Pic vert | Vert mousse, jaune lichen, vagues et rares points carmin. |
| Pie | Projections de petites gouttelettes noires de tailles variées ; rythme synthétique original. |

Chants réels intégrés localement : trois sous CC0, quatre sous CC BY-SA 3.0/4.0 avec leurs attributions et conditions. Sources et adaptations dans `public/birds/credits.html` et `credits.json`. Aucun appel distant pendant la peinture, aucune clé externe. La mésange provient de Xeno-canto XC125793, via son dépôt libre sur Wikimedia Commons.

## Pigments et signatures

Onze pigments stables cohabitent sur la même feuille. Le moteur amont transporte désormais, dans son champ existant, les coefficients d’absorption RGB des couleurs déposées. Changer de pad ne change pas les couleurs précédentes. Les couleurs secondaires occupent des zones cohérentes et ne se mélangent qu’au contact. Le blanc reste celui du papier.

Documentation et planche des quatre nouveautés : [Sept plumages](docs/SEPT-PLUMAGES.md).

## Affichage

Correctif V11.1 : la toile garde le même gabarit entre peinture, séchage et révélation des mots. Son bitmap GPU est isolé dans une couche positionnée pour éviter que sa définition interne pilote la hauteur du cadre. Portrait 9:16 et paysage 16:9 sont conservés. Le titre et le haïku restent hors de la toile. Les contrôles de géométrie sont documentés dans [Proportions de la feuille](docs/PROPORTIONS-DE-LA-FEUILLE.md).


Portrait 9:16 ou paysage 16:9, grand écran et commandes tactiles. Champ QHD 1 440 × 2 560 lorsque le GPU le permet ; export de peinture 2 304 × 4 096 en portrait, puis marge du haïku (2 304 × 5 110 au total, titre et haïku inclus). L’eau claire est plus contrastée et s’efface en séchant. Le papier est fin, sans quadrillage. Les lavis utilisent une concentration continue pour éviter les bandes artificielles.

`1`–`3` : choisir une brosse. Sur la feuille, maintenir espace/Entrée et utiliser les flèches pour peindre au clavier. Relâcher la touche lève le pinceau. `F` : grand écran. `Échap` : lever le pinceau et sortir du grand écran.

## Filaments et geste direct

`ResonantBrush` réutilise les vrais segments eau/peinture du moteur. Trois échantillons de trajet par pas, compagnons de plumage compris, puis jets courbes effilés et gouttelettes : au plus seize segments. Les filaments sont des pigments transportés par le fluide, même avec l’encre fine à zéro. Les couleurs stables et les alphas de séchage V8/V7 sont conservés. Les boucles audio préparées sont réutilisées entre les contacts.

Contrôles, exemples et limites : [Pinceau sonore](docs/PINCEAU-SONORE.md).

## Séchage et détails

Quatre masques alpha procéduraux font émerger des variations de densité dans une même teinte, des délavages, des auréoles internes et des poches minérales. Un dépôt de bord suit le vrai contour du pigment et se renforce quand l’eau se retire. Les zones calmes et les blancs restent présents. Le réglage **Grain & relief** module l’intensité de cette matière. **Netteté** renforce progressivement le contraste local du pigment, les contours et les auréoles à mesure que l’eau se retire. **Seuil des détails** sélectionne les poches minérales : une valeur plus élevée privilégie les dépôts les plus marqués. Ces réglages agissent sur le rendu courant et sur le PNG, sans rejouer les gestes. L’atlas de séchage est désormais échantillonné à la moitié de la résolution linéaire de l’affichage.

Comparaisons et limites V10 : [Netteté au séchage](docs/NETTETE-ET-EFFACEMENT.md).

Selon la graine, un petit groupe de trois à sept gouttelettes peut se projeter hors de l’eau, pendant le chant. Il ne s’agit pas d’une animation permanente de particules. Les exemples PNG transparents sont dans `public/textures/` ; le moteur crée ses propres variantes pour chaque feuille.

Comparaisons sur le même champ de pigment, gros plan 4K et vérifications : [la matière au séchage](docs/SECHAGE-ET-MATIERE.md).

## Code et vérification

- `src/birds/WetPaper.ts` : guide borné de l’eau et évaporation.
- `src/birds/DirectBrush.ts` : cycle du contact, audio et annulation des chargements tardifs.
- `src/birds/ResonantBrush.ts`, `sonicFilament.ts` : geste direct, eau/peinture et jets sonores.
- `src/birds/SoundStain.ts` : ancien mode de sample sur eau préparée, conservé dans l’API.
- `src/birds/SoundImprint.ts` : enveloppe et attaques extraites du vrai signal.
- `src/birds/BirdAudioBank.ts` : cache des enregistrements et horloge réelle.
- `src/engine/WatercolorEngine.ts` : façade du PaintEngine réel et simulation fixe 30 Hz.
- `src/vendor/pigment-drift/paint/` : moteur et shaders conservés, adaptations dans `patches/pigment-drift.patch`.
- `src/engine/FineInkRenderer.ts` : encre fine GPU, incluse dans l’export.
- `src/birds/artworkPoetry.ts` : lecture des couleurs et des blancs du rendu final, titre et trois vers locaux.
- `src/birds/ArtworkWords.tsx`, `export.ts` : révélation des mots et carte PNG.
- `src/birds/haiku.ts` : grammaire historique conservée.

Le détail des contrôles, de l’API, des rendus et des limites est dans [Eau & chant](docs/EAU-ET-CHANT.md). L’audit des deux moteurs, la licence et les conditions de réutilisation sont dans [l’audit Pigment Drift](docs/AUDIT-PIGMENT-DRIFT.md).

La graine est déterministe pour une carte d’eau, des paramètres et des timings identiques. La graine seule ne mémorise pas un geste manuel. Les différences de calcul entre GPU restent possibles. WebGL2 et les cibles flottantes sont nécessaires ; la fluidité doit encore être vérifiée sur téléphone physique.

Les anciens studios restent accessibles par `/?mp3` et `/?validation`. Les versions antérieures sont documentées dans `docs/`.

## Licence

Pigment Drift, commit `61d3cf57d5273105d7b9985973e4648d7a553c83`, © 2026 ossianravn et contributeurs, MIT. Notices conservées dans `THIRD-PARTY-NOTICES.md`, `src/vendor/pigment-drift/LICENSE` et `public/PIGMENT-DRIFT-LICENSE.txt`. Les trois premiers enregistrements sont CC0 ; les quatre nouveaux extraits sont CC BY-SA, chacun sous la licence de son original. Les limites du modèle de pigment et des textures procédurales sont détaillées dans l’audit.
