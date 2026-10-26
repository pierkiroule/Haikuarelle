# V4 — L’atelier des oiseaux

## Concept réalisé

La page principale devient un instrument à dix pads. Poser le pinceau fixe un point normalisé sur la feuille ; cela ne peint pas. Chaque appui lance un véritable enregistrement puis ajoute une partition locale à cet endroit. Une feuille cumule au maximum quarante gestes. La seed de la feuille, les choix d’oiseaux et les positions donnent une signature personnelle.

Dix familles sont proposées : rouge-gorge, merle noir, rossignol, fauvette, hirondelle, geai, étourneau, chouette hulotte, hibou moyen-duc, corneille. Les correspondances sont picturales, pas une représentation zoologique de chaque espèce : une plume, une ramure, un voile, un trille.

La FFT, les attaques et l’énergie proviennent du signal audio réel. Le timbre et la famille du pad orientent le geste. L’origine et les proportions physiques sont conservées en portrait comme en paysage. La granulation, les rencontres, les petits retours d’eau et les traits fins réutilisent les ressources du moteur existant.

## Aucun démarrage sans son

- L’atelier est initialisé avec `requireAudio: true`, sur papier vierge, sans RAF de simulation.
- Le préchargement décode les fichiers avec un contexte audio hors ligne. Il ne crée aucun contexte de lecture et ne peint rien.
- `BirdAudioBank.play` demande l’autorisation de lecture dans le geste utilisateur, vérifie que le contexte est actif, appelle `source.start()`, puis seulement le callback pictural.
- Une lecture bloquée, un fichier absent ou silencieux ne crée aucun dépôt.
- Les fenêtres silencieuses de l’enregistrement ne déposent ni eau ni pigment. Les traits sont découpés aux silences réels.
- Un nouveau pad coupe la voix précédente ; `stopBird()` coupe ses dépôts futurs et son encre non encore dessinée. Le journal conserve le tracé original et sa coupure temporelle.
- Le séchage des pigments existants continue cinq secondes après la fin du son. Ce mouvement est une transformation de la matière déjà posée.
- Quitter l’onglet coupe le chant. Une nouvelle feuille efface l’œuvre et le haïku.

L’ancien mode d’import MP3, conservé à `/?mp3`, ne déclenche plus la grammaire autonome au démarrage ni au retrait d’un fichier. Les erreurs de décodage et changements d’extrait invalident immédiatement la partition précédente.

## Haïku et export

Trois vers originaux sont choisis par une grammaire locale. L’oiseau dominant, la palette et le centre des points joués modifient les lignes. La seed fixe les variantes. Une dédicace facultative s’affiche dans l’atelier et dans le PNG. Aucun texte ou prénom n’est envoyé à un service distant.

Le PNG réunit la véritable peinture capturée par le GPU, l’encre, les trois vers et la dédicace. La peinture conserve un grand côté de 4 096 px ; la marge poétique s’ajoute en dessous. Le format portrait complet mesure 2 304 × 4 741 px. Le paysage ajoute une marge de 1 147 px sous la peinture 4 096 × 2 304.

## Sources sonores

Les dix prises de son sont fournies par LaSonothèque / BigSoundBank. Chaque page source indique CC0. Le registre `public/birds/credits.json` contient les auteurs, URLs, offsets, modifications et SHA-256. Les fichiers sont intégrés à l’application ; il n’y a ni compte Xeno-canto ni clé API côté client.

Adaptations : sélectionner une fenêtre de six secondes maximum, conversion mono 44,1 kHz, normalisation de volume, fondus de 15/100 ms, encodage MP3 128 kbit/s. Aucun chant n’est synthétisé. Le geai est crédité à Joseph SARDIN & Axeline T. Les autres auteurs sont Joseph SARDIN ou Le tiroir du fond selon le fichier.

## Validation — 25 octobre 2026

- **43 tests** passent : grammaire autonome conservée, analyse PCM, découpes audio, formats, dix oiseaux, point du pinceau, marges et budgets GPU, variété des gestes, seed de la partition, haïku personnalisé, préchargement silencieux, autorisation de lecture avant peinture, erreurs de lecture, interruptions et fenêtres silencieuses.
- TypeScript strict et construction de production Vite validés.
- Dans le navigateur de contrôle, **10/10 vrais fichiers** ont été décodés et analysés. Lecture réelle démarrée pour le rouge-gorge (3,03 s), le hibou (6 s) et le geai (0,74 s). Les callbacks de fin et d’interruption ont été observés.
- Disposition contrôlée dans un cadre 390 × 844 : portrait 9:16, aucun débordement horizontal, dix pads fixes sous la toile pour jouer en la regardant. Le grand écran et la sortie par Échap fonctionnent.
- **Le navigateur de contrôle ne fournit pas WebGL2.** Le parcours audio et l’interface y sont vérifiés séparément ; l’animation GPU intégrée ne peut pas y être testée.
- Les vrais appels WebGL de la façade TypeScript ont été enregistrés puis rejoués sur Mesa EGL / llvmpipe, avec les shaders amont adaptés. Ce n’est pas un autre moteur de peinture.
- Une signature de cinq gestes a été rendue en 1 080 × 1 920 et 2 304 × 4 096. Les images complètes et le détail ont été examinés visuellement. Le papier reste discret, sans trame carrée ; les dépôts, bords diffus, petits amas et encre sont visibles. Environ 89,5 % du papier conserve des valeurs claires sur cette étude.
- Le PNG 4K produit hors écran a ensuite été passé au **vrai export de carte Canvas2D du navigateur** : résultat décodé **2 304 × 4 741**, 6 865 681 octets, avec les trois vers et une dédicace.

Les mesures EGL et SHA-256 figurent dans `bird-validation-egl.json`. Les rendus inspectés figurent dans `bird-studies/`.

## Limites

La fluidité sur un téléphone physique reste à vérifier. La simulation garde un pas fixe : un GPU lent peut diffuser plus lentement que le son. La coupure réelle de la voix empêche de nouveaux dépôts après sa fin, au prix d’un geste moins complet sur ces appareils. Le grand écran masque les commandes mais conserve l’œuvre.

La seed seule ne rejoue pas une performance manuelle : il faut aussi conserver les positions, oiseaux, réglages et coupures. Le moteur expose cette partition, mais cette version ne propose pas encore de sauvegarde/rechargement de session dans l’interface. Les vers sont issus d’une grammaire poétique originale, sans compréhension sémantique de la personne.
