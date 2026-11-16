// Garde-robe : dialogue d'essayage et d'achat des cosmétiques, aperçu du serpent équipé.
import { SLOTS, SLOT_NAMES, ITEMS, findItem, rarity, isOwned, buyItem, equipItem } from './cosmetics.js';
import { drawPreview } from './render.js';
import { colors } from './ui.js';
import { fmtCount } from './format.js';

const $ = (id) => document.getElementById(id);

// deps : { state, calme(), onChange(texte) } ; retourne { open }.
export function initWardrobe({ state, calme, onChange, sfx }) {
  const dlg = $('dlgWardrobe');
  let slot = 'hat';
  let sel = state.equip.hat; // article essayé dans l'aperçu
  let raf = 0;
  const tryOn = () => ({ ...state.equip, [slot]: sel });

  function sizeCanvas(cv, ratio) {
    const w = Math.max(1, Math.round((cv.clientWidth || 64) * (window.devicePixelRatio || 1)));
    if (cv.width !== w) { cv.width = w; cv.height = Math.round(w * ratio); }
  }

  function scene(t) {
    const cv = $('wScene');
    sizeCanvas(cv, 0.4);
    drawPreview(cv, tryOn(), colors(), t, 'scene');
  }
  function loop(now) {
    raf = 0;
    if (!dlg.open) return;
    scene(calme() ? 0 : now / 1000);
    if (!calme()) raf = requestAnimationFrame(loop);
  }
  function startLoop() { if (!raf) raf = requestAnimationFrame(loop); }

  function renderTabs() {
    const box = $('wTabs');
    box.textContent = '';
    for (const s of SLOTS) {
      const b = document.createElement('button');
      b.className = 'btn btn-filtre';
      b.textContent = SLOT_NAMES[s];
      b.setAttribute('aria-pressed', String(s === slot));
      b.addEventListener('click', () => { slot = s; sel = state.equip[s]; render(); });
      box.appendChild(b);
    }
  }

  function statusOf(it) {
    if (state.equip[slot] === it.id) return 'Porté';
    if (isOwned(state, slot, it.id)) return 'Possédé';
    return `${fmtCount(it.cost)} pièces`;
  }

  function renderTiles() {
    const box = $('wTiles');
    box.textContent = '';
    for (const it of ITEMS[slot]) {
      const b = document.createElement('button');
      b.className = 'tuile';
      b.setAttribute('aria-pressed', String(it.id === sel));
      const cv = document.createElement('canvas');
      cv.width = 72; cv.height = 72; cv.className = 'tuile-cv'; cv.setAttribute('aria-hidden', 'true');
      drawPreview(cv, { ...state.equip, [slot]: it.id }, colors(), 0, slot);
      const n = document.createElement('span'); n.className = 'tuile-nom'; n.textContent = it.name;
      const st = document.createElement('span'); st.className = 'tuile-etat'; st.textContent = statusOf(it);
      b.append(cv, n, st);
      b.addEventListener('click', () => { sel = it.id; render(); });
      box.appendChild(b);
    }
  }

  function renderAction() {
    const it = findItem(slot, sel);
    const btn = $('wAction'), note = $('wNote');
    $('wCoins').textContent = `${fmtCount(state.coins)} pièces`;
    $('wNom').textContent = `${it.name} · ${rarity(it.cost)}`;
    btn.classList.remove('btn-fort');
    if (state.equip[slot] === it.id) { btn.textContent = 'Porté'; btn.setAttribute('aria-disabled', 'true'); note.textContent = ''; return; }
    if (isOwned(state, slot, it.id)) { btn.textContent = 'Porter'; btn.setAttribute('aria-disabled', 'false'); btn.classList.add('btn-fort'); note.textContent = ''; return; }
    btn.textContent = `Acheter · ${fmtCount(it.cost)}`;
    const ok = state.coins >= it.cost;
    btn.setAttribute('aria-disabled', String(!ok));
    if (ok) btn.classList.add('btn-fort');
    note.textContent = ok ? '' : `Il manque ${fmtCount(it.cost - state.coins)} pièces.`;
  }

  function render() { renderTabs(); renderTiles(); renderAction(); scene(0); startLoop(); }

  $('wAction').addEventListener('click', () => {
    if ($('wAction').getAttribute('aria-disabled') === 'true') return;
    const it = findItem(slot, sel);
    const bought = !isOwned(state, slot, sel) && buyItem(state, slot, sel);
    if (bought) { sfx.buy(); onChange(`${it.name} acheté et porté`); }
    else if (equipItem(state, slot, sel)) onChange(`${it.name} porté`);
    render();
  });
  $('wClose').addEventListener('click', () => dlg.close());

  return { open() { slot = 'hat'; sel = state.equip.hat; render(); }, refresh() { if (dlg.open) renderAction(); } };
}
