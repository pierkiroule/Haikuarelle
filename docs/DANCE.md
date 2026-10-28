# Revoir la naissance de mon Haïkuarelle

Le bouton final ouvre une vidéo du véritable processus de création, uniquement en avant. Les étapes s’enchaînent progressivement pendant 26 secondes, avec un départ et une arrivée adoucis, puis la composition finale reste immobile quatre secondes. La contemplation s’arrête sur cette œuvre, sans reboucler automatiquement ni inverser les gestes.

## Capture de la toile

Les images proviennent du rendu réel de l’eau, des pigments, d’Inkbird, du souffle et du séchage. Elles sont capturées pendant l’atelier, sans curseur ni commandes et sans la teinte visible de l’eau claire (sa physique et son action sur les pigments restent présentes), sur un bord long de 1600 pixels sur écran tactile et 1920 pixels sur ordinateur (dans les limites du GPU), compressées en JPEG à qualité 0,96. La capture vise douze captures par seconde environ selon le temps de simulation, lorsque celle-ci évolue (les pauses ne rallongent pas le film) ; les gestes peuvent également déclencher une capture. L’image finale utilise le PNG haute définition.

Les captures restent en mémoire locale à la session, sans envoi serveur ni accès au microphone. Effacer ou recommencer vide l’historique. Un rechargement de la page le perd. Le masquage de l’onglet suspend les captures. Si la capture échoue, un message prévient ; la peinture et son PNG restent disponibles, sans faux rejeu depuis la seule image finale.

Le stockage est limité à 360 images et environ 32 Mio de données compressées. Pour les créations longues, l’historique est progressivement éclairci et la fréquence diminue, en conservant le début, la fin et la chronologie complète. Le film est donc un accéléré échantillonné, pas un enregistrement à 30 images par seconde de chaque geste. Sa fluidité est obtenue par des fondus entre captures. Au plus quatre images voisines restent décodées pendant la lecture.

## Film final

Le film reprend le placement et l’échelle validés de la peinture. La peinture, les trois lignes du haïku et le filigrane occupent des zones séparées. Dans le lecteur, les commandes sont placées sous l’image afin de ne jamais masquer le dernier vers. Le titre et les trois vers apparaissent à l’approche de l’œuvre terminée. Le dernier plan utilise la composition PNG produite par le même export que le téléchargement : mêmes peinture, placement, titre, haïku et signature. Le filigrane et les crédits restent à l’extérieur de cette image dans le cadre vidéo. La signature •°○, le nom de l’application, son adresse et les crédits sonores sont conservés.

Le sample de l’oiseau joue une seule fois, entier pour les enregistrements du catalogue, puis trois échos courts de sa fin décroissent en volume (0,29 / 0,14 / 0,055). Chaque écho entre et sort en fondu. Il reste au moins trois secondes de silence en fin de film. Une même partition pilote la contemplation, MediaRecorder et la piste audio hors ligne. Ce n’est pas la bande sonore exacte enregistrée pendant les gestes ; les vocaux ne sont pas inclus. Un filigrane promotionnel permanent en bas du film porte « Plume d’Haïkuarelle · •°○ », « Créez avec le chant des oiseaux » et l’adresse de l’application.

L’export prépare 900 images à timestamps fixes avec WebCodecs/Mediabunny et attend le décodage de chaque image avant l’encodage. MP4 H.264/AAC si disponible, sinon WebM annoncé. MediaRecorder reste une solution de repli, dont la cadence dépend du navigateur. Format vertical : 1080 × 1920 sur ordinateur, 720 × 1280 sur écran étroit/tactile ou à mémoire limitée. Le débit cible est de 6,5 Mbit/s en 720p et 12 Mbit/s en 1080p. Le redimensionnement utilise le filtrage haute qualité du navigateur. Ces dimensions sont celles du film ; les étapes intermédiaires restent limitées à la définition de capture.

Fermer ou annuler libère les images décodées et les ressources audio/vidéo sans modifier l’œuvre. Safari/iPhone et les performances sur appareils physiques restent à vérifier.
