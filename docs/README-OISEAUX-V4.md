# HAÏKUARELLE •° — V4 · L’atelier des oiseaux

Un instrument pictural dans le navigateur : poser son pinceau, jouer un chant d’oiseau, laisser un geste d’aquarelle et d’encre fine apparaître. Les gestes s’accumulent en une signature personnelle. Un haïku apparaît sous l’œuvre, avec une dédicace facultative.

React + Vite + TypeScript. Simulation et rendu WebGL2 issus de Paint Studio / Pigment Drift, licence MIT. Aucun backend, service payant ou appel à une IA.

## Installer

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

## Composer

1. Toucher le papier pour poser le pinceau. Au clavier : sélectionner la toile, appuyer sur Entrée puis utiliser les flèches.
2. Toucher l’un des dix pads. Les touches 1 à 9 et 0 correspondent aux dix oiseaux.
3. Le chant démarre réellement avant de programmer le moindre pigment. Son énergie, ses attaques et son spectre modulent le geste à l’endroit choisi.
4. Déplacer le pinceau et jouer un autre oiseau. Un nouveau pad interrompt le précédent ; le pigment déjà déposé continue à diffuser et à sécher pendant cinq secondes.
5. Ajuster la palette, la taille du pinceau, l’humidité, le grain et l’encre. Chaque oiseau possède une famille de gestes, dans la même harmonie de pigments.
6. Le haïku répond aux oiseaux les plus présents, à la palette et à la position des gestes. Ajouter un prénom dans la dédicace, si souhaité.
7. **Emporter · PNG** exporte l’aquarelle et ses trois vers. **Nouvelle feuille** efface la session et choisit une nouvelle seed.

La feuille reste blanche au démarrage. Poser le pinceau, précharger les sons, changer la palette ou ouvrir le grand écran ne dépose rien. Un son indisponible, silencieux ou bloqué par le navigateur ne crée pas de marque. Arrêter un chant ou quitter l’onglet coupe les nouveaux dépôts. La diffusion et le séchage des pigments existants sont naturels et continuent après le son.

## Dix enregistrements réels

Rouge-gorge, merle noir, rossignol, fauvette à tête noire, hirondelle rustique, geai des chênes, étourneau, chouette hulotte, hibou moyen-duc et corneille noire.

Les dix fichiers viennent de LaSonothèque / BigSoundBank, sous CC0. Ils sont inclus dans `public/birds/` et servis par l’application : aucun appel à une banque de sons externe pendant l’utilisation. Les auteurs, pages originales, passages choisis, modifications et empreintes SHA-256 figurent dans `public/birds/credits.json`, et dans la page Crédits accessible depuis l’atelier. Le geai est crédité à Joseph SARDIN & Axeline T. Les auteurs des autres prises de son sont Joseph SARDIN et Le tiroir du fond.

L’API Xeno-canto v3 nécessite une clé personnelle. Cette version utilise une sélection CC0 intégrée pour fonctionner sans compte ni secret côté client.

## Papier, portrait et HD

- Portrait réel 9:16 : champ de pigments 1 080 × 1 920.
- Paysage HD 16:9 : champ de pigments 1 920 × 1 080.
- Grand écran : toile seule, avec proportions conservées. Toucher ou bouger la souris révèle Quitter ; Échap permet de sortir.
- La peinture exportée a un grand côté de 4 096 px. Une marge supplémentaire contient le haïku et la dédicace ; l’image complète dépasse donc 4 096 px sur son grand côté.

Choisir le format sur une feuille vierge. La palette peut changer en cours de composition. Eau, grain et encre restent accessibles dans le volet Matière. La trame carrée du papier a été supprimée dans la V3 ; son relief fin est filtré pour éviter le crénelage.

## Architecture et API

- `src/App.tsx` : atelier tactile, curseur du pinceau, pads, haïku et export.
- `src/birds/catalog.ts` : dix oiseaux, gestes, crédits.
- `src/birds/BirdAudioBank.ts` : décodage/cache, autorisation audio et durée de vie des voix.
- `src/birds/grammar.ts` : partition locale, ancrée au point du pinceau et modulée par le véritable signal.
- `src/birds/haiku.ts` : grammaire poétique originale et déterministe, sans modèle génératif.
- `src/engine/WatercolorEngine.ts` : façade du moteur amont, simulation, horloge et sessions interactives.
- `src/engine/FineInkRenderer.ts` : filaments secs, inclus dans l’export GPU.

```ts
const engine = new HaikuarelleEngine(canvas, settings, onStatus, onError, {
  requireAudio: true,
});
engine.beginSignature(58017); // feuille blanche, aucun pas de simulation

// Appeler uniquement une fois la lecture du pad réellement démarrée.
engine.playBird(analysis, bird, {x: 0.4, y: 0.55}, 58018, 0.6, 0);
engine.stopBird(); // interrompt les dépôts ; laisse sécher la matière
const image = await engine.exportPNG(); // aquarelle + encre, sans les vers
engine.destroy();
```

Les coordonnées sont normalisées, origine en haut à gauche. `playBird` n’efface pas les marques existantes. La partition courante est disponible dans `engine.composition`, avec les coupures temporelles des gestes interrompus. Chaque feuille possède une seed ; reproduire une signature interactive demande aussi les gestes, positions, réglages et instants d’interruption, ainsi que le même moteur/GPU. La seed seule ne restitue pas les choix manuels.

L’API générique `WatercolorEngine` de la V1 reste disponible. L’ancien atelier d’import MP3 est conservé à `/?mp3` et le banc d’essai GPU à `/?validation`. Dans l’atelier MP3, la génération automatique sans audio a été supprimée. Lire `docs/README-MP3-V3.md` pour son usage.

## Vérification et limites

Lire `docs/OISEAUX.md` pour les tests, les rendus inspectés et les limites de vérification.

Un GPU compatible WebGL2 et textures flottantes est nécessaire. Les calculs gardent un pas fixe de 1/30 s ; sur un appareil lent, la diffusion peut prendre plus de temps réel. Les dépôts restants sont coupés à la fin réelle du son. Le dessin est une approximation picturale de l’aquarelle : pas de modèle spectral scientifique ni de calcul par fibre de coton.

La poésie combine des vers originaux sélectionnés selon l’œuvre. Elle ne prétend pas analyser l’émotion de l’utilisateur. Le compteur de quarante gestes invite à préserver des blancs ; une nouvelle feuille permet de repartir.

## Provenance

Pigment Drift : https://github.com/ossianravn/pigment-drift-generator — commit audité `61d3cf57d5273105d7b9985973e4648d7a553c83`.

L’audit, les mentions MIT et le patch par rapport à l’amont figurent dans `docs/AUDIT-PIGMENT-DRIFT.md`, `THIRD-PARTY-NOTICES.md` et `patches/pigment-drift.patch`.
