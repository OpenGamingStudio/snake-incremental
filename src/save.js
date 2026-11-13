// Sauvegarde localStorage, tolérante aux données absentes ou corrompues.
import { newState } from './economy.js';

export const SAVE_KEY = 'snake-incremental-v1';

export function sanitize(raw) {
  const base = newState();
  if (!raw || typeof raw !== 'object') return base;
  for (const k of Object.keys(base)) {
    if (k === 'levels' || k === 'achievements') continue;
    if (typeof raw[k] === typeof base[k] && (typeof raw[k] !== 'number' || Number.isFinite(raw[k]))) base[k] = raw[k];
  }
  if (raw.levels && typeof raw.levels === 'object') {
    for (const k of Object.keys(base.levels)) {
      const v = raw.levels[k];
      if (Number.isInteger(v) && v >= 0) base.levels[k] = v;
    }
  }
  if (raw.achievements && typeof raw.achievements === 'object') {
    for (const k of Object.keys(raw.achievements)) if (raw.achievements[k] === true) base.achievements[k] = true;
  }
  return base;
}

export function load(storage) {
  try {
    return sanitize(JSON.parse(storage.getItem(SAVE_KEY)));
  } catch {
    return newState();
  }
}

export function save(storage, state) {
  try { storage.setItem(SAVE_KEY, JSON.stringify(state)); } catch { /* quota / mode privé */ }
}
