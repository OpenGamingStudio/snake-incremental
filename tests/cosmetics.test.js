import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ITEMS, SKINS, buyItem, equipItem, isOwned, rarity } from '../src/cosmetics.js';
import { newState, prestige, earn } from '../src/economy.js';
import { sanitize } from '../src/save.js';
import { VERSION } from '../src/version.js';

test('la version du jeu suit package.json', () => {
  assert.equal(VERSION, JSON.parse(readFileSync(new URL('../package.json', import.meta.url))).version);
  assert.match(VERSION, /^\d+\.\d+\.\d+$/);
});

test('achat : pièces insuffisantes refusées, puis achat et port', () => {
  const s = newState();
  assert.equal(buyItem(s, 'hat', 'party'), false);
  s.coins = 2000;
  assert.equal(buyItem(s, 'hat', 'party'), true);
  assert.equal(s.coins, 500);
  assert.equal(s.equip.hat, 'party');
  assert.equal(buyItem(s, 'hat', 'party'), false);
  assert.equal(equipItem(s, 'hat', 'none'), true);
  assert.equal(equipItem(s, 'hat', 'crown'), false);
});

test('les articles gratuits sont possédés ; les peaux et raretés sont définies', () => {
  const s = newState();
  assert.ok(isOwned(s, 'skin', 'classic'));
  for (const it of ITEMS.skin) assert.ok(it.id in SKINS);
  assert.equal(rarity(0), 'Gratuit');
  assert.equal(rarity(3e7), 'Légendaire');
});

test('prestige conserve les cosmétiques ; sanitize rejette les faux', () => {
  const s = newState();
  s.coins = 5000; buyItem(s, 'skin', 'pumpkin');
  earn(s, 1e6); prestige(s);
  assert.equal(s.equip.skin, 'pumpkin');
  const t = sanitize({ owned: { 'hat:crown': true, 'hat:x': true }, equip: { hat: 'crown', skin: 'gold', face: 'nope' } });
  assert.deepEqual(t.owned, { 'hat:crown': true });
  assert.equal(t.equip.hat, 'crown');
  assert.equal(t.equip.skin, 'classic');
  assert.equal(t.equip.face, 'none');
});
