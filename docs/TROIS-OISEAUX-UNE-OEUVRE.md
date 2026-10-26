# V11 — trois oiseaux, une œuvre

Le parcours comporte trois temps : choisir un trio, peindre, finaliser et laisser venir les mots.

## Choisir

Sept oiseaux sont proposés avec leurs plumages. Il faut en retenir exactement trois, sans doublon. Le trio devient la palette de peinture ; les chants démarrent uniquement au contact de la feuille. Avant le premier geste, il est possible de modifier le trio. Une nouvelle œuvre ramène au choix des oiseaux.

## Peindre

Les trois pads changent de brosse. Eau et pigments se posent au même geste ; le son et la vitesse conservent leur influence sur la trace. Aucun titre ni poème n’est affiché pendant cette phase. Les réglages de matière, dont Netteté et Seuil des détails, sont conservés.

## Finaliser

**Finaliser mon œuvre** exige au moins un vrai dépôt audible. La commande coupe le chant et les nouveaux dépôts, reprend un séchage éventuellement suspendu et bloque les nouveaux coups de pinceau. Le fluide continue ses vrais pas de simulation. Quand le moteur annonce la fin du séchage, un titre court apparaît au-dessus de la feuille, puis les trois vers émergent en dessous. L’option de réduction des animations est respectée.

Reprendre le pinceau, pendant ou après cette étape, masque les mots et permet de continuer la même peinture. Une fin de séchage arrivée ensuite ne peut pas révéler un ancien poème. Effacer tout remet à zéro la feuille et ses mots, en conservant le trio.

## Résonance avec la peinture

`artworkPoetry.ts` analyse une grille bornée du vrai rendu GPU sec : couleurs dominantes et secondaires, surface peinte, blancs, centre de gravité, orientation et îlots connectés. Les fibres du papier et les petits éclats isolés ne sont pas assimilés à des régions peintes. La palette supposée d’un oiseau inutilisé ne décide pas des couleurs du texte.

Une grammaire poétique locale choisit un titre de quelques mots et un haïku libre en trois vers. Les rencontres de couleurs influencent la deuxième ligne ; les blancs, le placement et les îlots orientent les images poétiques. La graine et les gestes déterminent les variantes. Aucun service d’IA, aucune clé, aucun envoi de l’image et aucune interprétation psychologique. La métrique traditionnelle 5/7/5 n’est pas garantie pour toutes les variantes.

## Export

Le PNG inclut le titre, la peinture entière à sa définition native d’export et les trois vers, avec une dédicace facultative. Portrait : peinture de 2 304 × 4 096, carte complète de 2 304 × 5 110. Le bitmap est libéré après encodage, y compris en cas d’erreur.

## Vérification

98 tests passent. Les nouveaux tests couvrent le choix de trois oiseaux distincts, l’absence de lecture au choix, l’attente d’un vrai dépôt, le blocage des gestes pendant la finalisation, la révélation après séchage, sa position au-dessus et au-dessous de la toile, la reprise, l’effacement et l’export. Le module de lecture est vérifié pour les couleurs réelles, les blancs, les îlots et le placement, ainsi que pour la reproductibilité. Un filet de pigment entre deux points de la grille déclenche une lecture fine de secours plutôt qu’un faux diagnostic de feuille vide. Cinq peintures GPU réelles de V9/V10 servent aussi à vérifier la diversité des titres et les résonances de couleur (`finalization-validation.json`).

L’export Canvas 2D réel est exécuté dans le navigateur à partir d’une aquarelle du véritable moteur, vérifiée lors de la V10. Le PNG téléchargé est relu et sa taille 2 304 × 5 110 contrôlée. Les exemples sont dans `finalization-studies/`. L’interface est inspectée à 390 px et sur grand écran. Le navigateur de contrôle ne dispose pas de WebGL2 ; le cycle React est donc vérifié par tests d’intégration avec le moteur remplacé, et la simulation GPU par les rendus natifs précédents. Aucun shader ni algorithme de transport n’a changé dans cette version. Les performances sur téléphone physique restent à confirmer.
