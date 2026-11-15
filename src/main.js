// Boucle de jeu, entrées clavier / tactile, dialogues, assemblage des modules.
import { createGame, step, turn } from './engine.js';
import { buy, appleValue, earn, gridSize, stepMs, hasWrap, COMBO_WINDOW_STEPS,
  checkAchievements, prestige, UPGRADES } from './economy.js';
import { load, save, SAVE_KEY } from './save.js';
import { sfx, setMuted, setVolume } from './audio.js';
import { ACTIONS, LABELS, DEFAULT_KEYS, actionFor, assign, cloneKeys, sanitizeKeys, keyName } from './keys.js';
import { fmtCount, fmtFull, fmtDuration } from './format.js';
import { offlineGain } from './offline.js';
import { swipeDir } from './swipe.js';
import { draw, fitCanvas, renderStats, renderShop, renderPrestige, prestigeSummary, renderAchievements,
  setFilter, flyGain, toast, announce, prefs, resetPalette } from './ui.js';

const $ = (id) => document.getElementById(id);
const canvas = $('board');
const state = load(window.localStorage);
setMuted(state.muted);

// Options d'interface : clé à part, la sauvegarde du jeu (SAVE_KEY) ne change pas.
const OPT_KEY = 'snake-incremental-options';
const SPEEDS = ['1', '0.75', '0.5', '0.35'];
const TEXTS = ['100', '125', '150'];
const options = { vib: true, notation: 'courte', pad: 'auto', volume: 100, speed: '1', assist: false, dalt: false,
  calme: 'auto', texte: '100', ann: false, keys: cloneKeys(DEFAULT_KEYS) };
try {
  const raw = JSON.parse(window.localStorage.getItem(OPT_KEY));
  if (raw && typeof raw === 'object') {
    if (typeof raw.vib === 'boolean') options.vib = raw.vib;
    if (raw.notation === 'courte' || raw.notation === 'sci') options.notation = raw.notation;
    if (['auto', 'on', 'off'].includes(raw.pad)) options.pad = raw.pad;
    if (Number.isInteger(raw.volume) && raw.volume >= 0 && raw.volume <= 100) options.volume = raw.volume;
    if (SPEEDS.includes(raw.speed)) options.speed = raw.speed;
    if (TEXTS.includes(raw.texte)) options.texte = raw.texte;
    if (raw.calme === 'on') options.calme = 'on';
    for (const k of ['assist', 'dalt', 'ann']) if (typeof raw[k] === 'boolean') options[k] = raw[k];
    options.keys = sanitizeKeys(raw.keys);
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

// Sauvegarde + horodatage : le rythme récent (pièces/s) sert au gain hors-ligne au retour.
// Onglet caché : on garde l'heure de départ, sinon l'autosave effacerait l'absence.
function persist() {
  if (!document.hidden) {
    state.lastSeen = Date.now();
    const r = rate();
    if (r > 0) state.idleRate = r;
  }
  save(window.localStorage, state);
}

// Créditer l'absence ; retourne le texte récapitulatif ou ''.
function claimOffline() {
  const res = offlineGain(state, Date.now());
  state.lastSeen = Date.now();
  if (!res) return '';
  earn(state, res.gain);
  const time = fmtDuration(res.secs);
  return `Pendant votre absence${res.capped ? ` (plafonné à ${time})` : ` (${fmtDuration(res.away)})`} : +${fmtCount(res.gain)} pièces.`;
}

function refresh() {
  wake();
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
  wake();
  announce(`${title} ${text}`);
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
  wake();
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
  persist();
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
  unlock(); persist(); refresh();
}

function tick() {
  const r = step(game, Math.random, hasWrap(state) || options.assist, options.assist);
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
    if (options.ann) announce(`${fmtFull(Math.floor(state.coins), 'pièce')}`);
    flyGain(v);
    // palier de combo : toutes les 5 pommes enchaînées
    if (view.combo >= 5 && view.combo % 5 === 0 && view.combo > before) { toast(`Combo ×${view.combo}`); announce(`Combo ×${view.combo}`); }
    unlock();
    refresh();
  } else if (view.combo && view.sinceApple > COMBO_WINDOW_STEPS) {
    view.combo = 0;
    refresh();
  }
  if (r.cut) { view.combo = 0; announce(`Queue raccourcie, longueur ${game.snake.length}`); refresh(); }
  if (r.died) {
    die(r.hit === 'wall' ? 'Mur !' : 'Queue !');
  } else if (r.won) {
    unlock();
    persist();
    const len = game.snake.length;
    const earned = view.earned;
    resetSnake();
    view.phase = 'ready';
    card('Plateau rempli !', `Longueur ${len}, +${fmtCount(earned)} pièces cette partie.`, 'Rejouer');
    $('voileBtn').focus({ preventScroll: true });
    refresh();
  }
}

// Boucle d'animation à la demande : elle tourne seulement pendant la partie, ou le temps de redessiner
// après un changement (wake). Onglet caché ou jeu à l'arrêt : aucune image demandée.
let raf = 0;
let dirty = true;
function wake() {
  dirty = true;
  if (raf || document.hidden) return;
  last = performance.now();
  raf = requestAnimationFrame(frame);
}

function frame(now) {
  raf = 0;
  let changed = dirty;
  dirty = false;
  acc += Math.min(now - last, 250);
  last = now;
  if (view.phase === 'running') {
    const ms = stepMs(state) / Number(options.speed);
    while (acc >= ms) { acc -= ms; tick(); changed = true; if (view.phase !== 'running') break; }
  } else acc = 0;
  syncPause();
  if (changed) {
    fitCanvas(canvas);
    draw(canvas, game, view);
  }
  if (view.phase === 'running' || dirty) raf = requestAnimationFrame(frame);
}
window.addEventListener('resize', wake);

function input(dir) {
  if (document.querySelector('dialog[open]')) return;
  if (view.phase === 'paused') return;
  if (view.phase === 'ready') start();
  turn(game, dir);
  wake();
}

window.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey || document.querySelector('dialog[open]')) return;
  const tag = e.target instanceof Element ? e.target.tagName : '';
  if (tag === 'SELECT' || tag === 'INPUT') return;
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  const action = actionFor(options.keys, key);
  if (action && action !== 'pause') { e.preventDefault(); input(action); return; }
  if (action === 'pause') {
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
// Bouton Pause : disponible à tout moment (WCAG 2.2.1), reprend s'il est déjà en pause.
$('pauseBtn').addEventListener('click', () => {
  if (view.phase === 'running') pause(); else if (view.phase === 'paused') start();
});
let shownPhase = '';
function syncPause() {
  if (shownPhase === view.phase) return;
  shownPhase = view.phase;
  const b = $('pauseBtn');
  b.setAttribute('aria-pressed', String(view.phase === 'paused'));
  b.setAttribute('aria-label', view.phase === 'paused' ? 'Reprendre' : 'Pause');
  b.setAttribute('aria-disabled', String(view.phase === 'ready'));
  b.classList.toggle('en-pause', view.phase === 'paused');
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (!resetting) persist(); // dernière heure vue et rythme, avant que le navigateur fige l'onglet
    pause(false);
    cancelAnimationFrame(raf);
    raf = 0;
    return;
  }
  wake();
  const recap = claimOffline();
  if (recap) { toast(recap); announce(recap); persist(); refresh(); }
});

// Balayage sur le cadre du plateau (plateau + carton, seuil SWIPE_MIN) ; touch-action: none sur le cadre seulement.
let p0 = null;
const cadre = document.querySelector('.cadre');
canvas.tabIndex = -1;
cadre.addEventListener('pointerdown', (e) => {
  if (e.target.closest('button')) return; // le bouton du carton garde son clic
  p0 = { x: e.clientX, y: e.clientY, id: e.pointerId };
  try { cadre.setPointerCapture(e.pointerId); } catch { /* pointeur déjà relâché */ }
});
cadre.addEventListener('pointermove', (e) => {
  if (!p0 || e.pointerId !== p0.id) return;
  const dir = swipeDir(e.clientX - p0.x, e.clientY - p0.y);
  if (!dir) return;
  input(dir);
  p0 = { x: e.clientX, y: e.clientY, id: e.pointerId };
});
const release = () => { p0 = null; };
cadre.addEventListener('pointerup', release);
cadre.addEventListener('pointercancel', release);
cadre.addEventListener('lostpointercapture', release);

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
  persist();
}
$('mute').addEventListener('click', toggleSound);
$('oSon').addEventListener('click', toggleSound);

// Options
function renderOptions() {
  wake();
  $('oVib').setAttribute('aria-checked', String(options.vib));
  $('oVib').textContent = options.vib ? 'Activées' : 'Coupées';
  $('oNote').value = options.notation;
  $('oVol').value = options.volume;
  $('oVolV').textContent = `${options.volume} %`;
  $('oVit').value = options.speed;
  $('oCalme').value = options.calme;
  $('oTexte').value = options.texte;
  for (const [id, key] of [['oAss', 'assist'], ['oDalt', 'dalt'], ['oAnn', 'ann']]) {
    $(id).setAttribute('aria-checked', String(options[key]));
    $(id).textContent = options[key] ? 'Activé' : 'Désactivé';
  }
  const root = document.documentElement;
  root.dataset.texte = options.texte;
  if (options.dalt) root.dataset.daltonien = ''; else delete root.dataset.daltonien;
  if (options.calme === 'on') root.dataset.calme = ''; else delete root.dataset.calme;
  prefs.calme = options.calme === 'on';
  resetPalette();
  setVolume(options.volume / 100);
  renderKeys();
  $('oPad').value = options.pad;
  if (options.pad === 'auto') delete document.body.dataset.croix; else document.body.dataset.croix = options.pad;
}
// Touches : un bouton par action ; on l'active, puis on appuie sur la nouvelle touche.
let capturing = null;
function renderKeys() {
  const box = $('touches');
  if (!box.children.length) {
    for (const a of ACTIONS) {
      const row = document.createElement('div');
      row.className = 'option';
      const lab = document.createElement('span');
      lab.id = `kL-${a}`;
      lab.textContent = LABELS[a];
      const btn = document.createElement('button');
      btn.id = `k-${a}`;
      btn.className = 'btn btn-touche';
      btn.setAttribute('aria-labelledby', `kL-${a} k-${a}`);
      btn.addEventListener('click', () => { capturing = a; $('keyMsg').textContent = `${LABELS[a]} : appuyez sur la nouvelle touche, Échap pour annuler.`; renderKeys(); });
      row.append(lab, btn);
      box.appendChild(row);
    }
  }
  for (const a of ACTIONS) {
    const btn = $(`k-${a}`);
    btn.textContent = capturing === a ? 'Appuyez sur une touche…' : options.keys[a].map(keyName).join(' / ');
    btn.classList.toggle('capture', capturing === a);
  }
}
$('dlgOptions').addEventListener('keydown', (e) => {
  if (!capturing) return;
  if (e.key === 'Shift' || e.repeat) return;
  if (e.key === 'Tab') { capturing = null; $('keyMsg').textContent = 'Changement annulé.'; renderKeys(); return; } // Tab quitte le bouton : on annule la capture, le focus suit
  e.preventDefault();
  e.stopPropagation();
  const a = capturing;
  if (e.key === 'Escape') { capturing = null; $('keyMsg').textContent = 'Changement annulé.'; renderKeys(); $(`k-${a}`).focus(); return; }
  const res = assign(options.keys, a, e.key);
  if (!res.ok) {
    $('keyMsg').textContent = res.reason === 'taken' ? `${keyName(e.key.length === 1 ? e.key.toLowerCase() : e.key)} sert déjà à : ${LABELS[res.owner]}. Choisissez une autre touche.` : 'Cette touche est réservée. Choisissez une autre touche.';
    return;
  }
  capturing = null;
  $('keyMsg').textContent = `${LABELS[a]} : ${keyName(options.keys[a][0])}.`;
  saveOptions(); renderKeys(); $(`k-${a}`).focus();
}, true);
$('dlgOptions').addEventListener('close', () => { capturing = null; $('keyMsg').textContent = ''; renderKeys(); });
$('keysReset').addEventListener('click', () => { options.keys = cloneKeys(DEFAULT_KEYS); capturing = null; saveOptions(); renderKeys(); $('keyMsg').textContent = 'Touches par défaut rétablies.'; });

function openDialog(dlg) { pause(false); dlg.showModal(); }
$('optBtn').addEventListener('click', () => openDialog($('dlgOptions')));
$('optClose').addEventListener('click', () => $('dlgOptions').close());
$('oVol').addEventListener('input', (e) => { options.volume = Number(e.target.value); saveOptions(); renderOptions(); });
$('oVol').addEventListener('change', () => sfx.buy());
$('oVit').addEventListener('change', (e) => { options.speed = SPEEDS.includes(e.target.value) ? e.target.value : '1'; saveOptions(); });
$('oCalme').addEventListener('change', (e) => { options.calme = e.target.value === 'on' ? 'on' : 'auto'; saveOptions(); renderOptions(); });
$('oTexte').addEventListener('change', (e) => { options.texte = TEXTS.includes(e.target.value) ? e.target.value : '100'; saveOptions(); renderOptions(); });
for (const [id, key] of [['oAss', 'assist'], ['oDalt', 'dalt'], ['oAnn', 'ann']]) {
  $(id).addEventListener('click', () => { options[key] = !options[key]; saveOptions(); renderOptions(); });
}
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
  unlock(); persist(); refresh(); renderAchievements(state);
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

const autosave = () => { if (!resetting) persist(); };
setInterval(autosave, 15000);
// le taux « pièces/s » et « Rentabilisé en » vieillissent même sans pomme
setInterval(() => { if (view.phase === 'running' && !document.hidden) refresh(); }, 2000);
window.addEventListener('beforeunload', autosave);
renderSound(); renderOptions();
const welcome = claimOffline();
unlock(); refresh(); renderAchievements(state);
if (welcome) { card('Bon retour !', welcome, 'Jouer'); persist(); }
wake();
