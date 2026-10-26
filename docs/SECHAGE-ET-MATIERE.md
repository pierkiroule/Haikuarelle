# V7 — la matière au séchage

Le lavis garde sa teinte et présente désormais plusieurs épaisseurs optiques. Certaines zones deviennent plus denses ; d’autres se délavent. Les détails émergent progressivement à mesure que baisse l’humidité réelle du champ GPU.

## Quatre alphas et deux liserés

| Masque | Fonction |
| --- | --- |
| Densité large | Variations douces et irrégulières à l’intérieur d’un même pigment. |
| Auréoles internes | Arcs discontinus associés aux délavages, regroupés dans certaines zones. |
| Délavages | Réserves claires et fleurs d’eau irrégulières. |
| Sédiments | Poches de pigment minéral à une échelle intermédiaire. |

Les quatre alphas partagent des champs déformés cohérents : un délavage et son auréole ont une structure commune. Leur activité est localisée afin d’éviter une texture de camouflage sur toute la peinture. Les fibres et la granulation fine restent liées au relief du papier, rendu en pleine résolution.

Un liseré extérieur et quelques retraits intérieurs sont calculés à partir du vrai champ de pigment. Ils suivent le contour de la tache, au lieu de tracer un cercle décoratif. Les alpha-masques ne peuvent pas peindre le papier vierge.

Le réglage **Grain & relief** dose cette matière. Réhumidifier une zone réduit temporairement l’apparence sèche ; les détails reviennent lorsque l’eau se retire.

## Éclaboussures

Une grammaire déterministe prévoit parfois un seul groupe de petites gouttes hors du bassin humide. Le groupe peut être absent. Les dépôts sont limités à sept, distribués près d’un bord et lancés uniquement pendant les trames audibles. Ils emploient le pigment du sample et les vrais segments de Paint Studio. Le silence et la fin de la source ne créent aucun nouveau pigment.

## Technique

`DRYING_MASKS` est une extension locale des shaders Paint Studio. L’atlas RGBA8 est calculé sur le GPU au quart de la résolution linéaire de l’affichage puis mis en cache. Les structures sont fixées aux coordonnées du papier et à la graine. L’humidité pilote leur révélation ; aucun bruit animé ne les fait scintiller. Le rendu 4K recalcule les masques à la résolution adaptée à l’export. Le surcoût mémoire de cet atlas est d’environ 2,4 Mo pour une peinture de 2 304 × 4 096 px.

`Look.dryingDetail` est un paramètre ajouté par HAÏKUARELLE. Sa valeur zéro permet une comparaison du même pigment sans les nouveaux masques. La façade et la grammaire réutilisent toujours la simulation de fluide du moteur audité ; ces détails sont une interprétation picturale, pas un modèle spectral de séchage.

La planification des gouttelettes est isolée dans `src/birds/splashes.ts`. Son aléatoire est séparé de la trajectoire du pinceau et de l’encre fine. Les limites de 12 segments sonores et 4 segments d’eau par pas restent respectées.

## Validation

73 tests passent, ainsi que TypeScript. Les vrais appels GL et shaders sont rejoués sur Mesa/EGL pour trois pigments et trois graines. Les comparaisons utilisent exactement le même champ de pigment : seul le rendu des détails est activé ou désactivé. Les captures 4K ont été inspectées visuellement.

- Le papier vierge est identique pixel pour pixel avec et sans les masques.
- Les changements sont nettement plus présents à sec que dans la peinture fraîche.
- Deux captures successives de la peinture sèche sont identiques pixel pour pixel.
- Les gouttes sont rares, bornées, reproductibles et placées hors de l’eau préparée.

Les captures comparatives sont dans `drying-studies/`, les exemples alpha transparents dans `public/textures/` et les mesures dans `drying-validation-egl.json`. Le navigateur de contrôle ne dispose pas de WebGL2 ; la fluidité sur téléphone physique reste non mesurée.

## Refaire une validation native

`scripts/render-offscreen.ts` possède un mode `drying`, utilisant les véritables analyses des trois MP3. Il enregistre les appels du moteur ; `scripts/replay-egl.py` les rejoue sur Mesa/EGL. Le mode capture aussi l’atlas de quatre alphas avant sa libération. Aucun autre moteur de peinture ni image générative n’intervient dans ces rendus.
