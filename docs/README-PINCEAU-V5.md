# HAÏKUARELLE •° — V5 · Pinceau libre & trois plumages

Un instrument d’aquarelle et d’encre fine. Jouer un oiseau, déplacer librement son pinceau, laisser le son moduler la matière. Un haïku accompagne la signature obtenue.

React + Vite + TypeScript. Simulation et rendu WebGL2 fondés sur Paint Studio / Pigment Drift (MIT). Sans backend, service payant ou appel à une IA.

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

## Peindre

1. Jouer l’un des **trois pads**. Il reste actif jusqu’à un second appui, un autre pad ou Arrêter.
2. Sur ordinateur, déplacer la souris sur le papier. Sur téléphone ou tablette, glisser le doigt. Le stylet prend aussi en compte la pression.
3. Un mouvement lent produit un lavis ample. Un mouvement rapide affine la trace et peut projeter de petites gouttes dans la direction du geste.
4. Le chant réel module la charge de pigment, le grain de la ligne et les accents. Les silences interrompent les dépôts. Relâcher le doigt ou quitter le papier permet de reprendre ailleurs sans trait de liaison.
5. Ajuster la taille du pinceau, l’humidité, le grain et l’encre. Les traces déjà posées continuent à diffuser puis sécher.
6. Un haïku naît au premier dépôt réel. La dédicace facultative et les trois vers sont inclus dans **Emporter · PNG**.

Le papier reste vierge sans mouvement et sans chant actif. Jouer un pad seul n’ajoute aucun tracé prédessiné. Les phrases sonores se répètent avec une respiration silencieuse, sans modifier leur hauteur. Un arrêt automatique intervient après 90 secondes ; masquer l’onglet arrête aussi la voix.

## Trois signatures identifiables

| Pad | Pigments et geste |
| --- | --- |
| **Corneille** | Noir de carbone, matière plus dense, encre fine et éclats directionnels. |
| **Rouge-gorge** | Orange chaud, lavis gris latéral et blanc du papier préservé. |
| **Geai** | Bleu lumineux, touches fragmentées par son appel bref, encre légère. |

La sélection combine le rythme des enregistrements et une interprétation des plumages. Les trois couleurs occupent chacune l’un des trois vrais canaux de pigments du moteur existant. Passer à un autre oiseau conserve les couleurs déjà peintes. Les couleurs peuvent se rencontrer dans l’eau.

Les enregistrements réels, sous CC0, sont intégrés dans l’application. Seuls les trois pads actifs sont préchargés. Les auteurs, sources et adaptations figurent dans `public/birds/credits.html` et `credits.json`. Aucun accès à une API externe ni clé Xeno-canto n’est nécessaire.

## Formats et raccourcis

- Portrait réel 9:16 : champ de pigments 1 080 × 1 920.
- Paysage HD 16:9 : champ de pigments 1 920 × 1 080.
- Grand écran : proportions conservées, commandes discrètes, pinceau libre pendant le chant. Toucher ou déplacer le pointeur révèle Quitter et Terminer.
- PNG : peinture avec grand côté de 4 096 px, puis marge contenant le haïku et la dédicace. En portrait : 2 304 × 4 741 px au total.

Choisir le format sur une feuille vierge. Sur mobile, les trois grands pads restent visibles sous la toile.

`1`, `2`, `3` : jouer/arrêter le pad correspondant. `F` : grand écran. `Échap` : sortir du grand écran ou arrêter le chant. Avec la toile sélectionnée, les flèches déplacent le pinceau ; Entrée le pose au centre.

## Architecture

- `src/App.tsx` : interface, capture du pointeur, événements tactiles/stylet, pads, haïku et export.
- `src/birds/ResonantBrush.ts` : file bornée d’événements, vitesse physique, pression, largeur, projections et ruptures de contact.
- `src/birds/BirdAudioBank.ts` : cache des trois voix, répétition avec respiration, vraie horloge audio et arrêt.
- `src/birds/catalog.ts` : catalogue et sélection des trois pads ; crédits des sources.
- `src/birds/haiku.ts` : grammaire poétique originale et locale.
- `src/birds/export.ts` : assemblage du vrai PNG de peinture avec le haïku.
- `src/engine/WatercolorEngine.ts` : façade du PaintEngine réel, simulation à pas fixe et sessions de peinture.
- `src/engine/FineInkRenderer.ts` : rubans d’encre ajoutés au GPU par petits lots, inclus dans l’export.

## API du pinceau

```ts
const engine = new HaikuarelleEngine(canvas, {
  palette: 'plumages',
  format: 'portrait',
  wetness: 0.62,
  granulation: 0.7,
  complexity: 0.52,
  ink: 0.62,
}, onStatus, onError, {requireAudio: true});

engine.beginSignature(58029);

// Après le démarrage réel du son :
engine.startBirdBrush(analysis, bird, 58030, 0.55, 0, audioElapsedSeconds, onFirstMark);

// Pendant le déplacement : coordonnées 0..1, temps monotone en millisecondes.
engine.moveBrush({x: 0.4, y: 0.55}, pointerEvent.timeStamp, 0.5);
engine.setBrushSize(0.7);
engine.liftBrush(); // rupture du trait au relâchement / à la sortie du papier
engine.stopBird();  // coupe les dépôts ; laisse sécher la matière existante

const painting = await engine.exportPNG();
engine.destroy();
```

L’horloge de lecture provient de `AudioContext.currentTime`. Elle est repliée sur la phrase et sa respiration. Un contexte audio suspendu renvoie une position invalide : aucun dépôt n’est émis. La simulation de l’eau garde un pas fixe de 1/30 s, et utilise l’état courant du son et les derniers mouvements disponibles.

La file du pointeur reste limitée à 96 événements, puis au maximum quatre segments de trajectoire par pas. Le rouge-gorge peut utiliser trois composantes par segment (eau, gris, orange), plus trois gouttes : cela reste sous la limite réelle de seize segments du shader amont. Les projections sont liées à la distance parcourue et à la vitesse. L’encre utilise un tampon extensible avec `bufferSubData` ; la signature complète n’est pas reconstruite à chaque mouvement.

Les graines fixent les variantes de matière, de projections et du poème. Reproduire une performance exige également ses événements de pointeur, les horloges, les réglages et le même moteur/GPU. Il n’y a pas encore d’import/export de session dans l’interface.

L’API autonome de V1 reste disponible. L’atelier d’import MP3 est conservé à `/?mp3` et le banc d’essai GPU à `/?validation`. Lire `docs/README-MP3-V3.md` et `docs/README-OISEAUX-V4.md` pour ces versions.

## Validation et limites

**54 tests** passent. TypeScript strict et construction Vite validés. Les rendus du vrai moteur montrent les trois pigments et la différence entre mouvements lents et rapides ; les PNG de contrôle figurent dans `docs/motion-studies/`. Les détails sont consignés dans `docs/PINCEAU-LIBRE.md`.

WebGL2 et les textures flottantes sont requis. Le navigateur de contrôle ne fournit pas WebGL2 : l’interface et l’audio y sont vérifiés, tandis que les véritables appels GPU ont été rejoués hors écran sur Mesa EGL. Le parcours complet sur un téléphone physique reste à vérifier. Sur un GPU lent, l’eau peut diffuser plus lentement ; les entrées restent bornées et le son actuel pilote les dépôts.

L’aquarelle est une approximation picturale, pas un modèle spectral scientifique de pigments. Le poème utilise des vers originaux, sans analyse psychologique de l’utilisateur ni envoi de sa dédicace à un service.

## Provenance

Pigment Drift : https://github.com/ossianravn/pigment-drift-generator — commit audité `61d3cf57d5273105d7b9985973e4648d7a553c83`.

Audit et mentions : `docs/AUDIT-PIGMENT-DRIFT.md`, `THIRD-PARTY-NOTICES.md`, `patches/pigment-drift.patch`. Les licences MIT et les crédits audio sont conservés avec le code et l’application.
