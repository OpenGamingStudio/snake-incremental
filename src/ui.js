// Interface : rendu canvas, panneaux DOM, toasts.
import { UPGRADES, ACHIEVEMENTS, upgradeCost, canBuy, fmt, stepMs, appleBase, comboBonus,
  starMult, prestigeGain } from './economy.js';

const $ = (id) => document.getElementById(id);

export function draw(canvas, game, view) {
  const ctx = canvas.getContext('2d');
  const px = canvas.width;
  const cell = px / game.size;
  ctx.fillStyle = '#10130e';
  ctx.fillRect(0, 0, px, px);
  ctx.fillStyle = '#151911';
  for (let y = 0; y < game.size; y++)
    for (let x = 0; x < game.size; x++)
      if ((x + y) % 2) ctx.fillRect(x * cell, y * cell, cell, cell);
  if (game.apple) {
    ctx.fillStyle = '#e8452c';
    ctx.beginPath();
    ctx.arc((game.apple.x + 0.5) * cell, (game.apple.y + 0.5) * cell, cell * 0.36, 0, Math.PI * 2);
    ctx.fill();
  }
  const hot = view.combo > 1;
  const head = hot ? '#f0b429' : '#d6f56a';
  const body = hot ? '#c88f12' : '#8fb52a';
  game.snake.forEach((c, i) => {
    ctx.fillStyle = i === 0 ? head : body;
    ctx.fillRect(c.x * cell + 1, c.y * cell + 1, cell - 2, cell - 2);
  });
  if (!view.running) {
    const bh = px / 7;
    ctx.fillStyle = '#10130e';
    ctx.fillRect(0, (px - bh) / 2, px, bh);
    ctx.fillStyle = '#e9ecdf';
    ctx.font = `bold ${px / 16}px system-ui,sans-serif`;
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
    const got = !!s.achievements[a.id];
    li.className = got ? 'got' : '';
    li.textContent = a.name;
    el.appendChild(li);
  }
}

export function toast(text) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = text;
  $('toasts').appendChild(t);
  setTimeout(() => t.remove(), 2800);
}
