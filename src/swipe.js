// Balayage : direction d'un déplacement du doigt, ou null s'il est trop court (seuil en px).
export const SWIPE_MIN = 20;

export function swipeDir(dx, dy, min = SWIPE_MIN) {
  if (!Number.isFinite(dx) || !Number.isFinite(dy)) return null;
  const ax = Math.abs(dx), ay = Math.abs(dy);
  if (Math.max(ax, ay) < min) return null;
  return ax > ay ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
}
