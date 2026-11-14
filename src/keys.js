// Touches du jeu : actions, réglages par défaut, remappage. Logique pure (testée).
export const ACTIONS = ['up', 'down', 'left', 'right', 'pause'];
export const LABELS = { up: 'Haut', down: 'Bas', left: 'Gauche', right: 'Droite', pause: 'Pause' };

// Une action peut avoir plusieurs touches ; remapper la remplace par une seule.
export const DEFAULT_KEYS = {
  up: ['ArrowUp', 'z', 'w'],
  down: ['ArrowDown', 's'],
  left: ['ArrowLeft', 'q', 'a'],
  right: ['ArrowRight', 'd'],
  pause: ['p', 'Escape'],
};

// Touches qui gardent leur rôle natif (focus, activation) ou sont des modificateurs.
const RESERVED = new Set(['Tab', 'Enter', ' ', 'Shift', 'Control', 'Alt', 'Meta', 'AltGraph', 'CapsLock', 'Dead', 'Unidentified', 'ContextMenu']);

export const normalizeKey = (key) => (key.length === 1 ? key.toLowerCase() : key);
export const isReserved = (key) => RESERVED.has(key);

export function keyName(key) {
  const names = { ArrowUp: 'Flèche haut', ArrowDown: 'Flèche bas', ArrowLeft: 'Flèche gauche', ArrowRight: 'Flèche droite', Escape: 'Échap', ' ': 'Espace' };
  return names[key] || (key.length === 1 ? key.toUpperCase() : key);
}

export const cloneKeys = (keys) => Object.fromEntries(ACTIONS.map((a) => [a, [...keys[a]]]));

// Réglages lus du stockage : toute valeur inattendue retombe sur les défauts.
export function sanitizeKeys(raw) {
  const out = cloneKeys(DEFAULT_KEYS);
  if (!raw || typeof raw !== 'object') return out;
  const seen = new Set();
  const next = {};
  for (const a of ACTIONS) {
    const list = Object.hasOwn(raw, a) && Array.isArray(raw[a]) ? raw[a] : null;
    if (!list || !list.length || list.length > 4) return out;
    const keys = list.map((k) => (typeof k === 'string' && k.length >= 1 && k.length <= 20 ? normalizeKey(k) : ''));
    if (keys.some((k) => !k || isReserved(k) || seen.has(k))) return out;
    keys.forEach((k) => seen.add(k));
    next[a] = keys;
  }
  return next;
}

// Action liée à une touche, ou null.
export function actionFor(keys, key) {
  const k = normalizeKey(key);
  return ACTIONS.find((a) => keys[a].includes(k)) || null;
}

// Assigne `key` à `action` (remplace ses touches). Refuse une touche réservée ou déjà prise.
export function assign(keys, action, key) {
  const k = normalizeKey(key);
  if (isReserved(k)) return { ok: false, reason: 'reserved' };
  const owner = actionFor(keys, k);
  if (owner && owner !== action) return { ok: false, reason: 'taken', owner };
  keys[action] = [k];
  return { ok: true };
}
