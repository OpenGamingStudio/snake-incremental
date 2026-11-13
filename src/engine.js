// Moteur du snake : logique pure, sans DOM, déterministe (rng injectable).
export const DIRS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export function isOpposite(a, b) {
  return DIRS[a].x + DIRS[b].x === 0 && DIRS[a].y + DIRS[b].y === 0;
}

export function createGame(size, rng = Math.random) {
  const mid = Math.floor(size / 2);
  const snake = [{ x: mid, y: mid }, { x: mid - 1, y: mid }, { x: mid - 2, y: mid }];
  const game = { size, snake, dir: 'right', queue: [], apple: null, alive: true };
  game.apple = placeApple(game, rng);
  return game;
}

export function placeApple(game, rng = Math.random) {
  const taken = new Set(game.snake.map((c) => c.y * game.size + c.x));
  const free = [];
  for (let i = 0; i < game.size * game.size; i++) if (!taken.has(i)) free.push(i);
  if (!free.length) return null;
  const i = free[Math.floor(rng() * free.length)];
  return { x: i % game.size, y: Math.floor(i / game.size) };
}

// Met un changement de direction en file (max 2) ; refuse demi-tour et doublons.
export function turn(game, dir) {
  if (!DIRS[dir]) return;
  const last = game.queue.length ? game.queue[game.queue.length - 1] : game.dir;
  if (dir === last || isOpposite(dir, last) || game.queue.length >= 2) return;
  game.queue.push(dir);
}

// Avance d'un pas. Retourne { ate, died, won }.
export function step(game, rng = Math.random, wrap = false) {
  if (!game.alive) return { ate: false, died: true, won: false };
  if (game.queue.length) game.dir = game.queue.shift();
  const d = DIRS[game.dir];
  let x = game.snake[0].x + d.x;
  let y = game.snake[0].y + d.y;
  if (wrap) {
    x = (x + game.size) % game.size;
    y = (y + game.size) % game.size;
  } else if (x < 0 || y < 0 || x >= game.size || y >= game.size) {
    game.alive = false;
    return { ate: false, died: true, won: false };
  }
  const ate = !!game.apple && game.apple.x === x && game.apple.y === y;
  // la queue va se libérer sauf si on mange : on l'exclut de la collision
  const body = ate ? game.snake : game.snake.slice(0, -1);
  if (body.some((c) => c.x === x && c.y === y)) {
    game.alive = false;
    return { ate: false, died: true, won: false };
  }
  game.snake.unshift({ x, y });
  if (!ate) game.snake.pop();
  else game.apple = placeApple(game, rng);
  return { ate, died: false, won: ate && game.apple === null };
}
