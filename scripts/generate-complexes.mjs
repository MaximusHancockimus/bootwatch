import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const jsonPath = path.join(root, 'src/data/rexburg-housing.json');
const outPath = path.join(root, 'src/data/complexes.ts');

const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

function slug(s) {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'complex';
}

const used = new Map();
const limits = [45, 60, 30, 45, 30, 60];
const risks = ['moderate', 'low', 'high', 'moderate', 'high', 'low'];
const signageOpts = ['moderate', 'well-marked', 'sneaky', 'moderate', 'sneaky', 'well-marked'];

const lats = data.map((d) => d.lat);
const lngs = data.map((d) => d.lng);
const midLat = lats.reduce((a, b) => a + b, 0) / lats.length;
const midLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;
const dLat = Math.max(...lats) - Math.min(...lats);
const dLng = Math.max(...lngs) - Math.min(...lngs);

const parts = [];
parts.push(`import { Complex } from '../types/complex';`);
parts.push('');
parts.push(`/** Placeholder copy — replace with verified rules when you have real data */`);
parts.push(`const PLACEHOLDER_NOTE =`);
parts.push(`  'Placeholder visitor limit for testing — replace with verified parking rules.';`);
parts.push('');
parts.push(`export const REXBURG_CENTER = {`);
parts.push(`  latitude: ${midLat.toFixed(4)},`);
parts.push(`  longitude: ${midLng.toFixed(4)},`);
parts.push(`  latitudeDelta: ${Math.max(0.04, dLat * 1.2).toFixed(4)},`);
parts.push(`  longitudeDelta: ${Math.max(0.04, dLng * 1.2).toFixed(4)},`);
parts.push(`};`);
parts.push('');
parts.push(`export const CUSTOM_TIMER_ID = '__custom__';`);
parts.push('');
parts.push(`export function getComplexById(id: string): Complex | undefined {`);
parts.push(`  return complexes.find((c) => c.id === id);`);
parts.push(`}`);
parts.push('');
parts.push(`export const complexes: Complex[] = [`);

for (let i = 0; i < data.length; i++) {
  const row = data[i];
  const base = slug(row.name);
  const n = used.get(base) || 0;
  used.set(base, n + 1);
  const id = n > 0 ? `${base}-${n + 1}` : base;
  const lim = limits[i % limits.length];
  const risk = risks[i % risks.length];
  const sig = signageOpts[i % signageOpts.length];
  parts.push(`  {`);
  parts.push(`    id: '${id}',`);
  parts.push(`    name: ${JSON.stringify(row.name.trim())},`);
  parts.push(`    address: 'Rexburg, ID',`);
  parts.push(`    latitude: ${row.lat},`);
  parts.push(`    longitude: ${row.lng},`);
  parts.push(`    visitorTimeLimitMinutes: ${lim},`);
  parts.push(`    bootingCompany: 'Verify locally',`);
  parts.push(`    signageQuality: '${sig}',`);
  parts.push(`    riskLevel: '${risk}',`);
  parts.push(`    notes: PLACEHOLDER_NOTE,`);
  parts.push(`  },`);
}

parts.push(`];`);
parts.push('');

fs.writeFileSync(outPath, parts.join('\n'));
console.log('Wrote', data.length, 'complexes to', outPath);
