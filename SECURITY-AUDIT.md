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
