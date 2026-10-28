# Revoir la naissance de mon Haïkuarelle

Le bouton final ouvre une vidéo du véritable processus de création, en aller-retour : 15 secondes du début à l’œuvre séchée, puis les mêmes images dans l’ordre inverse pendant 15 secondes. La 3D, les déformations, la symétrie et les oiseaux animés sont supprimés.

## Capture de la toile

Les images proviennent du rendu réel de l’eau, des pigments, d’Inkbird, du souffle et du séchage. Elles sont capturées pendant l’atelier, sans curseur ni commandes et sans la teinte visible de l’eau claire (sa physique et son action sur les pigments restent présentes), sur un bord long de 1600 pixels sur écran tactile et 1920 pixels sur ordinateur (dans les limites du GPU), compressées en JPEG à qualité 0,96. La capture vise huit images par seconde selon le temps de simulation, lorsque celle-ci évolue (les pauses ne rallongent pas le film) ; les gestes peuvent également déclencher une capture. L’image finale utilise le PNG haute définition.

Les captures restent en mémoire locale à la session, sans envoi serveur ni accès au microphone. Effacer ou recommencer vide l’historique. Un rechargement de la page le perd. Le masquage de l’onglet suspend les captures. Si la capture échoue, un message prévient ; la peinture et son PNG restent disponibles, sans faux rejeu depuis la seule image finale.

Le stockage est limité à 360 images et environ 32 Mio de données compressées. Pour les créations longues, l’historique est progressivement éclairci et la fréquence diminue, en conservant le début, la fin et la chronologie complète. Le film est donc un accéléré échantillonné, pas un enregistrement à 30 images par seconde de chaque geste. Sa fluidité est obtenue par des fondus entre captures. Au plus quatre images voisines restent décodées pendant la lecture.

## Film final

Le film reprend le placement et l’échelle validés de la peinture. Le titre et les trois vers apparaissent à l’approche de l’œuvre terminée, puis s’effacent pendant le retour. La signature •°○, le nom de l’application, son adresse et les crédits sonores sont conservés.

Le chant de l’oiseau accompagne le film à l’endroit, avec des respirations et des fondus ; ce n’est pas la bande sonore exacte enregistrée pendant les gestes. Les vocaux de guidance ne sont pas inclus. Un filigrane promotionnel permanent en bas du film porte « Plume d’Haïkuarelle · •°○ », « Créez avec le chant des oiseaux » et l’adresse de l’application.

L’export prépare 900 images à timestamps fixes avec WebCodecs/Mediabunny et attend le décodage de chaque image avant l’encodage. MP4 H.264/AAC si disponible, sinon WebM annoncé. MediaRecorder reste une solution de repli, dont la cadence dépend du navigateur. Format vertical : 1080 × 1920 sur ordinateur, 720 × 1280 sur écran étroit/tactile ou à mémoire limitée. Le débit cible est de 6,5 Mbit/s en 720p et 12 Mbit/s en 1080p. Le redimensionnement utilise le filtrage haute qualité du navigateur. Ces dimensions sont celles du film ; les étapes intermédiaires restent limitées à la définition de capture.

Fermer ou annuler libère les images décodées et les ressources audio/vidéo sans modifier l’œuvre. Safari/iPhone et les performances sur appareils physiques restent à vérifier.
