import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const jsonPath = path.join(root, 'src/data/rexburg-housing.json');
const outPath = path.join(root, 'src/data/complexes.ts');
const sqlOutPath = path.join(root, 'supabase/sync_complexes_from_app.sql');

const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

function slug(s) {
  return (
    s
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'complex'
  );
}

const PLACEHOLDER_NOTE =
  'Placeholder visitor limit for testing — replace with verified parking rules.';

/** Cycling defaults only when a JSON row omits the field (see rexburg-housing.json). */
const limits = [45, 60, 30, 45, 30, 60];
const risks = ['moderate', 'low', 'high', 'moderate', 'high', 'low'];

/**
 * Optional fields per object in rexburg-housing.json (all optional except name/lat/lng):
 *   visitorTimeLimitMinutes: number | null  — null = no posted limit / unclear
 *   bootingCompany: string | null
 *   riskLevel: 'high' | 'moderate' | 'low' | 'unknown'
 *   notes: string — verbatim or summary from the sign; cite photo filename if useful
 *   enforcement: string — alias for bootingCompany (e.g. "RC Booting", "Guardian", "Unknown")
 *   weekday_hours / friday_hours: { start, end } — used to compose notes if notes omitted
 *   variants: string[] — e.g. Haven buildings; appended to composed notes
 *   peak_activity_hint: string — optional; shown when sighting stats are below threshold
 */
function pickVisitorLimit(row, i) {
  if (Object.prototype.hasOwnProperty.call(row, 'visitorTimeLimitMinutes')) {
    return row.visitorTimeLimitMinutes;
  }
  if (Object.prototype.hasOwnProperty.call(row, 'visitor_limit_minutes')) {
    return row.visitor_limit_minutes;
  }
  return limits[i % limits.length];
}

function pickString(row, key, fallback) {
  if (row[key] === undefined || row[key] === '') return fallback;
  return row[key];
}

function pickBootingCompany(row) {
  if (row.bootingCompany !== undefined && row.bootingCompany !== null && row.bootingCompany !== '') {
    return row.bootingCompany;
  }
  if (row.enforcement !== undefined && row.enforcement !== null && row.enforcement !== '') {
    return row.enforcement;
  }
  return 'Verify locally';
}

function formatLimitPhraseMinutes(minutes) {
  if (minutes == null) return null;
  if (minutes < 60) return `up to ${minutes} minutes`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return h === 1 ? 'up to 1 hour' : `up to ${h} hours`;
  const hp = h === 1 ? '1 hr' : `${h} hr`;
  return `${hp} ${m} min`;
}

function pickHourRange(obj) {
  if (!obj || obj.start == null || obj.end == null) return undefined;
  return { start: String(obj.start), end: String(obj.end) };
}

function pickWeekdayHoursForRow(row) {
  return pickHourRange(row.weekday_hours);
}

function pickFridayHoursForRow(row) {
  if (!Object.prototype.hasOwnProperty.call(row, 'friday_hours')) return undefined;
  if (row.friday_hours === null) return null;
  return pickHourRange(row.friday_hours);
}

/** Notes only (hours display in app from visitorWeekdayHours / visitorFridayHours). */
function composeAutoNotes(row) {
  const hasMeta =
    Object.prototype.hasOwnProperty.call(row, 'visitor_limit_minutes') ||
    Object.prototype.hasOwnProperty.call(row, 'visitorTimeLimitMinutes') ||
    (Array.isArray(row.variants) && row.variants.length > 0);
  if (!hasMeta) return null;

  const parts = [];
  if (Object.prototype.hasOwnProperty.call(row, 'visitor_limit_minutes')) {
    if (row.visitor_limit_minutes == null) {
      parts.push('Visitor duration not posted as a single time limit; check posted hours on site.');
    } else {
      const phrase = formatLimitPhraseMinutes(row.visitor_limit_minutes);
      parts.push(`Visitor parking ${phrase} when applicable.`);
    }
  } else if (Object.prototype.hasOwnProperty.call(row, 'visitorTimeLimitMinutes')) {
    if (row.visitorTimeLimitMinutes == null) {
      parts.push('Visitor duration not posted as a single time limit; check posted hours on site.');
    } else {
      const phrase = formatLimitPhraseMinutes(row.visitorTimeLimitMinutes);
      parts.push(`Visitor parking ${phrase} when applicable.`);
    }
  }

  if (Array.isArray(row.variants) && row.variants.length) {
    parts.push(`Same visitor policy surveyed for: ${row.variants.join(', ')}.`);
  }

  return parts.join(' ');
}

function pickNotes(row) {
  if (
    Object.prototype.hasOwnProperty.call(row, 'notes') &&
    row.notes !== undefined &&
    row.notes !== null &&
    String(row.notes).length > 0
  ) {
    return row.notes;
  }
  const auto = composeAutoNotes(row);
  if (auto) return auto;
  return PLACEHOLDER_NOTE;
}

function sqlQuote(s) {
  return `'${String(s).replace(/'/g, "''")}'`;
}

const used = new Map();
const rows = [];
for (let i = 0; i < data.length; i++) {
  const row = data[i];
  const base = slug(row.name);
  const n = used.get(base) || 0;
  used.set(base, n + 1);
  const id = n > 0 ? `${base}-${n + 1}` : base;
  rows.push({
    id,
    name: row.name.trim(),
    lat: row.lat,
    lng: row.lng,
    lim: pickVisitorLimit(row, i),
    risk: pickString(row, 'riskLevel', risks[i % risks.length]),
    boot: pickBootingCompany(row),
    notes: pickNotes(row),
    wh: pickWeekdayHoursForRow(row),
    fh: pickFridayHoursForRow(row),
    peakHint:
      row.peak_activity_hint != null && String(row.peak_activity_hint).trim() !== ''
        ? String(row.peak_activity_hint).trim()
        : undefined,
  });
}

const lats = rows.map((r) => r.lat);
const lngs = rows.map((r) => r.lng);
const midLat = lats.reduce((a, b) => a + b, 0) / lats.length;
const midLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;
const dLat = Math.max(...lats) - Math.min(...lats);
const dLng = Math.max(...lngs) - Math.min(...lngs);

const parts = [];
parts.push(`import { Complex } from '../types/complex';`);
parts.push('');
parts.push(`/** Placeholder copy — replace with verified rules when you have real data */`);
parts.push(`const PLACEHOLDER_NOTE = ${JSON.stringify(PLACEHOLDER_NOTE)};`);
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

for (const r of rows) {
  parts.push(`  {`);
  parts.push(`    id: '${r.id}',`);
  parts.push(`    name: ${JSON.stringify(r.name)},`);
  parts.push(`    address: 'Rexburg, ID',`);
  parts.push(`    latitude: ${r.lat},`);
  parts.push(`    longitude: ${r.lng},`);
  parts.push(`    visitorTimeLimitMinutes: ${r.lim === null ? 'null' : r.lim},`);
  parts.push(`    bootingCompany: ${r.boot === null ? 'null' : JSON.stringify(r.boot)},`);
  parts.push(`    riskLevel: '${r.risk}',`);
  if (r.wh) {
    parts.push(
      `    visitorWeekdayHours: { start: ${JSON.stringify(r.wh.start)}, end: ${JSON.stringify(r.wh.end)} },`,
    );
  }
  if (r.fh !== undefined) {
    if (r.fh === null) {
      parts.push(`    visitorFridayHours: null,`);
    } else {
      parts.push(
        `    visitorFridayHours: { start: ${JSON.stringify(r.fh.start)}, end: ${JSON.stringify(r.fh.end)} },`,
      );
    }
  }
  if (r.peakHint) {
    parts.push(`    peakActivityHint: ${JSON.stringify(r.peakHint)},`);
  }
  parts.push(`    notes: ${r.notes === PLACEHOLDER_NOTE ? 'PLACEHOLDER_NOTE' : JSON.stringify(r.notes)},`);
  parts.push(`  },`);
}

parts.push(`];`);
parts.push('');

fs.writeFileSync(outPath, parts.join('\n'));
console.log('Wrote', rows.length, 'complexes to', outPath);

const sql = [];
sql.push('-- Keeps public.complexes in sync with app IDs (required for sightings.complex_id FK).');
sql.push('-- Run in Supabase → SQL Editor. Regenerate: node scripts/generate-complexes.mjs');
sql.push('');
sql.push(
  'insert into public.complexes (id, name, address, latitude, longitude, visitor_time_limit_minutes, booting_company, signage_quality, risk_level, notes)',
);
sql.push('values');

for (let i = 0; i < rows.length; i++) {
  const r = rows[i];
  const limSql = r.lim === null ? 'null' : r.lim;
  const bootSql = r.boot === null ? 'null' : sqlQuote(r.boot);
  const noteSql = sqlQuote(r.notes);
  const line =
    `  (${sqlQuote(r.id)}, ${sqlQuote(r.name)}, ${sqlQuote('Rexburg, ID')}, ${r.lat}, ${r.lng}, ${limSql}, ${bootSql}, ${sqlQuote('unknown')}, ${sqlQuote(r.risk)}, ${noteSql})` +
    (i < rows.length - 1 ? ',' : '');
  sql.push(line);
}

sql.push('on conflict (id) do update set');
sql.push('  name = excluded.name,');
sql.push('  address = excluded.address,');
sql.push('  latitude = excluded.latitude,');
sql.push('  longitude = excluded.longitude,');
sql.push('  visitor_time_limit_minutes = excluded.visitor_time_limit_minutes,');
sql.push('  booting_company = excluded.booting_company,');
sql.push('  signage_quality = excluded.signage_quality,');
sql.push('  risk_level = excluded.risk_level,');
sql.push('  notes = excluded.notes;');

fs.writeFileSync(sqlOutPath, sql.join('\n'));
console.log('Wrote', sqlOutPath);
