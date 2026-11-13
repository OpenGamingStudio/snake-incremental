// Sons WebAudio simples (aucun fichier). Créé au premier geste utilisateur.
let ctx = null;
let muted = false;

export function setMuted(m) { muted = m; }

function tone(freq, dur, type = 'square', vol = 0.06, when = 0) {
  if (muted) return;
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    const t = ctx.currentTime + when;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(ctx.destination);
    o.start(t); o.stop(t + dur);
  } catch { /* audio indisponible */ }
}

export const sfx = {
  eat: (combo = 1) => tone(440 * Math.pow(1.06, Math.min(combo, 20)), 0.09),
  die: () => { tone(220, 0.15, 'sawtooth'); tone(110, 0.3, 'sawtooth', 0.06, 0.12); },
  buy: () => { tone(660, 0.07, 'triangle'); tone(880, 0.1, 'triangle', 0.06, 0.07); },
  achieve: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, 'triangle', 0.06, i * 0.09)),
  prestige: () => [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, 'sine', 0.07, i * 0.1)),
};
