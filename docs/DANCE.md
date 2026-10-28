# Rorschach vivant — une boucle de trente secondes

« Contempler le vol de mon Haïkuarelle » ouvre directement une scène blanche plein écran. La peinture sèche est projetée entière sur deux ailes : une copie et son miroir géométrique. Les UV conservent toute la source ; aucune moitié de l’œuvre n’est découpée. L’axe se cale près des premiers pigments substantiels pour rapprocher les réserves transparentes et former une apparition commune. Les surfaces peuvent légèrement se chevaucher autour de cet axe.

## Le mouvement

La matière se déploie comme deux nappes souples, sans silhouette d’oiseau littérale. La caméra commence près d’une zone réellement peinte, recule pour révéler la symétrie, accompagne l’ouverture avec un virage incliné puis retrouve une vue d’ensemble. Sa projection est en perspective, avec trajectoire et roulis interpolés continûment. Les ondulations, le relief et les frémissements utilisent le même temps visuel.

Le cycle dure trente secondes : quinze secondes aller, puis retour exact. Une fonction cosinus remonte le temps visuel de 0 à 15 puis de 15 à 0, avec vitesse nulle aux retournements. Géométrie, caméra, éclairage et textes dépendent de ce temps : l’image à t est donc la même qu’à 30 − t. Aucun historique de centaines d’images n’est conservé. La contemplation boucle automatiquement ; Suspendre permet de l’arrêter.

## Le son

Le chant reste toujours à l’endroit. Les enregistrements originaux se succèdent avec 500 ms de respiration et des fondus doux aux extrémités du cycle. La déformation utilise les caractéristiques sonores du temps visuel : lors du retour, le mouvement est inversé alors que la piste audio continue normalement. C’est une composition audiovisuelle, pas une synchronisation syllabe par syllabe sur la seconde moitié. Aucun microphone n’est utilisé.

L’autorisation audio est demandée dans le clic d’entrée, avant la préparation de l’image. Le nettoyage tient compte du double montage de React StrictMode. Changer d’onglet suspend le voyage ; fermer la scène libère le son, les encodeurs et les ressources GPU sans modifier la peinture originale.

## Le rendu

Les deux instances partagent une seule texture et un seul maillage indexé : 192 × 256 cellules sur grand écran, 128 × 176 sur écran compact. La couleur conserve la définition du rendu sec d’origine, jusqu’à 4096 px selon le GPU. Mipmaps et filtrage anisotrope disponible limitent le scintillement. Le relief est lissé séparément ; des tangentes analytiques donnent des normales lisses, sans réévaluer cinq fois la surface à chaque sommet. Les parties transparentes sont découpées et la profondeur est testée. Il s’agit de membranes ouvertes, pas d’une sculpture fermée.

Le cadrage et les cibles de gros plan sont déduits des pigments. La transparence et le relief restent des estimations optiques par contraste avec le papier : les lavis presque identiques au papier peuvent être atténués. Une marge protège les contours dilués.

## Le film

« Garder la boucle · 30 s » exporte tout le cycle, même s’il est demandé au milieu de la contemplation. Le titre reste fixe, les vers suivent les trois temps du déploiement puis le retour. La promotion est une signature discrète, avec le nom de l’application, •°, l’adresse publique et les crédits du chant ; aucun carton final ne coupe la boucle.

Mediabunny/WebCodecs encode 900 images à trente images par seconde avec des timestamps fixes, plus une piste audio préparée hors ligne. Un appareil lent allonge le calcul, pas le film. Le son n’est jamais lu à rebours. Le fichier de trente secondes est fini ; le lecteur d’aperçu le répète automatiquement.

H.264 + AAC produit un vrai MP4 lorsque ces deux encodeurs sont disponibles. Sinon un vrai WebM VP9/Opus est annoncé comme tel, avec indication de conversion éventuelle pour Instagram. Sans WebCodecs audio/vidéo, MediaRecorder est utilisé lorsqu’il est disponible ; sa cadence et sa durée précise dépendent du navigateur. Sans encodeur compatible, la contemplation et le PNG restent disponibles.

La vidéo est verticale, 1080 × 1920 sur ordinateur, 720 × 1280 sur écran étroit/tactile ou appareil à mémoire limitée. La contemplation utilise l’écran entier. L’export ne stocke pas 900 images brutes et partage les ressources des deux ailes ; il peut prendre plus de trente secondes sur un appareil lent.

## Vérification

`npm test` vérifie le temps aller-retour, la symétrie des ailes, la trajectoire, les cibles pigmentées, les indices, les 900 images, les trente secondes audio à l’endroit, l’annulation et le démarrage unique sous StrictMode. Le contrôle GPU compare également les pixels de deux étapes aller/retour et du raccord de boucle sur une texture de test HD. `scripts/check-dance.py` vérifie le parcours complet avec chant réel et retour à la toile inchangée. Les buffers de simulation y sont réduits pour SwiftShader ; ce n’est pas un benchmark de mobile réel. Safari/iPhone réel reste à vérifier pour l’export H.264/AAC et le partage natif.
