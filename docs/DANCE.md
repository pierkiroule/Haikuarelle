# L’oiseau d’haïkuarelle : voler, planer et se poser

« Contempler le vol de mon Haïkuarelle » ouvre un récit automatique de trente secondes dans un ciel très clair. La caméra accompagne un oiseau fait de la peinture : battements d’ailes, vol plané, approche d’un fil électrique noir, puis pose et repli des ailes. Ce récit avance jusqu’à l’atterrissage ; il remplace l’ancienne lecture aller-retour du Rorschach.

## La matière de l’oiseau

La peinture entière habille chacune des deux ailes, avec une géométrie miroir. Les UV conservent la source complète. Les surfaces s’effilent vers les pointes, fléchissent pendant les battements et se replient contre le corps après l’atterrissage. Un maillage distinct, beaucoup plus léger, forme le corps, la tête, la queue, le bec et les yeux. Ses couleurs sont déduites des pigments de l’œuvre ; la queue conserve les transparences du rendu.

Les ailes partagent une texture HD et un maillage indexé : 192 × 256 cellules sur grand écran, 128 × 176 sur écran compact. Les petites parties utilisent une grille de 24 × 16. Le relief est lissé et les tangentes analytiques gardent l’éclairage souple. Mipmaps, filtrage anisotrope disponible et mélange alpha séparé préservent les détails et les lavis. L’extraction de transparence reste optique : les pigments presque identiques au papier peuvent être atténués.

## Le vol et la pose

- Début : battements amples et légère inclinaison du corps.
- Vers 10–17 s : vol plané, ailes ouvertes et frémissements liés au chant.
- Vers 18–25 s : ralentissement, redressement, reprise des battements et déploiement des pattes.
- À 25 s : contact avec le câble ; les ailes se replient progressivement jusqu’à 28,5 s.
- Fin : l’oiseau reste perché et la caméra continue son approche orbitale.

Le fil est une géométrie cylindrique noire dans le même espace 3D, avec une légère flèche et une vibration amortie à l’impact. Les prises des pattes sont contraintes à la hauteur et à la profondeur du fil lors du contact. Le corps suit ce léger mouvement, sans glisser ou traverser le câble.

La caméra effectue un tour autour de l’oiseau tout en suivant sa trajectoire dans le ciel. Elle s’approche pendant la pose pour rendre le contact et le repli lisibles. Projection en perspective, profondeur et roulis sont partagés par l’oiseau, les pattes et le câble. Le fond de ciel est très discret. Un fondu au début et à la fin permet de répéter le film sans montrer un atterrissage à l’envers.

## Son, texte et export

Le chant reste à l’endroit pendant trente secondes, avec 500 ms de respiration entre les phrases et des fondus doux aux extrémités. Les attaques, l’énergie et les aigus modulent les frémissements des ailes. Aucun microphone ni backend. Le titre reste fixe ; un vers accompagne chacun des trois temps de dix secondes. Signature •°, adresse et crédits audio restent discrets dans l’image.

« Garder le vol · 30 s » exporte le récit complet même s’il est demandé au milieu de la contemplation. Mediabunny/WebCodecs encode 900 images à des timestamps fixes, plus une piste audio préparée hors ligne. H.264/AAC produit un vrai MP4 lorsque disponible, sinon un vrai WebM est annoncé. Sans WebCodecs, MediaRecorder est utilisé si compatible ; sa cadence et sa durée précise dépendent du navigateur.

La vidéo est verticale, 1080 × 1920 sur ordinateur, 720 × 1280 sur écran étroit/tactile ou à mémoire limitée. L’export peut prendre plus de trente secondes. Suspendre, annuler ou fermer libère les ressources ; l’œuvre originale et son PNG restent intacts. Safari/iPhone réel reste à vérifier pour H.264/AAC et le partage natif.

## Vérification

Les tests couvrent les battements, le vol plané, le contact continu, le repli après contact, les prises sur le câble vibrant et les matrices de caméra. `scripts/check-dance.py` vérifie le parcours complet avec chant réel, l’export et le retour à la toile. Les buffers de simulation du contrôle sont réduits pour SwiftShader ; ce n’est pas un benchmark de GPU mobile réel.
