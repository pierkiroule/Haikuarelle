# Exposition collective

La route `/` ouvre l’installation. `/?atelier` conserve l’atelier individuel et son séchage volontaire. `/?validation` et `/?mp3` restent disponibles.

## Parcours

La toile A4 reste montée pendant le choix, le haïku et la création. La plume anonyme révèle un oiseau et ses mots. « Rejoindre l’œuvre » donne accès à l’eau, à toutes les couleurs de son plumage et au souffle. « Passer la plume » arrête les dépôts, atténue le chant et rend les plumes disponibles sans recréer le moteur ni effacer la feuille. Après 45 secondes sans geste, une invitation propose de poursuivre ; sans réponse pendant 12 secondes, le relais se fait automatiquement. Ces durées sont centralisées dans `src/exhibition/lifecycle.ts`.

« Cueillir un instant » encode les pixels et les mots présents au moment du clic, sans pause. L’image A4 inclut les bandes réservées et la signature, sans palette. Le grand côté vise 4096 pixels, dans la limite de texture du matériel. Aucun hébergement ni transfert QR n’est installé.

## Cycle matériel et compromis de résolution

Une horloge monotone mesure le temps réel, y compris lorsque l’onglet est caché. L’œuvre n’est pas conservée après fermeture/rechargement ou perte du contexte GPU.

Le cycle initial dure 60 secondes : eau présente puis retirée progressivement vers la fin des 20 premières secondes, pigments secs jusqu’à 40 secondes, érosion irrégulière jusqu’à 60 secondes. La réhumidification remet la matière visible en mouvement, mais n’altère pas son époque de dépôt.

Les dépôts sont regroupés en cohortes de **trois secondes**, datées au début de leur intervalle. Leur durée est donc de **57 à 60 secondes**, jamais prolongée par de nouveaux apports. Ce compromis explicite évite une texture haute définition par geste. Les couches contiennent les masses d’absorption optique et leur propre eau ; elles sont advectées dans un champ d’eau commun puis additionnées pour le rendu. Le souffle transfère eau et pigments de toutes les couches avec les mêmes flux. Les réserves sèches restent des barrières aux courants ordinaires. L’érosion est modulée dans l’espace, sans motif carré, et chaque cohorte est retirée à son échéance.

Au plus 20 cohortes actives, un tampon partagé et un petit pool recyclé. Le contrôle prolongé atteint 21 textures temporelles allouées, sans croissance. Le champ de simulation est plafonné à environ 480 000 cellules sur pointeur tactile, 900 000 sur pointeur fin, indépendamment de la taille du PNG. C’est un profil spécifique à l’exposition, plus économique que l’atelier individuel pour financer les âges superposés. Le rendu et les textures procédurales restent à la résolution d’affichage ; l’export ne reconstruit pas des détails physiques absents du champ. Aucun débit d’images sur téléphone physique n’a été mesuré.

## Paysage sonore

Les vrais MP3 locaux sont conservés. Une source principale et une seule réponse sont possibles, avec des gains plafonnés, des fondus et une position stéréo liée au geste ou au dépôt mémorisé. Les réponses ne bouclent pas : elles reprennent un fragment à partir de la première activité, pour 3,5 secondes au maximum, dans les pauses du premier plan. Le souvenir s’atténue avec son âge et ne démarre pas s’il pourrait dépasser la fin de sa trace. La mémoire est limitée à 32 dépôts, le silence revient après leur expiration.

L’énergie, les attaques et la variation spectrale des chants analysés excitent l’eau existante. Les fondus audibles pondèrent cette influence. Les réponses n’ajoutent ni eau ni pigment. Les deux voix utilisent des flux couplés qui transportent ensemble l’eau et ses pigments, avec un plafond conservatif par face ; leurs échanges restent limités aux cellules reliées par un film humide. La recherche de bassin connecté est mise en cache pendant 250 ms ; le guide d’eau est resynchronisé depuis le GPU environ toutes les 600 ms. Les forces sont localisées, atténuées avec la distance et plafonnées. Aucun microphone, enregistrement ou analyse de l’ambiance.

Les sons nécessitent un geste utilisateur. Le bouton de silence coupe les voix ; les dépôts de peinture sonore nécessitent de réactiver les chants. Eau et souffle restent disponibles. En arrière-plan, les voix sont arrêtées ; le vieillissement matériel rattrape le temps écoulé au retour.

## Vérification

- Tests unitaires : vieillissement, chevauchement sans rajeunissement, retour d’arrière-plan, bornes mémoire, réponses et pauses, localisation dans les bassins.
- `scripts/check-exhibition-life.py` : vrai WebGL, ancien pigment remouillé sans rajeunissement, survie des dépôts récents après disparition des anciens, retour complet au blanc et réutilisation des textures pendant 100 époques.
- `scripts/check-exhibition-water.py` : deux voix simultanées modifient réellement l’eau sans ajout de matière, conservent les masses et la concentration, laissent stables une flaque séparée et les pigments secs.
- `scripts/check-exhibition-flow.py` : vrais MP3 et parcours tactile/clavier, choix de deux oiseaux, conservation du canvas, capture PNG A4, avertissement et relais après inactivité, absence de débordement sur 1200 × 1000 et 390 × 844.

Ces contrôles utilisent Chromium et son GPU logiciel avec un champ réduit. Ils ne remplacent pas une écoute dans le lieu ni une mesure sur la borne finale. Une session collective est locale à un navigateur ; aucune synchronisation entre appareils n’est ajoutée.

## Reconstruction de matière sans carrelage

Les anciens atlas de mouvement/marbrures, calculés au quart de la définition, étaient agrandis par interpolation bilinéaire. Les changements de pente aux bords des texels pouvaient former des raccords en mosaïque. Le pinceau et l’érosion employaient aussi des bruits de gradient sur un support carré.

Le rendu matériel utilise maintenant une reconstruction cubique positive pour les pigments, les marbrures et les masques de séchage. Elle conserve une surface continue, sans oscillations négatives ni flou CSS de la toile. Le bruit de matière et l’érosion utilisent le même support simplex tourné que le coton, avec des variantes de domaine ; le chemin historique reste disponible en mode de rendu non matériel. La résolution du champ d’exposition passe à environ 480 000 cellules tactiles et 900 000 cellules sur pointeur fin, avec la même borne de couches temporelles. Cela augmente leur coût mémoire d’environ 40 à 50 %.

`scripts/check-material-seams.py` compile la fonction réellement utilisée par le rendu. Il rejette les cassures entre cellules lors de l’agrandissement d’un atlas et vérifie que le contraste subsiste. Le shader précédent échoue à ce contrôle ; le nouveau passe. Le contrôle du papier vérifie séparément l’absence du relief en quads 2 × 2.
