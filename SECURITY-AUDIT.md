# Audit de sécurité V1 / V1 security audit

Portée : tout le code de `feat/v1` (site statique sans build, sans dépendance, sans backend).

| Zone | Constat | Statut |
|---|---|---|
| XSS / innerHTML | Un seul `innerHTML` (gabarit statique du bouton d'amélioration). Aucune donnée de la sauvegarde n'y passait, mais supprimé : tout le DOM dynamique utilise `textContent` / `createElement`. Pas d'`eval`, ni `document.write`. | Corrigé |
| Sauvegarde localStorage non fiable | Nombres non bornés (1e308 → Infinity/NaN) et clés de succès arbitraires acceptées. Désormais : nombres bornés [0 ; 1e15], niveaux entiers plafonnés, `hasOwn`, succès limités aux identifiants connus (pas de `__proto__`). JSON invalide → état neuf. Tests ajoutés. | Corrigé |
| Dépendances | Aucune (ni runtime, ni dev) ; pas de CDN, pas de police externe. | RAS |
| CSP / en-têtes | Ajout d'une CSP en `<meta>` (`default-src 'none'`, script/style `'self'`, `connect-src 'none'`, `base-uri`/`form-action 'none'`) et `referrer no-referrer`. Liens externes en `rel="noopener noreferrer"`. `frame-ancestors`, HSTS, `X-Content-Type-Options`, `X-Frame-Options` ne se posent qu'en en-têtes HTTP : à régler côté Traefik/Dokploy (à relayer à Yann). | Partiel |
| Secrets | Recherche de clés/jetons/URL privées dans le code et l'historique de la branche : rien. | RAS |
| Autres | Pas d'entrée réseau, pas de postMessage, pas de stockage tiers ; audio WebAudio démarré au geste. | RAS |

## Complément 2026-11-13 : en-têtes HTTP / HTTP headers addendum

Constat sur https://snake.opengamingstudio.com : HTTP 200, `server: nginx/1.31.8` (version exposée), aucun en-tête de sécurité.

| Zone | Constat | Statut |
|---|---|---|
| Fuite de version | `Server: nginx/1.31.8`. `server_tokens off` dans `nginx.conf` (vérifié : `Server: nginx`). | Corrigé |
| CSP en en-tête | Même politique que la `<meta>` + `frame-ancestors 'none'` et `manifest-src 'self'` (impossibles en `<meta>`). Compatible Tailwind (CSS compilé dans `style.css`, aucun style inline) et canvas (aucun `eval`, ni script/style inline). | Corrigé |
| HSTS | `max-age=31536000; includeSubDomains` (effectif via HTTPS, assuré par Traefik). Pas de `preload` : engagement irréversible, à décider par Victor. | Corrigé |
| Sniffing / clickjacking | `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`. | Corrigé |
| Referrer / capteurs | `Referrer-Policy: no-referrer`, `Permissions-Policy` coupant caméra, micro, géoloc, capteurs, paiement, USB ; `Cross-Origin-Opener-Policy: same-origin`. | Corrigé |
| Fichiers cachés | `location ~ /\.` refusé (hors `.well-known`) : `/.git/config` → 404. | Corrigé |
| Pièges | `add_header` dans un `location` annulerait les en-têtes du `server` : noté dans le fichier. | Info |

Vérification : image construite (`Dockerfile`) et testée avec `curl -I` en local. Reste à contrôler après déploiement : `curl -I https://snake.opengamingstudio.com`. Si Traefik ajoute déjà certains en-têtes, ils seraient en double (à vérifier).
