# Eau & chant — HAÏKUARELLE V6

## Interaction

1. Avec **Pinceau d’eau**, mouiller une zone au doigt, à la souris ou au stylet. L’eau est un vrai dépôt `Kind.Water` dans le canal d’humidité du moteur. Le papier humide s’assombrit très légèrement et revient à sa teinte naturelle en séchant.
2. Glisser l’un des trois samples sur cette zone. Sur un écran tactile comme avec une souris, le même gestionnaire Pointer Events capture le pad et restitue le point de dépôt. Le sample ne démarre pas à sa simple sélection.
3. Autre accès : sélectionner un sample, cliquer/toucher un point de la feuille, puis **Déposer ici**. Au clavier : `E` choisit l’eau ; flèches déplacent le point ; espace/Entrée mouille ; Maj + flèches prolonge la zone humide. `1`, `2`, `3` sélectionnent les samples ; Entrée sur le papier dépose le sample sélectionné.
4. Le sample original joue **une seule fois**. Son enveloppe ouvre le lavis, ses attaques relancent les lobes et les gouttelettes, son éclat spectral infléchit les ramifications et l’encre fine. Les phrases ne sont plus répétées pendant 90 secondes.
5. L’advection, les mélanges, les auréoles et l’évaporation se poursuivent après le son. Il n’y a alors plus de nouveau pigment sonore. On peut réhumidifier la feuille et déposer un autre chant pour travailler les rencontres.

Le bouton **Pause** suspend le séchage entre deux chants ; **Reprendre** relance la simulation.

Les trois couleurs restent dans les mêmes canaux physiques : corneille noire, rouge-gorge orange avec compagnon gris, geai bleu. Une zone sèche refuse le dépôt et propose de reprendre le pinceau d’eau. Un extrait silencieux ou une lecture bloquée ne crée aucune peinture.

## Matière et résolution

- Le champ de pigment de Paint Studio est porté à **1 440 × 2 560** en portrait, et l’inverse en paysage, lorsque le GPU le permet. La feuille logique reste 1 080 × 1 920 afin de conserver la même géométrie.
- Le rendu agrandi reconstruit le vrai champ par Catmull–Rom borné aux texels adjacents. Le papier reste dans les coordonnées de la feuille et ne contient plus de trame carrée.
- Le rendu interactif utilise une absorption optique continue de la concentration transportée, avec granulation corrélée au relief du papier et liseré de séchage. Cela évite les paliers réguliers de la pile de six lavis du Generator. Ce n’est pas un modèle spectral de pigment.
- Le temps d’évaporation dépend réellement du réglage **Humidité**. La fin du score laisse environ cinq constantes de temps au dernier dépôt pour se stabiliser : généralement 20 à 50 secondes de simulation. Le téléphone peut demander davantage de temps réel si son GPU ralentit.
- Le grain agit sur le dépôt minéral rendu ; l’encre agit sur les nervures fines des dépôts suivants ; la résonance agit sur le contraste des changements de largeur et de charge des prochains chants. Les traits déjà posés ne sont pas réécrits.
- L’export garde un grand côté de 4 096 px. La carte portrait, haïku inclus, mesure 2 304 × 4 741 px. L’export montre l’état courant : on peut emporter une œuvre encore humide ou attendre son séchage.

## API locale

```ts
engine.beginSignature(seed);
engine.wetBrush({x: 0.35, y: 0.45}, 0.7, 0.5);
engine.wetBrush({x: 0.65, y: 0.5}, 0.7, 0.5);
engine.liftWaterBrush();

// Dans le callback appelé APRÈS le démarrage réussi de la vraie source audio :
engine.startSoundStain(analysis, bird, {x: 0.5, y: 0.48}, eventSeed,
  0.7, layer, sound.elapsed, onFirstPigment);
```

`WetPaper` garde une approximation bornée de l’eau posée afin de choisir les trajectoires capillaires et de tester le point de dépôt. Ce guide CPU ne dessine aucun pigment. La simulation et le rendu sont bien ceux du moteur GPU réutilisé. Les variations microscopiques de bord du champ GPU peuvent différer du guide de ciblage.

`SoundStain` est une nouvelle grammaire locale ; elle ne prétend pas être une API Pigment Drift. À chaque pas elle produit au maximum 12 segments, auxquels peuvent s’ajouter 4 segments d’eau manuels. Au plus quatre gouttes d’eau localisées créent les backruns. Les limites réelles du moteur sont respectées.

La graine reproduit les choix de forme à eau, paramètres, ordre de dépôts et pas de simulation identiques. Une session dessinée à la main ne peut pas être reproduite par la seule graine : sa carte d’eau et ses timings font partie de l’entrée. Les différences de virgule flottante entre GPU restent possibles.

## Validation et limites

Les tests couvrent le dépôt d’eau sans pigment, le refus d’un sample sur papier sec, le démarrage sonore préalable, le silence, l’arrêt, la décroissance de l’eau, le guidage par les zones humides, les graines et les budgets GPU. Les contrôles d’interface sont vérifiés en vue portrait de 390 × 844 et sur grand écran.

La machine de contrôle du navigateur ne fournit pas WebGL2. Les images de validation sont donc calculées par les vrais shaders et les vrais appels GL TypeScript enregistrés, puis rejoués sur Mesa/EGL. Ce n’est pas un autre moteur de dessin. Les captures et mesures sont conservées dans `docs/water-studies/` et `docs/water-validation-egl.json`.

La fluidité sur un téléphone physique reste à confirmer. Le budget QHD demande davantage de mémoire GPU que la V5 ; aucune promesse de 60 images/s n’est faite. L’application affiche une erreur explicite si WebGL2 ou les formats flottants nécessaires sont indisponibles.

### Résultats de la V6

69 tests passent, ainsi que le contrôle TypeScript. Les cinq graines 62001 à 62005 produisent des rendus distincts, inspectés sur la planche `water-studies/cinq-empreintes.jpg` et sur le détail d’export. Le rejeu indépendant de 62004 est identique pixel pour pixel sur Mesa/EGL, y compris en 2 304 × 4 096. Le PNG final a été encodé par la fonction réelle de carte dans le navigateur : 2 304 × 4 741, haïku et dédicace inclus. Le fichier JSON joint conserve les empreintes SHA-256, le moteur utilisé et les limites de vérification.

L’examen des premières versions a conduit à supprimer les bandes de lavis trop régulières, réduire le grain uniforme, élargir les migrations selon les zones humides et courber les nervures d’encre. La matière reste une approximation procédurale ; ces rendus ne constituent pas un scan de vraie aquarelle.

## V6.1 — circulation dans toute la tache et eau plus lisible

Le dépôt organise maintenant un lavis pâle dans tout le bassin humide relié au sample. Un graphe borné, construit à partir des vrais gestes d’eau, ordonne les trajets par distance capillaire. La vague de couleur avance avec les trames effectivement audibles du sample et garde des accents plus denses près du dépôt. Aucun pigment supplémentaire n’est programmé dans le silence ou après la fin de la source.

Les nouveaux segments `wetOnly` sont une extension locale identifiée dans le patch : ils teintent uniquement l’eau déjà présente, sans la réhumidifier. Le shader vérifie aussi la continuité réelle du film d’eau pour éviter de franchir une coupure sèche. L’advection, les mélanges et le séchage restent calculés par Paint Studio.

L’assombrissement de l’eau claire est renforcé : il vient toujours du vrai canal d’humidité GPU. La perte linéaire d’eau de Paint Studio est désactivée dans ce mode afin de respecter l’évaporation exponentielle utilisée par le guide. Le papier redevient clair en séchant. Les modes antérieurs conservent leur réglage d’évaporation amont.

La validation ciblée utilise une longue tache avec un bras et une seconde flaque indépendante. Captures et mesures : `circulation-studies/` et `circulation-validation-egl.json`. Les deux nouveaux tests vérifient le parcours jusqu’aux extrémités avec un sample court et le respect des zones sèches ; 71 tests passent, ainsi que TypeScript.

Sur ce cas de contrôle, 98,6 % des pixels de la tache connectée suffisamment mouillés sont teintés, contre 0 % dans la flaque indépendante. Le contraste moyen de l’eau dans ce masque est d’environ 24 niveaux RGB par rapport à la feuille vierge. Ces mesures décrivent ce scénario, avec les seuils enregistrés dans le JSON, et ne sont pas une garantie pour toutes les formes possibles. Les captures montrent l’arrivée des pigments, la migration puis l’état sec.
