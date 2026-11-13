// Interface : rendu canvas, panneaux DOM, toasts.
import { UPGRADES, ACHIEVEMENTS, upgradeCost, canBuy, fmt, stepMs, appleBase, comboBonus,
  starMult, prestigeGain } from './economy.js';

const $ = (id) => document.getElementById(id);

export function draw(canvas, game, view) {
  const ctx = canvas.getContext('2d');
  const px = canvas.width;
  const cell = px / game.size;
  ctx.fillStyle = '#14151a';
  ctx.fillRect(0, 0, px, px);
  ctx.fillStyle = '#1b1d25';
  for (let y = 0; y < game.size; y++)
    for (let x = 0; x < game.size; x++)
      if ((x + y) % 2) ctx.fillRect(x * cell, y * cell, cell, cell);
  if (game.apple) {
    ctx.fillStyle = '#ff5c5c';
    ctx.beginPath();
    ctx.arc((game.apple.x + 0.5) * cell, (game.apple.y + 0.5) * cell, cell * 0.36, 0, Math.PI * 2);
    ctx.fill();
  }
  const hue = view.combo > 1 ? 50 : 140;
  game.snake.forEach((c, i) => {
    ctx.fillStyle = i === 0 ? `hsl(${hue},80%,65%)` : `hsl(${hue},65%,${48 - Math.min(i, 20)}%)`;
    ctx.fillRect(c.x * cell + 1, c.y * cell + 1, cell - 2, cell - 2);
  });
  if (!view.running) {
    ctx.fillStyle = 'rgba(0,0,0,.55)';
    ctx.fillRect(0, 0, px, px);
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${px / 16}px system-ui,sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(view.dead ? 'Perdu ! Touche / glisse' : 'Touche / glisse / flèches', px / 2, px / 2);
  }
}

export function renderStats(s, view) {
  $('coins').textContent = fmt(s.coins);
  $('combo').textContent = view.combo > 1 ? `Combo x${view.combo}` : '';
  $('info').textContent = `Pomme: ${fmt(appleBase(s) * starMult(s))} · Combo +${Math.round(comboBonus(s) * 100)}%/pomme · ` +
    `${(1000 / stepMs(s)).toFixed(1)} pas/s · ★ ${s.stars} (x${starMult(s).toFixed(1)})`;
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
    b.innerHTML = '<b></b><span></span><i></i>';
    b.children[0].textContent = `${u.name} (niv. ${lvl}${maxed ? ' MAX' : ''})`;
    b.children[1].textContent = u.desc;
    b.children[2].textContent = maxed ? '—' : `${fmt(upgradeCost(id, lvl))} 🪙`;
    b.addEventListener('click', () => onBuy(id));
    shop.appendChild(b);
  }
  const gain = prestigeGain(s);
  const p = $('prestige');
  p.disabled = gain < 1;
  p.textContent = gain < 1 ? 'Prestige : gagne plus de pièces (≥ 1 000)' : `Prestige : +${gain} ★ (+${gain * 10}% pièces, remise à zéro)`;
  p.onclick = onPrestige;
}

export function renderAchievements(s) {
  const el = $('achievements');
  el.textContent = '';
  for (const a of ACHIEVEMENTS) {
    const li = document.createElement('li');
    const got = !!s.achievements[a.id];
    li.className = got ? 'got' : '';
    li.textContent = (got ? '🏆 ' : '🔒 ') + a.name;
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
