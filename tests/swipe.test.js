import test from 'node:test';
import assert from 'node:assert/strict';
import { swipeDir, SWIPE_MIN } from '../src/swipe.js';

test('swipeDir : quatre directions', () => {
  assert.equal(swipeDir(40, 5), 'right');
  assert.equal(swipeDir(-40, 5), 'left');
  assert.equal(swipeDir(3, 40), 'down');
  assert.equal(swipeDir(3, -40), 'up');
});

test('swipeDir : trop court ou invalide = null', () => {
  assert.equal(swipeDir(SWIPE_MIN - 1, 0), null);
  assert.equal(swipeDir(0, 0), null);
  assert.equal(swipeDir(NaN, 50), null);
  assert.equal(swipeDir(SWIPE_MIN, 0), 'right');
});

test('swipeDir : diagonale = axe dominant', () => {
  assert.equal(swipeDir(30, 25), 'right');
  assert.equal(swipeDir(25, -30), 'up');
});
