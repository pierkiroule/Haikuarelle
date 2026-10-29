# Une poésie située dans la peinture et le vivant

Le haïku résonant des douze oiseaux actifs associe désormais trois éléments :

1. Un lieu et un geste du vivant écrits ensemble pour l'oiseau choisi : 12 scènes par oiseau, soit 144 nouvelles scènes. Refuges, chemins creux, vergers, haies, lavoirs, fils entre poteaux et lieux-dits composent ce répertoire.
2. Une image centrale fondée sur la famille morphologique effectivement mesurée dans la peinture : îlots, ramifications, élévation, voile dilué, masse dense, espace peu occupé ou passage. Chaque famille offre quatre images naturelles.
3. Une matière colorée issue de la teinte dominante observée : azur, bleuet, argile rouge, pollen, mousse, suie, givre, etc. Une deuxième couleur suffisamment présente peut apparaître dans la même ligne. Le titre reprend la forme et la matière du vers central, puis nomme toujours l'oiseau.

Le lieu et le dernier vers ne sont pas recombinés séparément. Les scènes dont les affinités correspondent à la forme sont favorisées (poids 4 contre 1) sans exclure les autres refuges. La graine, les marques, les mesures de l'image et les couleurs déterminent un tirage reproductible. Le moteur conserve le répertoire précédent pour les quatre oiseaux inactifs.

Les lieux-dits sont des évocations imaginaires de la campagne française, sans prétention de géolocalisation. Les formes sont des métaphores géométriques, pas une reconnaissance d'objets ou de paysages. Deux couleurs observées peuvent être nommées ensemble ; aucune relation spatiale entre elles n'est inventée. La gamme est estimée depuis le bitmap et ne constitue pas une mesure colorimétrique.

Les textes restent trois vers libres, sans promesse de métrique 5/7/5 ni de rime systématique. La cohérence visuelle, le milieu de l'oiseau et la lisibilité priment. Aucun service distant ou modèle de langage n'est appelé lors de la génération.

## Vérification

- Tests : correspondance entre couleur observée et mots, forme et titre/vers, cohérence des couples lieu/geste, références aux oiseaux, déterminisme, longueur des lignes et atteignabilité des 12 scènes pour chaque oiseau.
- `python scripts/check-nature-poetry.py` (Vite sur 5173) : lecture de bitmaps synthétiques bleus/roux/noirs, îlots/ramifications/masses, génération et export PNG dans Chromium.
