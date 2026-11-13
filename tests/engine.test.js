import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, step, turn } from '../src/engine.js';

test('avance et mange une pomme', () => {
  const g = createGame(8, () => 0);
  g.apple = { x: g.snake[0].x + 1, y: g.snake[0].y };
  const r = step(g, () => 0);
  assert.equal(r.ate, true);
  assert.equal(g.snake.length, 4);
});

test('mur mortel, mais traversable avec wrap', () => {
  const g = createGame(8);
  for (let i = 0; i < 10 && g.alive; i++) step(g);
  assert.equal(g.alive, false);
  const w = createGame(8);
  for (let i = 0; i < 20; i++) step(w, Math.random, true);
  assert.equal(w.alive, true);
});

test('demi-tour refusé, collision avec soi-même', () => {
  const g = createGame(8);
  turn(g, 'left');
  assert.equal(g.queue.length, 0);
  g.snake = [{x:3,y:3},{x:3,y:4},{x:4,y:4},{x:4,y:3},{x:4,y:2}];
  g.dir = 'up'; g.apple = null;
  turn(g, 'right');
  assert.equal(step(g).died, true);
});

test('la queue libérée ne tue pas', () => {
  const g = createGame(8);
  g.snake = [{x:2,y:2},{x:2,y:3},{x:3,y:3},{x:3,y:2}];
  g.dir = 'up'; turn(g, 'right');
  assert.equal(step(g).died, false);
});
