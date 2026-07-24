// Pick a Chum content pipeline.
//
// Why: agent/data/workbook.xlsx is Steve's permanent editing surface for the
// life of the feature. He edits the spreadsheet, this script rebuilds the JSON
// records under app/pick-a-chum/data/generated/, and a push deploys the change.
// Hand-editing the generated files is pointless: they are overwritten here, so
// ALL content changes go through the workbook.
//
// Two sources feed the pack:
//   1. The workbook (all copy, routing, FAQ, responses, knowledge, config).
//   2. The repo's own dog database (data/*.ts) for the 54 pack dogs, which the
//      workbook references but does not contain. That phase imports the live
//      data modules so the dog records never drift from the site.
//
// Run from the repo root:
//   npm run build:chumdata            (rebuild everything, fail loud on bad rows)
//   node scripts/build-chumdata.mjs --check   (parse only, write nothing)
//
// The script is deliberately loud: every row it cannot parse is reported, and a
// malformed or missing required sheet is a hard failure so a broken workbook
// never deploys silently.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import * as XLSX from 'xlsx';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const WORKBOOK = join(ROOT, 'agent/data/workbook.xlsx');
const OUT_DIR = join(ROOT, 'app/pick-a-chum/data/generated');
const ROUTE_MAP = join(ROOT, 'app/pick-a-chum/data/route-map.json');
const CHECK_ONLY = process.argv.includes('--check');

const WORKBOOK_VERSION = '2.0';

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

const warnings = [];
const warn = (msg) => {
  warnings.push(msg);
  console.warn('  ! ' + msg);
};

// Header text -> stable camelCase key, unless an explicit map overrides it.
const camel = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .map((w, i) => (i === 0 ? w : w[0].toUpperCase() + w.slice(1)))
    .join('');

const clean = (v) => (v == null ? '' : String(v).replace(/\s+/g, ' ').trim());

// Split a delimited cell ("a; b; c" or "a|b|c") into a trimmed array.
const splitList = (v, re = /[|;]/) =>
  clean(v)
    ? clean(v)
        .split(re)
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

const isPlaceholderUrl = (v) => /^\[.*\]$/.test(clean(v)) || clean(v) === '';

// ---------------------------------------------------------------------------
// Sheet parsing
// ---------------------------------------------------------------------------

// Content sheets carry a title/note/blank preamble before the header row, so
// the header is located by content (best overlap with the configured column
// names) rather than a fixed index, which survives blank-row trimming and small
// layout edits. `headerRow` may be pinned explicitly (e.g. Lists at row 0).
function readSheet(wb, sheetName, { headerRow, columns, arrays = {}, required = [], idKey } = {}) {
  const ws = wb.Sheets[sheetName];
  if (!ws) {
    warn(`sheet "${sheetName}" not found in workbook`);
    return [];
  }
  const grid = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  if (headerRow == null) {
    const wanted = columns ? Object.keys(columns) : [];
    let best = -1;
    let bestScore = 0;
    const scan = Math.min(grid.length, 10);
    for (let r = 0; r < scan; r++) {
      const cells = (grid[r] || []).map(clean);
      const score = wanted.length
        ? wanted.filter((w) => cells.includes(w)).length
        : cells.filter(Boolean).length;
      if (score > bestScore) {
        bestScore = score;
        best = r;
      }
    }
    headerRow = best;
  }
  const headers = (grid[headerRow] || []).map(clean);
  if (headerRow < 0 || !headers.some(Boolean)) {
    warn(`sheet "${sheetName}" has no locatable header row`);
    return [];
  }

  // Build header-text -> output-key. Explicit `columns` map wins; anything not
  // listed falls back to a camelCased key so no column is silently dropped.
  const keyFor = (header) => {
    if (columns && columns[header] !== undefined) return columns[header];
    return camel(header);
  };
  // If an explicit column was configured but never appears, that is a schema
  // drift worth shouting about.
  if (columns) {
    for (const wanted of Object.keys(columns)) {
      if (!headers.includes(wanted)) {
        warn(`sheet "${sheetName}" expected column "${wanted}" but it is missing`);
      }
    }
  }

  const out = [];
  for (let r = headerRow + 1; r < grid.length; r++) {
    const row = grid[r] || [];
    const rec = {};
    let anyValue = false;
    headers.forEach((header, c) => {
      if (!header) return;
      const key = keyFor(header);
      if (key === null) return; // explicit skip
      const raw = clean(row[c]);
      if (raw) anyValue = true;
      rec[key] = arrays[key] ? splitList(row[c], arrays[key]) : raw;
    });
    if (!anyValue) continue; // fully blank row, ignore quietly

    const missing = required.filter((k) => {
      const val = rec[k];
      return Array.isArray(val) ? val.length === 0 : !val;
    });
    if (missing.length) {
      warn(`sheet "${sheetName}" row ${r + 1}: missing required [${missing.join(', ')}] -> row skipped`);
      continue;
    }
    out.push(rec);
  }
  if (idKey && out.length) {
    const seen = new Set();
    for (const rec of out) {
      const id = rec[idKey];
      if (seen.has(id)) warn(`sheet "${sheetName}" duplicate ${idKey} "${id}"`);
      seen.add(id);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Per-sheet configuration. Explicit column maps keep the output schema clean
// and stable even if the workbook's human-facing headers are reworded.
// ---------------------------------------------------------------------------

const SHEETS = {
  'priority-stack': {
    sheet: 'Priority Stack',
    idKey: 'priority',
    required: ['priority', 'layer'],
    columns: {
      Priority: 'priority',
      Layer: 'layer',
      Scope: 'scope',
      'What it checks': 'checks',
      'Required action': 'action',
      Reason: 'reason',
    },
  },
  buckets: {
    sheet: 'First Input Buckets',
    idKey: 'bucketId',
    required: ['bucketId', 'bucket'],
    arrays: { exampleInputs: /[|;]/ },
    columns: {
      'Bucket ID': 'bucketId',
      Bucket: 'bucket',
      'Related layer': 'relatedLayer',
      'Example inputs': 'exampleInputs',
      'Detection guidance': 'detectionGuidance',
      'Response behaviour': 'responseBehaviour',
      'Default outcome': 'defaultOutcome',
      'Important notes': 'notes',
    },
  },
  'character-profiles': {
    sheet: 'Character Profiles',
    idKey: 'dog',
    required: ['dog'],
    arrays: { specialisms: /;/, namesForOtherDogs: /;/, destinationFamilies: /[,;]/ },
    columns: {
      Dog: 'dog',
      'System role': 'systemRole',
      'Character premise': 'premise',
      Specialisms: 'specialisms',
      Voice: 'voice',
      'Names for other dogs': 'namesForOtherDogs',
      'Destination families': 'destinationFamilies',
      'Commercial behaviour': 'commercialBehaviour',
      'Knowledge depth': 'knowledgeDepth',
      'Build status': 'buildStatus',
    },
  },
  'first-interaction-matrix': {
    sheet: 'First Interaction Matrix',
    idKey: 'bucketId',
    required: ['bucketId'],
    columns: {
      'Bucket ID': 'bucketId',
      'Input family': 'inputFamily',
      Collie: 'collie',
      Labrador: 'labrador',
      'Border Terrier': 'borderTerrier',
      Boxer: 'boxer',
      'Implementation note': 'note',
    },
  },
  'collie-responses': {
    sheet: 'Collie Responses',
    idKey: 'responseId',
    required: ['responseId', 'bucketId', 'template'],
    arrays: { triggers: /;/ },
    columns: {
      'Response ID': 'responseId',
      'Bucket ID': 'bucketId',
      Subtag: 'subtag',
      'Trigger examples / condition': 'triggers',
      'Collie response template': 'template',
      'Fact source': 'factSource',
      'Default route': 'defaultRoute',
      'Animation cue': 'animationCue',
      Status: 'status',
    },
  },
  destinations: {
    sheet: 'Destinations',
    idKey: 'destinationId',
    required: ['destinationId', 'name', 'family'],
    arrays: { triggerTags: /;/, preferredDog: /\// },
    columns: {
      'Destination ID': 'destinationId',
      Name: 'name',
      Family: 'family',
      Action: 'action',
      Description: 'description',
      'Trigger tags': 'triggerTags',
      'Campaign state': 'campaignState',
      Weight: 'weight',
      'Preferred dog': 'preferredDog',
      'URL / action ID': 'workbookUrl',
    },
  },
  'gk-plan': {
    sheet: 'General Knowledge Plan',
    idKey: 'categoryId',
    required: ['categoryId', 'category'],
    columns: {
      'Category ID': 'categoryId',
      Category: 'category',
      'Target records': 'targetRecords',
      Scope: 'scope',
      'Collie treatment': 'collieTreatment',
      Exclusions: 'exclusions',
    },
  },
  'general-knowledge': {
    sheet: 'GK Seed Questions',
    idKey: 'questionId',
    required: ['questionId', 'canonicalQuestion', 'correctAnswer'],
    arrays: { alternativePhrasings: /\|/ },
    columns: {
      'Question ID': 'questionId',
      Category: 'category',
      'Canonical question': 'canonicalQuestion',
      'Correct answer': 'correctAnswer',
      'Collie observation': 'collieObservation',
      'Alternative phrasings': 'alternativePhrasings',
      Status: 'status',
    },
  },
  'collie-knowledge': {
    sheet: 'Collie Knowledge',
    idKey: 'factId',
    required: ['factId', 'topic'],
    columns: {
      'Fact ID': 'factId',
      Category: 'category',
      Topic: 'topic',
      'Approved value / brief': 'approvedValue',
      Source: 'source',
      Status: 'status',
      'Usage note': 'usageNote',
    },
  },
  transfers: {
    sheet: 'Transfers',
    idKey: 'transferId',
    required: ['transferId', 'from', 'to'],
    arrays: { strongTriggers: /\|/ },
    columns: {
      'Transfer ID': 'transferId',
      From: 'from',
      To: 'to',
      'Strong triggers': 'strongTriggers',
      'Exclusions / higher-priority checks': 'exclusions',
      'Example transfer line': 'exampleLine',
      'Context carried': 'contextCarried',
    },
  },
  'mini-games': {
    sheet: 'Mini Games',
    idKey: 'gameId',
    required: ['gameId', 'name'],
    columns: {
      'Game ID': 'gameId',
      Name: 'name',
      Phase: 'phase',
      'Human name / mechanic': 'mechanic',
      'MVP behaviour': 'mvpBehaviour',
      'State rule': 'stateRule',
      Constraints: 'constraints',
      'Why selected': 'whySelected',
    },
  },
  'session-logic': {
    sheet: 'Session Logic',
    idKey: 'ruleId',
    required: ['ruleId', 'rule'],
    columns: {
      'Rule ID': 'ruleId',
      Area: 'area',
      Rule: 'rule',
      Reason: 'reason',
    },
  },
  'analytics-events': {
    sheet: 'Analytics & QA',
    idKey: 'eventId',
    required: ['eventId', 'event'],
    columns: {
      'Event ID': 'eventId',
      Event: 'event',
      'When fired': 'whenFired',
      'Suggested properties': 'suggestedProperties',
      Purpose: 'purpose',
    },
  },
  'copy-components': {
    sheet: 'Copy Components',
    idKey: 'componentId',
    required: ['componentId', 'line'],
    columns: {
      'Component ID': 'componentId',
      Type: 'type',
      Subgroup: 'subgroup',
      Line: 'line',
      'Usage rule': 'usageRule',
      Status: 'status',
    },
  },
  faq: {
    sheet: 'FAQ Library',
    idKey: 'faqId',
    required: ['faqId', 'canonicalQuestion'],
    arrays: { alternativePhrasings: /\|/ },
    columns: {
      'FAQ ID': 'faqId',
      'Canonical question': 'canonicalQuestion',
      'Alternative phrasings': 'alternativePhrasings',
      'Canonical answer': 'canonicalAnswer',
      'Source page': 'sourcePage',
      CTA: 'cta',
      'Campaign state': 'campaignState',
      'Content status': 'contentStatus',
      Notes: 'notes',
    },
  },
  articles: {
    sheet: 'Article Library',
    idKey: 'articleId',
    required: ['articleId', 'title'],
    arrays: { triggerTags: /;/, preferredDog: /\// },
    columns: {
      'Article ID': 'articleId',
      Title: 'title',
      'Trigger tags': 'triggerTags',
      'Preferred dog': 'preferredDog',
      Family: 'family',
      Status: 'status',
      URL: 'workbookUrl',
      Notes: 'notes',
    },
  },
  'research-sources': {
    sheet: 'Research Sources',
    idKey: 'sourceId',
    required: ['sourceId', 'title'],
    columns: {
      'Source ID': 'sourceId',
      Title: 'title',
      'Author / owner': 'author',
      Supports: 'supports',
      'URL / location': 'url',
      'Source type': 'sourceType',
      Status: 'status',
    },
  },
  risks: {
    sheet: 'Risks & Mitigations',
    idKey: 'riskId',
    required: ['riskId', 'scenario'],
    columns: {
      'Risk ID': 'riskId',
      Scenario: 'scenario',
      Severity: 'severity',
      Risk: 'risk',
      Mitigation: 'mitigation',
      'Why this solution': 'why',
    },
  },
  decisions: {
    sheet: 'Decision Log',
    idKey: 'id',
    required: ['id', 'decision'],
    columns: {
      ID: 'id',
      Decision: 'decision',
      'Approved approach': 'approvedApproach',
      Reason: 'reason',
      Status: 'status',
      Phase: 'phase',
    },
  },
  'animation-states': {
    sheet: 'Animation Future',
    idKey: 'stateId',
    required: ['stateId', 'state'],
    columns: {
      'State ID': 'stateId',
      State: 'state',
      Behaviour: 'behaviour',
      Trigger: 'trigger',
      'Comedy meaning': 'comedyMeaning',
      Phase: 'phase',
    },
  },
  'open-inputs': {
    sheet: 'Open Inputs',
    idKey: 'inputId',
    required: ['inputId', 'item'],
    columns: {
      'Input ID': 'inputId',
      Item: 'item',
      'Required detail': 'requiredDetail',
      'Why / deadline': 'whyDeadline',
      Owner: 'owner',
    },
  },
  'change-log': {
    sheet: 'Change Log',
    idKey: 'version',
    required: ['version'],
    columns: {
      Version: 'version',
      Date: 'date',
      Summary: 'summary',
      Status: 'status',
    },
  },
  lists: {
    sheet: 'Lists',
    headerRow: 0,
    required: [],
    // Column-oriented enum lists; parsed into { status, phase, severity, campaignState } arrays below.
  },
};

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------

console.log(`Reading ${WORKBOOK}`);
const wb = XLSX.read(readFileSync(WORKBOOK), { type: 'buffer' });

const data = {};
for (const [name, cfg] of Object.entries(SHEETS)) {
  const { sheet, ...opts } = cfg;
  const rows = readSheet(wb, sheet, opts);
  data[name] = rows;
  console.log(`  ${name.padEnd(26)} ${String(rows.length).padStart(4)} records  (${sheet})`);
}

// Lists is column-oriented enums, not row records: pivot each column into its
// own array so the runtime can validate campaign/status/severity/phase values.
{
  const ws = wb.Sheets['Lists'];
  const grid = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false, defval: '' });
  const headers = (grid[0] || []).map(clean);
  const enums = {};
  headers.forEach((h, c) => {
    if (!h) return;
    enums[camel(h)] = grid
      .slice(1)
      .map((row) => clean(row[c]))
      .filter(Boolean);
  });
  data.lists = enums;
}

// Route-map overlay: resolve every Destination / Article to a real app route.
// The workbook holds "[URL to be supplied]" placeholders; route-map.json is the
// repo-derived resolution layer. A real URL typed into the workbook wins over
// the overlay, so Steve can override a route from the spreadsheet later.
let routeMap = {};
try {
  routeMap = JSON.parse(readFileSync(ROUTE_MAP, 'utf8'));
} catch {
  warn(`route-map.json not found at ${ROUTE_MAP}; destinations/articles will have no resolvedUrl`);
}
const unresolved = [];
const resolve = (rec, idKey) => {
  const id = rec[idKey];
  const entry = routeMap[id] || {};
  const workbookUrl = clean(rec.workbookUrl);
  const resolvedUrl = !isPlaceholderUrl(workbookUrl) ? workbookUrl : entry.resolvedUrl || null;
  if (!resolvedUrl && !entry.embedded) unresolved.push(`${idKey} ${id} (${rec.name || rec.title})`);
  return { ...rec, resolvedUrl: resolvedUrl || null, routeNote: entry.note || null };
};
data.destinations = data.destinations.map((r) => resolve(r, 'destinationId'));
data.articles = data.articles.map((r) => resolve(r, 'articleId'));
if (unresolved.length) {
  console.log(`  route-map: ${unresolved.length} destination(s)/article(s) without a resolved URL:`);
  unresolved.forEach((u) => console.log('      - ' + u));
}

// FAQ answer overlay: the workbook holds {{approved_..._answer}} placeholders;
// faq-source.json carries the real answers pulled from the live-site FAQ. Fill
// each mapped FAQ record's resolvedAnswer so the pack answers with real copy.
// The eventual home for these is the workbook's Canonical answer column.
{
  let src;
  try {
    src = JSON.parse(readFileSync(join(ROOT, 'app/pick-a-chum/data/faq-source.json'), 'utf8'));
  } catch {
    warn('faq-source.json not found; FAQ records keep their {{placeholder}} answers');
  }
  const byId = {};
  for (const e of src?.entries || []) if (e.workbookFaqId) byId[e.workbookFaqId] = e;
  data.faq = data.faq.map((rec) => {
    const e = byId[rec.faqId];
    const raw = clean(rec.canonicalAnswer);
    const hasReal = raw && !/\{\{.*\}\}/.test(raw);
    const resolvedAnswer = hasReal ? raw : e ? e.answer : null;
    return { ...rec, resolvedAnswer: resolvedAnswer || null, resolvedCta: e?.cta || null };
  });
  const unfilled = data.faq.filter((r) => !r.resolvedAnswer).map((r) => r.faqId);
  if (unfilled.length) {
    console.log(`  faq: ${unfilled.length} record(s) still without an approved answer: ${unfilled.join(', ')}`);
  }
}

// Dogs phase: the 54 pack dogs are not in the workbook (it references "the
// existing database"). Import the repo's own data/*.ts modules directly so the
// records never drift from the site, then reshape into one dog record per dog.
// Join key is Breed.slug; the name-keyed files (lifespan, lineage, breed-info)
// are looked up by Breed.name.
async function loadTs(rel) {
  return import(pathToFileURL(join(ROOT, rel)).href);
}
{
  const { breeds } = await loadTs('data/breeds.ts');
  const health = (await loadTs('data/healthConditions.ts')).default;
  const costs = (await loadTs('data/runningCosts.ts')).default;
  const training = (await loadTs('data/trainingDifficulty.ts')).default;
  const { lifespanCurves } = await loadTs('data/lifespanCurves.ts');
  const famous = (await loadTs('data/famousDogs.ts')).default;
  const { getLineage } = await loadTs('data/lineage.ts');
  let resolveLineageName = (n) => n;
  try {
    resolveLineageName = (await loadTs('data/lineageNames.ts')).resolveLineageName || resolveLineageName;
  } catch {
    /* optional bridge */
  }
  const breedInfo = JSON.parse(readFileSync(join(ROOT, 'data/breed-info.json'), 'utf8'));

  const lineageFor = (name) => getLineage(name) || getLineage(resolveLineageName(name)) || null;

  data.dogs = breeds.map((b) => {
    const cost = costs[b.slug];
    const info = breedInfo[b.name] || {};
    const missing = [];
    if (!health[b.slug]) missing.push('health');
    if (!cost) missing.push('costs');
    if (!training[b.slug]) missing.push('training');
    if (!lifespanCurves[b.name]) missing.push('lifespanCurve');
    if (!breedInfo[b.name]) missing.push('breedInfo');
    const lineage = lineageFor(b.name);
    if (!lineage) missing.push('lineage');
    if (missing.length) warn(`dog "${b.slug}" missing joins: [${missing.join(', ')}]`);

    const annual = cost?.annualCosts || null;
    return {
      name: b.name,
      slug: b.slug,
      detailUrl: `/chums/${b.slug}`,
      subtitle: info.subtitle || null,
      fact: b.fact,
      character: b.character,
      temperament: info.temperament || [],
      pros: info.pros || [],
      cons: info.cons || [],
      lookFor: b.lookFor,
      size: b.size,
      sizeBand: b.sizeBand,
      coatColour: b.coatColour,
      coatLength: b.coatLength,
      height: b.height,
      length: b.length,
      weight: b.weight,
      skull: b.skull,
      type: b.type,
      image: b.image,
      lifespanYears: cost?.lifespanYears ?? null,
      costs: cost
        ? {
            currency: cost.currency,
            priceYear: cost.priceYear,
            annual,
            annualTotal: annual ? Object.values(annual).reduce((a, n) => a + n, 0) : null,
            medicalScenarios: cost.medicalScenarios,
          }
        : null,
      training: training[b.slug]
        ? {
            score: training[b.slug].score,
            label: training[b.slug].label,
            traits: training[b.slug].traits,
            goodFor: training[b.slug].goodFor,
            watchOut: training[b.slug].watchOut,
          }
        : null,
      health: health[b.slug]
        ? { generalNote: health[b.slug].generalNote, conditions: health[b.slug].conditions }
        : null,
      lifespanCurve: lifespanCurves[b.name] || null,
      famousDogs: famous[b.slug] || [],
      lineage,
    };
  });
  console.log(`  ${'dogs'.padEnd(26)} ${String(data.dogs.length).padStart(4)} records  (repo data/*.ts, not the workbook)`);
}

// Read Me live counts, useful as a self-describing header for the pack.
const meta = {
  generatedFrom: 'agent/data/workbook.xlsx',
  workbookVersion: WORKBOOK_VERSION,
  counts: Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, Array.isArray(v) ? v.length : Object.keys(v).length])
  ),
  warnings: warnings.length,
};

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

if (CHECK_ONLY) {
  console.log('\n--check: parsed workbook, wrote nothing.');
} else {
  mkdirSync(OUT_DIR, { recursive: true });
  for (const [name, rows] of Object.entries(data)) {
    writeFileSync(join(OUT_DIR, `${name}.json`), JSON.stringify(rows, null, 2) + '\n');
  }
  writeFileSync(join(OUT_DIR, 'manifest.json'), JSON.stringify(meta, null, 2) + '\n');
  console.log(`\nWrote ${Object.keys(data).length + 1} files to app/pick-a-chum/data/generated/`);
}

console.log(`\n${warnings.length} warning(s).`);
if (warnings.length) {
  // Missing required rows and schema drift are warnings; a completely unreadable
  // required sheet already returned []. Fail the build so nothing broken deploys.
  const fatal = warnings.some(
    (w) => w.includes('not found in workbook') || w.includes('no locatable header row')
  );
  if (fatal) {
    console.error('\nFATAL: a required sheet is missing or unreadable. Aborting.');
    process.exit(1);
  }
}
