import test from 'node:test';
import assert from 'node:assert/strict';
import { offlineGain, OFFLINE_CAP_S, OFFLINE_EFFICIENCY } from '../src/offline.js';
import { newState, nextAffordable, upgradeCost } from '../src/economy.js';
import { sanitize, MAX_NUM } from '../src/save.js';

const T = 1_000_000_000_000;
const st = (o = {}) => ({ ...newState(), lastSeen: T, idleRate: 10, ...o });

test('offline : un quart du rythme sur la durée d\'absence', () => {
  const r = offlineGain(st(), T + 600_000);
  assert.equal(r.gain, 10 * OFFLINE_EFFICIENCY * 600);
  assert.equal(r.capped, false);
});

test('offline : plafonné à 2 h', () => {
  const r = offlineGain(st(), T + 30 * 86400_000);
  assert.equal(r.secs, OFFLINE_CAP_S);
  assert.equal(r.gain, 10 * OFFLINE_EFFICIENCY * OFFLINE_CAP_S);
  assert.equal(r.capped, true);
});

test('offline : rien si absence courte, pas de rythme, pas d\'horodatage ou horloge reculée', () => {
  assert.equal(offlineGain(st(), T + 30_000), null);
  assert.equal(offlineGain(st({ idleRate: 0 }), T + 600_000), null);
  assert.equal(offlineGain(st({ lastSeen: 0 }), T + 600_000), null);
  assert.equal(offlineGain(st(), T - 600_000), null);
});

test('offline : jamais au-delà du plafond de sauvegarde', () => {
  const r = offlineGain(st({ idleRate: 1e15, coins: MAX_NUM - 5 }), T + 3600_000);
  assert.equal(r.gain, 5);
});

test('sauvegarde : lastSeen et idleRate sont conservés et bornés', () => {
  const s = sanitize({ lastSeen: T, idleRate: 3.5 });
  assert.equal(s.lastSeen, T);
  assert.equal(s.idleRate, 3.5);
  assert.equal(sanitize({ idleRate: -4, lastSeen: 'x' }).idleRate, 0);
});

test('nextAffordable : le moins cher non maximal, avec le manque et le délai', () => {
  const s = newState();
  s.coins = 4;
  const n = nextAffordable(s, 2);
  assert.equal(n.id, 'value');
  assert.equal(n.cost, upgradeCost('value', 0));
  assert.equal(n.missing, n.cost - 4);
  assert.equal(n.seconds, n.missing / 2);
  assert.equal(n.ready, false);
});

test('nextAffordable : prêt si assez de pièces, null si tout est au maximum', () => {
  const s = newState();
  s.coins = 1e6;
  assert.equal(nextAffordable(s, 0).ready, true);
  assert.equal(nextAffordable(s, 0).seconds, 0);
  s.levels = { speed: 25, value: 100, combo: 30, grid: 14, wrap: 1 };
  assert.equal(nextAffordable(s, 0), null);
});

test('nextAffordable : délai inconnu sans rythme', () => {
  const s = newState();
  assert.equal(nextAffordable(s, 0).seconds, null);
});
