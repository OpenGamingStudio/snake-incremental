import test from 'node:test';
import assert from 'node:assert/strict';
import { newState, buy, upgradeCost, appleValue, earn, prestige, prestigeGain, checkAchievements,
  stepMs, gridSize } from '../src/economy.js';
import { sanitize, load, save } from '../src/save.js';

test('achat : coût croissant, refus si pauvre', () => {
  const s = newState();
  assert.equal(buy(s, 'speed'), false);
  s.coins = 1000;
  assert.equal(buy(s, 'speed'), true);
  assert.ok(upgradeCost('speed', 1) > upgradeCost('speed', 0));
  assert.ok(stepMs(s) < 240);
});

test('combo et valeur', () => {
  const s = newState();
  assert.equal(appleValue(s, 5), 1);
  s.levels.combo = 5; s.levels.value = 2;
  assert.ok(appleValue(s, 5) > appleValue(s, 1));
  assert.equal(gridSize(s), 8);
});

test('prestige : étoiles, remise à zéro, conservation des succès', () => {
  const s = newState();
  earn(s, 4000);
  s.levels.speed = 3; s.apples = 60;
  checkAchievements(s);
  assert.equal(prestigeGain(s), 2);
  assert.equal(prestige(s), 2);
  assert.equal(s.coins, 0); assert.equal(s.levels.speed, 0);
  assert.equal(s.stars, 2); assert.ok(s.achievements.a2);
  assert.equal(prestige(s), 0);
  assert.ok(appleValue(s, 1) > 1);
});

test('sauvegarde : aller-retour, corrompue, ancienne', () => {
  const mem = {}; const st = { getItem: (k) => mem[k] ?? null, setItem: (k, v) => { mem[k] = v; } };
  const s = newState(); s.coins = 42; s.levels.grid = 2;
  save(st, s);
  assert.equal(load(st).coins, 42);
  mem['snake-incremental-v1'] = '{oops';
  assert.equal(load(st).coins, 0);
  const o = sanitize({ coins: 'x', levels: { speed: -3, grid: 2.5, value: 4 }, extra: 1 });
  assert.equal(o.coins, 0); assert.equal(o.levels.speed, 0); assert.equal(o.levels.value, 4);
});
