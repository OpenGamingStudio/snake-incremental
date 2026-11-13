// Boucle de jeu, entrées clavier / tactile, assemblage des modules.
import { createGame, step, turn } from './engine.js';
import { buy, appleValue, earn, gridSize, stepMs, hasWrap, COMBO_WINDOW_STEPS,
  checkAchievements, prestige, fmt } from './economy.js';
import { load, save, SAVE_KEY } from './save.js';
import { sfx, setMuted } from './audio.js';
import { draw, renderStats, renderShop, renderAchievements, toast } from './ui.js';

const canvas = document.getElementById('board');
const state = load(window.localStorage);
setMuted(state.muted);

let game = createGame(gridSize(state));
const view = { running: false, dead: false, combo: 0, sinceApple: 0 };
let acc = 0;
let last = performance.now();

function refresh() {
  renderStats(state, view);
  renderShop(state, onBuy, onPrestige);
}

function unlock() {
  for (const a of checkAchievements(state)) {
    toast('Succès : ' + a.name);
    sfx.achieve();
    renderAchievements(state);
  }
}

function resetSnake() {
  game = createGame(gridSize(state));
  view.running = false;
  view.combo = 0;
  view.sinceApple = 0;
}

function onBuy(id) {
  if (!buy(state, id)) return;
  sfx.buy();
  if (id === 'grid') resetSnake();
  unlock(); save(window.localStorage, state); refresh();
}

function onPrestige() {
  const gain = prestige(state);
  if (!gain) return;
  sfx.prestige();
  toast(`Prestige : +${gain} étoile(s)`);
  resetSnake(); view.dead = false;
  unlock(); save(window.localStorage, state); refresh(); renderAchievements(state);
}

function tick() {
  const r = step(game, Math.random, hasWrap(state));
  view.sinceApple++;
  if (r.ate) {
    view.combo = view.sinceApple <= COMBO_WINDOW_STEPS ? view.combo + 1 : 1;
    view.sinceApple = 0;
    const v = appleValue(state, view.combo);
    earn(state, v);
    state.apples++;
    state.bestCombo = Math.max(state.bestCombo, view.combo);
    state.bestLength = Math.max(state.bestLength, game.snake.length);
    sfx.eat(view.combo);
    unlock();
    refresh();
  } else if (view.combo && view.sinceApple > COMBO_WINDOW_STEPS) {
    view.combo = 0;
    refresh();
  }
  if (r.died || r.won) {
    if (r.died) { state.deaths++; sfx.die(); }
    unlock();
    save(window.localStorage, state);
    resetSnake();
    view.dead = r.died;
    refresh();
  }
}

function frame(now) {
  acc += Math.min(now - last, 250);
  last = now;
  if (view.running) {
    const ms = stepMs(state);
    while (acc >= ms) { acc -= ms; tick(); if (!view.running) break; }
  } else acc = 0;
  draw(canvas, game, view);
  requestAnimationFrame(frame);
}

function input(dir) {
  if (!view.running) { view.running = true; view.dead = false; acc = 0; }
  turn(game, dir);
}

const KEYS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  w: 'up', s: 'down', a: 'left', d: 'right', z: 'up', q: 'left' };
window.addEventListener('keydown', (e) => {
  const d = KEYS[e.key.length === 1 ? e.key.toLowerCase() : e.key];
  if (d) { e.preventDefault(); input(d); }
});

// Swipe + tap : un glissement donne la direction ; un tap lance la partie.
let t0 = null;
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  t0 = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  if (!view.running) input(game.dir);
}, { passive: false });
canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  if (!t0) return;
  const dx = e.touches[0].clientX - t0.x, dy = e.touches[0].clientY - t0.y;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
  input(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
  t0 = { x: e.touches[0].clientX, y: e.touches[0].clientY };
}, { passive: false });
canvas.addEventListener('touchend', () => { t0 = null; });
canvas.addEventListener('mousedown', () => { if (!view.running) input(game.dir); });

document.querySelectorAll('[data-dir]').forEach((b) =>
  b.addEventListener('click', () => input(b.dataset.dir)));

function setMuteLabel(b) {
  b.textContent = state.muted ? 'Son coupé' : 'Son';
  b.setAttribute('aria-pressed', String(state.muted));
}
document.getElementById('mute').addEventListener('click', (e) => {
  state.muted = !state.muted;
  setMuted(state.muted);
  setMuteLabel(e.currentTarget);
  save(window.localStorage, state);
});
setMuteLabel(document.getElementById('mute'));
let resetting = false;
document.getElementById('reset').addEventListener('click', () => {
  if (confirm('Effacer toute la progression ?')) {
    resetting = true;
    window.localStorage.removeItem(SAVE_KEY);
    location.reload();
  }
});

const autosave = () => { if (!resetting) save(window.localStorage, state); };
setInterval(autosave, 15000);
window.addEventListener('beforeunload', autosave);
unlock(); refresh(); renderAchievements(state);
requestAnimationFrame(frame);
