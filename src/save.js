// Sauvegarde localStorage, tolérante aux données absentes ou corrompues.
import { newState, UPGRADES, ACHIEVEMENTS } from './economy.js';

export const SAVE_KEY = 'snake-incremental-v1';

// Plafond : une sauvegarde importée ou modifiée ne doit pas produire Infinity / NaN.
export const MAX_NUM = 1e15;

export function sanitize(raw) {
  const base = newState();
  if (!raw || typeof raw !== 'object') return base;
  for (const k of Object.keys(base)) {
    if (k === 'levels' || k === 'achievements') continue;
    if (typeof raw[k] === typeof base[k] && (typeof raw[k] !== 'number' || Number.isFinite(raw[k]))) base[k] = typeof raw[k] === 'number' ? Math.min(Math.max(raw[k], 0), MAX_NUM) : raw[k];
  }
  if (raw.levels && typeof raw.levels === 'object') {
    for (const k of Object.keys(base.levels)) {
      const v = Object.hasOwn(raw.levels, k) ? raw.levels[k] : undefined;
      if (Number.isInteger(v) && v >= 0) base.levels[k] = Math.min(v, UPGRADES[k].max);
    }
  }
  if (raw.achievements && typeof raw.achievements === 'object') {
    for (const a of ACHIEVEMENTS) if (raw.achievements[a.id] === true) base.achievements[a.id] = true;
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
