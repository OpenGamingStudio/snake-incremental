// Gain hors-ligne : une part du rythme récent, plafonnée dans le temps. Logique pure.
import { MAX_NUM } from './save.js';

export const OFFLINE_CAP_S = 2 * 3600; // au plus 2 h comptées
export const OFFLINE_EFFICIENCY = 0.25; // un quart du rythme de jeu actif
export const OFFLINE_MIN_S = 60; // en dessous, rien

// Gain pour une absence depuis state.lastSeen (ms), ou null s'il n'y a rien à créditer.
export function offlineGain(state, nowMs) {
  const away = (nowMs - state.lastSeen) / 1000;
  if (!(state.lastSeen > 0) || !(state.idleRate > 0) || !(away >= OFFLINE_MIN_S)) return null;
  const secs = Math.min(away, OFFLINE_CAP_S);
  const gain = Math.min(state.idleRate * OFFLINE_EFFICIENCY * secs, Math.max(0, MAX_NUM - state.coins));
  if (!(gain > 0)) return null;
  return { gain, away, secs, capped: away > OFFLINE_CAP_S };
}
