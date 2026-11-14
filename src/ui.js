// Interface : rendu canvas, compteur, registre, prestige, succès, toasts.
import { UPGRADES, ACHIEVEMENTS, upgradeCost, canBuy, stepMs, appleBase, comboBonus, comboMult,
  starMult, prestigeGain, gridSize } from './economy.js';
import { fmtShort, fmtCount, fmtDuration } from './format.js';

const $ = (id) => document.getElementById(id);
const SVG = 'http://www.w3.org/2000/svg';
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Préférences d'affichage (notation), fixées par main.js.
export const prefs = { sci: false };
const short = (n) => fmtShort(n, prefs.sci);

// Couleurs lues dans les variables CSS de :root (identité unique dans src/css/input.css).
let palette = null;
function colors() {
  if (!palette) {
    const cs = getComputedStyle(document.documentElement);
    const v = (n) => cs.getPropertyValue(n).trim();
    palette = { paper: v('--color-quadrille'), grid: v('--color-trait'), major: v('--color-mine'), ink: v('--color-encre'),
      snake: v('--color-chlorophylle'), apple: v('--color-framboise'), hot: v('--color-miel') };
  }
  return palette;
}

// Netteté : le canvas suit sa taille CSS × devicePixelRatio.
export function fitCanvas(canvas) {
  const side = Math.max(1, Math.round(canvas.clientWidth * (window.devicePixelRatio || 1)));
  if (canvas.width !== side) { canvas.width = side; canvas.height = side; }
}

export function draw(canvas, game, view) {
  const ctx = canvas.getContext('2d');
  const c = colors();
  const px = canvas.width;
  const cell = px / game.size;
  const line = Math.max(1, Math.round(px / 480));
  ctx.fillStyle = c.paper;
  ctx.fillRect(0, 0, px, px);
  // papier millimétré : trait fin à chaque case, trait plus marqué toutes les 10 cases
  for (let i = 1; i < game.size; i++) {
    ctx.fillStyle = i % 10 === 0 ? c.major : c.grid;
    ctx.fillRect(Math.round(i * cell), 0, line, px);
    ctx.fillRect(0, Math.round(i * cell), px, line);
  }
  const edge = Math.max(2, Math.round(cell * 0.09));
  if (game.apple) {
    ctx.fillStyle = c.apple;
    ctx.beginPath();
    ctx.arc((game.apple.x + 0.5) * cell, (game.apple.y + 0.5) * cell, cell * 0.36, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = edge; ctx.strokeStyle = c.ink; ctx.stroke();
  }
  const body = view.combo > 1 ? c.hot : c.snake;
  // serpent : cases pleines à contour encre ; tête = carré encre intérieur et deux yeux
  game.snake.forEach((seg, i) => {
    const x = seg.x * cell, y = seg.y * cell;
    ctx.fillStyle = c.ink;
    ctx.fillRect(x, y, cell, cell);
    ctx.fillStyle = body;
    ctx.fillRect(x + edge, y + edge, cell - 2 * edge, cell - 2 * edge);
    if (i === 0) {
      ctx.fillStyle = c.ink;
      const m = cell * 0.22;
      ctx.fillRect(x + m, y + m, cell - 2 * m, cell - 2 * m);
      ctx.fillStyle = c.paper;
      const e = Math.max(2, cell * 0.14);
      ctx.fillRect(x + cell * 0.3, y + cell * 0.36, e, e);
      ctx.fillRect(x + cell * 0.7 - e, y + cell * 0.36, e, e);
    }
  });
}

// Compteur : un caractère par boîte de largeur fixe, la largeur ne bouge pas à nombre de chiffres égal.
let lastCoins = '';
export function renderStats(s, view, rate) {
  const text = fmtCount(s.coins, prefs.sci);
  if (text !== lastCoins) {
    lastCoins = text;
    const box = $('coins');
    box.textContent = '';
    for (const ch of text) {
      const span = document.createElement('span');
      span.className = /[0-9]/.test(ch) ? 'c' : ch.trim() ? 'l' : 's';
      span.textContent = ch;
      box.appendChild(span);
    }
    $('coinsTxt').textContent = `${text} pièces`;
  }
  const combo = $('combo');
  combo.textContent = `Combo ×${view.combo}`;
  combo.classList.toggle('chaud', view.combo > 1);
  $('best').textContent = `meilleur ×${s.bestCombo}`;
  $('starsTxt').textContent = `${s.stars} (+${Math.round((starMult(s) - 1) * 100)} %)`;
  $('stars').setAttribute('aria-label', `${s.stars} étoiles, bonus +${Math.round((starMult(s) - 1) * 100)} %`);
  $('info').textContent = `Pomme ${short(appleBase(s) * starMult(s))} · combo +${Math.round(comboBonus(s) * 100)} % par pomme · ` +
    `${(1000 / stepMs(s)).toFixed(1).replace('.', ',')} pas/s · ${rate > 0 ? short(rate) : '—'} pièces/s`;
}

// « +12 » qui monte et s'efface (600 ms), sauf mouvements réduits.
export function flyGain(v) {
  if (reduced()) return;
  const el = $('fly');
  el.textContent = `+${short(v)}`;
  el.classList.remove('go');
  void el.offsetWidth;
  el.classList.add('go');
}

// Effet du prochain niveau, en clair.
function nextEffect(s, id) {
  const lvl = s.levels[id];
  if (id === 'speed') {
    const next = stepMs({ levels: { ...s.levels, speed: lvl + 1 } });
    const gain = Math.round((stepMs(s) / next - 1) * 100);
    return gain > 0 ? `+${gain} % vitesse` : 'vitesse au plafond';
  }
  if (id === 'value') return '+50 % par pomme';
  if (id === 'combo') return '+10 % par pomme enchaînée';
  if (id === 'grid') return `grille ${gridSize(s) + 1}×${gridSize(s) + 1}`;
  return 'traverse les murs';
}

// Part de gain/s apportée par le prochain niveau (null : pas d'estimation honnête).
function gainShare(s, id, combo) {
  const lvl = s.levels[id];
  if (id === 'speed') return stepMs(s) / stepMs({ levels: { ...s.levels, speed: lvl + 1 } }) - 1;
  if (id === 'value') return 0.5;
  if (id === 'combo') {
    const c = Math.max(combo, s.bestCombo > 1 ? Math.ceil(s.bestCombo / 2) : 1);
    return comboMult({ levels: { ...s.levels, combo: lvl + 1 } }, c) / comboMult(s, c) - 1;
  }
  return null;
}

const rows = new Map();
let filterBuyable = false;

function buildShop(onBuy) {
  const shop = $('shop');
  for (const id of Object.keys(UPGRADES)) {
    const u = UPGRADES[id];
    const row = document.createElement('div');
    row.className = 'upg';
    const mk = (tag, cls, parent = row) => { const e = document.createElement(tag); e.className = cls; parent.appendChild(e); return e; };
    const name = mk('div', 'upg-nom');
    mk('b', '', name).textContent = u.name;
    mk('span', '', name).textContent = u.desc;
    const level = mk('span', 'upg-niveau');
    const effect = mk('span', 'upg-effet');
    const payback = mk('span', 'upg-retour');
    const cell = mk('div', 'upg-achat');
    const btn = mk('button', 'btn buy', cell);
    const missing = mk('span', 'manque', cell);
    const gauge = mk('div', 'jauge', cell);
    const fill = mk('i', '', gauge);
    const max = mk('span', 'max', cell);
    max.textContent = 'MAX';
    btn.addEventListener('click', () => { if (btn.getAttribute('aria-disabled') !== 'true') onBuy(id); });
    row.addEventListener('animationend', () => row.classList.remove('flash'));
    level.addEventListener('animationend', () => level.classList.remove('bond'));
    shop.appendChild(row);
    rows.set(id, { row, level, effect, payback, btn, missing, gauge, fill, max, lvl: -1, could: null });
  }
}

// Registre : lignes mises à jour en place (le focus reste sur le bouton utilisé).
export function renderShop(s, onBuy, rate, combo) {
  if (!rows.size) buildShop(onBuy);
  let shown = 0;
  for (const [id, r] of rows) {
    const u = UPGRADES[id];
    const lvl = s.levels[id];
    const maxed = lvl >= u.max;
    const cost = maxed ? 0 : upgradeCost(id, lvl);
    const can = canBuy(s, id);
    if (r.lvl !== lvl) {
      if (r.lvl >= 0 && lvl > r.lvl && !reduced()) r.level.classList.add('bond');
      r.lvl = lvl;
      r.level.textContent = `×${lvl} / ${u.max}`;
    }
    r.effect.textContent = maxed ? 'niveau maximum' : nextEffect(s, id);
    const share = maxed ? null : gainShare(s, id, combo);
    r.payback.textContent = maxed ? '' : share && rate > 0 ? `Rentabilisé en ${fmtDuration(cost / (rate * share))}` : 'Rentabilisé en —';
    r.btn.hidden = maxed;
    r.max.hidden = !maxed;
    r.missing.hidden = maxed || can;
    r.gauge.hidden = maxed || can;
    if (!maxed) {
      r.btn.textContent = `Acheter · ${short(cost)}`;
      r.btn.setAttribute('aria-disabled', String(!can));
      // le nom accessible commence par le texte visible (WCAG 2.5.3)
      r.btn.setAttribute('aria-label', `Acheter · ${short(cost)} pièces : ${u.name}, niveau ${lvl + 1}`
        + (can ? '' : `, manque ${short(Math.ceil(cost - s.coins))}`));
      if (!can) {
        r.missing.textContent = `manque ${short(Math.ceil(cost - s.coins))}`;
        r.fill.style.transform = `scaleX(${Math.max(0, Math.min(1, s.coins / cost)).toFixed(3)})`;
      }
    }
    // devient achetable : un seul flash miel
    if (r.could === false && can && !reduced()) r.row.classList.add('flash');
    r.could = can;
    r.row.hidden = filterBuyable && !can;
    if (!r.row.hidden) shown++;
  }
  $('shopVide').hidden = shown > 0;
}

export function setFilter(buyable) {
  filterBuyable = buyable;
  $('fAll').setAttribute('aria-pressed', String(!buyable));
  $('fBuy').setAttribute('aria-pressed', String(buyable));
}

// Bloc prestige : gain possible, raison écrite quand il est indisponible.
export function renderPrestige(s) {
  const gain = prestigeGain(s);
  const btn = $('prestige');
  btn.setAttribute('aria-disabled', String(gain < 1));
  $('prestigeTxt').textContent = gain < 1
    ? 'Prestige : aucune étoile à gagner pour l\'instant.'
    : `Prestige : +${gain} étoile${gain > 1 ? 's' : ''} (+${gain * 10} % de pièces).`;
  const need = 1000 - s.runEarned;
  $('prestigeRaison').textContent = gain < 1 ? `Il manque ${short(Math.ceil(need))} pièces gagnées dans cette série (1 000 pour la première étoile).` : '';
  return gain;
}

export function prestigeSummary(s) {
  const gain = prestigeGain(s);
  const pct = (n) => `+${n * 10} %`;
  return `Vous repartez à 0 pièce et niveau 0. Vous gagnez ${gain} étoile${gain > 1 ? 's' : ''} : ` +
    `${s.stars} → ${s.stars + gain}, bonus ${pct(s.stars)} → ${pct(s.stars + gain)}.`;
}

// Condition en clair des succès verrouillés.
const CONDITIONS = { a1: '1 pomme', a2: '50 pommes', a3: '500 pommes', c1: 'Combo ×5', c2: 'Combo ×15',
  l1: 'Longueur 15', l2: 'Longueur 40', m1: '1 000 pièces gagnées', m2: '100 000 pièces gagnées', u1: 'Vitesse niveau 10',
  g1: 'Grille 12×12', w1: 'Murs traversants', d1: '1 défaite', p1: '1 prestige', p2: '10 étoiles' };
const SHAPES = [
  ['circle', { cx: 50, cy: 50, r: 47 }],
  ['rect', { x: 4, y: 4, width: 92, height: 92, rx: 6 }],
  ['polygon', { points: '50,2 93,26 93,74 50,98 7,74 7,26' }],
];

export function renderAchievements(s) {
  const el = $('achievements');
  el.textContent = '';
  let n = 0;
  ACHIEVEMENTS.forEach((a, i) => {
    const got = Object.hasOwn(s.achievements, a.id) && s.achievements[a.id] === true;
    if (got) n++;
    const li = document.createElement('li');
    li.className = got ? 'tampon got' : 'tampon';
    const svg = document.createElementNS(SVG, 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('aria-hidden', 'true');
    const [tag, attrs] = SHAPES[i % SHAPES.length];
    const shape = document.createElementNS(SVG, tag);
    for (const k of Object.keys(attrs)) shape.setAttribute(k, attrs[k]);
    shape.setAttribute('class', 'forme');
    svg.appendChild(shape);
    const label = document.createElement('span');
    label.textContent = got ? a.name.replace(/ x(\d)/, ' ×$1') : CONDITIONS[a.id] || a.name;
    li.setAttribute('aria-label', got ? `Succès débloqué : ${a.name}` : `Succès verrouillé : ${CONDITIONS[a.id] || a.name}`);
    li.append(svg, label);
    el.appendChild(li);
  });
  $('succesN').textContent = `${n} / ${ACHIEVEMENTS.length}`;
}

// Toasts : 2 visibles au plus, 3 s.
export function toast(text) {
  const box = $('toasts');
  while (box.children.length >= 2) box.firstChild.remove();
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = text;
  box.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// Annonce discrète pour lecteur d'écran (paliers, achats).
export function announce(text) { $('annonce').textContent = text; }
