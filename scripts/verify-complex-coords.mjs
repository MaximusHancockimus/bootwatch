/**
 * Verifies rexburg-housing.json coordinates match generated complexes.ts per id.
 * Run: node scripts/verify-complex-coords.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const data = JSON.parse(fs.readFileSync(path.join(root, 'src/data/rexburg-housing.json'), 'utf8'));

function slug(s) {
  return (
    s
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'complex'
  );
}

const used = new Map();
const usedIds = new Set();
const rows = [];
for (let i = 0; i < data.length; i++) {
  const row = data[i];
  const base = slug(row.name);
  const explicitId =
    typeof row.id === 'string' && row.id.trim() !== ''
      ? row.id.trim()
      : typeof row.complex_id === 'string' && row.complex_id.trim() !== ''
        ? row.complex_id.trim()
        : null;

  let id;
  if (explicitId) {
    id = explicitId;
    if (usedIds.has(id)) throw new Error(`duplicate id "${id}"`);
    usedIds.add(id);
  } else {
    const n = used.get(base) || 0;
    used.set(base, n + 1);
    id = n > 0 ? `${base}-${n + 1}` : base;
    if (usedIds.has(id)) throw new Error(`duplicate generated id "${id}"`);
    usedIds.add(id);
  }
  rows.push({ id, lat: row.lat, lng: row.lng, name: row.name });
}

const ts = fs.readFileSync(path.join(root, 'src/data/complexes.ts'), 'utf8');
const mism = [];
for (const r of rows) {
  const idEsc = r.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(
    `id:\\s*'${idEsc}'[\\s\\S]*?latitude:\\s*([^,\\n]+),\\s*\\n\\s*longitude:\\s*([^,\\n]+),`,
    'm',
  );
  const m = ts.match(re);
  if (!m) {
    mism.push({ id: r.id, err: 'no block in complexes.ts' });
    continue;
  }
  const tlat = parseFloat(m[1]);
  const tlng = parseFloat(m[2]);
  if (Math.abs(tlat - r.lat) > 1e-9 || Math.abs(tlng - r.lng) > 1e-9) {
    mism.push({ id: r.id, name: r.name, json: [r.lat, r.lng], ts: [tlat, tlng] });
  }
}

console.log('JSON rows:', rows.length);
console.log('Mismatches:', mism.length);
if (mism.length) console.log(mism);
