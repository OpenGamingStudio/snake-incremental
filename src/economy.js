// Économie : améliorations, coûts, combo, prestige, succès. Logique pure.
export const UPGRADES = {
  speed: { name: 'Vitesse', desc: 'Le serpent avance plus vite', base: 15, growth: 1.35, max: 25 },
  value: { name: 'Valeur des pommes', desc: '+50 % de pièces par pomme', base: 10, growth: 1.3, max: 100 },
  combo: { name: 'Combo', desc: 'Chaque pomme enchaînée ajoute un bonus', base: 40, growth: 1.5, max: 30 },
  grid: { name: 'Taille de la grille', desc: '+1 case de côté (plus de pommes possibles)', base: 60, growth: 1.7, max: 14 },
  wrap: { name: 'Murs traversants', desc: 'Plus de mort contre les murs', base: 2500, growth: 1, max: 1 },
};

export const COMBO_WINDOW_STEPS = 12; // pas max entre deux pommes pour garder le combo
export const PRESTIGE_DIVISOR = 1000;

export function newState() {
  return {
    coins: 0, runEarned: 0, totalEarned: 0, apples: 0, deaths: 0,
    bestCombo: 0, bestLength: 3, stars: 0, prestiges: 0,
    levels: { speed: 0, value: 0, combo: 0, grid: 0, wrap: 0 },
    achievements: {}, muted: false,
  };
}

export function upgradeCost(id, level) {
  const u = UPGRADES[id];
  return Math.ceil(u.base * Math.pow(u.growth, level));
}

export function canBuy(state, id) {
  const lvl = state.levels[id];
  return lvl < UPGRADES[id].max && state.coins >= upgradeCost(id, lvl);
}

export function buy(state, id) {
  if (!canBuy(state, id)) return false;
  state.coins -= upgradeCost(id, state.levels[id]);
  state.levels[id]++;
  return true;
}

export const stepMs = (s) => Math.max(60, Math.round(240 * Math.pow(0.93, s.levels.speed)));
export const gridSize = (s) => 8 + s.levels.grid;
export const starMult = (s) => 1 + 0.1 * s.stars;
export const appleBase = (s) => Math.pow(1.5, s.levels.value);
export const comboBonus = (s) => 0.1 * s.levels.combo; // par pomme enchaînée au-delà de la 1re
export const hasWrap = (s) => s.levels.wrap > 0;

export function comboMult(state, combo) {
  return 1 + comboBonus(state) * Math.max(0, combo - 1);
}

// Gain d'une pomme mangée avec le combo courant (combo >= 1).
export function appleValue(state, combo) {
  return appleBase(state) * comboMult(state, combo) * starMult(state);
}

export function earn(state, amount) {
  state.coins += amount;
  state.runEarned += amount;
  state.totalEarned += amount;
}

export function prestigeGain(state) {
  return Math.floor(Math.sqrt(state.runEarned / PRESTIGE_DIVISOR));
}

export function prestige(state) {
  const gain = prestigeGain(state);
  if (gain < 1) return 0;
  const keep = { totalEarned: state.totalEarned, apples: state.apples, deaths: state.deaths,
    bestCombo: state.bestCombo, bestLength: state.bestLength, achievements: state.achievements,
    muted: state.muted, stars: state.stars + gain, prestiges: state.prestiges + 1 };
  Object.assign(state, newState(), keep);
  return gain;
}

export const ACHIEVEMENTS = [
  { id: 'a1', name: 'Première pomme', test: (s) => s.apples >= 1 },
  { id: 'a2', name: '50 pommes', test: (s) => s.apples >= 50 },
  { id: 'a3', name: '500 pommes', test: (s) => s.apples >= 500 },
  { id: 'c1', name: 'Combo x5', test: (s) => s.bestCombo >= 5 },
  { id: 'c2', name: 'Combo x15', test: (s) => s.bestCombo >= 15 },
  { id: 'l1', name: 'Serpent de 15 cases', test: (s) => s.bestLength >= 15 },
  { id: 'l2', name: 'Serpent de 40 cases', test: (s) => s.bestLength >= 40 },
  { id: 'm1', name: '1 000 pièces gagnées', test: (s) => s.totalEarned >= 1e3 },
  { id: 'm2', name: '100 000 pièces gagnées', test: (s) => s.totalEarned >= 1e5 },
  { id: 'u1', name: 'Vitesse niveau 10', test: (s) => s.levels.speed >= 10 },
  { id: 'g1', name: 'Grille 12×12', test: (s) => s.levels.grid >= 4 },
  { id: 'w1', name: 'Sans limites', test: (s) => s.levels.wrap >= 1 },
  { id: 'd1', name: 'Ça arrive aux meilleurs', test: (s) => s.deaths >= 1 },
  { id: 'p1', name: 'Première étoile', test: (s) => s.prestiges >= 1 },
  { id: 'p2', name: '10 étoiles', test: (s) => s.stars >= 10 },
];

// Débloque les succès atteints ; retourne la liste des nouveaux.
export function checkAchievements(state) {
  const fresh = [];
  for (const a of ACHIEVEMENTS) {
    if (!Object.hasOwn(state.achievements, a.id) && a.test(state)) {
      state.achievements[a.id] = true;
      fresh.push(a);
    }
  }
  return fresh;
}

export function fmt(n) {
  if (n < 1000) return n < 10 ? n.toFixed(1).replace(/\.0$/, '') : String(Math.floor(n));
  const u = ['k', 'M', 'B', 'T'];
  let i = -1;
  while (n >= 1000 && i < u.length - 1) { n /= 1000; i++; }
  return n.toFixed(n < 10 ? 2 : 1) + u[i];
}
