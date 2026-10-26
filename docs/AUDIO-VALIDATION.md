# Validation V2 — 25 octobre 2026

## Analyse et grammaire

19 tests Vitest passent, avec TypeScript strict et build Vite :

- Les 6 tests de composition libre de la V1 restent valides.
- 10 tests audio vérifient la séparation graves/aigus à même amplitude, la stéréo en opposition de phase, le silence, les attaques et leur espacement, la limite réelle de 15 secondes, la sensibilité au niveau, le déterminisme de la partition, les traits d’encre et leur contrôle, les budgets du moteur et les fichiers courts.
- 3 tests vérifient la découpe d’une fenêtre de 15 secondes à l’offset choisi, la copie indépendante des canaux, les bornes de début/fin et les enregistrements courts.

La désactivation de l’encre conserve exactement la partition des gestes d’aquarelle. Les deux générateurs aléatoires sont séparés.

## Test du MP3 dans le navigateur

Le bouton « Essayer 15 s » a chargé un véritable MP3 stéréo fourni avec le projet. Le fichier a été décodé par `OfflineAudioContext`, puis analysé dans le Worker. Vérifications visibles :

- Nom de l’extrait affiché : « Étude de résonance · 15 s.mp3 ».
- Fenêtre affichée : 00:00 → 00:15, durée réelle de 15,0 s.
- Forme d’onde calculée : 150 barres.
- Une seed a été calculée à partir du PCM : 3470128776 dans ce décodeur.
- Le contrôle Encre apparaît et le bouton de création prend son libellé audio.
- La préécoute démarre après clic sur Écouter ; le bouton devient Arrêter et revient à Écouter en fin de lecture.
- Aucun débordement horizontal sur le viewport de contrôle.

Le navigateur distant refuse toujours WebGL2. La création GPU animée n’a donc pas pu être contrôlée dans ce navigateur. Le décodage, le Worker, la préécoute et la partie audio de l’interface ont pu l’être.

## Vérification graphique hors écran

Les appels réels de `HaikuarelleEngine` et de `FineInkRenderer` ont été enregistrés et rejoués sous Mesa EGL / llvmpipe. Le script inclut les tampons de géométrie, les VAO, les uniforms et le mélange alpha du rendu d’encre. Aucune autre simulation picturale n’a été écrite.

Trois études ont été calculées et examinées :

1. Un MP3 original de 15 secondes, décodé avec FFmpeg pour ce contrôle hors écran.
2. Des graves continus, pour vérifier l’ancrage des lavis.
3. Des attaques séparées par des silences, pour vérifier les réserves et les filaments.

Les images figurent dans `docs/audio-studies/`. L’étude du MP3 a aussi été calculée en 4 096 × 3 072 px, avec ses traits d’encre.

Le MP3 a été rejoué deux fois. Les pixels sont identiques dans cet environnement :
`8dad8c39c5bcd49bb2b2e0d7c4c897a54a5627043ea9b3967a1f6b5e0118dbb8`.

Le retrait du seul overlay d’encre change 2 210 pixels à la résolution de 1 024 × 768 ; 2 154 pixels ont un écart supérieur à 5/255. L’alpha du PNG reste partout opaque. Cela vérifie que les traits sont présents dans la cible capturée, et non ajoutés seulement à l’interface. Les empreintes et dimensions sont consignées dans `audio-validation-egl.json`.

La première itération rendait les traits trop faibles. Leur largeur, leur contraste et leur portée ont été ajustés après inspection. Le rendu final garde une encre discrète, indépendante des concentrations colorées, avec de légères interruptions et des variations d’épaisseur.

## Limites

- Le décodeur du navigateur et FFmpeg ne produisent pas nécessairement exactement le même PCM après resampling. Leur empreinte de seed peut donc différer. La partition est fixe pour le même objet d’analyse et la même seed ; les variations de décodeur et de GPU restent des limites de reproduction entre appareils.
- La durée de la source analysée est de 15 secondes. La formation de l’œuvre conserve les 24 secondes de simulation de la V1, avec une fin de séchage. La préécoute n’est pas synchronisée à l’animation.
- Aucun benchmark n’a été réalisé sur un téléphone physique. Les unités de temps EGL ne sont pas une mesure des images par seconde sur mobile.
- L’encodage PNG par un navigateur disposant de WebGL2 reste à répéter sur l’appareil cible. Le rendu hors écran, sa taille 4K et l’inclusion de l’encre ont été vérifiés.

## Reproduire le rendu de contrôle

Après les dépendances optionnelles EGL décrites dans `VALIDATION.md` :

```bash
ffmpeg -i public/audio/etude-15s.mp3 -ar 16000 -ac 2 -f f32le /tmp/haikuarelle-audio.f32
node /tmp/haikuarelle-render.mjs /tmp/audio-trace.jsonl audio /tmp/haikuarelle-audio.f32
python3 scripts/replay-egl.py /tmp/audio-trace.jsonl /tmp/audio-studies
```

`/tmp/haikuarelle-render.mjs` est obtenu en compilant `scripts/render-offscreen.ts`, selon la commande du document de validation V1. Les assertions vérifient le replay, la contribution de l’encre et la taille de l’export.
