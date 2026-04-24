/**
 * Restores lat/lng in rexburg-housing.json from the last committed src/data/complexes.ts
 * (your hand-verified pins). Run after: git commit complexes.ts OR from a clean tree use HEAD.
 *
 * Usage: node scripts/restore-coords-from-git-head.mjs
 * Then:  node scripts/generate-complexes.mjs
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const jsonPath = path.join(root, 'src/data/rexburg-housing.json');

function slug(s) {
  return (
    s
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'complex'
  );
}

function parseCoordMapFromTs(ts) {
  const map = new Map();
  const re =
    /id:\s*'([^']+)'\s*,\s*\r?\n\s*name:\s*"[^"]*"\s*,\s*\r?\n\s*address:\s*'[^']*'\s*,\s*\r?\n\s*latitude:\s*([^,\r\n]+),\s*\r?\n\s*longitude:\s*([^,\r\n]+),/g;
  let m;
  while ((m = re.exec(ts))) {
    map.set(m[1], { lat: parseFloat(m[2]), lng: parseFloat(m[3]) });
  }
  if (map.size === 0) {
    throw new Error('restore-coords-from-git-head: parsed 0 complexes — regex or git show failed');
  }
  return map;
}

function assignIdsToJsonRows(data) {
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
      if (usedIds.has(id)) throw new Error(`duplicate id in JSON: ${id}`);
      usedIds.add(id);
    } else {
      const n = used.get(base) || 0;
      used.set(base, n + 1);
      id = n > 0 ? `${base}-${n + 1}` : base;
      if (usedIds.has(id)) throw new Error(`duplicate generated id: ${id}`);
      usedIds.add(id);
    }
    rows.push({ index: i, id, name: row.name });
  }
  return rows;
}

const ts = execSync('git show HEAD:src/data/complexes.ts', {
  cwd: root,
  encoding: 'utf8',
  maxBuffer: 10 * 1024 * 1024,
});
const coordMap = parseCoordMapFromTs(ts);

const raw = fs.readFileSync(jsonPath, 'utf8');
const data = JSON.parse(raw);
const meta = assignIdsToJsonRows(data);

let applied = 0;
let missing = [];
for (const { index, id, name } of meta) {
  const c = coordMap.get(id);
  if (c) {
    data[index].lat = c.lat;
    data[index].lng = c.lng;
    applied++;
  } else {
    missing.push({ index, id, name });
  }
}

fs.writeFileSync(jsonPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');

console.log(`Updated ${applied} rows in rexburg-housing.json from git HEAD complexes.ts`);
if (missing.length) {
  console.log(
    `${missing.length} row(s) had no matching id in HEAD TS (new since last commit — left JSON coords unchanged):`,
  );
  missing.forEach((m) => console.log(`  - ${m.id} (${m.name})`));
}
console.log('Next: node scripts/generate-complexes.mjs');
