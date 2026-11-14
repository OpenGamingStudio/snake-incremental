import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_KEYS, ACTIONS, actionFor, assign, sanitizeKeys, cloneKeys } from '../src/keys.js';

test('les touches par défaut couvrent flèches, ZQSD et WASD', () => {
  assert.equal(actionFor(DEFAULT_KEYS, 'ArrowUp'), 'up');
  assert.equal(actionFor(DEFAULT_KEYS, 'Z'), 'up');
  assert.equal(actionFor(DEFAULT_KEYS, 'a'), 'left');
  assert.equal(actionFor(DEFAULT_KEYS, 'Escape'), 'pause');
  assert.equal(actionFor(DEFAULT_KEYS, 'x'), null);
});

test('assign remplace les touches, refuse réservées et doublons', () => {
  const k = cloneKeys(DEFAULT_KEYS);
  assert.deepEqual(assign(k, 'up', 'I'), { ok: true });
  assert.deepEqual(k.up, ['i']);
  assert.equal(assign(k, 'down', 'Tab').reason, 'reserved');
  assert.equal(assign(k, 'down', ' ').reason, 'reserved');
  assert.deepEqual(assign(k, 'down', 'p'), { ok: false, reason: 'taken', owner: 'pause' });
  assert.deepEqual(assign(k, 'pause', 'p'), { ok: true });
});

test('sanitizeKeys retombe sur les défauts si les données sont invalides', () => {
  for (const bad of [null, 'x', {}, { up: 'a' }, { ...DEFAULT_KEYS, up: ['Tab'] }, { ...DEFAULT_KEYS, up: ['p'] }]) {
    assert.deepEqual(sanitizeKeys(bad), DEFAULT_KEYS);
  }
  const good = cloneKeys(DEFAULT_KEYS); good.up = ['i'];
  assert.deepEqual(sanitizeKeys(good), good);
  assert.deepEqual(sanitizeKeys(JSON.parse('{"__proto__":{"up":["x"]}}')), DEFAULT_KEYS);
  assert.equal(ACTIONS.length, 5);
});
