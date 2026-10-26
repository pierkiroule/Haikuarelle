# HAÏKUARELLE •° — V3 · Portrait & grand écran HD

Une application React + Vite + TypeScript. Quinze secondes d’un MP3 deviennent une composition d’aquarelle et d’encre fine. Le traitement reste local, sans backend ni appel à une IA. Le moteur WebGL2 est une adaptation directe de Paint Studio, issu de Pigment Drift sous licence MIT.

## Installation

Node.js 20.19+ ou 22.12+ recommandé.

```bash
npm install
npm run dev
```

Ouvrir l’adresse affichée par Vite. Pour une version de production :

```bash
npm run build
npm run preview
```

Les dépendances sont verrouillées dans `package-lock.json`. Pour une installation strictement identique, utiliser `npm ci`.

## Portrait, HD et papier

La V3 supprime les fibres croisées qui produisaient une trame carrée trop visible. Le papier est plus discret et son grain fin est filtré selon la taille du pixel. Le champ de pigments est maintenant calculé en Full HD.

- **Portrait 9:16** : champ 1 080 × 1 920, export 2 304 × 4 096.
- **Paysage HD 16:9** : champ 1 920 × 1 080, export 4 096 × 2 304.
- **Grand écran** : toile seule, sans déformation, plein écran natif si disponible ou mode de contemplation dans la page. Un toucher révèle Quitter ; Échap permet de sortir.

Le téléphone choisit le portrait au premier lancement en orientation verticale. Le sélecteur Format permet de changer ensuite. Le passage portrait/paysage rejoue la même partition dans son nouveau cadre. Le grand écran conserve l’œuvre en cours.

Voir `docs/PORTRAIT-HD.md` pour le détail des modifications et de la validation.

## Transduire un MP3

Au démarrage, le papier reste blanc. La création, le replay, la pause et l’export sont désactivés tant qu’aucun extrait n’est chargé et analysé. Retirer le MP3, le remplacer ou déplacer l’extrait efface immédiatement l’ancienne partition. Un fichier silencieux reste blanc, sans simulation en cours. Il n’y a pas de création libre automatique dans cet atelier sonore.

1. Cliquer sur **Importer un MP3**, choisir un fichier, ou déposer le fichier sur la bande audio. **Essayer 15 s** charge un court enregistrement original fourni avec l’application.
2. Déplacer le curseur pour choisir le début de l’extrait. Le moteur analyse au maximum 15 secondes. Un fichier plus court garde sa durée réelle.
3. L’œuvre se forme automatiquement à la fin de l’analyse. **Créer l’œuvre** donne une nouvelle variation à partir du même extrait. La flèche de replay conserve la seed et les réglages.
4. Régler **Encre** pour ajouter des filigranes ou des nervures plus présentes. Le curseur à zéro retire les traits tout en conservant la partition des lavis.
5. **Écouter** permet d’entendre exactement l’extrait choisi, indépendamment de l’animation. **PNG** exporte l’aquarelle et l’encre ensemble.

La fenêtre sonore dure 15 secondes ; la formation de l’œuvre garde une durée cible de 24 secondes, avec les dernières secondes réservées aux traits et au séchage. L’écoute de l’extrait est une préécoute séparée : ce n’est pas un lecteur audio synchronisé à la simulation GPU.

L’analyse utilise une FFT à 1 024 points sur du PCM à 16 kHz, à 30 fenêtres par seconde, dans un Web Worker. Elle mesure l’énergie, trois bandes de fréquences, la brillance, les changements de spectre, les attaques et l’espace stéréo. La grammaire compose une masse principale, un lavis secondaire, des accents et des réserves. Aucune signification émotionnelle n’est déduite de la musique.

La grammaire et ses correspondances sont détaillées dans `docs/AUDIO-GRAMMAR.md`. La validation figure dans `docs/AUDIO-VALIDATION.md`.

## Utilisation

- **Créer l’œuvre** lance une nouvelle variation de l’extrait analysé. La création se développe pendant 24 secondes de temps simulé, puis se stabilise.
- **Palette** choisit l’une des cinq associations de trois pigments. Les couleurs changent sur le champ existant.
- **Texture** agit directement sur le rendu du grain du papier et des concentrations minérales.
- **Humidité** modifie la diffusion, la durée d’humidité et la force des rencontres. La composition est rejouée avec la même seed.
- **Complexité** modifie le nombre, la taille et l’organisation des gestes. La composition est rejouée avec la même seed.
- **Pause** suspend l’horloge et la simulation. La reprise ne saute aucun pas.
- **↶ à côté de la seed** régénère la même composition avec les réglages actuels. On peut aussi saisir une seed uint32 et valider avec Entrée.
- **PNG** exporte l’état visible de la peinture avec un grand côté de 4 096 px, dans le format choisi, sans interface.

Raccourcis : `G` pour générer ; `Espace` pour pause/reprise. Une préférence système de réduction des animations fait démarrer l’atelier en pause. Les contrôles restent utilisables au clavier et au toucher. Les réglages sont mémorisés uniquement dans le stockage local du navigateur.

La seed fixe la partition. Pour retrouver le rendu, il faut aussi retrouver les mêmes réglages et la même version du moteur. La simulation utilise un champ de 1 920 × 1 080 en paysage ou de 1 080 × 1 920 en portrait, avec un pas fixe de 1/30 seconde. La définition d’affichage s’adapte ; le champ ne change pas lors d’un simple redimensionnement ou d’un passage en grand écran.

## API interne

```ts
import { HaikuarelleEngine } from './src/engine/WatercolorEngine';

const engine = new HaikuarelleEngine(canvas, {
  palette: 'estuaire',
  granulation: 0.72,
  wetness: 0.64,
  complexity: 0.52,
  format: 'portrait',
});

engine.generate(240106);
engine.deposit(0.45, 0.50, '0');
engine.addWater(0.48, 0.52, 0.4);
engine.setWetness(0.7);
engine.setGranulation(0.8);
engine.pause();
engine.resume();
const image: Blob = await engine.exportPNG();
engine.destroy();
```

Pour une source audio, la façade expose aussi `setAudio(analysis)` :

```ts
import {openAudio, analyzeExcerpt} from './src/audio/file';

const document = await openAudio(file);
const analysis = await analyzeExcerpt(document, 30); // extrait 00:30 → 00:45
engine.setAudio(analysis);
engine.update({ink: 0.7});
engine.setAudio(null); // efface la feuille et arrête la simulation
```

L’atelier crée le moteur avec le cinquième argument `{requireAudio: true}`. Dans ce mode, `generate`, les réglages et `resume` ne peuvent pas déclencher une peinture sans analyse sonore. Le constructeur par défaut garde la grammaire autonome de la V1 pour les usages programmatiques explicites et le banc d’essai. `clear()` efface la feuille sans lancer d’animation ; le statut est alors `phase: 'idle'`.

Les coordonnées vont de 0 à 1, origine en haut à gauche. `deposit` accepte les indices d’encre `"0"`, `"1"`, `"2"` ou la couleur hexadécimale exacte d’un pigment de la palette courante. Une couleur absente est refusée explicitement : les trois canaux d’encres du moteur amont ne permettent pas un nombre arbitraire de pigments simultanés. `addWater` utilise une quantité normalisée entre 0 et 1.

Les gestes externes prolongent le séchage. Une génération par seed seule ne rejoue pas les événements externes injectés ensuite : il faudra conserver leur journal pour un futur moteur sonore. Les setters Humidité et Complexité repartent d’une feuille neuve. Texture et Palette agissent en direct sur la feuille actuelle.

`generate` ne crée pas un calque final préfabriqué : la grammaire alimente à chaque pas les véritables segments et gouttes du moteur de simulation amont.

## Architecture

```text
src/
  App.tsx                    Interface minimale
  Validation.tsx             Banc d’essai GPU accessible par ?validation
  engine/
    types.ts                 Contrat public WatercolorEngine
    WatercolorEngine.ts      Adaptateur, horloge, export et ressources
    composition.ts           Partition libre déterministe des gestes
    FineInkRenderer.ts       Traits secs sur le GPU, inclus dans le PNG
    layout.ts                Formats, orientation, budgets et export
  audio/
    analyze.ts               FFT et analyse déterministe du PCM
    analysis.worker.ts       Analyse hors du thread de l’interface
    composeAudio.ts          Grammaire de transduction musicale
    file.ts                  Décodage local, extrait, préécoute
    AudioImport.tsx          Import, fenêtre et forme d’onde
    palettes.ts              Palettes et rampes de concentration
  vendor/pigment-drift/
    paint/engine.ts           Moteur WebGL2 amont adapté
    paint/shaders.ts          Simulation et rendu amont affinés
    paint/noise.ts            Bruit amont
    engine/                   Couleurs, palettes, paramètres amont
patches/pigment-drift.patch   Diff précis par rapport au commit audité
docs/                        Audit, validation et études
scripts/                     Validation des appels GL hors écran
```

## Vérification

```bash
npm test
npm run typecheck
npm run build
```

Le banc d’essai navigateur se trouve à `/?validation`. Il génère cinq études, rejoue une seed et compare les pixels, vérifie les différences de texture et décode un export PNG haute définition. Il n’envoie aucune donnée et ne nécessite pas de serveur applicatif.

Pour la vérification hors écran dans un environnement sans WebGL de navigateur, voir `docs/VALIDATION.md`. Les captures fournies dans `docs/studies/` ont été obtenues avec les véritables appels GL de la façade TypeScript, rejoués sous EGL. Ce ne sont ni des images générées par IA ni des illustrations de remplacement.

## Limites techniques et artistiques

- WebGL2 et les textures flottantes rendables sont indispensables. Un message explicite remplace la toile si le navigateur les refuse. Il n’y a pas de moteur CPU de secours.
- L’import accepte des fichiers jusqu’à 50 Mo. Le navigateur décode le fichier complet avant de sélectionner la fenêtre de 15 secondes. La fréquence de décodage réduite à 16 kHz limite la mémoire, sans garantir la prise en charge de fichiers très longs sur tous les mobiles. Aucun fichier sonore n’est téléversé ni mémorisé après fermeture.
- La seed d’une œuvre sonore s’utilise avec le même extrait décodé et les mêmes réglages. Les décodeurs MP3 peuvent produire de petites différences de PCM selon le navigateur. Le JSON d’analyse permet de fixer la partition indépendamment du décodeur.
- Le champ de simulation est Full HD, dans le format choisi. L’export 4K rééchantillonne ce champ et recalcule le papier, les traits et les shaders à la résolution de sortie ; ce n’est pas une nouvelle simulation physique 4K.
- Sur un appareil lent, le rendu peut dépasser 24 secondes réelles : les pas physiques sont conservés pour préserver le résultat. Aucun benchmark sur téléphone réel n’est revendiqué.
- La reproductibilité pixel à pixel s’applique sur le même pilote et la même version, avec les mêmes réglages. Les calculs flottants et interpolations peuvent varier légèrement entre GPU.
- Cette V1 donne une interprétation picturale de la diffusion et du séchage. Le papier et la granulation sont procéduraux ; le mélange soustractif est approximatif. Ce n’est pas une simulation scientifique de pigments réels. Voir l’audit pour les distinctions précises.
- Un export 4K demande temporairement plusieurs tampons de mémoire. En cas de limite de mémoire du navigateur, l’application signale l’échec.
- Une perte de contexte interrompt la simulation et propose une régénération. Le champ en cours n’est pas sauvegardé automatiquement.

## Provenance

Source : https://github.com/ossianravn/pigment-drift-generator
Commit audité : `61d3cf57d5273105d7b9985973e4648d7a553c83`.

Lire `docs/AUDIT-PIGMENT-DRIFT.md` et `THIRD-PARTY-NOTICES.md`. Les mentions et la licence MIT originales sont conservées avec les sources et avec l’application compilée.
