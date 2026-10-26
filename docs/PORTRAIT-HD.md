# V3 — Papier discret, portrait et grand écran

La feuille et son rendu ont été adaptés ensemble. Le format n’est pas obtenu en étirant un bitmap horizontal dans un rectangle vertical.

## Papier et matière

L’ancien shader associait des fibres horizontales et verticales à un bruit défini sur une grille carrée. Leur cumul, trop contrasté, donnait une impression de trame régulière et de pixels sur le papier.

Le shader `PAPER` utilise maintenant un bruit à support triangulaire, plusieurs rotations et des échelles distinctes. Les deux nappes de fibres croisées ont été retirées. Le grain fin est atténué lorsqu’il devient plus petit que le pixel affiché, avec un filtrage par dérivées écran. Le relief et les variations de luminosité du papier sont plus discrets ; la granulation reste surtout portée par les pigments.

Le champ des pigments passe à la définition Full HD. Le rendu utilise six lavis plus fins et une densité ajustée pour garder des transparences. Ce modèle reste une approximation picturale ; les limites physiques de la V1 restent applicables.

## Formats et affichage

| Format | Champ simulé | Export PNG |
| --- | --- | --- |
| Portrait 9:16 | 1 080 × 1 920 | 2 304 × 4 096 |
| Paysage HD 16:9 | 1 920 × 1 080 | 4 096 × 2 304 |

Un écran étroit orienté verticalement choisit le portrait au premier lancement. Le choix explicite de l’utilisateur et le paramètre URL `format` sont conservés. Le passage au portrait oriente ensemble les gestes, les masses de couleur et l’encre. Un changement de format rejoue la partition avec la même seed et les mêmes données audio.

Le bouton **Grand écran** masque les commandes et ajuste la toile au viewport sans la déformer. Il tente le plein écran natif si l’API est disponible. Sinon, le même bouton ouvre un mode de contemplation dans la page. Un toucher ou un déplacement de souris révèle Quitter. Échap permet aussi de sortir ; le raccourci F bascule le mode depuis la page.

Le grand écran ne recommence pas la peinture : seul le tampon d’affichage change. Le champ de simulation et la chronologie restent fixes. Le tampon de rendu tient compte du DPR et reste borné à 2,8 millions de pixels sur interface tactile et 4,2 millions sur ordinateur.

## Validation

- 23 tests Vitest passent. TypeScript strict et build Vite passent.
- Les nouveaux tests couvrent les dimensions réelles des champs, les exports, l’orientation commune de l’encre et de l’aquarelle, les marges et les budgets d’affichage.
- Deux œuvres ont été calculées avec les appels GL réels du moteur sous Mesa EGL, examinées en entier et en gros plan : portrait et paysage HD. Les PNG exportés ont été rouverts et décodés à leurs dimensions complètes.
- Un passage paysage → portrait → paysage, suivi du même replay, redonne exactement les pixels du premier paysage dans cet environnement : SHA-256 `2752d5c49ee74c93d42cabf627f182d1420b8a5cd7c2cb1bf78ad65df4316052`.
- Le format portrait a été contrôlé dans un viewport embarqué de 390 × 844 px. La toile conserve le rapport 9:16 et aucun débordement horizontal n’a été observé.
- Le mode Grand écran a été activé dans le navigateur de contrôle, sur ordinateur et dans le viewport mobile. Les commandes disparaissent, le rapport de la toile est conservé et le bouton Quitter fonctionne. La sortie par Échap a aussi été vérifiée avec le focus sur ce bouton. L’API native de plein écran n’étant pas activée dans ce navigateur distant, le mode dans la page a été vérifié.

Les images et les empreintes figurent dans `hd-studies/` et `hd-validation-egl.json`.

Le navigateur de contrôle ne fournit toujours pas de contexte WebGL2 : l’animation GPU a donc été vérifiée hors écran, sans mesure de fluidité sur un téléphone physique. Le champ Full HD demande plus de calcul que le champ V2. La durée réelle de l’animation peut augmenter sur un appareil lent ; aucun pas physique n’est sauté.

## Reproduire le rendu hors écran

Compiler `scripts/render-offscreen.ts` selon `VALIDATION.md`, puis :

```bash
node /tmp/haikuarelle-render.mjs /tmp/hd-trace.jsonl hd
python3 scripts/replay-egl.py /tmp/hd-trace.jsonl /tmp/hd-studies
```

Les anciennes images V1/V2 sont des références historiques ; elles ne décrivent pas le nouveau shader de papier.
