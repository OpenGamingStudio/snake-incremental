// Notation des nombres à la française : « 1 234 », « 1,2 k », « 3,4 M », « 5,6 Md », scientifique dès 1e15.
const UNITS = ['k', 'M', 'Md', 'Bn'];
const NBSP = ' ';

function sci(n) {
  const e = Math.floor(Math.log10(n));
  return (Math.floor((n / 10 ** e) * 10) / 10).toFixed(1).replace('.', ',') + 'e' + e;
}

// Notation courte (coûts, gains). `scientific` : option « 1,2e3 » du joueur.
export function fmtShort(n, scientific = false) {
  if (!Number.isFinite(n)) return '—';
  if (n < 1000) return n < 10 && n % 1 ? (Math.floor(n * 10) / 10).toFixed(1).replace('.', ',').replace(/,0$/, '') : String(Math.floor(n));
  if (scientific || n >= 1e15) return sci(n);
  let i = -1;
  while (n >= 1000 && i < UNITS.length - 1) { n /= 1000; i++; }
  return (Math.floor(n * 10) / 10).toFixed(1).replace('.', ',') + NBSP + UNITS[i];
}

// Compteur : tous les chiffres jusqu'à 999 999 (« 1 234 »), notation courte ensuite.
export function fmtCount(n, scientific = false) {
  if (!Number.isFinite(n)) return '—';
  if (n >= 1e6 || (scientific && n >= 1000)) return fmtShort(n, scientific);
  return String(Math.floor(n)).replace(/\B(?=(\d{3})+$)/g, NBSP);
}

// Durée lisible : « 38 s », « 4 min », « 2 h ».
export function fmtDuration(sec) {
  if (!Number.isFinite(sec) || sec < 0) return '—';
  if (sec < 90) return Math.max(1, Math.round(sec)) + NBSP + 's';
  if (sec < 5400) return Math.round(sec / 60) + NBSP + 'min';
  return Math.round(sec / 3600) + NBSP + 'h';
}
