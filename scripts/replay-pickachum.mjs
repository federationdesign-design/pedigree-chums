// DEV ONLY (stripped for production). Replay an exported recorder log through the
// live engine and diff each turn's old response against the new one.
//
// It re-runs each session's turns IN ORDER through a single fresh session, so
// rotation, transfers and the Boxer cut-off reproduce exactly as they did live
// (this is NOT a flat list of inputs replayed independently). After you edit the
// workbook and rebuild the data, this shows, per turn, what you fixed and what
// you broke.
//
// Usage:
//   npm run replay:pickachum -- path/to/pick-a-chum-log.csv
//   npx tsx scripts/replay-pickachum.mjs path/to/pick-a-chum-log.csv [--full]

import { readFileSync } from 'node:fs';
import { CHUM_DATA } from '../app/pick-a-chum/lib/data.ts';
import { submit } from '../app/pick-a-chum/lib/engine.ts';
import { newSession } from '../app/pick-a-chum/lib/session.ts';

const args = process.argv.slice(2);
const full = args.includes('--full');
const path = args.find((a) => !a.startsWith('--'));
if (!path) {
  console.error('Usage: npx tsx scripts/replay-pickachum.mjs <exported-log.csv> [--full]');
  process.exit(2);
}

// Minimal RFC4180 CSV parser (handles quotes, escaped quotes, embedded commas
// and newlines).
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c === '\r') { /* skip */ }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const raw = parseCsv(readFileSync(path, 'utf8')).filter((r) => r.length > 1 || (r.length === 1 && r[0] !== ''));
if (!raw.length) { console.error('empty log'); process.exit(1); }
const header = raw[0];
const idx = (name) => header.indexOf(name);
const col = { session: idx('sessionId'), turn: idx('turn'), dog: idx('activeDog'), input: idx('input'), text: idx('responseText'), action: idx('action'), bucket: idx('bucket') };
const rows = raw.slice(1).map((r) => ({
  session: r[col.session],
  turn: Number(r[col.turn]),
  dog: r[col.dog],
  input: r[col.input],
  oldText: r[col.text],
  oldAction: r[col.action],
  oldBucket: r[col.bucket],
}));

// Group by session, first-seen order, turns ascending.
const order = [];
const bySession = new Map();
for (const row of rows) {
  if (!bySession.has(row.session)) { bySession.set(row.session, []); order.push(row.session); }
  bySession.get(row.session).push(row);
}
for (const s of order) bySession.get(s).sort((a, b) => a.turn - b.turn);

const trunc = (s, n = 90) => (s.length > n ? s.slice(0, n) + '...' : s).replace(/\n/g, ' ⏎ ');
let turns = 0, changedText = 0, changedAction = 0, sessions = 0;

for (const s of order) {
  const seq = bySession.get(s);
  const startDog = seq[0].dog;
  const session = newSession(startDog);
  sessions++;
  console.log(`\n=== session ${s}  (start: ${startDog}, ${seq.length} turns) ===`);
  for (const row of seq) {
    // D6: safety turns are redacted at capture (no raw input stored). Skip them
    // rather than feeding the engine an empty or placeholder string.
    if (!row.input || row.input.startsWith('[redacted')) {
      console.log(`  turn ${row.turn}  [skipped: redacted safety turn]`);
      turns++;
      continue;
    }
    const t = submit(CHUM_DATA, session, row.input);
    const resp = t.response;
    const newText = resp.followUp ? `${resp.text}\n${resp.followUp}` : resp.text;
    const newAction = t.resolution.action;
    const textChanged = newText !== row.oldText;
    const actionChanged = newAction !== row.oldAction;
    turns++;
    if (textChanged) changedText++;
    if (actionChanged) changedAction++;
    const flag = textChanged || actionChanged ? 'CHANGED' : 'same';
    console.log(`  turn ${row.turn}  [${flag}]  ${startDog}> ${trunc(row.input, 60)}`);
    if (actionChanged) console.log(`      action: ${row.oldAction} -> ${newAction}`);
    if (textChanged) {
      console.log(`      old: ${full ? row.oldText.replace(/\n/g, ' ⏎ ') : trunc(row.oldText)}`);
      console.log(`      new: ${full ? newText.replace(/\n/g, ' ⏎ ') : trunc(newText)}`);
    }
  }
}

console.log(`\n---\n${sessions} sessions, ${turns} turns replayed. ${changedText} response(s) changed, ${changedAction} action(s) changed.`);
