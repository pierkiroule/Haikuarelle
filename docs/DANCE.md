# La danse des haïkuarelles

Le bouton « Contempler le vol de mon Haïkuarelle » ouvre une chorégraphie automatique de trente secondes. Six formes abstraites, chacune composée uniquement de deux ailes miroir portant toute la peinture, se croisent dans un ciel clair. Aucun corps, tête, queue, pattes ou fil électrique n'est modélisé.

Les trajectoires déphasées dessinent des rubans de vent en profondeur. Chaque paire alterne battements et glisse avec son rythme propre ; les frémissements répondent au chant. La caméra accompagne la nuée avec une orbite, des rapprochements et des reculs progressifs. Les positions sont calculées au temps absolu, identiques en contemplation et en export.

Une texture originale HD est partagée entre les douze ailes, avec mipmaps et filtrage anisotrope disponible. Le maillage indexé partagé comporte 64 × 88 cellules sur écran compact, 96 × 128 sur grand écran : la définition des pigments reste indépendante de cette géométrie. Six appels de dessin instanciés rendent les deux ailes de chaque forme. La transparence est extraite optiquement du papier ; les pigments presque identiques au papier peuvent être atténués.

Le chant reste à l'endroit avec une respiration entre les phrases. Le titre reste fixe, un vers accompagne chacun des trois temps de dix secondes. Le film porte la signature, l'adresse et les crédits. Un fondu au ciel encadre la danse. Aucun microphone.

L'export conserve trente secondes : 900 images à timestamps fixes avec WebCodecs/Mediabunny, H.264/AAC en MP4 si supporté, sinon WebM annoncé. MediaRecorder sert de repli lorsque compatible ; cadence et durée dépendent alors du navigateur. Format vertical : 1080 × 1920 sur ordinateur, 720 × 1280 sur écran étroit/tactile ou à mémoire limitée. L'export peut prendre plus de trente secondes. Fermer ou annuler libère les ressources sans modifier l'original. Safari/iPhone et les performances sur appareils réels restent à vérifier.
