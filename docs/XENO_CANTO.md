# Préparer des chants depuis Xeno-canto

L’application utilise des MP3 locaux dans `public/birds/`. Le script de préparation utilise l’API v3 de Xeno-canto, sans ajouter de dépendance réseau pendant la peinture. La clé ne doit jamais être placée dans les fichiers publics, le code frontend, une URL partagée ou les crédits.

## Rechercher puis écouter

```sh
python scripts/xeno-canto.py --species "Pica pica"
```

Le script demande la clé avec une saisie masquée. Il peut aussi lire `XENO_CANTO_API_KEY` dans l’environnement du processus ; il ne lit pas automatiquement les fichiers `.env`. Il ne conserve pas la clé et ne l’affiche pas dans les erreurs réseau.

Les résultats de qualité A sont filtrés vers les licences CC0, CC BY et CC BY-SA. La recherche présente une page à la fois (`--page 2` pour la suivante). Un résultat vide ne prouve pas l’absence d’autres enregistrements. Les liens permettent d’écouter les candidats et de choisir une prise claire, sans autres espèces dominantes, adaptée à la signature sonore souhaitée. Un chant ou un cri peut être pertinent suivant l’oiseau.

## Télécharger un enregistrement choisi

```sh
python scripts/xeno-canto.py --download 123456
```

Remplacer le numéro par celui réellement sélectionné. L’original et ses métadonnées sont déposés dans `/tmp/haikuarelle-xeno-canto/` par défaut ; `--directory` permet de choisir un dossier durable. Le script refuse les licences hors sélection et les fichiers déjà présents. Il conserve l’auteur, la licence, le lien de l’enregistrement et l’empreinte SHA-256. Aucune modification de l’application n’est automatique.

## Intégrer après écoute

1. Choisir un extrait musicalement pertinent ; harmoniser son volume et appliquer des fondus courts avec les outils audio utilisés pour les autres oiseaux.
2. Remplacer le MP3 de l’oiseau dans `public/birds/` après comparaison du son et de sa réponse picturale.
3. Actualiser `public/birds/credits.json` (auteur, source, licence, transformations, durée et empreintes), ainsi que la source/auteur dans `src/birds/catalog.ts`.
4. Régénérer les crédits avec `python scripts/generate-bird-credits.py`, puis lancer les tests et la compilation.

Respecter les conditions d’attribution et de partage à l’identique des enregistrements concernés et de leurs adaptations.

## Limite de validation dans le cloud

Lors de la préparation, le proxy de cet environnement refuse la connexion à `xeno-canto.org` et `www.xeno-canto.org` avec un refus de tunnel HTTP 403. L’authentification, les résultats réels de l’API et le téléchargement doivent donc encore être validés depuis une connexion qui autorise ce domaine. Aucun chant existant n’a été remplacé.
