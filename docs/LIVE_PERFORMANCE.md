# Fluidité en atelier : captures, rendu et budgets

## Causes corrigées

- Le film réalisait jusqu'à 12,5 captures par seconde, avec un grand côté de
  1 600/1 920 pixels. Chaque capture créait puis supprimait un framebuffer et tous
  les tampons procéduraux (papier, flux, masques de séchage). Les trois précalculs
  étaient donc relancés à chaque prise, même pour la même feuille.
- La boucle affichait une image à chaque RAF, même quand aucun pas de simulation
  à 30 Hz n'avait eu lieu. Les détails procéduraux et l'encre étaient redessinés
  sans changement.
- Les indices RAM/CPU pouvaient sélectionner 5,76 millions de cellules humides et
  un affichage de 8,4 millions de pixels. Ils ne prouvent pas la présence d'un GPU
  dédié, notamment sur un PC à graphique intégré.

## Fonctionnement

La capture du processus réutilise désormais une seule cible et ses textures
statiques. Un changement de taille ou de feuille libère ce cache. Les exports HD
ponctuels conservent leurs cibles indépendantes, et la destruction libère tout.
Les textures sont recalculées pour une nouvelle feuille. La visibilité de l'eau
reste un paramètre du rendu, pas une modification de son état physique.

Les profils fixes de départ privilégient la réactivité (voir README). La géométrie
logique et le pas physique de 30 Hz sont conservés. Une observation de 24 frames
lentes réduit le budget d'affichage de 28 %, avec un délai de 60 frames avant une
nouvelle réduction et un plancher de 36 %. Les pauses longues sont ignorées. Cela
ne redimensionne jamais le champ humide, ne modifie pas la composition et ne touche
pas à la définition des exports. Un rendu graphique logiciel identifiable via
l'extension de diagnostic WebGL reçoit un plafond de 300 000 cellules, une échelle
maximale de 0,4 et un affichage de 350 000 pixels. L'identité du GPU n'est ni conservée
ni transmise. En l'absence de cette extension, aucun diagnostic logiciel n'est inventé.

Les images du film utilisent un grand côté de 768/1080/1440/1600 pixels selon le
profil (640 pour un rendu logiciel), éventuellement réduit avec l'affichage. Les
captures coûteuses s'espacent suivant le temps de lecture GPU mesuré (jusqu'à
2 secondes de temps simulé). Les étapes forcées initiale, annulation et finale
restent disponibles. Le lecteur interpole toujours les captures et finit sur le
PNG HD composé. La toile JPEG n'est redimensionnée que si ses dimensions changent.

Le grand côté du PNG reste 4 096 pixels et les atlas de détail restent indépendants
du champ humide. Un champ plus léger ne peut toutefois pas restituer des détails
physiques qui n'ont pas été simulés : il s'agit d'un compromis explicite entre coût
et finesse, pas d'une promesse de rendu identique entre tous les profils.

## Mesures et vérifications

Premier essai comparatif isolé, même champ réduit et mêmes prises de 512 pixels
sur SwiftShader : moyenne de 247 ms avant contre 108 ms après, sur quatre captures
répétées. Les trois précalculs passent de quatre exécutions chacun à zéro après la
première capture ; les pixels de la capture réutilisée et de la capture indépendante
sont identiques. Ces temps de GPU logiciel ne prédisent pas les FPS d'un vrai PC ou
d'un téléphone. Des exécutions concurrentes donnent des temps différents.

- `scripts/check-live-performance.py` : précalculs évités, cache renouvelé pour une
  nouvelle feuille, état pigment/eau inchangé, rendu omis si aucun tick n'avance,
  redimensionnement de l'affichage sans modification du champ humide, erreurs GL.
- `tests/live-budget.test.ts` : lenteur durable, pause, limites et délai entre réductions.
- `tests/process-recording.test.ts` : captures lentes espacées, étapes forcées,
  annulation et limites de mémoire.
- `scripts/check-film-water.py`, `scripts/check-undo.py` : eau masquée uniquement
  dans le film, état physique préservé, annulation exacte et historique borné.
- `scripts/check-poetic-ui.py` : parcours réel en Chromium, avec petit champ sur
  GPU logiciel : rencontre, peinture, séchage, révélation, lecture agrandie et composition.

Une validation matérielle reste nécessaire sur le PC concerné et sur des appareils
Android/iOS. Le code ne garantit pas 60 FPS sur un navigateur sans accélération GPU.
