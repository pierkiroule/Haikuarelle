# V11.1 — proportions stables de la toile

Le passage peinture → séchage → révélation utilisait trois limites de taille différentes. Sur un viewport mobile de 390 × 844, la hauteur passait de 459 à 574 puis à 534 pixels CSS. Cette variation du gabarit rendait la finalisation instable.

Le correctif donne au parcours un gabarit commun. Le conteneur de l’œuvre occupe explicitement sa colonne. Le cadre de la feuille conserve son ratio 9:16 ou 16:9 et ne peut pas être comprimé par le flex. Le canvas GPU est placé en couche absolue dans ce cadre : ses dimensions internes ne participent plus à la hauteur de la mise en page. Le titre et le haïku restent des éléments voisins, en dehors de la surface peinte.

En plein écran, la feuille est ajustée uniformément à l’espace disponible pour laisser apparaître les mots. Ses proportions restent conservées. Sur un écran horizontal très bas, une hauteur minimale empêche le calcul d’une feuille vide.

## Contrôles réels dans le navigateur

Le test `tests/fixtures/paper-layout.html` charge les styles de production et utilise la même hiérarchie de feuille, titre et haïku. Une mire avec un cercle et des carrés permet de voir les déformations. Le canvas utilise le vrai calcul `displaySize`, une densité de pixels de 3 et un `ResizeObserver` qui met à jour sa définition interne.

36 cas contrôlés :

- 24 cas : quatre viewports (390 × 844, 412 × 915, 1280 × 900 et 740 × 360), portrait/paysage, peinture/séchage/finalisation.
- 12 cas : portrait/paysage et trois étapes en plein écran sur les viewports 390 × 844 et 1280 × 900.

Dans les huit groupes hors plein écran, les trois étapes ont exactement les mêmes dimensions et ne provoquent aucun nouvel événement de redimensionnement du canvas. Sur mobile 390 × 844 en portrait, la feuille reste à 258,1875 × 459 pixels CSS à chaque étape. La différence de ratio maximale sur les 36 cas est de 0,000131, due aux arrondis sous-pixel du navigateur.

Les mesures sont conservées dans `paper-layout-validation.json`. Une capture de contrôle est dans `paper-layout-studies/`. Les 98 tests existants passent, ainsi que TypeScript. La simulation et les shaders ne changent pas. Le navigateur de contrôle ne dispose pas de WebGL2 : cette vérification porte sur la géométrie réelle du navigateur avec une mire Canvas 2D, pas sur les performances d’un GPU de téléphone physique.

## Refaire le contrôle

Lancer `npm run dev`, puis ouvrir `/tests/fixtures/paper-layout.html`. Choisir une taille de viewport, passer par les trois étapes et tester les deux formats. Le cercle doit rester rond et les dimensions affichées doivent rester identiques entre les étapes hors plein écran. Le nombre d’événements `ResizeObserver` doit se stabiliser.
