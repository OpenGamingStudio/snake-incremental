# Contribuer à Snake Incremental

Merci de votre intérêt ! Ce document ne couvre que ce qui est **propre à ce jeu**.
Les règles communes à tous les projets d'OpenGamingStudio (branches `feat/` et `fix/`,
Conventional Commits, tests, revue, documentation des bibliothèques, aucun secret dans le dépôt,
PR externe depuis un fork) sont dans le dépôt
[OpenGamingStudio/.github](https://github.com/OpenGamingStudio/.github) : lisez-les d'abord.

*English summary: this file only covers game-specific expectations; shared studio rules live in
[OpenGamingStudio/.github](https://github.com/OpenGamingStudio/.github).*

## 1. Stack

- HTML, CSS et JavaScript (modules ES) **statiques** : pas de framework, pas d'étape de build, pas de bundler.
- Rendu du jeu sur `<canvas>` ; interface (boutique d'améliorations, stats) en DOM.
- Sauvegarde dans `localStorage`, rien côté serveur.
- Le site est servi tel quel (déploiement statique) : ce qui est dans le dépôt est ce qui est en ligne.
- Toute dépendance externe doit être justifiée dans la PR ; par défaut, on n'en ajoute pas.

## 2. Lancer et tester en local

Il faut seulement un serveur de fichiers statiques (les modules ES ne fonctionnent pas en `file://`) :

```bash
git clone https://github.com/OpenGamingStudio/snake-incremental.git
cd snake-incremental
python3 -m http.server 8000      # ou : npx serve .
```

Ouvrez <http://localhost:8000>. Pour tester sur mobile, servez sur le réseau local
(`python3 -m http.server 8000 --bind 0.0.0.0`) et ouvrez `http://<ip-de-votre-machine>:8000`,
ou utilisez le mode appareil des outils de développement du navigateur.

Avant d'ouvrir une PR :

- jouez une partie complète du début jusqu'à la première amélioration achetée, console ouverte : **aucune erreur** ;
- si des tests existent dans `tests/` (fichiers nommés `tests/*.test.js`, sinon Node les ignore), lancez-les avec Node ≥ 18 : `npm test` (`node --test`) ; une logique de moteur ou d'économie
  nouvelle ou modifiée doit venir avec ses tests (le code pur, sans DOM, se teste directement avec Node) ;
- testez avec une sauvegarde existante **et** sans sauvegarde (vider le `localStorage`).

## 3. Structure du code

Le code est séparé en quatre couches. Une couche ne dépend que de celles listées :

| Dossier | Rôle | Peut dépendre de |
|---|---|---|
| `src/engine/` | boucle de jeu, déplacement du serpent, collisions, apparition des récompenses ; logique pure, sans DOM | `src/economy/` |
| `src/economy/` | monnaies, coûts, améliorations, formules de progression ; données et fonctions pures | rien |
| `src/ui/` | rendu canvas, boutique, HUD, contrôles clavier et tactiles | `engine`, `economy` |
| `src/audio/` | sons et musique (Web Audio), réglages de volume | rien |

Règles : la logique de jeu ne touche jamais au DOM ; les nombres d'équilibrage vivent dans
`src/economy/` (pas de « nombre magique » dans l'UI ou le moteur) ; le moteur est avancé par un pas
de temps fixe, indépendant de la fréquence d'affichage.
Si vous devez déroger à cette organisation, expliquez pourquoi dans la PR.

## 4. Ce que nous attendons d'une contribution

### Équilibrage

- Tout changement de coût, de gain ou de formule indique, dans la PR, **les chiffres avant/après**
  et la raison (ex. : temps estimé pour atteindre la 5e amélioration).
- Pas de rupture de courbe : une amélioration ne doit pas rendre les précédentes inutiles, ni
  créer un mur ou un raccourci qui casse le rythme des récompenses. Joignez, si possible, un tableau
  ou un petit script qui simule la progression.
- Les formules doivent rester raisonnables à grande échelle (pas de dépassement ni de perte de
  précision gênante sur les très grands nombres).

### Sauvegarde

- La sauvegarde est **versionnée** : le format contient un numéro de version.
- Tout changement de format ajoute une **migration** de la version précédente vers la nouvelle,
  testée avec une sauvegarde de l'ancienne version. Une sauvegarde de joueur ne doit jamais être
  perdue ni rendue invalide silencieusement.
- Une sauvegarde corrompue ou inconnue ne fait pas planter le jeu : on garde une copie de l'ancienne
  et on repart proprement.
- Ne jamais renommer ou supprimer une clé `localStorage` sans migration.

### Jouabilité mobile

- Jouable au doigt (écran tactile, orientation portrait comprise), sans clavier.
- Zones tactiles d'au moins 44 px, pas de zoom ou de défilement de page involontaire pendant la partie.
- Le jeu reste fluide sur un téléphone d'entrée de gamme : évitez les allocations à chaque image et le
  rendu inutile.
- Le son ne démarre qu'après une action du joueur (règle des navigateurs) et peut être coupé.

## Licence

En contribuant, vous acceptez que votre code soit publié sous licence [MIT](LICENSE).

## Tri des contributions

Chaque issue et chaque PR passe par un tri avant d'être étudiée par l'équipe.

1. **Accusé de réception** sous environ 1 h, avec l'étiquette `triage:en-cours`.
2. **Tri** sur trois critères :
   - **cohérence** : la contribution respecte l'esprit du jeu et les règles de ce fichier ;
   - **pertinence** : elle apporte quelque chose d'utile et ne fait pas doublon ;
   - **fonctionnement** : le jeu se lance et reste jouable (navigateur et mobile).
3. **Décision** :
   - `triage:valide` : la contribution passe ensuite à la validation par les développeurs du studio ;
   - `triage:rejete` : un commentaire en donne le motif, puis l'issue ou la PR est fermée.
