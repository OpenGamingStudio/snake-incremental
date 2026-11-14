# Audit accessibilité (WCAG 2.2 AA) : branche `feat/a11y`

Méthode : build servi en local, Chrome 157 (headless), axe-core (règles wcag2a/2aa/21aa/22aa + best-practice), Lighthouse 11 (catégories accessibilité et bonnes pratiques, profil mobile), scripts Puppeteer pour le clavier. Vues testées : mobile 390 px, bureau 1280 px, dialogue Options ouvert, réflux 320 px, mode daltonien + texte 150 % + animations réduites.

## Avant / après

| Mesure | `main` (avant) | `feat/a11y` (après) |
|---|---|---|
| axe, violations (mobile, bureau, dialogue Options) | 0 | 0 |
| axe, mode daltonien + texte 150 % | n/a | 0 |
| Lighthouse accessibilité / bonnes pratiques | 100 / 100 | 100 / 100 |
| Cibles < 44 px (boutons, liens, champs) | 0 | 0 |
| Défilement horizontal à 320 px (réflux, zoom 400 %) | aucun | aucun |

Les scores automatiques étaient déjà au maximum : le gain est dans ce que les outils ne mesurent pas.

## Ce qui change

- **Clavier** : touches remappables (Haut, Bas, Gauche, Droite, Pause) dans Options, avec refus des doublons et des touches réservées (Tab, Entrée, Espace), Échap pour annuler, retour aux touches par défaut ; lien d'évitement « Aller au jeu » ; focus visible (contour encre 3 px) sur boutons, liens, listes, curseur, plateau.
- **Pause à tout moment** : bouton Pause (en-tête, état `aria-pressed`), touche Pause remappable, pause automatique à l'ouverture d'un dialogue et quand l'onglet est masqué.
- **Lecteur d'écran** : registre en liste (`role=list/listitem`), niveau lu « Niveau 3 sur 25 », nom accessible des achats avec valeur complète (« Acheter · 1,2 k, soit 1 234 pièces… »), compteur et ligne de gains lus en valeur complète (jamais « k / M »), région `aria-live` pour achats, combos, mort, plateau rempli, prestige, queue raccourcie ; option « Annoncer chaque pomme » (désactivée par défaut) ; la raison d'un prestige indisponible est liée au bouton.
- **Sans la couleur seule** : combo actif = point au centre des cases du serpent + texte « Combo ×N » ; pomme ronde, serpent carré ; boutons désactivés en pointillé ; interrupteurs avec texte Activé/Désactivé.
- **Mode daltonien** : palette Okabe-Ito (bleu ciel, vermillon sombre, papier gris-bleu), contrastes recalculés ≥ 4,5:1 ; axe : 0 violation.
- **Vitesse réduite et mode assisté** : vitesse 100 / 75 / 50 / 35 % ; mode assisté = murs traversants et queue raccourcie au lieu de la mort.
- **Mouvements** : option « Animations : réduites » en plus de `prefers-reduced-motion` ; pas de secousse ; un seul flash miel de 120 ms au maximum (sous le seuil de 3 flashs/s).
- **Son** : curseur de volume 0-100 % en plus du bouton muet ; vibrations désactivables.
- **Texte** : tout en rem ; option 100 / 125 / 150 % ; en-tête et compteur s'adaptent (plus de bandeau collant au-delà de 100 %) ; réflux 320 px sans défilement horizontal.
- **Mobile** : cibles 44 px et plus, croix 56 px ; les infos de gains masquées en mobile restent lues par le lecteur d'écran.
- `lang="fr"` conservé ; aucun dégradé ; Tailwind et Fredoka conservés.

## Test clavier (scripté, Puppeteer)

Tab → « Aller au jeu » ; Entrée sur « Jouer » démarre ; flèches dirigent ; `P` met en pause, le bouton Pause reprend ; dans Options, `P` est refusé pour « Haut » (déjà Pause), `I` accepté ; Échap pendant la capture annule sans fermer le dialogue, puis Échap ferme ; les options et touches persistent après rechargement ; la touche remappée pilote le serpent. Aucune erreur console.

## Test lecteur d'écran : limite

Ce serveur n'a ni NVDA, ni VoiceOver, ni Orca. Faute de mieux, contrôle de l'arbre d'accessibilité de Chrome (noms, rôles, états, valeurs complètes des nombres) et relevé de la région `aria-live` pendant une partie : « Vitesse niveau 1 », « Mur ! Longueur 3, +0 pièces cette partie. ». **Un passage réel NVDA / VoiceOver / Orca reste à faire par une personne** avant de parler de conformité certifiée.

## Reste à surveiller

- Un audit manuel complet WCAG (2.4.11 focus non masqué par le bandeau collant en mobile, tests utilisateurs) n'est pas couvert par les outils automatiques.
