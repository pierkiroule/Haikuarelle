# Plume d’Haïkuarelle

Un rituel poétique en cinq temps : choisir une plume virevoltante, accueillir son haïku, créer avec l’eau et le chant, laisser sécher sous le soleil du silence, puis partager son haïkuarelle. Les titres et les trois vers puisent dans la vie de l’oiseau rencontré : milieux, nourriture, nidification, gestes, saisons et voyages. Le haïku précède la peinture ; ses vers restent les mêmes pendant la création et au partage. Le titre et le haïku restent lisibles sur le papier pendant toute la création.

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

1. **Une plume sonore qui t’attire.** Huit plumes virevoltent dans un cercle. Toucher une plume révèle immédiatement le haïku de son oiseau et joue son chant, sans confirmation ni possibilité de comparer les oiseaux au préalable. Les identités sont mélangées à chaque rencontre ; seules les plumes sont visibles. Les trajectoires irrégulières évoquent une soufflerie lente et se suspendent au clavier pour faciliter la sélection ; un bouton permet aussi de les immobiliser. La réduction des animations affiche les plumes immobiles. Le titre (« La mémoire du geai », « La veille du rouge-gorge »…) et les trois vers explorent l’univers de cet oiseau.
2. **Un haïku pour ouvrir le voyage.** Trois vers liés à la vie et à l’univers de l’oiseau apparaissent avant tout dépôt. Le titre accompagne le haïku dès l’entrée dans l’atelier. « Entrer dans l’atelier » ouvre la toile.
3. **Fais dialoguer l’eau et le chant.** Une palette de deux pastilles — goutte et plume — reste accessible pendant toute la création. La goutte propose taille et quantité d’eau ; la plume propose taille et opacité. On peut peindre à sec, mouiller avant, revenir humidifier les pigments et alterner les outils sur la même toile. Changer d’outil et déposer de l’eau ne coupent pas un sample en cours ; l’eau persiste jusqu’au séchage volontaire. Le bandeau garde nuancier et curseurs accessibles ; sa flèche permet de le réduire pour agrandir la toile. Le titre et le haïku restent directement sur le papier, au-dessus et au-dessous de la peinture. Les pigments conservent la palette du plumage en zones voisines, sans changement des couleurs déjà déposées.
4. **Laisse sécher sous le soleil du silence.** « Laisser sécher » devient disponible après la fin du chant. La progression suit le séchage réel, sans minuterie artificielle. Le titre et le haïku restent à leur place pendant le séchage. « Reprendre la plume » permet de continuer.
5. **Partager ton haïkuarelle.** Partager le PNG avec le titre, l’œuvre, les trois vers et la dédicace facultative via le menu natif du navigateur. Si le partage de fichiers n’est pas disponible, l’image est téléchargée. « Garder l’image · PNG » permet toujours de télécharger directement. Annuler le partage ne déclenche pas de téléchargement.

La goutte de la palette permet de réhumidifier le papier sans effacer les pigments. « Effacer tout » conserve l’oiseau et revient à la création avec la goutte active. « Nouvelle œuvre » recommence le rituel avec une nouvelle graine. La plume animée suit le contact au pixel près ; les animations respectent la préférence de réduction des mouvements. Le logo aquarellé est servi en WebP sans perte. Six particules de plumes légères restent derrière l’interface, dans les marges ; elles sont absentes de l’œuvre exportée et désactivées en mode Toile seule ou avec la réduction des mouvements.

Le bandeau de création garde le nuancier, la taille et l’opacité à portée de main. Avec la goutte active, les curseurs règlent la taille et la quantité d’eau. Un bouton réduit le bandeau aux outils et au séchage, et agrandit la surface affichée de la toile ; le déployer restitue les réglages. Les nouveaux réglages n’altèrent pas les traces existantes.

Les attaques ouvrent des lobes humides irréguliers plutôt que des filaments. Les contours combinent plusieurs échelles de festons ; les auréoles de séchage varient en largeur, continuité et espacement. La Pie projette des points séparés, jamais de ligne continue, avec au plus huit gouttelettes par salve. Elle utilise un cri réel de Pie bavarde (*Pica pica*) enregistré par naturenotesuk (Freesound 555096, copie publique CC0 conservée localement). Cet extrait bref de 0,853 s est joué entier, sans répétition artificielle.

L’oiseau reste fixe pendant les dépôts. Avant le premier geste, **Retrouver les plumes** permet une nouvelle rencontre. Le parcours complet et sa vérification sont dans [Trois oiseaux, une œuvre](docs/TROIS-OISEAUX-UNE-OEUVRE.md).

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

Correctif V11.1 : la toile garde le même gabarit entre peinture, séchage et révélation des mots. Son bitmap GPU est isolé dans une couche positionnée pour éviter que sa définition interne pilote la hauteur du cadre. Portrait 9:16 et paysage 16:9 sont conservés. Le titre et le haïku occupent des bandes protégées du papier, hors du champ de peinture. Les contrôles de géométrie sont documentés dans [Proportions de la feuille](docs/PROPORTIONS-DE-LA-FEUILLE.md).


Portrait 9:16 ou paysage 16:9, grand écran et commandes tactiles. Champ adaptatif de 864 × 1 536 à 1 800 × 3 200, avec un profil QHD 1 440 × 2 560 par défaut lorsque les indications de ressources sont indisponibles, toujours limité par le GPU ; export de peinture 2 304 × 4 096 en portrait, puis marge du haïku (2 304 × 5 110 au total, titre et haïku inclus). L’eau claire est plus contrastée et s’efface en séchant. Le papier est fin, sans quadrillage. Les lavis utilisent une concentration continue pour éviter les bandes artificielles. Les échanges entre cellules voisines et diagonales évitent les sous-grilles laissées par les anciens pas de diffusion. Au grossissement et à l’export, une reconstruction cubique positive adoucit les cellules sans accentuer leurs carrés.

`1` : choisir la plume sonore. Sur la feuille, maintenir espace/Entrée et utiliser les flèches pour peindre au clavier. Relâcher la touche lève le pinceau. `F` : grand écran. `Échap` : lever le pinceau et sortir du grand écran.

## Filaments et geste direct

`ResonantBrush` réutilise les vrais segments eau/peinture du moteur. Trois échantillons de trajet par pas, compagnons de plumage compris, puis jets courbes effilés et gouttelettes : au plus seize segments. Les filaments sont des pigments transportés par le fluide, même avec l’encre fine à zéro. Les couleurs stables et les alphas de séchage V8/V7 sont conservés. Les boucles audio préparées sont réutilisées entre les contacts.

Contrôles, exemples et limites : [Pinceau sonore](docs/PINCEAU-SONORE.md).

## Séchage et détails

Le séchage utilise un bruit organique à support triangulaire, une accentuation modérée et un éclairage du grain très discret pour éviter le gaufrage carré. Les gradients sont lus dans le même champ reconstruit que la couleur, sans réaccentuer la grille. Quatre masques alpha procéduraux font émerger des variations de densité dans une même teinte, des délavages, des auréoles internes et des poches minérales. Un dépôt de bord suit le vrai contour du pigment et se renforce quand l’eau se retire. Les zones calmes et les blancs restent présents. Le réglage **Grain & relief** module l’intensité de cette matière. **Netteté** renforce progressivement le contraste local du pigment, les contours et les auréoles à mesure que l’eau se retire. **Seuil des détails** sélectionne les poches minérales : une valeur plus élevée privilégie les dépôts les plus marqués. Ces réglages agissent sur le rendu courant et sur le PNG, sans rejouer les gestes. L’atlas de séchage est échantillonné à la résolution d’affichage, plafonnée selon le profil : de 1 080 × 1 920 à 2 304 × 4 096 pixels équivalents (QHD par défaut). Il est précalculé une fois par placement de feuille ; aucune étape supplémentaire de simulation fluide n’est ajoutée. Les textures restent procédurales, sans promesse de reproduction physique exacte.

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
- `src/birds/artworkPoetry.ts` : lecture du rendu final et composition avec l’oiseau rencontré.
- `src/birds/ornithopoetry.ts` : scènes ornithologiques originales pour quinze espèces ; chaque oiseau du trio apporte une image au poème.
- `src/birds/ArtworkWords.tsx`, `export.ts` : révélation des mots et carte PNG.
- `src/birds/haiku.ts` : grammaire historique conservée.

Le détail des contrôles, de l’API, des rendus et des limites est dans [Eau & chant](docs/EAU-ET-CHANT.md). L’audit des deux moteurs, la licence et les conditions de réutilisation sont dans [l’audit Pigment Drift](docs/AUDIT-PIGMENT-DRIFT.md).

La graine est déterministe pour une carte d’eau, des paramètres et des timings identiques. La graine seule ne mémorise pas un geste manuel. Les différences de calcul entre GPU restent possibles. WebGL2 et les cibles flottantes sont nécessaires ; la fluidité doit encore être vérifiée sur téléphone physique.

Les anciens studios restent accessibles par `/?mp3` et `/?validation`. Les versions antérieures sont documentées dans `docs/`.

## Licence

Pigment Drift, commit `61d3cf57d5273105d7b9985973e4648d7a553c83`, © 2026 ossianravn et contributeurs, MIT. Notices conservées dans `THIRD-PARTY-NOTICES.md`, `src/vendor/pigment-drift/LICENSE` et `public/PIGMENT-DRIFT-LICENSE.txt`. Les trois premiers enregistrements sont CC0 ; les quatre nouveaux extraits sont CC BY-SA, chacun sous la licence de son original. Les limites du modèle de pigment et des textures procédurales sont détaillées dans l’audit.

### Les couleurs séparées du plumage

Le nuancier de la plume reste dans le bandeau de création : six à huit couleurs par oiseau, soit 59 teintes nommées au total. Choisir une teinte colore la plume et laisse le nuancier accessible ; les prochains dépôts utilisent uniquement ce pigment, avec le même chant et la même gestuelle. « Tout le plumage » rétablit la brosse multicolore. La sélection ne modifie jamais les dépôts précédents. Les teintes claires sont des lavis transparents, pas une gouache blanche opaque. Les HEX sont des approximations artistiques ; les reflets de pie et de corneille ne simulent pas une iridescence physique.

La table optique est fixée pour l’oiseau sur la feuille vierge, avec les onze pigments historiques suivis des six à huit pigments dédiés. Changer de teinte ne change pas cette table. Le shader dispose de 32 emplacements sans ajouter de champ de simulation ni de texture par couleur.

L’eau déposée sur un pigment encore vivant déclenche désormais de petites poussées croissantes qui déplacent la matière et ouvrent des auréoles. Leur rayon dépend de la quantité d’eau ; elles sont espacées le long du geste et limitées à quatre simultanément. L’eau seule sur papier vierge n’ajoute ni pigment ni auréole artificielle.

### Une feuille composée dès le premier geste

Le titre occupe une bande en haut du papier, les trois vers une bande en bas et « •°○ » signe discrètement le coin inférieur droit. Le canvas et les interactions sont limités au rectangle central : ni l’eau ni les pigments ne peuvent recouvrir les textes. Les lettres restent du texte HTML net et l’export PNG réserve les mêmes zones. La zone centrale conserve ses proportions ; les marges de texte ne déforment pas la peinture.

### Correctif de la trame au séchage

Le relief du papier utilisait les dérivées GPU de la valeur du bruit : leur calcul par groupes de 2 × 2 pixels imprimait une structure régulière dans l’éclairage. Le relief utilise maintenant le gradient analytique du bruit, sans ces facettes. Le grain et les octaves des masques de séchage sont filtrés selon la résolution réellement affichée pour éviter les fréquences sous-pixel et le moiré, tout en conservant les détails résolus à l’export.

`python scripts/check-paper-grain.py` compile le vrai shader et contrôle l’absence de relief bloqué sur les quads GPU ainsi que le filtrage du grain trop fin. Il nécessite numpy, Pillow, moderngl et EGL ; les gros plans à contraste amplifié sont écrits dans `/tmp`. Le contrôle échoue sur le shader antérieur au correctif. `scripts/check-plumage-render.py` vérifie ensuite le moteur WebGL réel, les couleurs, la diffusion et le séchage.

### L’eau répond au chant

L’enveloppe d’énergie excite les courants de l’eau déjà déposée, même avec un geste immobile. Le timbre module leur direction, leur étendue et la durée des poussées ; les attaques déclenchent de petites impulsions locales. Une eau abondante répond davantage qu’une zone peu humide. L’excitation retombe progressivement dans les silences, puis la vitesse se dissipe dans le solveur existant.

Les forces sont limitées à trois zones humides et n’ajoutent ni eau ni pigment. Les impulsions ne remplissent pas les flaques. Le transport est limité aux trajets humides continus ; les séparations sèches restent des barrières. Le séchage volontaire arrête toute nouvelle excitation. Les emplacements des gestes d’eau sont prioritaires dans le budget de 16 segments GPU.

`python scripts/check-resonant-water.py` vérifie le vrai solveur WebGL sur un pigment préexistant : le chant le déplace, la même scène silencieuse reste différente, la quantité d’eau ne change pas et le pigment situé sur papier sec reste fixe. Python Playwright, Chromium et le serveur Vite sont nécessaires. `ResonantWater` est une transduction artistique du son en courants, pas une simulation acoustique de l’eau.

### Le chant immergé de la goutte

Le premier contact d’un geste d’eau joue le chant de l’oiseau à travers un filtre passe-bas : entrée en fondu, aigus étouffés, puis légère émergence pendant le contact. Au relâchement, le volume descend et le filtre se referme sur 650 ms au maximum, en respectant la fin naturelle du sample. Les déplacements du geste ne relancent pas la lecture. Un contact relâché avant le décodage est annulé, sans son retardataire.

La goutte utilise un canal d’analyse dédié au mouvement de l’eau et n’autorise jamais de pigment. Son enveloppe sonore pilote les courants. La plume conserve le chant clair, entier et sans boucle. Une seule source est partagée : si le chant de peinture joue déjà, l’eau le rejoint sans le relancer ; passer à la plume remplace le chant immergé sans superposer les samples. Les interruptions explicites, la fermeture et le masquage de l’onglet libèrent aussi le filtre.

`python scripts/check-immersed-water.py` vérifie le vrai graphe audio dans Chromium aux formats ordinateur et mobile : filtre sur la goutte, diminution du volume et des aigus au relâchement, absence de pigment et chant naturel sur la plume.

### Le souffle du vivant

L’atelier propose Eau, Plume et Souffle. En mode Souffle, glisser sur une zone humide entraîne les pigments dans la direction du geste ; la vitesse module une force plafonnée et le curseur Taille règle sa largeur. Au clavier, maintenir espace ou Entrée puis utiliser les flèches. Aucun chant ni pigment supplémentaire n’est déclenché. Le souffle étire surtout le bord avant de la peinture en filaments étroits, de longueurs irrégulières. Des couloirs de transport courbes et ancrés au papier entraînent uniquement les pigments déjà présents dans la pellicule humide ; leur direction suit le geste. Le souffle cesse à la levée du geste ; les courants existants se dissipent dans le solveur.

Le souffle transporte désormais l’eau et ses pigments au-delà du contour initial de la flaque. Des échanges de flux bornés entraînent la pellicule humide sur le papier sec ; le pigment sec préexistant reste immobile. Les courants audio ordinaires restent confinés aux chemins humides. Le séchage, l’effacement et les interruptions retirent les forces en attente. Le repère de direction est décoratif et absent de l’export.

Contrôle GPU optionnel : `PYTHONPATH=/chemin/vers/playwright python3 scripts/check-living-breath.py`, après `npm run dev`. Il compare une tache avec et sans souffle et vérifie le déplacement de pigment, la stabilité des zones sèches et l’absence d’ajout d’eau.

Le séchage volontaire dure désormais 12 secondes de simulation, avec une constante d’évaporation de `12 / 5.6` partagée entre le guide d’eau et le GPU. Cela conserve une humidité résiduelle inférieure à 0,5 % à la fin ; l’eau reste disponible tant que cette étape n’est pas lancée. Les appareils qui ne soutiennent pas la cadence de simulation peuvent prendre davantage de temps réel.


### Qualité automatique et fixation des détails

Le moteur choisit un profil au démarrage à partir du type de pointeur et des indications facultatives de mémoire et de processeurs du navigateur. Ces indications sont une estimation prudente, pas une mesure de performance du GPU. La résolution reste fixe pendant l’œuvre et les limites de texture du GPU restent prioritaires.

| Profil | Champ portrait | Sélection |
| --- | --- | --- |
| Léger | 864 × 1 536 | Mémoire annoncée ≤ 2 Go |
| Équilibré | 1 080 × 1 920 | Tactile, mémoire ≤ 4 Go ou ≤ 4 processeurs |
| Fin | 1 440 × 2 560 | Profil par défaut, notamment si les indications manquent |
| Atelier | 1 800 × 3 200 | Pointeur fin, mémoire ≥ 8 Go et ≥ 12 processeurs logiques |

Le profil Atelier calcule 56 % de cellules de pigment en plus que l’ancien QHD fixe. Son atlas procédural de séchage peut atteindre la définition complète de l’export 4K ; il ne reconstruit pas une simulation 4K ni des gestes perdus. L’affichage respecte la densité de l’écran sous un plafond de mémoire ; le profil léger plafonne aussi ses tampons d’affichage et son atlas.

Pendant les 12 secondes de séchage, l’advection et les échanges capillaires ralentissent davantage avec la baisse de l’humidité. Les dépôts fins se fixent progressivement ; aucune accentuation globale ou nouvelle trame n’est ajoutée. Les échanges restent symétriques entre cellules et la réhumidification permet à la matière de bouger à nouveau.

Validation GPU optionnelle : `scripts/check-detail-fixation.py` compare deux champs identiques avec la même évaporation, en désactivant uniquement la fixation pour la référence. Le test vérifie une meilleure conservation du contraste des filaments, une masse de pigment comparable, la même eau et la stabilité du pigment sec. Les performances sur téléphone physique ne sont pas mesurées.


Le souffle du vivant s’ouvre en rhizome : impulsion initiale énergique, éventail directionnel et deux niveaux de bifurcations irrégulières. Le bord de la flaque peut avancer sur le papier sec. Le transport utilise des flux par faces, avec des donneurs plafonnés à 24 % par face, et déplace ensemble la pellicule d’eau et le pigment en suspension. Il ne déplace pas le pigment déjà sec. La carte d’eau CPU est resynchronisée à la levée du geste depuis une petite capture GPU de 192 pixels au grand côté ; les nouveaux prolongements participent aux gestes suivants, à la résonance et au séchage de 12 secondes. Un suivi de 650 ms permet au geste de franchir l’ancien contour sans se couper immédiatement ; il ne crée rien sur une toile entièrement sèche.

Le contrôle GPU du souffle vérifie des branches colorées à l’extérieur du contour initial, un volume d’eau approximativement conservé (tolérance numérique de 5 %), la présence des nouvelles zones dans le guide CPU et l’absence de déplacement de la peinture sèche distante. Le contrôle force aussi une entrée de souffle sur un champ sans eau pour vérifier qu’aucun pigment ni aucune humidité n’apparaissent.


Le souffle privilégie maintenant les longues coulures : sa portée est allongée dans la direction du geste, son éventail est plus étroit et les bifurcations secondaires arrivent plus loin. Des échanges courts maintiennent la racine et des échanges plus longs entraînent sa pointe ; le suivi au-delà de l’ancienne flaque est borné en temps (650 ms) et en distance (3,5 rayons de souffle). Dans la scène GPU de référence, la pointe colorée dépasse le contour d’environ 0,119 largeur de feuille, contre 0,035 auparavant, sans élargissement comparable de la tache. Ce rapport caractérise cette scène de contrôle, pas toutes les peintures ni les appareils.
