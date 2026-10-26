# Validation — 24 octobre 2026

## Résultat technique

- Six tests Vitest passent : déterminisme de la partition, cinq familles distinctes, limites GPU et marges sur 195 couples seed/complexité, action des réglages, continuité des gestes, rampes de pigments.
- TypeScript compile en mode strict. Le build Vite aboutit.
- Cinq compositions ont été calculées avec des seeds et palettes distinctes. Leurs PNG sont dans `docs/studies/` ; une galerie légère figure dans `/studies/`.
- Le même moteur TypeScript a rejoué la seed 240109. Le rendu hors écran est identique pixel par pixel : SHA-256 `561d35bfa00224da96c9a00b92a669c99743571462b890a577260bc612a0720d`.
- Le réglage Texture produit des images différentes entre 0 et 100 : les empreintes sont conservées dans `validation-egl.json`.
- Un PNG de 4 096 × 3 072 px a été rendu, encodé et ouvert pour inspection. Il figure dans `docs/studies/haikuarelle-240109-4096.png`.
- Les shaders de simulation et de rendu se compilent lors de la vérification EGL. Les études et l’export sont obtenus en rejouant les appels GL réels enregistrés par `HaikuarelleEngine` et son moteur amont. Aucune seconde simulation n’a été écrite.

| Seed | Palette | Structure | Part de pixels très clairs* |
| --- | --- | --- | --- |
| 240105 | Estuaire | Estuaire diagonal | 73,18 % |
| 240106 | Lichen | Archipel | 74,02 % |
| 240107 | Argile | Élan vertical | 74,44 % |
| 240108 | Brume | Deux masses et passage | 68,81 % |
| 240109 | Ambre | Strates suspendues | 65,37 % |

*Indicateur simple, défini par R, G et B tous supérieurs à 220/255. Il inclut les lavis très pâles ; ce n’est pas une mesure des zones strictement dépourvues de pigment.

## Examen visuel

Les cinq images ont été examinées. Les premières itérations avaient des grains trop uniformes, des lavis trop réguliers et des réhumidifications qui blanchissaient complètement des disques. La V1 finale réduit ces effets : dilution proportionnelle au temps, contours perturbés, largeur des gestes irrégulière, variations de concentration à plusieurs échelles et dégradés de concentration par pigment.

Le gros plan de l’export 4K montre le relief du papier, les superpositions et les variations de densité. Les cinq structures gardent des réserves de papier importantes. Les pigments restent des interprétations numériques : certaines formes de gestes et transitions demeurent plus régulières que celles d’une aquarelle physique.

## Environnement et limites de vérification

Le navigateur distant de contrôle refuse la création d’un contexte WebGL2 : `PaintUnavailableError: WebGL2 is not available.` L’interface, sa mise en page, le sélecteur de palettes et le message d’erreur ont été inspectés dans ce navigateur. Le démarrage de la simulation GPU, la pause/reprise en animation et l’encodage PNG par ce navigateur n’ont donc pas pu y être validés.

La vérification visuelle des shaders est réalisée hors navigateur, avec Mesa EGL `llvmpipe (LLVM 20.1.2, 256 bits)`, OpenGL 4.5. Les sources GLSL ES sont adaptées uniquement pour leur en-tête de compilation desktop ; les algorithmes et les appels de rendu restent ceux de l’application. Les cinq études et le rejeu ont été calculés dans la même exécution. Les empreintes établissent la reproductibilité dans cet environnement, pas une garantie binaire entre pilotes.

Aucun benchmark sur un téléphone physique n’a été réalisé. La feuille reste de taille fixe, l’affichage réduit son DPR sur interface tactile et les tampons sont libérés à la destruction. Il faut confirmer la fluidité et la consommation de mémoire sur les appareils cibles. Le banc d’essai `/?validation` permet de répéter les tests sur un navigateur disposant de WebGL2, y compris le contrôle de pause/reprise et le décodage du Blob PNG.

Les temps EGL figurant dans le JSON sont des temps de calcul cumulatifs hors écran. Ils ne mesurent pas la fluidité de l’animation React ou d’un GPU mobile.

## Reproduire la validation hors écran

Ces dépendances sont nécessaires seulement à la QA, pas à l’application :

```bash
python3 -m pip install moderngl glcontext pillow numpy
node --input-type=module - <<'JS'
import {build} from 'esbuild';
await build({
  entryPoints:['scripts/render-offscreen.ts'],
  bundle:true,
  platform:'node',
  format:'esm',
  outfile:'/tmp/haikuarelle-render.mjs',
});
JS
node /tmp/haikuarelle-render.mjs /tmp/haikuarelle-trace.jsonl
python3 scripts/replay-egl.py /tmp/haikuarelle-trace.jsonl /tmp/haikuarelle-studies
```

Le script vérifie la reproductibilité et l’effet de Texture après avoir produit les cinq études et l’export 4K. La disponibilité d’EGL dépend de l’environnement local.
