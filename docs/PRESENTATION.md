# Présentation à l'accueil

`public/presentation.mp4` est le fichier fourni sur main (H.264/AAC, 1080 × 1920,
90 secondes, environ 10 Mo). Le fichier conserve son contenu et sa durée. Une image
WebP extraite à deux secondes sert d'affiche légère, notamment quand le mouvement
réduit est demandé.

La présentation apparaît à l'initialisation de l'accueil, une fois par session
(`sessionStorage`, avec repli mémoire si le stockage n'est pas disponible). Le lien
« Revoir la présentation » permet de la relancer à tout moment depuis l'accueil.
La vidéo attend un clic ou toucher sur le bouton Play central pour démarrer avec
le son. La lecture reste en ligne sur mobile (`playsInline`). Les contrôles natifs
apparaissent dès la première tentative de lecture. Un bouton explicite
active ou coupe le son ; le choix peut aussi être modifié dans les contrôles vidéo.

La modale native est immédiatement refermable par ×, Échap ou « Entrer dans
Haïkuarelle ». Sa fermeture et son démontage arrêtent la lecture. Le focus revient
à l'élément précédemment actif lorsqu'il existe encore. Il n'y a pas de boucle :
la dernière image reste affichée et le texte invite à rencontrer une plume.
Aucune lecture automatique ne se produit. Le mouvement réduit désactive aussi
l’animation d’ouverture. Le bouton Play revient en pause ou à la fin du film.

Validation : `python scripts/check-presentation.py` (Vite sur 5173), avec le véritable
MP4, vérifie attente du bouton Play, démarrage sonore, fermeture, stockage de session, relecture, focus,
mouvement réduit et quatre tailles d'écran. Validation mobile sous Chromium, pas
sur appareil iOS/Android physique. Le moteur de peinture et les chants restent
indépendants de cette présentation.
