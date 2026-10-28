# La danse de mon haïkuarelle

« Contempler la danse de mon Haïkuarelle » ouvre une animation 3D automatique de trente secondes dans un espace blanc. L’œuvre complète apparaît une seule fois, sans duplication, symétrie, ailes ou silhouette d’oiseau.

La danse évoque le processus aquarelle : émergence progressive et irrégulière des pigments (0–10 s), diffusion et ondulations souples liées à l’énergie, aux attaques et aux aigus du chant, puis séchage (19–28 s), retour des détails et apaisement de la surface. C’est une reconstruction poétique à partir de la peinture finale ; ce n’est pas une restitution chronologique des gestes ni une nouvelle simulation du moteur aquarelle.

La texture conserve ses coordonnées d’origine. Une seule surface indexée (128 × 176 cellules sur écran compact, 192 × 256 sur grand écran) utilise la texture HD, des mipmaps et le filtrage anisotrope disponible. Les normales suivent les déformations. La caméra se déplace en biais, se rapproche puis recule sans tourner l’image à l’envers ni la mettre de profil. Le blanc du papier devient transparent ; les pigments presque identiques au papier peuvent être atténués.

Le chant reste à l’endroit avec une respiration entre les phrases. Le titre reste fixe ; un vers accompagne chacun des trois temps de dix secondes. Signature, adresse et crédits sont conservés. Un fondu blanc encadre la danse. Aucun microphone.

L’export conserve trente secondes : 900 images à timestamps fixes avec WebCodecs/Mediabunny, H.264/AAC en MP4 si supporté, sinon WebM annoncé. MediaRecorder sert de repli lorsque compatible ; cadence et durée dépendent alors du navigateur. Format vertical : 1080 × 1920 sur ordinateur, 720 × 1280 sur écran étroit/tactile ou à mémoire limitée. L’export peut prendre plus de trente secondes. Fermer ou annuler libère les ressources sans modifier l’original. Safari/iPhone et les performances sur appareils réels restent à vérifier.
