# Atelier individuel et rendu aquarelle

L’application propose un seul rituel : rencontre avec une plume, création sur toute la feuille A4, séchage volontaire de 12 secondes, révélation du titre et des trois vers à leurs places fixes, composition de la peinture, puis partage ou téléchargement. L’eau reste disponible jusqu’au séchage choisi. L’œuvre ne disparaît pas automatiquement. Les paramètres historiques `?atelier` et `?exposition` ouvrent aussi cet atelier ; `?validation` et `?mp3` restent des outils spécialisés.

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

Le choix d’une plume ouvre directement la création, avec un aperçu sonore. Aucun titre ni haïku initial ne réserve de place sur la feuille : l’A4 entière est peignable. Après le séchage, « Révéler le haïku résonant » lit les pixels de la peinture et compose un titre contenant le nom de l’oiseau et trois vers. Une grammaire locale croise l’univers de l’oiseau avec les îlots, la complexité des contours, les espaces blancs, la verticalité et la densité de matière. Il s’agit d’une interprétation poétique déterministe, sans service distant. Le titre et les deux derniers vers sont choisis ensemble parmi 21 petites strophes liées : le motif du titre revient dans le deuxième vers, le troisième le prolonge par une image et une rime. L’ouverture sensorielle s’appuie sur l’habitat, le plumage ou les gestes de chaque oiseau (45 ouvertures pour les 15 espèces du catalogue). Les sept familles de formes restent déterminantes. Certaines images sont oniriques ou surréalistes ; ce sont des poèmes libres en trois lignes, sans prétention de métrique stricte 5/7/5.

Le titre est fixé au centre en haut et les trois vers au centre en bas. Tous utilisent Patrick Hand, une écriture manuscrite lisible embarquée dans `public/fonts` avec sa licence SIL OFL. Aucun réglage de police, couleur, alignement ou position de texte n’est proposé. Les tailles s’ajustent automatiquement à la largeur des lignes pour éviter les retours à la ligne et les débordements. La zone basse conserve une marge pour la signature. Seule la peinture reste déplaçable et redimensionnable. « Valider la composition » active le partage ; « Déplacer la peinture » permet de rouvrir son placement. Reprendre la peinture retire les textes afin de produire une nouvelle lecture après séchage.

Le PNG conserve la feuille entière, le titre et les trois vers manuscrits centrés à leurs places fixes, la transformation de la peinture et la signature rouge •°○. Aucun nom d’utilisateur ou dédicace n’est ajouté. L’interface indique que la participation n’attribue pas de propriété exclusive ; ce texte d’interface ne remplace pas des conditions juridiques de diffusion.

`scripts/check-resonant-haiku.py` vérifie le parcours avec un vrai chant, le déplacement et la taille de la peinture, les textes manuscrits fixes, la confirmation et le PNG signé sur ordinateur et mobile. Les tests unitaires contrôlent aussi la dépendance des vers aux familles de formes, le centrage et le calcul des tailles pour l’export.


### Séchage et composition de la peinture

Le séchage affiche un halo bleu pulsant autour de la feuille et une barre en bas avec soleil tournant. La progression suit les ticks physiques, sans minuterie cosmétique indépendante ; la durée simulée reste de 12 secondes. Le halo et le soleil restent fixes si la réduction des animations est demandée. Les anciennes particules de séchage sont retirées.

Après révélation du haïku, la peinture entière peut être réduite entre 25 et 100 % puis déplacée au toucher, à la souris ou au clavier. Ses proportions restent intactes et elle reste dans le papier. Le bouton de recentrage restitue la taille originale. Titre, vers et signature restent indépendants. Le PNG applique la même transformation à l’image à pleine résolution ; reprendre la plume restitue la composition originale sans altérer la simulation des pigments. Les observateurs de taille des textes ne sont plus recréés à chaque déplacement.

### Mise en page simplifiée

L’inspecteur ne contient que la taille de la peinture (25 à 100 %) et son recentrage à la taille originale. Glisser la peinture ou utiliser les flèches la déplace ; le titre, les trois vers et la signature restent fixes. La mise en page et l’export utilisent la même règle de centrage, de taille automatique et d’interligne. Le PNG attend le chargement de Patrick Hand avant de mesurer et dessiner le texte ; sa position ne dépend pas de la transformation de la peinture. Les formats A4, portrait allongé et paysage gardent le titre en haut et les vers en bas.


### Pie : même fonctionnement aquarelle

La Pie utilise les mêmes lavis reliés au geste, dépôts sur papier sec et fronts de diffusion humides que les autres oiseaux. Les branches spécifiques qui la limitaient à des gouttelettes sont retirées du dépôt sonore et du pinceau gestuel. Son mode multicolore associe noir, ardoise bleutée et gris perle ; ses huit couleurs de plumage restent sélectionnables séparément. Le chant réel, sa lecture intégrale, la réactivité à son énergie et l’arrêt des pigments dans les silences sont conservés.

### Inkbird : un vol autonome qui dessine

Inkbird se trouve à droite de Souffle. Un tap fixe le point de départ et lance le chant entier de l’oiseau choisi. Le doigt ne contrôle plus la trajectoire. Un simple point de 5 px suit le véritable tracé en temps réel et disparaît à la fin ou à l’interruption du chant. Cette animation locale n’entraîne pas de rendu React global à chaque frame et n’est pas incluse dans le PNG.

Le slider « Étendue du vol Inkbird » règle la surface parcourue, de 10 à 86 % du petit côté du papier en diamètre. Il ne modifie jamais la pression du trait, qui dépend uniquement du chant. La trajectoire est autonome, déterministe et irrégulière : l’énergie module sa vitesse, la luminosité spectrale infléchit ses virages et les attaques provoquent des écarts et des projections de cinq micro-gouttes. Le retour vers le territoire est progressif, les bords du papier sont respectés. L’oiseau poursuit son vol dans les silences mais l’encre est alors levée. Le coût est borné à deux traits et six segments de pigments par tick. La pression suit l’énergie, ses écarts et les attaques, avec des montées rapides et un relâchement plus lent. Certaines attaques dédoublent une fibre sèche ; les chutes sonores peuvent rompre brièvement le tracé. Les projections ont des tailles variées.

L’opacité et la couleur restent réglables, exclusivement dans le nuancier du plumage de l’oiseau. Le mode Tout le plumage change de couleur par phrases sur certaines attaques, sans clignotement chromatique à chaque frame ; une couleur séparée reste fixe. Aucune couleur libre n’est proposée. Le cœur calligraphique est dessiné par FineInkRenderer et conserve une couleur sRGB par trait. Ses bords peuvent légèrement diffuser dans l’eau existante ; les slots du nuancier de plumage conservent les pigments déjà déposés sans les recolorer. Le PNG conserve les tracés et projections, sans le point de guidage. Échap et l’action d’interruption arrêtent explicitement le sample.

Les tests vérifient l’indépendance du doigt, la surface de vol sans épaississement du trait, les silences, les bords du papier, la dynamique et les couleurs. Le contrôle navigateur vérifie le point visible, les couleurs du plumage et l’export signé sur bureau et petit mobile avec un champ GPU logiciel réduit.
