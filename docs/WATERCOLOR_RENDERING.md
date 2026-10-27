# Atelier individuel et rendu aquarelle

L’application propose un seul rituel : rencontre avec une plume, création sur toute la feuille A4, séchage volontaire de 12 secondes, révélation et placement du titre et des trois vers, puis partage ou téléchargement. L’eau reste disponible jusqu’au séchage choisi. L’œuvre ne disparaît pas automatiquement. Les paramètres historiques `?atelier` et `?exposition` ouvrent aussi cet atelier ; `?validation` et `?mp3` restent des outils spécialisés.

Les contrôleurs de relais, les couches temporelles, la dégradation par âge et les réponses sonores des anciens visiteurs ont été supprimés. Le chant complet de l’oiseau accompagne les pigments ; le geste d’eau garde son chant immergé. La simulation utilise le profil de qualité individuel complet, sans budget réservé aux cohortes.

## Correctifs visuels conservés

- Reconstruction cubique positive des pigments, marbrures et masques de séchage pour éviter les raccords en mosaïque. À la résolution native, les dépôts fins sont préservés.
- Bruits de matière sur un support simplex tourné, sans support carré apparent.
- Géométrie indépendante pour le contour de l’eau : grandes ondulations plutôt que les petites dentelures du pinceau pigmentaire. Le voile humide utilise une épaisseur optique continue et transparente.
- Empreinte du papier atténuée dans la peinture fraîche, puis révélée progressivement lorsque l’eau se retire. Les textures sèches et la couleur moyenne sont conservées, sans flou global.
- Export PNG de toute la feuille A4, avec le titre et les trois vers placés sur la peinture et la signature •°○.

## Contrôles de rendu

Les scripts `check-material-seams.py`, `check-water-shore.py`, `check-wet-paper-imprint.py` et `check-paper-grain.py` compilent les vrais shaders pour contrôler respectivement les raccords de cellules, le contour d’un dépôt d’eau, l’empreinte du papier humide/sec et le relief du coton. `check-plumage-render.py` et `check-breath-transport.py` vérifient les couleurs et le transport eau/pigments dans Chromium.

Les mesures portent sur des scènes déterminées, parfois avec un champ réduit et un GPU logiciel. Les performances sur téléphone physique restent à mesurer. L’export haute définition ne reconstruit pas des détails absents du champ physique.

## Toile immersive

L’entrée dans l’atelier ouvre automatiquement une présentation immersive dans la page : feuille A4 entière et centrée, palette flottante repliée et commandes de sortie/actions en haut. Un outil ouvre ses réglages ; reprendre le geste les referme. Le panneau flotte au-dessus de la palette sans redimensionner la feuille ni recréer le moteur. Échap ou la croix permettent de revenir à la présentation classique ; « Toile immersive » permet d’y retourner. Les commandes de partage réapparaissent après le séchage. Le plein écran natif reste facultatif via « Grand écran » ou la touche F, avec repli dans la page si le navigateur ne le propose pas.

`scripts/check-immersive-atelier.py` vérifie le centrage, les proportions, l’occupation de l’espace, la stabilité de la feuille pendant les réglages, le maintien du même canvas et la sortie au clavier/bouton sur ordinateur et mobiles portrait/paysage.

## Haïku résonant placé sur l’œuvre

Le choix d’une plume ouvre directement la création, avec un aperçu sonore. Aucun titre ni haïku initial ne réserve de place sur la feuille : l’A4 entière est peignable. Après le séchage, « Révéler le haïku résonant » lit les pixels de la peinture et compose un titre contenant le nom de l’oiseau et trois vers. Une grammaire locale croise l’univers de l’oiseau avec les îlots, la complexité des contours, les espaces blancs, la verticalité et la densité de matière. Il s’agit d’une interprétation poétique déterministe, sans service distant.

Le titre et le bloc de trois lignes se déplacent indépendamment au toucher, à la souris ou avec les flèches du clavier (Maj pour un pas plus grand). Deux curseurs règlent séparément la taille du titre et celle des vers. Le titre utilise la même police Georgia que les vers, en gras italique. Le placement est limité à la feuille et préserve la zone de signature. « Valider le placement » active le partage et le téléchargement ; « Modifier le placement » permet de revenir à l’édition. Reprendre la peinture retire le haïku afin de produire une nouvelle lecture après séchage.

Le PNG conserve la feuille entière, les coordonnées et les tailles relatives des deux blocs, et la signature rouge •°○. Aucun nom d’utilisateur ou dédicace n’est ajouté. L’interface indique que la participation n’attribue pas de propriété exclusive ; ce texte d’interface ne remplace pas des conditions juridiques de diffusion.

`scripts/check-resonant-haiku.py` vérifie le parcours avec un vrai chant, le déplacement, la taille, la confirmation et le PNG signé sur ordinateur et mobile. Les tests unitaires contrôlent aussi la dépendance des vers aux familles de formes et le dessin du texte à ses coordonnées exportées.
