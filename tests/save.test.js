import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitize } from '../src/save.js';
import { UPGRADES } from '../src/economy.js';

test('sanitize borne les niveaux et les pièces', () => {
  const s = sanitize({ coins: -5, runEarned: -1, levels: { grid: 1e6, speed: 3 } });
  assert.equal(s.levels.grid, UPGRADES.grid.max);
  assert.equal(s.levels.speed, 3);
  assert.equal(s.coins, 0);
  assert.equal(s.runEarned, 0);
});

test('sanitize plafonne les nombres et ignore les clés inconnues', () => {
  const s = sanitize({ coins: 1e300, apples: -4, achievements: { a1: true, __proto__: true, evil: true }, levels: { speed: 1.5 } });
  assert.equal(s.coins, 1e15);
  assert.equal(s.apples, 0);
  assert.deepEqual(s.achievements, { a1: true });
  assert.equal(s.levels.speed, 0);
});
