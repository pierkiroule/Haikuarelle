# Audit de Pigment Drift — HAÏKUARELLE •°

Source examinée : https://github.com/ossianravn/pigment-drift-generator

Commit : `61d3cf57d5273105d7b9985973e4648d7a553c83`.
Audit et intégration : 24 octobre 2026.

## Ce qui existe réellement

| Composant | Source | Fonction réelle | Décision |
| --- | --- | --- | --- |
| Generator | `src/engine/shader.ts`, `renderer.ts` | Un fragment shader WebGL2 : bruit PCG, gradient noise et FBM déformés, champ de hauteur découpé en lavis, rampes de cinq couleurs en OKLab, rivière de pigment levé, papier et granulation procéduraux. Animation cyclique. | Le rendu partagé dans Paint Studio est réutilisé. L’animation cyclique et la composition paysagère de Generator ne sont pas utilisées. |
| Paint Studio | `src/paint/engine.ts`, `shaders.ts` | Champ RGBA16F : concentration totale, humidité, quantités de l’encre 2 et 3. Au maximum trois encres, chacune avec cinq couleurs. Double tampon. | Moteur principal conservé. |
| Simulation | `VEL_STEP`, `CURL`, `VORTICITY`, `DIVERGENCE`, `JACOBI`, `GRADIENT`, `FIELD_STEP` | Advection, confinement de vorticité, projection de pression, interpolation Catmull–Rom bornée, diffusion et propagation asymétrique suivant un bruit de fibres, décroissance de l’humidité. | Réutilisation directe. 18 itérations de pression et vitesse à un quart de la résolution linéaire. |
| Dépôts et gouttes | `Segment`, `Drop`, `PaintEngine.step()` | Au maximum 16 segments et 4 gouttes par pas. Peinture, eau et levée. Les gouttes déplacent le pigment par une transformation de marbrure. | Une partition déterministe fournit ces entrées réelles. |
| Papier | `PAPER` | Texture procédurale : aspérités, grain, fibres orientées, relief par dérivées écran. Aucun fichier de papier photographié dans le dépôt. | Conservé et affiné, coordonnées de feuille stables. |
| Pigments | `RENDER`, `color.ts` | Rampes artistiques, partage de trois encres, mélange OKLab, lavis et vernis multiplicatifs. Aucun spectre de pigment, aucune donnée Kubelka–Munk. | Rampes monochromatiques ; mélange des encres adapté en densité optique approximative. |
| Export | `PaintEngine.capture(scale,timeS)` | Rendu hors écran, lecture RGBA puis inversion des lignes. Limite native à 4 096 px. | Utilisé directement puis encodage PNG par le navigateur. |

Le dépôt n’est pas une bibliothèque React publiée avec une API WatercolorEngine. Le moteur s’utilise directement en TypeScript. L’interface demandée est une nouvelle façade locale, et ne prétend pas être une API amont.

## Réutilisation et adaptations

Les fichiers vendus sont regroupés sous `src/vendor/pigment-drift/` : moteur, shaders, bruit, paramètres, palettes et fonctions couleur. Les couleurs, paramètres, palettes et bruit sont conservés sans modification. Le dossier `patches/` contient le diff précis des modifications du moteur et des shaders.

Adaptations de `paint/engine.ts` : budget de simulation configurable, cache des champs de rendu statiques lorsque `drift=0`, libération du tampon de sommets.

Adaptations de `paint/shaders.ts` : relief du papier à plusieurs échelles avec fibres orientées, granulation corrélée aux creux, mélange des encres en densité optique, perturbation des contours des gouttes d’eau. La simulation d’advection et de pression reste celle de Paint Studio.

Ajouts HAÏKUARELLE : façade WatercolorEngine, horloge de simulation fixe à 30 Hz, feuille canonique indépendante de l’écran, cinq familles de compositions, partition de gestes, palettes, interface React, validation et téléchargement PNG.

## Licence

Le fichier `LICENSE` amont contient la licence MIT, copyright 2026 ossianravn and Pigment Drift contributors. La copie, la modification, la distribution et l’usage commercial sont permis, à condition de conserver la mention de copyright et le texte de permission avec les copies ou parties substantielles.

La licence complète est conservée dans `src/vendor/pigment-drift/LICENSE`, `public/PIGMENT-DRIFT-LICENSE.txt` et `THIRD-PARTY-NOTICES.md`. Les fichiers adaptés conservent leurs mentions de provenance. Le lien de crédit figure dans l’application. Le logiciel est fourni sans garantie selon la licence MIT.

## Limites à distinguer d’une simulation physique complète

- La matière est une approximation picturale procédurale. Il n’y a pas de réseau de fibres de coton mesuré ni de texture photographique.
- L’humidité diffuse et décroît réellement dans le champ GPU. La granulation minérale et le relief sont surtout une modulation du rendu liée au papier ; ce ne sont pas des particules minérales simulées individuellement.
- Les auréoles viennent de la réhumidification et du déplacement des concentrations existantes. Le modèle ne résout pas la totalité des mécanismes physiques d’un backrun.
- Les coulures et ramifications sont des gestes structurés qui alimentent le champ fluide ; leur direction est choisie par la grammaire, pas par une simulation 3D de gravité et de capillarité.
- Les trois encres se mélangent en approximation soustractive. Aucun modèle spectral ou chimique n’est revendiqué.
- L’export a une définition de 4 096 × 3 072 px ; le champ simulé reste à 1 024 × 768. Il ne s’agit pas d’une nouvelle simulation à 4K.

## Ajout V2 — 25 octobre 2026

Le moteur amont reçoit un hook optionnel `afterRender(width,height)` appelé après le lavis, sur la cible courante de rendu ou d’export. Le composant local `FineInkRenderer` y dessine les traits secs. La simulation amont n’est pas réécrite. L’analyse MP3 et la grammaire de transduction sont de nouveaux modules HAÏKUARELLE, documentés dans `AUDIO-GRAMMAR.md`.

## Ajout V3 — 25 octobre 2026

Le shader PAPER adapté utilise désormais un bruit à support triangulaire, sans fibres croisées, et un filtrage des hautes fréquences par dérivées écran. Les contributions de grain et de relief ont été réduites. Le nouveau module `layout.ts` fournit deux champs Full HD et oriente ensemble gestes et traits. L’API de rendu amont et la simulation fluide restent conservées. Voir `PORTRAIT-HD.md`.

## V6 — eau préparée et sample déposé

Les shaders d’advection, de vitesse, de pression et de vorticité sont toujours ceux de Paint Studio. Le champ est désormais QHD (budget configurable, limites GPU respectées), l’évaporation est réglable et la reconstruction du rendu agrandi utilise Catmull–Rom borné. Le rendu de la session « eau & chant » utilise une concentration optique continue afin d’éviter les terrasses régulières du Generator ; il garde les masses de pigment et les parts des trois encres réellement transportées. Le papier utilise un bruit simplex à supports tournés, sans trame orthogonale, et un éclairage très discret de l’eau claire issue du canal d’humidité. Le moteur reste procédural et ne contient aucun scan photographique de papier. Le patch joint identifie ces adaptations.

### Adaptation V6.1

Les segments conservent les trois encres et les trois opérations amont. Un bit supplémentaire dans les paramètres signale les lavis limités au film humide (`wetOnly`, extension HAÏKUARELLE). Le shader vérifie la continuité de ce film, conserve le séchage exponentiel du mode préparé et accentue la visibilité de l’eau claire. Aucune nouvelle simulation de fluide ne remplace l’advection ni la projection de pression de Paint Studio.

### Adaptation V7 — alphas de séchage

Un atlas RGBA8 local (`DRYING_MASKS`) fournit les variations de densité, les arcs de backruns, les délavages et les sédiments. Il réutilise les fonctions de bruit amont et est mis en cache dans les coordonnées de la feuille. L’humidité du vrai champ GPU révèle ces masques. Les liserés extérieurs s’appuient sur les gradients du pigment transporté. Le paramètre `Look.dryingDetail` est une extension HAÏKUARELLE ; sa valeur nulle conserve le rendu antérieur. Le papier vierge reste identique. La simulation d’advection et de pression n’est pas remplacée.

### Adaptation V8 — base d’absorption multicolore

Le moteur amont est bien limité à trois encres. HAÏKUARELLE ajoute explicitement
`Look.pigments` : en mode optique, les trois quantités existantes représentent les
composantes d’absorption RGB, et non les identifiants de trois encres. R contient
la somme d’absorption / 8 ; BA les composantes verte et bleue prémultipliées ;
la composante rouge est le reste. G demeure l’eau. Les onze pigments sont
convertis à la déposition dans cette base commune. L’advection, le solveur de
pression, la diffusion, les backruns et les masques de séchage sont conservés.
Aucune texture de simulation supplémentaire. Le mode amont reste disponible
sans `Look.pigments`. `paint/optics.ts` et les ajouts au shader sont des extensions
locales, pas des API existantes de Pigment Drift. Ce modèle d’absorption à trois
canaux n’est pas spectral et ne simule pas la chimie de pigments réels.
