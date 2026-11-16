// Dessin canvas du serpent, de la pomme et des cosmétiques (aplats, contours encre, sans dégradé).
// Les cosmétiques se calent sur la tête : visage dans le repère de la direction, chapeau posé sur le haut.
import { SKINS } from './cosmetics.js';

const TAU = Math.PI * 2;
const ANG = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function poly(ctx, pts) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
}
// remplit puis contourne la forme courante
function inked(ctx, fill, ink, lw) {
  ctx.fillStyle = fill; ctx.fill();
  ctx.lineWidth = lw; ctx.strokeStyle = ink; ctx.lineJoin = 'round'; ctx.stroke();
}
function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); }

// Chapeaux : repère centré sur la tête, unité = 1 case, le haut du crâne est à y = -0.5.
const HATS = {
  party(ctx, c, lw) {
    poly(ctx, [[-0.24, -0.42], [0.24, -0.42], [0, -1.08]]); inked(ctx, c.apple, c.ink, lw);
    ctx.fillStyle = c.hot; ctx.fillRect(-0.15, -0.62, 0.3, 0.09);
    circle(ctx, 0, -1.08, 0.1); inked(ctx, c.hot, c.ink, lw);
  },
  chef(ctx, c, lw) {
    for (const [x, y] of [[-0.2, -0.78], [0.2, -0.78], [0, -0.9]]) { circle(ctx, x, y, 0.2); inked(ctx, '#FFFFFF', c.ink, lw); }
    rr(ctx, -0.27, -0.66, 0.54, 0.26, 0.04); inked(ctx, '#FFFFFF', c.ink, lw);
  },
  tophat(ctx, c, lw) {
    rr(ctx, -0.27, -1.02, 0.54, 0.54, 0.04); inked(ctx, c.ink, c.ink, lw);
    ctx.fillStyle = c.apple; ctx.fillRect(-0.27, -0.66, 0.54, 0.1);
    rr(ctx, -0.42, -0.58, 0.84, 0.14, 0.05); inked(ctx, c.ink, c.ink, lw);
  },
  crown(ctx, c, lw) {
    poly(ctx, [[-0.34, -0.42], [-0.34, -0.9], [-0.17, -0.68], [0, -1.0], [0.17, -0.68], [0.34, -0.9], [0.34, -0.42]]);
    inked(ctx, c.hot, c.ink, lw);
    circle(ctx, 0, -0.56, 0.07); inked(ctx, c.apple, c.ink, lw * 0.6);
  },
  propeller(ctx, c, lw, t) {
    ctx.beginPath(); ctx.arc(0, -0.46, 0.34, Math.PI, 0); ctx.closePath(); inked(ctx, '#2D7FF9', c.ink, lw);
    ctx.fillStyle = c.ink; ctx.fillRect(-0.03, -0.96, 0.06, 0.2);
    const w = Math.abs(Math.cos(t * 14)) * 0.36 + 0.04;
    ctx.beginPath(); ctx.ellipse(0, -0.98, w, 0.06, 0, 0, TAU); inked(ctx, c.hot, c.ink, lw * 0.7);
  },
};

// Visages : repère tourné vers la direction (l'avant est +x, les yeux en (0.12, ±0.2)).
const FACES = {
  shades(ctx, c, lw) {
    rr(ctx, 0.0, -0.36, 0.3, 0.32, 0.08); inked(ctx, c.ink, c.ink, lw);
    rr(ctx, 0.0, 0.04, 0.3, 0.32, 0.08); inked(ctx, c.ink, c.ink, lw);
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0.05, -0.31, 0.06, 0.1); ctx.fillRect(0.05, 0.09, 0.06, 0.1);
  },
  mustache(ctx, c, lw) {
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(0.3, s * 0.13, 0.08, 0.14, 0, 0, TAU); inked(ctx, c.ink, c.ink, lw * 0.6); }
  },
  nose(ctx, c, lw) { circle(ctx, 0.4, 0, 0.14); inked(ctx, c.apple, c.ink, lw); },
};

export function drawHat(ctx, id, u, c, t) {
  const f = HATS[id]; if (!f) return;
  ctx.save(); ctx.scale(u, u); f(ctx, c, Math.max(0.045, 2 / u), t); ctx.restore();
}

function skinFill(skin, i, c) {
  const k = SKINS[skin] || SKINS.classic;
  return k.cols ? k.cols[i % k.cols.length] : (k.c || c.snake);
}

// Un segment : carré arrondi à contour encre, queue effilée, motif de la peau.
function drawSegment(ctx, x, y, cell, fill, skin, i, alongX, edge, c, scale, combo) {
  const s = cell * scale, o = (cell - s) / 2;
  rr(ctx, x + o, y + o, s, s, s * 0.3); ctx.fillStyle = c.ink; ctx.fill();
  const ins = edge * (scale < 1 ? 0.8 : 1);
  rr(ctx, x + o + ins, y + o + ins, s - 2 * ins, s - 2 * ins, s * 0.22);
  ctx.fillStyle = fill; ctx.fill();
  const k = SKINS[skin] || SKINS.classic;
  if (k.mark) {
    ctx.save(); ctx.clip(); ctx.fillStyle = k.m;
    if (k.mark === 'band' && i % 2 === 0) {
      if (alongX) ctx.fillRect(x + cell * 0.36, y, cell * 0.28, cell); else ctx.fillRect(x, y + cell * 0.36, cell, cell * 0.28);
    } else if (k.mark === 'dot') {
      circle(ctx, x + cell * 0.3, y + cell * 0.3, cell * 0.09); ctx.fill();
      circle(ctx, x + cell * 0.7, y + cell * 0.7, cell * 0.09); ctx.fill();
    } else if (k.mark === 'shine') {
      ctx.fillRect(x + cell * 0.2, y + cell * 0.2, cell * 0.22, cell * 0.1);
      ctx.fillRect(x + cell * 0.2, y + cell * 0.2, cell * 0.1, cell * 0.22);
    }
    ctx.restore();
  }
  if (combo > 1) { // combo actif : un point au centre, l'information ne repose pas sur la couleur seule
    circle(ctx, x + cell / 2, y + cell / 2, cell * 0.12); ctx.fillStyle = c.ink; ctx.fill();
  }
}

// Tête à (cx, cy) : yeux qui suivent la direction, clignement, langue, visage puis chapeau.
function drawHead(ctx, cx, cy, cell, dir, lo, t, c, fill, edge, combo) {
  const u = cell, lw = Math.max(1.5, u * 0.05);
  ctx.save();
  ctx.translate(cx, cy + (t ? Math.sin(t * 6) * u * 0.025 : 0));
  rr(ctx, -u / 2, -u / 2, u, u, u * 0.34); ctx.fillStyle = c.ink; ctx.fill();
  rr(ctx, -u / 2 + edge, -u / 2 + edge, u - 2 * edge, u - 2 * edge, u * 0.26); ctx.fillStyle = fill; ctx.fill();
  ctx.save();
  ctx.rotate(ANG[dir] ?? 0);
  if (t > 0 && t % 2.6 < 0.3) { // langue
    ctx.fillStyle = c.apple; ctx.fillRect(u * 0.45, -u * 0.035, u * 0.2, u * 0.07);
    ctx.fillRect(u * 0.62, -u * 0.1, u * 0.07, u * 0.07); ctx.fillRect(u * 0.62, u * 0.03, u * 0.07, u * 0.07);
  }
  const blink = t > 0 && t % 3.4 < 0.12;
  for (const s of [-1, 1]) {
    if (blink) { ctx.fillStyle = c.ink; ctx.fillRect(u * 0.07, s * u * 0.2 - u * 0.02, u * 0.2, u * 0.04); continue; }
    circle(ctx, u * 0.15, s * u * 0.2, u * 0.15); inked(ctx, '#FFFFFF', c.ink, lw);
    circle(ctx, u * 0.2, s * u * 0.2, u * 0.075); ctx.fillStyle = c.ink; ctx.fill();
  }
  if (lo.face !== 'none') { ctx.scale(u, u); FACES[lo.face]?.(ctx, c, lw / u); }
  ctx.restore();
  if (lo.hat !== 'none') {
    ctx.rotate(({ left: -0.1, right: 0.1 })[dir] ?? 0);
    drawHat(ctx, lo.hat, u, c, t);
  }
  ctx.restore();
  void combo;
}

export function drawApple(ctx, id, cx, cy, cell, c, t) {
  const u = cell, lw = Math.max(2, u * 0.07);
  ctx.save();
  ctx.translate(cx, cy);
  const pulse = t ? 1 + Math.sin(t * 5) * 0.05 : 1;
  ctx.scale(u * pulse, u * pulse);
  const w = lw / (u * pulse);
  if (id === 'cherry') {
    ctx.strokeStyle = c.ink; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(-0.17, 0.12); ctx.quadraticCurveTo(-0.05, -0.2, 0.1, -0.38);
    ctx.moveTo(0.18, 0.14); ctx.quadraticCurveTo(0.15, -0.1, 0.1, -0.38); ctx.stroke();
    for (const x of [-0.17, 0.18]) { circle(ctx, x, 0.17, 0.17); inked(ctx, c.apple, c.ink, w); }
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(-0.22, 0.1, 0.06, 0.06); ctx.fillRect(0.13, 0.12, 0.06, 0.06);
  } else if (id === 'donut') {
    circle(ctx, 0, 0, 0.36); inked(ctx, '#F6A5C0', c.ink, w);
    circle(ctx, 0, 0, 0.12); inked(ctx, c.paper, c.ink, w);
    const sp = [[-0.22, -0.12, '#FFC93C'], [0.2, -0.16, '#2D7FF9'], [0.18, 0.18, '#FFFFFF'], [-0.12, 0.22, '#2E9E4A'], [0.0, -0.27, '#D81E5B']];
    for (const [x, y, col] of sp) { ctx.fillStyle = col; ctx.fillRect(x - 0.035, y - 0.02, 0.07, 0.04); }
  } else if (id === 'gem') {
    const g = [[-0.22, -0.34], [0.22, -0.34], [0.4, -0.08], [0, 0.4], [-0.4, -0.08]];
    poly(ctx, g); inked(ctx, '#3DD6E8', c.ink, w);
    ctx.fillStyle = '#B8F3FA'; poly(ctx, [[-0.22, -0.34], [-0.08, -0.08], [-0.4, -0.08]]); ctx.fill();
    ctx.strokeStyle = c.ink; ctx.lineWidth = w * 0.6; ctx.beginPath(); ctx.moveTo(-0.4, -0.08); ctx.lineTo(0.4, -0.08); ctx.moveTo(-0.08, -0.08); ctx.lineTo(0, 0.4); ctx.moveTo(0.08, -0.08); ctx.lineTo(0, 0.4); ctx.stroke();
  } else if (id === 'star') {
    ctx.rotate(t ? Math.sin(t * 3) * 0.2 : 0);
    const pts = [];
    for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.17 : 0.42, a = -Math.PI / 2 + i * Math.PI / 5; pts.push([Math.cos(a) * r, Math.sin(a) * r]); }
    poly(ctx, pts); inked(ctx, c.hot, c.ink, w);
  } else {
    circle(ctx, 0, 0.04, 0.34); inked(ctx, c.apple, c.ink, w);
    ctx.fillStyle = c.ink; ctx.fillRect(-0.025, -0.4, 0.05, 0.14);
    poly(ctx, [[0.02, -0.3], [0.26, -0.4], [0.2, -0.2]]); inked(ctx, c.snake, c.ink, w * 0.7);
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(-0.22, -0.08, 0.07, 0.12);
  }
  ctx.restore();
}

// Serpent entier. snake : cases { x, y } (tête en premier), dir : direction de la tête.
export function drawSnake(ctx, snake, cell, dir, lo, t, c, combo) {
  const edge = Math.max(2, Math.round(cell * 0.09));
  const hot = combo > 1 && lo.skin === 'classic';
  for (let i = snake.length - 1; i >= 1; i--) {
    const seg = snake[i], ref = snake[i - 1];
    drawSegment(ctx, seg.x * cell, seg.y * cell, cell, hot ? c.hot : skinFill(lo.skin, i, c), lo.skin, i,
      ref.y === seg.y, edge, c, i === snake.length - 1 && snake.length > 3 ? 0.78 : 1, combo);
  }
  const h = snake[0];
  drawHead(ctx, (h.x + 0.5) * cell, (h.y + 0.5) * cell, cell, dir, lo, t, c,
    hot ? c.hot : skinFill(lo.skin, 0, c), edge, combo);
}

// Aperçu d'une vignette ou de la grande scène de la garde-robe.
export function drawPreview(canvas, lo, c, t, slot) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.fillStyle = c.paper; ctx.fillRect(0, 0, w, h);
  if (slot === 'apple') { drawApple(ctx, lo.apple, w / 2, h / 2, w * 0.7, c, t); return; }
  if (slot === 'scene') {
    const cell = h / 3.2;
    ctx.save(); ctx.translate(w / 2 - cell * 2.6, cell * 0.55);
    const body = [{ x: 3, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 1 }, { x: 0, y: 1 }, { x: 0, y: 2 }];
    drawSnake(ctx, body, cell, 'right', lo, t, c, 0);
    drawApple(ctx, lo.apple, 4.6 * cell, 1.5 * cell, cell * 0.9, c, t);
    ctx.restore();
    return;
  }
  const cell = h * (slot === 'hat' ? 0.5 : 0.62);
  ctx.save(); ctx.translate(w / 2 - cell * (slot === 'skin' ? 0.7 : 0.5), h * (slot === 'hat' ? 0.68 : 0.5) - cell / 2);
  const snake = slot === 'skin' ? [{ x: 1.2, y: 0 }, { x: 0.2, y: 0 }, { x: -0.8, y: 0 }] : [{ x: 0, y: 0 }];
  drawSnake(ctx, snake, cell, 'right', lo, t, c, 0);
  ctx.restore();
}
