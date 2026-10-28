# Matière aquarelle

Le rendu et les captures utilisent la même matière, sans ajouter de réglages dans l’atelier.

- **Familles de pigments.** Les couleurs bleues présentent davantage de granulation ; les jaunes gardent une matière fine et une mobilité plus grande ; les teintes sombres se déposent davantage. Les échanges capillaires utilisent un coefficient commun aux deux côtés de chaque échange pour conserver la quantité de pigment. Les coupures sèches restent des barrières.
- **Contours.** L’humidité locale et les masques organiques continus font alterner passages nets, fondus et bords perdus. L’anticrénelage suit la résolution de sortie ; aucune nouvelle grille ou trame répétée n’est ajoutée.
- **Séchage.** Les détails suivent des poches de dépôt et les variations du champ, avec des auréoles interrompues, du grain minéral et de petites réserves pâles dans les lavis fins. Les grandes zones calmes conservent une texture plus douce, sans supprimer entièrement le grain du papier.
- **Superpositions.** Une courbe douce limite l’assombrissement optique des fortes concentrations. Elle conserve davantage de lumière dans les glacis chromatiques et une plage plus profonde pour les sombres. La séparation des couleurs déjà présente dans le transport reste active.
- **Respiration.** Le dépôt autonome d’une phrase s’allège progressivement, sans couper le chant ni désactiver les gestes. Les détails restent localisés et les blancs non peints ne reçoivent aucun pigment décoratif.

Il s’agit d’une approximation picturale : les coefficients sont déduits des familles de couleurs dans la base optique RGB transportée. Ils ne constituent pas des mesures de pigments chimiques. Des couleurs déjà mélangées ne peuvent pas être identifiées séparément à partir de cette base. Le modèle conserve les mêmes champs de simulation et n’ajoute pas de texture GPU permanente.

Vérifications : `scripts/check-pigment-materials.py` teste les mobilités relatives, la conservation de masse et d’humidité et produit des comparaisons humides/sèches avec le rendu précédent. `scripts/check-plumage-render.py` contrôle la diffusion connectée, l’absence de fuite diagonale et la présence des couleurs du plumage. Les tests s’exécutent avec Chromium logiciel et un champ réduit ; ils ne remplacent pas un essai de performance sur téléphone physique.
