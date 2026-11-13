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
    palette = { paper: v('--color-quadrille'), grid: v('--color-trait'), major: v('--color-mine'), ink: v('--color-graphite'),
      snake: v('--color-chlorophylle'), apple: v('--color-signal'), hot: v('--color-laiton') };
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
  }
  const body = view.combo > 1 ? c.hot : c.snake;
  game.snake.forEach((seg, i) => {
    ctx.fillStyle = body;
    ctx.fillRect(seg.x * cell + 1, seg.y * cell + 1, cell - 2, cell - 2);
    if (i === 0) {
      ctx.fillStyle = c.ink;
      const m = cell * 0.3;
      ctx.fillRect(seg.x * cell + m, seg.y * cell + m, cell - 2 * m, cell - 2 * m);
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
  $('combo').textContent = view.combo > 1 ? `Combo x${view.combo}` : '';
  $('info').textContent = `Pomme ${fmt(appleBase(s) * starMult(s))} · Combo +${Math.round(comboBonus(s) * 100)} %/pomme · ` +
    `${(1000 / stepMs(s)).toFixed(1)} pas/s · Étoiles ${s.stars} (x${starMult(s).toFixed(1)})`;
}

export function renderShop(s, onBuy, onPrestige) {
  const shop = $('shop');
  shop.textContent = '';
  for (const id of Object.keys(UPGRADES)) {
    const u = UPGRADES[id];
    const lvl = s.levels[id];
    const b = document.createElement('button');
    b.className = 'upg';
    const maxed = lvl >= u.max;
    b.disabled = !canBuy(s, id);
    for (const tag of ['b', 'span', 'i']) b.appendChild(document.createElement(tag));
    b.children[0].textContent = `${u.name} (niv. ${lvl}${maxed ? ' MAX' : ''})`;
    b.children[1].textContent = u.desc;
    b.children[2].textContent = maxed ? '—' : fmt(upgradeCost(id, lvl));
    b.addEventListener('click', () => onBuy(id));
    shop.appendChild(b);
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
    li.className = got ? 'succes got relative py-1 pl-5' : 'succes relative py-1 pl-5 text-mine';
    li.textContent = a.name;
    el.appendChild(li);
  }
}

export function toast(text) {
  const t = document.createElement('div');
  t.className = 'casual rounded-papier border-l-4 border-signal bg-graphite px-3.5 py-2 text-quadrille';
  t.textContent = text;
  $('toasts').appendChild(t);
  setTimeout(() => t.remove(), 2800);
}
