import test from 'node:test';
import assert from 'node:assert/strict';
import { fmtShort, fmtCount, fmtDuration } from '../src/format.js';

const S = ' ';

test('fmtShort : notation courte française', () => {
  assert.equal(fmtShort(0), '0');
  assert.equal(fmtShort(1.5), '1,5');
  assert.equal(fmtShort(340), '340');
  assert.equal(fmtShort(1200), `1,2${S}k`);
  assert.equal(fmtShort(999999), `999,9${S}k`);
  assert.equal(fmtShort(3.4e6), `3,4${S}M`);
  assert.equal(fmtShort(5.6e9), `5,6${S}Md`);
  assert.equal(fmtShort(2e15), '2,0e15');
  assert.equal(fmtShort(1200, true), '1,2e3');
  assert.equal(fmtShort(Infinity), '—');
});

test('fmtCount : même nombre de caractères à nombre de chiffres égal', () => {
  assert.equal(fmtCount(1234), `1${S}234`);
  assert.equal(fmtCount(5678.9), `5${S}678`);
  assert.equal(fmtCount(1234).length, fmtCount(5678).length);
  assert.equal(fmtCount(999999), `999${S}999`);
  assert.equal(fmtCount(1.2e6), `1,2${S}M`);
});

test('fmtDuration', () => {
  assert.equal(fmtDuration(38), `38${S}s`);
  assert.equal(fmtDuration(240), `4${S}min`);
  assert.equal(fmtDuration(7200), `2${S}h`);
  assert.equal(fmtDuration(Infinity), '—');
});
