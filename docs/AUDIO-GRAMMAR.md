# Grammaire de transduction — V2

L’objectif est une œuvre autonome, structurée et contemplative. Les données sonores ne sont pas affichées comme un oscilloscope : elles modulent des gestes regroupés autour d’une même structure picturale.

## Chaîne locale

Fichier complet → décodage Web Audio à 16 kHz → fenêtre de 15 secondes → analyse dans un Worker → partition de gestes → champ GPU d’aquarelle → traits d’encre → séchage → PNG.

L’analyse n’utilise ni transcription, ni modèle d’IA, ni service externe. L’exemple MP3 est un enregistrement procédural original fourni avec le projet. Le fichier importé est conservé en mémoire pour sélectionner un extrait et le préécouter ; il n’est pas envoyé au serveur.

## Mesures et correspondances

| Dimension sonore | Mesure | Geste et effet |
| --- | --- | --- |
| Intensité | RMS par fenêtre, compression douce et normalisation relative conservant la différence de niveau absolu | Rayon, charge et densité des lavis. Un son faible reste plus aérien. |
| Graves | Part de puissance sous 250 Hz, résolution FFT de 15,625 Hz | Plus de pigment principal, lavis plus larges et ancrage de la composition. |
| Médiums | Part de puissance de 250 à 1 800 Hz | Contribution à l’équilibre des bandes et à la brillance ; pas de geste arbitraire supplémentaire. |
| Aigus | Part de puissance au-dessus de 1 800 Hz jusqu’à la fréquence de Nyquist | Finesse et portée des nervures, épaisseur et présence de l’encre. |
| Brillance | Centroïde spectral comprimé logarithmiquement | Courbure et orientation des grands axes ; équilibre des deux familles de pigments. |
| Changements de spectre | Flux spectral positif | Vitesse locale, rencontres de lavis et réhumidifications ponctuelles. |
| Attaques | Pics de flux, seuil et période réfractaire de 240 ms, puis sélection des plus marquantes | Dépôts courts, petites ramifications et auréoles. Leur nombre est borné. Aucun tempo musical exact n’est supposé. |
| Espace stéréo | Rapport de l’énergie latérale et déséquilibre gauche/droite | Distance du lavis secondaire, légères déviations et longueur des traits. |
| Silences | Seuil d’activité à la fois absolu et relatif au niveau de l’extrait | Suppression des gestes correspondants. Les bords voisins peuvent encore diffuser naturellement. Un extrait entièrement silencieux laisse la feuille blanche. |

Les puissances des deux canaux sont additionnées après leurs FFT respectives. Une stéréo en opposition de phase conserve donc son énergie, au lieu de disparaître dans une sommation mono.

## Syntaxe picturale

1. Définir six points d’appui à partir des grandes variations du son.
2. Construire un axe principal souple, puis un axe secondaire moins présent.
3. Diviser la fenêtre en 24 phrases courtes. Humidifier, puis déposer des lavis sur les seules phrases actives.
4. Faire se rencontrer certains lavis ; ajouter un troisième pigment uniquement pour des accents limités.
5. Choisir les attaques significatives pour quelques dépôts, fleurs d’eau et ramifications.
6. Déployer les traits d’encre sur ces mêmes points d’appui. Ils restent fins, incomplets et sensibles au grain du papier.
7. Arrêter les gestes d’eau avant la fin, terminer les lignes, puis stabiliser l’œuvre.

La palette conserve trois pigments cohérents. Les fréquences ne déclenchent pas de couleurs arc-en-ciel. La complexité borne les accents ; les grandes masses gardent une hiérarchie et les marges restent disponibles. Un silence est une absence de geste, pas un pigment blanc ajouté.

## Encre

`FineInkRenderer` dessine des rubans de triangles texturés dans le framebuffer de peinture. Leur épaisseur varie avec la pression du geste, leur bord accroche un grain procédural et leur opacité comporte de petites interruptions. Une révélation progressive suit la longueur du tracé.

Il s’agit d’une encre sèche superposée : ce composant ne prétend pas simuler une encre liquide se mélangeant physiquement à l’eau. L’overlay est exécuté aussi dans la cible d’export 4K. Le PNG contient donc le même ensemble aquarelle + encre ; ce n’est pas un calque d’interface oublié lors du téléchargement.

Le réglage Encre modifie la partition de traits. Les nombres aléatoires de l’encre ont leur propre générateur, afin de conserver la partition des lavis lorsqu’on désactive les traits.

## Reproductibilité

L’empreinte de seed est calculée à partir du PCM quantifié de la fenêtre, sans utiliser le nom du fichier. La partition est déterministe pour le même JSON d’analyse, la même seed de variation et les mêmes réglages. Le replay n’utilise pas l’horloge du lecteur sonore.

Un changement de décodeur MP3 peut légèrement changer le PCM, donc son empreinte. Pour une reproduction indépendante du décodeur, conserver l’objet `AudioAnalysis` et la seed de variation. Le renderer conserve les limites de reproductibilité flottante entre GPU de la V1.
