# Snake Incremental

Un snake incrémental addictif, plein de récompenses et de progression. Jouable dans le navigateur et sur mobile.

An addictive incremental snake game full of rewards and progression. Playable in the browser and on mobile.

- Jouer / Play : https://snake.opengamingstudio.com (bientôt / soon)
- Licence : [MIT](LICENSE)
- Projet de [OpenGamingStudio](https://github.com/OpenGamingStudio), studio de jeux web open source.

## Le jeu / The game

Dirige le serpent (flèches, WASD/ZQSD, glissement du doigt ou croix tactile), mange des pommes pour gagner des pièces, enchaîne-les pour le combo, achète des améliorations (vitesse, valeur des pommes, combo, taille de grille, murs traversants), puis fais un **prestige** pour gagner des ★ (+10 % de pièces chacune). Succès, sons WebAudio, sauvegarde automatique dans le `localStorage`.

Move the snake (arrows, WASD, swipe or on-screen pad), eat apples for coins, chain them for combos, buy upgrades, then **prestige** for permanent ★ bonuses. Achievements, WebAudio sounds, automatic `localStorage` save.

## Développement / Development

Site statique sans build : `python3 -m http.server 8000` puis http://localhost:8000. Structure : `src/engine.js` (snake), `src/economy.js` (améliorations, prestige, succès), `src/save.js`, `src/audio.js`, `src/ui.js`, `src/main.js` (boucle et entrées). Tests : `npm test` (`node --test tests/`, Node ≥ 18).

## Contribuer / Contributing

Les issues et les pull requests sont les bienvenues. Les contributions sont vérifiées (cohérence, pertinence, fonctionnement) puis relues par l'équipe avant fusion sur `main`.
Issues and pull requests are welcome. Contributions are checked (consistency, relevance, working state) and reviewed by the team before being merged into `main`.

## Styles (Tailwind CSS)

Le socle de styles est Tailwind CSS v4.3 (palette et typo du projet dans `src/css/input.css`, `@theme`). Le site est statique : `style.css` est généré et commité. Après toute modification du HTML, de `src/ui.js` ou de `src/css/input.css` :

```
tailwindcss -i src/css/input.css -o style.css --minify
```

(binaire autonome : https://github.com/tailwindlabs/tailwindcss/releases, aucune dépendance npm.) Aucun dégradé dans le projet.

## Déploiement / Deployment

Image nginx (`Dockerfile`) avec `nginx.conf` : `server_tokens off` et en-têtes de sécurité (CSP, HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, COOP). Test local : `docker build -t snake . && docker run --rm -p 8080:80 snake` puis `curl -I localhost:8080`. HSTS n'a d'effet que sur HTTPS (assuré par Traefik).

nginx image (`Dockerfile`) with `nginx.conf`: `server_tokens off` and security headers. HSTS only applies over HTTPS (handled by Traefik).
