# Contempler le vol de mon Haïkuarelle

Après séchage, révélation du haïku et validation de la composition, un seul bouton ouvre un voyage automatique dans la peinture. Les cinq outils, le décompte et l’enregistrement manuel de gestes ont été retirés. La peinture originale et son export PNG restent intacts.

## Le voyage

Le vol démarre avec le chant, sans deuxième geste. L’autorisation audio est demandée dans le clic d’entrée, avant la préparation de la texture. Une vue plein écran montre successivement l’ensemble de la matière, un virage incliné, deux approches rapprochées, puis un éloignement. Le vol dure neuf secondes ; on peut le suspendre ou le revoir. Une interruption par changement d’onglet suspend le son et le voyage.

La caméra utilise une vraie projection en perspective à 60°, une matrice de vue, un roulis et un trajet interpolé continu. Les gros plans visent des zones pigmentées détectées dans l’œuvre, plutôt que le centre potentiellement vide du papier. Le début et la fin partagent le même cadrage. Les oscillations principales de la membrane sont périodiques sur les neuf secondes, avec une modulation supplémentaire par l’énergie, les graves, les aigus et les attaques du chant.

Le maillage indexé partage ses sommets : 192 × 256 cellules sur grand écran, 128 × 176 sur écran compact. Les indices restent sur seize bits. La texture conserve le rendu sec d’origine, jusqu’à 4096 px selon le GPU, indépendamment de la densité du maillage. Mipmaps et filtrage anisotrope, lorsqu’il est disponible, limitent le scintillement dans les vues rasantes. Le relief est lissé séparément de la couleur ; les normales lisses évitent l’éclairage plat par triangle lors des gros plans. Les parties transparentes sont découpées et la profondeur est testée ; il s’agit d’une membrane ouverte, pas d’une sculpture fermée.

## Extraction

Une lecture réduite sert à cadrer la matière ; le recadrage utilise ensuite la texture d’origine. La transparence et le relief sont estimés par contraste avec la teinte connue du papier. C’est une extraction optique, pas une mesure native de masse pigmentaire : les lavis presque identiques au papier peuvent être atténués. Une marge protège les contours dilués.

## Le film

Après le voyage, « Garder le film · 15 s » exporte neuf secondes de vol, avec le titre et un vers par tranche de trois secondes, puis six secondes de présentation : logo, invitation, adresse publique, signature •° et crédits du chant. Le PNG conserve sa signature •°○.

Mediabunny/WebCodecs encode 450 images à des timestamps fixes. Un appareil lent allonge le calcul, pas le film. La piste audio de quinze secondes est préparée hors ligne : phrases séparées par 500 ms de silence, fondu avant neuf secondes, puis six secondes silencieuses. Le dernier passage peut être fondu à la limite des neuf secondes.

H.264 + AAC produit un vrai MP4 lorsque ces deux encodeurs sont disponibles. Sinon, un vrai WebM VP9/Opus est proposé et annoncé : une conversion peut être nécessaire pour Instagram. Sans WebCodecs audio/vidéo, MediaRecorder est utilisé lorsqu’il est disponible ; sa cadence et sa durée précise dépendent du navigateur. Sans encodeur compatible, la contemplation et le PNG restent disponibles.

Le film est vertical, 1080 × 1920 sur ordinateur, 720 × 1280 sur écran étroit/tactile ou appareil à mémoire limitée. La contemplation utilise le format de l’écran entier. Annulation, changement d’onglet et fermeture libèrent les ressources ; le son est également libéré lors de la fermeture réelle, en tenant compte du double montage de React StrictMode. Aucun microphone, backend ni envoi de l’œuvre.

## Vérification

`npm test` vérifie le trajet, ses banques et approches, les matrices, les cibles pigmentées, les limites des indices, le démarrage automatique sous StrictMode et l’encodage des 450 images. `scripts/check-dance.py` vérifie un parcours avec chant réel, vol automatique, export et retour à la toile inchangée. Les buffers de simulation y sont réduits pour SwiftShader ; ce n’est pas un benchmark de GPU mobile réel. L’export H.264/AAC et le partage natif sur Safari/iPhone réel restent à vérifier.
