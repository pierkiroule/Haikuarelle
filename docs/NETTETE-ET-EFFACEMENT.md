# V10 — netteté au séchage et feuille à blanc

**Effacer tout**, à côté des brosses, coupe le chant, annule un éventuel chargement en attente et remet à blanc l’eau, les pigments, l’encre et le haïku. Les réglages, les oiseaux choisis, la dédicace et la graine sont conservés. **Nouvelle feuille** change aussi la graine. Les deux commandes passent par la même remise à zéro de la simulation et du cycle de contact.

Dans **Résonance & matière**, deux réglages agissent immédiatement sur la peinture existante et son export :

- **Netteté** : contraste local borné du vrai champ de pigment, poches minérales plus lisibles, auréoles affinées et bords mieux définis. Le renforcement suit la baisse de l’humidité ; les zones encore mouillées restent douces.
- **Seuil des détails** : sélection progressive des poches de sédiment. Un seuil élevé retient les dépôts les plus marqués, sans découper tout le lavis avec un seuil binaire.

Les valeurs initiales sont 72 et 56. Le relief du papier reste fin et non quadrillé. La teinte est préservée : les variations concernent l’épaisseur optique du pigment. Le grain fin suit le papier et les alphas sont fixés à la feuille, sans bruit animé.

## Modifications du moteur

La simulation Paint Studio réutilisée reste inchangée. Les quatre échantillons du gradient servent également au contraste local du pigment. La correction est bornée par la concentration présente ; elle ne dépose aucune nouvelle peinture. L’anticrénelage du contour reste calculé avec les dérivées du fragment, y compris à l’export.

L’atlas de séchage RGBA8 passe du quart à la moitié de la résolution linéaire de l’affichage. Il est calculé une fois puis réutilisé : pas de calcul procédural supplémentaire à chaque pas de simulation. À 2 304 × 4 096, cet atlas représente environ 9 Mo au lieu de 2,4 Mo. Le moteur le recalcule à la définition de l’export.

`Look.dryingSharpness` et `Look.dryingThreshold` sont des extensions HAÏKUARELLE, transmises par les champs optionnels `EngineSettings.sharpness` et `dryingThreshold`. Ce ne sont pas des API amont supposées. Le patch complet est vérifié contre le commit audité de Pigment Drift.

## Vérification

87 tests passent. Les captures sont produites par les vrais appels et shaders du moteur, rejoués sur Mesa/EGL. Trois couleurs sont examinées : bleu du geai, rose/gris du bouvreuil et carbone de la corneille.

Pour chaque oiseau, les comparaisons douce/accentuée et seuil bas/haut utilisent exactement le même champ de peinture : aucun pas de physique entre les captures. Le papier vierge est identique pixel pour pixel quel que soit le réglage. Deux captures consécutives du rendu sec sont identiques. Après effacement, la feuille du geai est identique pixel pour pixel à son papier initial.

Le PNG de peinture 2 304 × 4 096 est relu et inspecté, ainsi que son détail à l’échelle 1:1 dans `definition-studies/detail-4k.jpg`. Les rapports et empreintes sont dans `definition-validation-egl.json`. Les fichiers JPEG des planches servent uniquement à documenter la vérification ; la peinture n’utilise pas ces images.

L’interface mobile est inspectée à une largeur de 390 px. Le navigateur de contrôle n’offre pas WebGL2 : les rendus sont vérifiés nativement, et la fluidité sur téléphone physique reste à mesurer.
