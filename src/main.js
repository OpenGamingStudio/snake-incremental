// Boucle de jeu, entrées clavier / tactile, dialogues, assemblage des modules.
import { createGame, step, turn, DIRS } from './engine.js';
import { buy, appleValue, earn, gridSize, stepMs, hasWrap, COMBO_WINDOW_STEPS,
  checkAchievements, prestige, UPGRADES } from './economy.js';
import { load, save, SAVE_KEY } from './save.js';
import { sfx, setMuted } from './audio.js';
import { fmtCount } from './format.js';
import { draw, fitCanvas, renderStats, renderShop, renderPrestige, prestigeSummary, renderAchievements,
  setFilter, flyGain, toast, announce, prefs } from './ui.js';

const $ = (id) => document.getElementById(id);
const canvas = $('board');
const state = load(window.localStorage);
setMuted(state.muted);

// Options d'interface : clé à part, la sauvegarde du jeu (SAVE_KEY) ne change pas.
const OPT_KEY = 'snake-incremental-options';
const options = { vib: true, notation: 'courte', pad: 'auto' };
try {
  const raw = JSON.parse(window.localStorage.getItem(OPT_KEY));
  if (raw && typeof raw === 'object') {
    if (typeof raw.vib === 'boolean') options.vib = raw.vib;
    if (raw.notation === 'courte' || raw.notation === 'sci') options.notation = raw.notation;
    if (['auto', 'on', 'off'].includes(raw.pad)) options.pad = raw.pad;
  }
} catch { /* options absentes ou illisibles : valeurs par défaut */ }
const saveOptions = () => { try { window.localStorage.setItem(OPT_KEY, JSON.stringify(options)); } catch { /* quota */ } };
// vibrer seulement après un geste du joueur (sinon le navigateur refuse et le signale en console)
const buzz = (ms) => { if (options.vib && navigator.vibrate && navigator.userActivation?.hasBeenActive) navigator.vibrate(ms); };

let game = createGame(gridSize(state));
// phase : 'ready' (carton de départ ou de mort), 'running', 'paused'
const view = { phase: 'ready', combo: 0, sinceApple: 0, earned: 0, first: true };
let acc = 0;
let last = performance.now();

// Gain par seconde sur les 30 dernières secondes de jeu (aide « Rentabilisé en »).
const gains = [];
function rate() {
  const now = performance.now();
  while (gains.length && now - gains[0].t > 30000) gains.shift();
  if (!gains.length) return 0;
  const span = Math.max(5000, Math.min(30000, now - gains[0].t));
  return gains.reduce((sum, g) => sum + g.v, 0) / (span / 1000);
}

function refresh() {
  prefs.sci = options.notation === 'sci';
  const r = rate();
  renderStats(state, view, r);
  renderShop(state, onBuy, r, view.combo);
  renderPrestige(state);
  canvas.classList.toggle('traverse', hasWrap(state));
}

function unlock() {
  const fresh = checkAchievements(state);
  for (const a of fresh) toast('Succès : ' + a.name.replace(/ x(\d)/, ' ×$1'));
  if (fresh.length) { sfx.achieve(); buzz(30); renderAchievements(state); }
}

function boardLabel(text) { canvas.setAttribute('aria-label', text); }

// Carton posé sur le plateau : départ, mort, pause.
function card(title, text, button) {
  $('voileTitre').textContent = title;
  $('voileTexte').textContent = text;
  $('voileBtn').textContent = button;
  $('voile').hidden = false;
}

function resetSnake() {
  game = createGame(gridSize(state));
  view.combo = 0;
  view.sinceApple = 0;
  view.earned = 0;
}

function start() {
  if (view.phase === 'running' || document.querySelector('dialog[open]')) return;
  const hadFocus = document.activeElement === $('voileBtn');
  view.phase = 'running';
  view.first = false;
  acc = 0;
  last = performance.now();
  $('voile').hidden = true;
  if (hadFocus) canvas.focus({ preventScroll: true });
  boardLabel(`Partie en cours, longueur ${game.snake.length}`);
}

function pause(focus = true) {
  if (view.phase !== 'running') return;
  view.phase = 'paused';
  card('Pause', 'La partie attend.', 'Reprendre');
  boardLabel(`Partie en pause, longueur ${game.snake.length}`);
  if (focus) $('voileBtn').focus({ preventScroll: true });
}

function die(cause) {
  const len = game.snake.length;
  const earned = view.earned;
  state.deaths++;
  sfx.die();
  buzz(80);
  unlock();
  save(window.localStorage, state);
  resetSnake();
  view.phase = 'ready';
  card(cause, `Longueur ${len}, +${fmtCount(earned)} pièces cette partie.`, 'Rejouer');
  boardLabel(`Partie terminée : ${cause} Longueur ${len}.`);
  $('voileBtn').focus({ preventScroll: true });
  refresh();
}

function onBuy(id) {
  if (!buy(state, id)) return;
  sfx.buy();
  announce(`${UPGRADES[id].name} niveau ${state.levels[id]}`);
  if (id === 'grid' && view.phase !== 'running') resetSnake();
  else if (id === 'grid') { resetSnake(); pause(false); card('Grille agrandie', 'Le plateau gagne une case de côté.', 'Reprendre'); }
  unlock(); save(window.localStorage, state); refresh();
}

function tick() {
  const head = game.snake[0];
  const d = DIRS[game.queue.length ? game.queue[0] : game.dir];
  const r = step(game, Math.random, hasWrap(state));
  view.sinceApple++;
  if (r.ate) {
    const before = view.combo;
    view.combo = view.sinceApple <= COMBO_WINDOW_STEPS ? view.combo + 1 : 1;
    view.sinceApple = 0;
    const v = appleValue(state, view.combo);
    earn(state, v);
    view.earned += v;
    gains.push({ t: performance.now(), v });
    state.apples++;
    state.bestCombo = Math.max(state.bestCombo, view.combo);
    state.bestLength = Math.max(state.bestLength, game.snake.length);
    sfx.eat(view.combo);
    flyGain(v);
    // palier de combo : toutes les 5 pommes enchaînées
    if (view.combo >= 5 && view.combo % 5 === 0 && view.combo > before) { toast(`Combo ×${view.combo}`); announce(`Combo ×${view.combo}`); }
    unlock();
    refresh();
  } else if (view.combo && view.sinceApple > COMBO_WINDOW_STEPS) {
    view.combo = 0;
    refresh();
  }
  if (r.died) {
    const x = head.x + d.x, y = head.y + d.y;
    die(x < 0 || y < 0 || x >= game.size || y >= game.size ? 'Mur !' : 'Queue !');
  } else if (r.won) {
    unlock();
    save(window.localStorage, state);
    const len = game.snake.length;
    const earned = view.earned;
    resetSnake();
    view.phase = 'ready';
    card('Plateau rempli !', `Longueur ${len}, +${fmtCount(earned)} pièces cette partie.`, 'Rejouer');
    $('voileBtn').focus({ preventScroll: true });
    refresh();
  }
}

function frame(now) {
  acc += Math.min(now - last, 250);
  last = now;
  if (view.phase === 'running') {
    const ms = stepMs(state);
    while (acc >= ms) { acc -= ms; tick(); if (view.phase !== 'running') break; }
  } else acc = 0;
  fitCanvas(canvas);
  draw(canvas, game, view);
  requestAnimationFrame(frame);
}

function input(dir) {
  if (document.querySelector('dialog[open]')) return;
  if (view.phase === 'paused') return;
  if (view.phase === 'ready') start();
  turn(game, dir);
}

const KEYS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  w: 'up', s: 'down', a: 'left', d: 'right', z: 'up', q: 'left' };
window.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey || document.querySelector('dialog[open]')) return;
  const tag = e.target instanceof Element ? e.target.tagName : '';
  if (tag === 'SELECT' || tag === 'INPUT') return;
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  const d = KEYS[key];
  if (d) { e.preventDefault(); input(d); return; }
  if (key === 'p' || key === 'Escape') {
    e.preventDefault();
    if (view.phase === 'running') pause(); else if (view.phase === 'paused') start();
    return;
  }
  // Espace / Entrée : démarrer ou rejouer, sauf si un bouton ou un lien a le focus (il s'active lui-même)
  if ((key === ' ' || key === 'Enter') && tag !== 'BUTTON' && tag !== 'A') {
    e.preventDefault();
    if (view.phase !== 'running') start();
  }
});

$('voileBtn').addEventListener('click', start);
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(false); });

// Balayage sur le plateau (seuil 24 px) ; touch-action: none sur le plateau seulement.
let p0 = null;
canvas.tabIndex = -1;
canvas.addEventListener('pointerdown', (e) => {
  p0 = { x: e.clientX, y: e.clientY, id: e.pointerId };
  try { canvas.setPointerCapture(e.pointerId); } catch { /* pointeur déjà relâché */ }
});
canvas.addEventListener('pointermove', (e) => {
  if (!p0 || e.pointerId !== p0.id) return;
  const dx = e.clientX - p0.x, dy = e.clientY - p0.y;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
  input(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
  p0 = { x: e.clientX, y: e.clientY, id: e.pointerId };
});
const release = () => { p0 = null; };
canvas.addEventListener('pointerup', release);
canvas.addEventListener('pointercancel', release);

// Croix tactile : réagit dès l'appui ; Entrée / Espace au clavier passent par click.
document.querySelectorAll('[data-dir]').forEach((b) => {
  b.addEventListener('pointerdown', (e) => { e.preventDefault(); input(b.dataset.dir); });
  b.addEventListener('click', (e) => { if (e.detail === 0) input(b.dataset.dir); });
});

// Son (en-tête et options)
function renderSound() {
  $('mute').setAttribute('aria-pressed', String(!state.muted));
  $('oSon').setAttribute('aria-checked', String(!state.muted));
  $('oSon').textContent = state.muted ? 'Coupé' : 'Activé';
}
function toggleSound() {
  state.muted = !state.muted;
  setMuted(state.muted);
  renderSound();
  save(window.localStorage, state);
}
$('mute').addEventListener('click', toggleSound);
$('oSon').addEventListener('click', toggleSound);

// Options
function renderOptions() {
  $('oVib').setAttribute('aria-checked', String(options.vib));
  $('oVib').textContent = options.vib ? 'Activées' : 'Coupées';
  $('oNote').value = options.notation;
  $('oPad').value = options.pad;
  if (options.pad === 'auto') delete document.body.dataset.croix; else document.body.dataset.croix = options.pad;
}
function openDialog(dlg) { pause(false); dlg.showModal(); }
$('optBtn').addEventListener('click', () => openDialog($('dlgOptions')));
$('optClose').addEventListener('click', () => $('dlgOptions').close());
$('oVib').addEventListener('click', () => { options.vib = !options.vib; saveOptions(); renderOptions(); buzz(30); });
$('oNote').addEventListener('change', (e) => { options.notation = e.target.value === 'sci' ? 'sci' : 'courte'; saveOptions(); refresh(); });
$('oPad').addEventListener('change', (e) => { options.pad = ['on', 'off'].includes(e.target.value) ? e.target.value : 'auto'; saveOptions(); renderOptions(); });

// Filtre du registre
$('fAll').addEventListener('click', () => { setFilter(false); refresh(); });
$('fBuy').addEventListener('click', () => { setFilter(true); refresh(); });

// Prestige : confirmation comptable, « Pas encore » par défaut
$('prestige').addEventListener('click', () => {
  if ($('prestige').getAttribute('aria-disabled') === 'true') return;
  $('dlgPrestigeTxt').textContent = prestigeSummary(state);
  openDialog($('dlgPrestige'));
});
$('prestigeNo').addEventListener('click', () => $('dlgPrestige').close());
$('prestigeYes').addEventListener('click', () => {
  $('dlgPrestige').close();
  const gain = prestige(state);
  if (!gain) return;
  sfx.prestige();
  buzz(60);
  gains.length = 0;
  resetSnake();
  view.phase = 'ready';
  card('Nouvelle série', `+${gain} étoile${gain > 1 ? 's' : ''} : chaque pomme rapporte davantage.`, 'Jouer');
  announce(`Prestige : ${state.stars} étoiles`);
  unlock(); save(window.localStorage, state); refresh(); renderAchievements(state);
});

// Réinitialiser : double confirmation
let resetting = false;
let armed = false;
$('reset').addEventListener('click', () => {
  armed = false;
  $('dlgResetTxt').textContent = 'Pièces, améliorations, étoiles et succès seront effacés de ce navigateur.';
  $('resetYes').textContent = 'Tout effacer';
  openDialog($('dlgReset'));
});
$('resetNo').addEventListener('click', () => $('dlgReset').close());
$('resetYes').addEventListener('click', () => {
  if (!armed) {
    armed = true;
    $('dlgResetTxt').textContent = 'Dernière confirmation : cette action ne peut pas être annulée.';
    $('resetYes').textContent = 'Tout effacer, vraiment';
    $('resetNo').focus();
    return;
  }
  resetting = true;
  window.localStorage.removeItem(SAVE_KEY);
  location.reload();
});

const autosave = () => { if (!resetting) save(window.localStorage, state); };
setInterval(autosave, 15000);
// le taux « pièces/s » et « Rentabilisé en » vieillissent même sans pomme
setInterval(() => { if (view.phase === 'running') refresh(); }, 2000);
window.addEventListener('beforeunload', autosave);
renderSound(); renderOptions();
unlock(); refresh(); renderAchievements(state);
requestAnimationFrame(frame);
