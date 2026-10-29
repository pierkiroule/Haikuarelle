# Interactions poétiques — adaptations locales des effets Aceternity

## Audit

L’application utilise React 19 et Vite, avec des feuilles CSS locales. La palette flottante existe dans `CreationPalette`, la sélection anonyme dans `FeatherEncounter`, et la mise en page fixe du poème dans `FixedPoetry`. Les actions, les états et les libellés de ces composants sont conservés. Aucun changement du moteur, du canvas, de l’audio ou du code d’export PNG.

Les pages officielles demandées ont été consultées par tentative d’accès :

- https://ui.aceternity.com/components/floating-dock
- https://ui.aceternity.com/components/3d-card-effect
- https://ui.aceternity.com/components/text-generate-effect

L’environnement refuse le domaine et le registre officiel avec `403 Forbidden`. Leur contenu et leur code n’ont donc pas pu être lus ou validés. L’intégration fournie est une implémentation locale indépendante des trois interactions demandées, inspirée de ces composants ; elle ne revendique pas une copie du code officiel ni une installation du registre Aceternity.

## Adaptations

- **Floating Dock** : boutons existants, léger soulèvement au survol précis, effacement pendant le geste, repos après inactivité, poignée « Outils » pour le réveil tactile ou clavier. Une palette dépliée ou un contrôle au clavier reste accessible. Les effets ne redimensionnent pas la toile.
- **3D Card Effect** : profondeur de quelques pixels et rotation bornée à ±3° sur les conteneurs des plumes. Les boutons, leurs identifiants anonymes, le choix et le son de preview sont inchangés. Pas d’inclinaison sur écran tactile ni d’écoute de capteurs.
- **Text Generate Effect** : mots révélés doucement dans le titre puis les trois vers. Texte et espaces conservés ; le texte complet reste présent pour les technologies d’assistance. Les animations ne sont pas utilisées dans les exports.

Motion est la seule dépendance directe ajoutée, sans Tailwind, bibliothèque d’icônes ou migration CSS. Les composants minimaux `motion/react-m` sont utilisés avec les fonctions d’animation chargées séparément. Les mouvements de pointeur mettent à jour des valeurs animées sans rafraîchir l’état React à chaque pixel. Aucun filtre de flou ni boucle de suivi globale n’est ajouté.

`prefers-reduced-motion` rend la révélation immédiate, supprime les inclinaisons et conserve les outils visibles. Les événements de préférence système sont libérés au démontage, comme les temporisations du dock. Les notices MIT de Motion et de ses modules sont disponibles dans `public/MOTION-LICENSES.txt`.

## Vérification

Les tests couvrent le réveil tactile/clavier, la conservation du focus, le texte inchangé et les préférences de mouvement. `scripts/check-poetic-ui.py` parcourt Rencontrer → Composer → Révéler dans Chromium logiciel, puis vérifie le mode tablette et l’inclinaison sur ordinateur. Les essais sur téléphones et tablettes physiques restent à faire.

### Composition du papier

La mise en page partagée (`src/birds/artworkLayout.ts`) réserve le haut au titre,
le bas aux trois vers et la zone verticale 14–78 % à la peinture. La transformation
choisie dans l'éditeur est relative à cette zone : 100 % conserve toute l'image et
ses proportions dans l'espace disponible. Les déplacements restent bornés à cet
espace. Le calcul des polices tient compte de la largeur et de la hauteur réservées,
y compris en paysage. L'écran, le PNG et chaque étape du film utilisent ce même
placement. Le film termine toujours sur le PNG composé.

Le papier des plumages, les marges et le fond du film utilisent le blanc pur. Le grain
reste porté par les pigments, sans teinter la feuille vide ; l'eau reste visible
pendant le travail et invisible dans l'enregistrement comme auparavant.

Vérification : `python scripts/check-artwork-zones.py` (Vite sur le port 5173) contrôle
les trois formats, les marges blanches et le confinement des pigments exportés.

### Accueil Haïkuarelle

Le titre, le bandeau et les métadonnées emploient « Haïkuarelle ». Le logo SVG
s'anime uniquement par transformations et opacité, sans filtre SVG animé. Chaque
plume partage les pigments de `BIRD_COLOURS`, avec des lavis superposés et une nervure
fine. La pointe du curseur conserve ses coordonnées.

L'intention artistique se lit dans un carrousel en bas de l'accueil : résonance,
trois temps pour créer, puis rencontre et signature. Le texte intégral est conservé.
Le défilement tactile est natif, avec flèches, repères de page et navigation clavier
(gauche/droite, début/fin). Il n'y a pas de défilement automatique. Les préférences de
mouvement réduit désactivent le défilement animé et les animations du logo. Le bouton
de suspension des plumes est retiré ; leur mouvement s'arrête toujours au focus
clavier ou avec `prefers-reduced-motion`.

Vérification navigateur : `python scripts/check-welcome.py`.

### Lecture agrandie de l'œuvre

Après révélation, « Agrandir l’œuvre » ouvre le PNG composé en haute définition dans
une vue dédiée. Pincement (100–500 %), déplacement borné, double toucher (100/300 %),
boutons +/− et retour à la vue entière partagent le même état de lecture. Échap ferme
la vue et rend le focus à son bouton d'ouverture. Le changement d'orientation remet
l'image à l'échelle de la vue. La composition, les pigments et les fichiers exportés
ne sont pas modifiés. Les URL temporaires sont libérées à la fermeture.

`python scripts/check-artwork-reader.py` vérifie les gestes tactiles Chromium, les
boutons, le double toucher et le retour du focus. `scripts/check-poetic-ui.py` vérifie
l'ouverture depuis le parcours complet sans changer le placement de la peinture.

### Table d'aquarelle

La palette regroupe quatre outils explicitement nommés, les actions Annuler/Sécher
et un volet de réglages repliable. Les godets utilisent les couleurs du plumage,
avec un godet multicolore pour la brosse complète ; la bordure et le point de
sélection ne reposent pas uniquement sur la perception des couleurs. Les outils,
godets et boutons ont des cibles d'au moins 44 px. Les godets défilent horizontalement
sur petit écran. Le nuancier conserve ses noms accessibles et ses callbacks.

Les commandes deviennent transparentes pendant le geste ; la zone invisible ne
capture plus les touchers. Le focus clavier garde les commandes disponibles, alors
que la sélection tactile ne force pas leur maintien à l'écran. La poignée Outils
permet de les rappeler. Aucun changement du moteur pictural ou du traitement audio.

`python scripts/check-watercolour-table.py` contrôle les dimensions tactiles, les
quatre largeurs 320/390/768/1280 px et les callbacks de sélection, annulation et séchage.
