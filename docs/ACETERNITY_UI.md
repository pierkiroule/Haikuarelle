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

L'intention artistique se lit dans un dialogue natif, depuis le bouton dédié.
Le dialogue conserve le texte complet, les trois temps et la conclusion. Il gère
le focus, Échap, la fermeture par bouton et le clic hors de la carte ; le fond est
inactif pendant la lecture. Les animations du logo et du dialogue respectent
`prefers-reduced-motion`. Vérification navigateur : `python scripts/check-welcome.py`.
