// Pick a Chum multi-turn simulation.
//
// Feeds scripted multi-turn conversations through the real engine and writes a CSV
// of how each turn resolved. Each scenario runs in ONE session (state carried turn
// to turn); a fresh session starts at each new scenario. This is the deterministic
// local engine (no network), the same code the browser runs.
//
// Scenario file format (default: scripts/sim-scenarios.txt):
//   - a line starting with '#' begins a new scenario; the first token after '#' is
//     the scenario id (e.g. "# S01").
//   - every non-blank line after it is one turn (one visitor message), fed in order.
//   - blank lines are ignored.
//
// Run (via tsx, since the engine imports .ts modules):
//   npm run sim                                              # defaults, prints CSV to stdout
//   npx tsx scripts/sim-multi-turn.mjs [scenariosFile] [outCsv]
//   npx tsx scripts/sim-multi-turn.mjs scripts/sim-scenarios.txt ~/Downloads/out.csv
//
// CSV columns: scenarioId, turn, input, layer, bucket, action, responseId, outcome,
// responseText. `outcome` is derived from the action: safety -> refusal, a comic
// handoff -> transfer, gk_unknown/fallback -> unmatched, everything else -> answered.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const GEN = join(ROOT, 'app/pick-a-chum/data/generated');
const LIB = join(ROOT, 'app/pick-a-chum/lib');

const scenariosPath = process.argv[2] ? expand(process.argv[2]) : join(HERE, 'sim-scenarios.txt');
const outPath = process.argv[3] ? expand(process.argv[3]) : null;

function expand(p) {
  return p.startsWith('~') ? join(homedir(), p.slice(1)) : p;
}

const read = (f) => JSON.parse(readFileSync(join(GEN, f), 'utf8'));
const data = {
  collieResponses: read('collie-responses.json'),
  labradorResponses: read('labrador-responses.json'),
  boxerResponses: read('boxer-responses.json'),
  terrierResponses: read('terrier-responses.json'),
  destinations: read('destinations.json'),
  faq: read('faq.json'),
  generalKnowledge: read('general-knowledge.json'),
  articles: read('articles.json'),
  transfers: read('transfers.json'),
  copyComponents: read('copy-components.json'),
  dogs: read('dogs.json'),
  linkHandoffs: read('link-handoffs.json'),
  misspellings: read('misspellings.json'),
};

const { submit } = await import(pathToFileURL(join(LIB, 'engine.ts')).href);
const { newSession } = await import(pathToFileURL(join(LIB, 'session.ts')).href);

// Parse the scenario file into [{ id, turns: [...] }].
function parseScenarios(text) {
  const scenarios = [];
  let current = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('#')) {
      const id = line.slice(1).trim().split(/\s+/)[0] || `S${scenarios.length + 1}`;
      current = { id, turns: [] };
      scenarios.push(current);
    } else if (current) {
      current.turns.push(raw.trim());
    }
  }
  return scenarios;
}

// Outcome bucket, matching the earlier passes. Takes the whole resolution so a
// faq_answer that matched only weakly (a lone common token) reports as unmatched
// rather than a false 'answered' (Task 10B). Threshold: strength must be >= 1.
const FAQ_MATCH_THRESHOLD = 1;
function outcomeFor(r) {
  const action = r.action;
  if (action === 'safety_signpost' || action === 'safety_boundary') return 'refusal';
  if (action === 'transfer') return 'transfer';
  if (action === 'gk_unknown' || action === 'fallback') return 'unmatched';
  if (action === 'faq_answer' && r.faqMatchStrength !== undefined && r.faqMatchStrength < FAQ_MATCH_THRESHOLD) return 'unmatched';
  return 'answered';
}

// CSV-quote a field if it contains a comma, quote or newline.
function csv(v) {
  const s = v == null ? '' : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const scenarios = parseScenarios(readFileSync(scenariosPath, 'utf8'));
const rows = [['scenarioId', 'turn', 'input', 'layer', 'bucket', 'action', 'responseId', 'outcome', 'responseText']];

for (const sc of scenarios) {
  const session = newSession();
  sc.turns.forEach((input, i) => {
    const { resolution: r, response } = submit(data, session, input);
    rows.push([
      sc.id,
      i + 1,
      input,
      r.layer,
      r.bucket ?? '',
      r.action,
      response.responseId ?? '',
      outcomeFor(r),
      response.text ?? '',
    ]);
  });
}

const out = rows.map((row) => row.map(csv).join(',')).join('\n') + '\n';
if (outPath) {
  writeFileSync(outPath, out);
  console.error(`Wrote ${rows.length - 1} turns across ${scenarios.length} scenarios to ${outPath}`);
} else {
  process.stdout.write(out);
}
