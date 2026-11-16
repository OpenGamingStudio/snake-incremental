// Cosmétiques : données et achats (logique pure). Le dessin est dans render.js.
export const SLOTS = ['hat', 'face', 'skin', 'apple'];
export const SLOT_NAMES = { hat: 'Chapeaux', face: 'Visages', skin: 'Peaux', apple: 'Pommes' };

// cost en pièces ; le niveau de rareté en découle (affiché en toutes lettres).
export const ITEMS = {
  hat: [
    { id: 'none', name: 'Tête nue', cost: 0 },
    { id: 'party', name: 'Cône de fête', cost: 1500 },
    { id: 'chef', name: 'Toque de chef', cost: 12000 },
    { id: 'tophat', name: 'Haut-de-forme', cost: 60000 },
    { id: 'crown', name: 'Couronne', cost: 400000 },
    { id: 'propeller', name: 'Casquette à hélice', cost: 2500000 },
  ],
  face: [
    { id: 'none', name: 'Visage nature', cost: 0 },
    { id: 'shades', name: 'Lunettes de soleil', cost: 1000 },
    { id: 'mustache', name: 'Moustache', cost: 9000 },
    { id: 'nose', name: 'Nez de clown', cost: 80000 },
  ],
  skin: [
    { id: 'classic', name: 'Vert classique', cost: 0 },
    { id: 'pumpkin', name: 'Citrouille', cost: 2000 },
    { id: 'blue', name: 'Bleu à pois', cost: 7000 },
    { id: 'candy', name: 'Bonbon', cost: 30000 },
    { id: 'bee', name: 'Abeille', cost: 150000 },
    { id: 'ghost', name: 'Fantôme', cost: 600000 },
    { id: 'rainbow', name: 'Arc-en-ciel', cost: 3000000 },
    { id: 'gold', name: 'Or massif', cost: 20000000 },
  ],
  apple: [
    { id: 'classic', name: 'Pomme', cost: 0 },
    { id: 'cherry', name: 'Cerises', cost: 3000 },
    { id: 'donut', name: 'Donut', cost: 45000 },
    { id: 'gem', name: 'Diamant', cost: 700000 },
    { id: 'star', name: 'Étoile filante', cost: 8000000 },
  ],
};

// Couleurs des peaux (aplats) : c = corps, cols = cycle de couleurs, mark = motif, m = couleur du motif.
export const SKINS = {
  classic: {},
  pumpkin: { c: '#F28C28', mark: 'band', m: '#16110F' },
  blue: { c: '#2D7FF9', mark: 'dot', m: '#FFFFFF' },
  candy: { c: '#FF7EB6', mark: 'band', m: '#FFFFFF' },
  bee: { c: '#FFC93C', mark: 'band', m: '#16110F' },
  ghost: { c: '#FFFFFF', mark: 'dot', m: '#B5D9A8' },
  rainbow: { cols: ['#D81E5B', '#F28C28', '#FFC93C', '#2E9E4A', '#2D7FF9', '#8E4DD6'] },
  gold: { c: '#FFC93C', mark: 'shine', m: '#FFFFFF' },
};

export const defaultEquip = () => ({ hat: 'none', face: 'none', skin: 'classic', apple: 'classic' });

export function findItem(slot, id) {
  return (ITEMS[slot] || []).find((i) => i.id === id) || null;
}

export function rarity(cost) {
  if (cost === 0) return 'Gratuit';
  if (cost < 20000) return 'Commun';
  if (cost < 500000) return 'Rare';
  if (cost < 10000000) return 'Épique';
  return 'Légendaire';
}

export const isOwned = (state, slot, id) => {
  const it = findItem(slot, id);
  return !!it && (it.cost === 0 || state.owned[`${slot}:${id}`] === true);
};

export function buyItem(state, slot, id) {
  const it = findItem(slot, id);
  if (!it || isOwned(state, slot, id) || state.coins < it.cost) return false;
  state.coins -= it.cost;
  state.owned[`${slot}:${id}`] = true;
  state.equip[slot] = id;
  return true;
}

export function equipItem(state, slot, id) {
  if (!isOwned(state, slot, id)) return false;
  state.equip[slot] = id;
  return true;
}
