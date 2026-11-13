// Interface : rendu canvas, panneaux DOM, toasts.
import { UPGRADES, ACHIEVEMENTS, upgradeCost, canBuy, fmt, stepMs, appleBase, comboBonus,
  starMult, prestigeGain } from './economy.js';

const $ = (id) => document.getElementById(id);

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

export function draw(canvas, game, view) {
  const ctx = canvas.getContext('2d');
  const c = colors();
  const px = canvas.width;
  const cell = px / game.size;
  ctx.fillStyle = c.paper;
  ctx.fillRect(0, 0, px, px);
  // papier millimétré : trait fin à chaque case, trait plus marqué toutes les 10 cases
  for (let i = 1; i < game.size; i++) {
    ctx.fillStyle = i % 10 === 0 ? c.major : c.grid;
    ctx.fillRect(Math.round(i * cell), 0, 1, px);
    ctx.fillRect(0, Math.round(i * cell), px, 1);
  }
  if (game.apple) {
    ctx.fillStyle = c.apple;
    ctx.beginPath();
    ctx.arc((game.apple.x + 0.5) * cell, (game.apple.y + 0.5) * cell, cell * 0.36, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = c.ink; ctx.stroke();
  }
  const body = view.combo > 1 ? c.hot : c.snake;
  // serpent : cases pleines à contour encre 2 px ; tête = carré encre intérieur et deux yeux
  game.snake.forEach((seg, i) => {
    const x = seg.x * cell, y = seg.y * cell;
    ctx.fillStyle = c.ink;
    ctx.fillRect(x, y, cell, cell);
    ctx.fillStyle = body;
    ctx.fillRect(x + 2, y + 2, cell - 4, cell - 4);
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
  if (!view.running) {
    const bh = px / 7;
    ctx.fillStyle = c.ink;
    ctx.fillRect(0, (px - bh) / 2, px, bh);
    ctx.fillStyle = c.paper;
    ctx.font = `700 ${px / 16}px Fredoka,sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(view.dead ? 'Perdu. Touche ou glisse' : 'Touche, glisse ou flèches', px / 2, px / 2);
  }
}

export function renderStats(s, view) {
  $('coins').textContent = fmt(s.coins);
  const combo = $('combo');
  combo.textContent = view.combo > 1 ? `Combo ×${view.combo}` : '';
  combo.classList.toggle('tampon', view.combo > 1);
  $('info').textContent = `Pomme ${fmt(appleBase(s) * starMult(s))} · Combo +${Math.round(comboBonus(s) * 100)} %/pomme · ` +
    `${(1000 / stepMs(s)).toFixed(1)} pas/s · Étoiles ${s.stars} (x${starMult(s).toFixed(1)})`;
}

export function renderShop(s, onBuy, onPrestige) {
  const shop = $('shop');
  shop.textContent = '';
  for (const id of Object.keys(UPGRADES)) {
    const u = UPGRADES[id];
    const lvl = s.levels[id];
    const maxed = lvl >= u.max;
    const cost = maxed ? 0 : upgradeCost(id, lvl);
    // une ligne du registre : nom ×niveau, effet, coût aligné à droite, bouton « Acheter »
    const row = document.createElement('div');
    row.className = 'upg';
    const name = document.createElement('b');
    name.textContent = u.name;
    const level = document.createElement('span');
    level.className = 'lvl';
    level.textContent = `×${lvl}`;
    name.appendChild(level);
    const desc = document.createElement('span');
    desc.className = 'desc';
    desc.textContent = u.desc;
    const price = document.createElement('span');
    price.className = 'cost';
    price.textContent = maxed ? 'MAX' : fmt(cost);
    const b = document.createElement('button');
    b.className = 'btn buy';
    b.disabled = !canBuy(s, id);
    // achat impossible : le coût manquant s'affiche, pas seulement un bouton grisé
    b.textContent = maxed ? 'Complet' : b.disabled ? `manque ${fmt(cost - s.coins)}` : 'Acheter';
    b.setAttribute('aria-label', maxed ? `${u.name} : niveau maximum` : `Acheter ${u.name} pour ${fmt(cost)} pièces`);
    b.addEventListener('click', () => onBuy(id));
    row.append(name, desc, price, b);
    shop.appendChild(row);
  }
  const gain = prestigeGain(s);
  const p = $('prestige');
  p.disabled = gain < 1;
  p.textContent = gain < 1 ? 'Prestige : gagne plus de pièces (dès 1 000)' : `Prestige : +${gain} étoile(s) (+${gain * 10} % pièces, remise à zéro)`;
  p.onclick = onPrestige;
}

export function renderAchievements(s) {
  const el = $('achievements');
  el.textContent = '';
  for (const a of ACHIEVEMENTS) {
    const li = document.createElement('li');
    const got = Object.hasOwn(s.achievements, a.id) && s.achievements[a.id] === true;
    li.className = got ? 'succes got relative py-1 pl-6' : 'succes relative py-1 pl-6 text-mine';
    li.textContent = a.name;
    el.appendChild(li);
  }
}

export function toast(text) {
  const t = document.createElement('div');
  t.className = 'casual tampon motion-safe-only animate-tampon text-ligne shadow-dure';
  t.textContent = text;
  $('toasts').appendChild(t);
  setTimeout(() => t.remove(), 2800);
}
