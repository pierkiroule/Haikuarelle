# La danse de ton haïkuarelle

Après le séchage, révéler le haïku puis valider la composition rend disponible « Faire danser mon haïkuarelle ». La scène se charge à la demande dans un dialogue accessible. Fermer le dialogue restitue la composition originale, sans réinitialiser la peinture ni modifier son export PNG.

## Interaction

Cinq outils travaillent sur une même surface WebGL2 : Onduler, Attirer, Tournoyer, Vibrer et Envoler. Le doigt détermine la zone d’action, le chant module l’amplitude et les aigus animent les détails. On peut changer d’outil pendant la danse. Une seule pression principale est suivie ; le clavier permet de maintenir espace/Entrée et de déplacer l’action avec les flèches. Aucun microphone ni serveur ne sont utilisés.

L’exploration démarre le chant à la première interaction. « Enregistrer ma danse · 9 s » ouvre un décompte de trois secondes puis mémorise les gestes, pas une capture d’écran. Le score est borné à 270 échantillons et conserve les changements d’outil et les positions. La dernière demi-seconde relâche progressivement les actions. Une création sans gestes reste possible : la matière conserve une respiration sonore discrète.

## Surface et qualité

Une copie haute définition du rendu sec, sans titre ni haïku, est figée depuis l’export existant (jusqu’à 4096 px sur le grand côté selon le GPU). Un aperçu réduit sert uniquement à trouver le cadrage ; le recadrage est appliqué à la texture originale. La forme reste une membrane ouverte en 3D, pas une sculpture fermée. Le maillage fixe contient 80 × 112 cellules, sans nouvelle simulation d’eau.

La transparence est estimée par différence avec la teinte connue du papier, avec un seuil progressif et une marge autour des zones peintes. C’est une extraction optique du rendu, pas une mesure native de masse pigmentaire : les lavis presque identiques au papier peuvent être atténués. Le relief se déduit également du contraste au papier. Les textures de couleur restent indépendantes des subdivisions du maillage. La caméra reste douce et le mouvement n’est lancé que par une interaction explicite.

## Vidéo

Le montage vertical associe neuf secondes de danse, avec un vers par tranche de trois secondes et le titre fixe, à six secondes de présentation. La présentation utilise le logo local, le nom de l’application, une invitation et l’adresse de l’instance courante (ou l’adresse publique du README en prévisualisation locale). Les crédits de l’enregistrement (auteur, licence, source) apparaissent dans cette présentation. La signature du film est •° ; celle du PNG reste •°○.

Sur les navigateurs WebCodecs compatibles, Mediabunny encode 450 images à des timestamps explicites : le temps de calcul ne modifie pas le rythme du film. La piste audio est préparée séparément dans un OfflineAudioContext de quinze secondes. Les phrases originales sont séparées par 500 ms de silence et s’estompent avant neuf secondes ; les six secondes promotionnelles restent silencieuses. Le dernier passage peut être fondu à la limite des neuf secondes. Le son du microphone n’est jamais capturé.

L’export choisit H.264 + AAC dans un vrai MP4 si ces deux encodeurs sont disponibles. Sinon il produit un vrai WebM VP9/Opus, annoncé comme tel : une conversion sera nécessaire avant un partage Instagram qui exige du MP4. Une extension MP4 seule ne prouve pas la compatibilité des codecs. Sans WebCodecs audio/vidéo, une capture MediaRecorder reste proposée lorsque disponible ; sa cadence et sa durée précise dépendent alors du navigateur. Sans encodeur compatible, un message conserve l’accès à la danse et au PNG.

La définition est 1080 × 1920 sur ordinateur et 720 × 1280 sur appareil tactile, écran étroit ou à mémoire limitée. L’export haute définition peut prendre plus de quinze secondes. Un seul fichier est conservé ; recommencer ou fermer révoque son URL. Annulation, changement d’onglet et fermeture interrompent l’export et libèrent les encodeurs, le son et les ressources WebGL. Le partage natif est déclenché uniquement sur un clic après préparation du fichier ; le téléchargement reste disponible.

## Vérification

- `npm test` : score borné, replay indépendant de la cadence du pointeur, silences, sélection des codecs, cadrage, 450 timestamps et annulation d’encodage.
- `npm run build` : compilation et chunks chargés à la demande.
- Le parcours navigateur de danse vérifie des chants et une peinture réels, les cinq outils, le retour à la même toile, l’export vidéo/audio et ses métadonnées sur ordinateur et mobile. Les buffers de simulation sont réduits pour SwiftShader ; ce contrôle ne mesure pas les performances d’un GPU mobile réel.
- Safari/iPhone réel doit encore être vérifié pour l’encodage H.264/AAC et le partage natif.
