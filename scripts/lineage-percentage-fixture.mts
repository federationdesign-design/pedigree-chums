// Lineage percentage fixture (BRIEF.md section 7, owner decision D1).
//
// Captures every percentage the site can display for the family trees, plus
// the derived campaign level list, as deterministic text. Committed as the
// baseline before any lineage grafting. After each batch that touches a tree,
// rerun with --check: the only permitted differences are NEW rows for new
// foundation records (and, at Batch 2, exactly two new level-list rows). If
// any existing figure moves, stop and report; never adjust a figure to make
// the assertion pass.
//
// What is captured, and which render site each part covers:
//   [tree]     every node of every expanded tree (grafts included) with its
//              leaf-sum percent (ancestryBreakdown maths, data/lineageArchive.ts:45-48)
//              and its subtree-sum percent (the d3 .sum((d) => d.value ?? 0)
//              maths behind the break panel, components/BreedTree/BreedTree.tsx:1151)
//   [breakdown] ancestryBreakdown() rows for each pack breed: the breed-page
//              ancestry card and the mini pit learn rail
//   [share]    ancestorShareOf() for each pack breed against every ancestor
//              name in its own expanded tree: the chum-picked panel
//   [levels]   the derived campaign level list, replicating
//              app/britains-dog-history/BreedStrip.tsx:137-147
//
// Usage:  npx tsx scripts/lineage-percentage-fixture.mts          write
//         npx tsx scripts/lineage-percentage-fixture.mts --check  verify
//
// The LINEAGE record is not exported, so tree keys are parsed from the source
// text of data/lineage.ts (top-level entries are exactly two spaces deep and
// open an object). The count is asserted so silent drift is caught.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getLineage, type LineageNode } from "../data/lineage";
import { ancestryBreakdown, ancestorShareOf } from "../data/lineageArchive";
import { breeds } from "../data/breeds";
import { ukBreeds } from "../data/uk-breeds";
import { resolveLineageName } from "../data/lineageNames";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
// tests/, not agent/: agent/ is gitignored, and the fixture must be tracked
// so the --check gate is meaningful on every clone.
const FIXTURE_DIR = join(ROOT, "tests", "lineage");
const PCT_FILE = join(FIXTURE_DIR, "percentages.txt");
const LEVELS_FILE = join(FIXTURE_DIR, "level-list.txt");

// ---- tree keys, parsed from source ----------------------------------------
const lineageSource = readFileSync(join(ROOT, "data", "lineage.ts"), "utf8");
const keys = [...lineageSource.matchAll(/^  "([^"]+)": \{$/gm)].map((m) => m[1]);
// 125 = the 123 baseline entries plus the two Batch 2 ancient additions.
if (keys.length !== 125) {
  console.error(
    `expected 125 top-level LINEAGE keys, parsed ${keys.length}; ` +
      "data/lineage.ts layout changed, update the parser before trusting this fixture"
  );
  process.exit(1);
}
keys.sort();

// ---- the two percentage measures ------------------------------------------
// Mirrors sumLeaves in data/lineageArchive.ts:45-48, including the `?? 1`.
function leafSum(n: LineageNode): number {
  if (!n.children?.length) return n.value ?? 1;
  return n.children.reduce((s, c) => s + leafSum(c), 0);
}
// Mirrors d3 hierarchy().sum((d) => d.value ?? 0): own value plus descendants.
function subtreeSum(n: LineageNode): number {
  return (n.value ?? 0) + (n.children ?? []).reduce((s, c) => s + subtreeSum(c), 0);
}
const pct = (part: number, whole: number): string =>
  whole > 0 ? String(Math.round((part / whole) * 100)) : "na";

// ---- build the percentage fixture -----------------------------------------
const lines: string[] = [];
for (const key of keys) {
  const tree = getLineage(key);
  if (!tree) continue;
  const rootLeaves = leafSum(tree);
  const rootSubtree = subtreeSum(tree);
  const walk = (n: LineageNode, path: string) => {
    lines.push(
      `[tree] ${path} | leafPct=${pct(leafSum(n), rootLeaves)} d3Pct=${pct(subtreeSum(n), rootSubtree)}`
    );
    n.children?.forEach((c) => walk(c, `${path} > ${c.name}`));
  };
  walk(tree, key);
}

const packNames = breeds.map((b) => b.name).sort();
for (const name of packNames) {
  for (const row of ancestryBreakdown(name)) {
    lines.push(`[breakdown] ${name} | ${row.name} = ${row.pct}`);
  }
}

for (const name of packNames) {
  const tree = getLineage(resolveLineageName(name));
  if (!tree) continue;
  const ancestors = new Set<string>();
  const collect = (n: LineageNode) => {
    ancestors.add(n.name);
    n.children?.forEach(collect);
  };
  tree.children?.forEach(collect);
  ancestors.delete(name);
  for (const anc of [...ancestors].sort()) {
    const share = ancestorShareOf(name, anc);
    if (share !== null) lines.push(`[share] ${name} of ${anc} = ${share}`);
  }
}

// ---- the derived campaign level list --------------------------------------
// Replicates BreedStrip.tsx: strip order, anchor order, keep rows whose
// lineage has ancestors and which have no pack page (breedCardKind "play").
// Root-only records are flip-only cards, never levels (owner decision,
// 3 August), so this file must match the 62-level baseline exactly until a
// future batch deliberately adds an ancestored level.
const STRIP_ORDER = [
  "ancient-medieval",
  "c1500",
  "c1700",
  "early1800",
  "spaniels",
  "mid1800",
  "late1800",
  "c1900",
  "crosses",
];
const levelRows = ukBreeds
  .slice()
  .sort(
    (a, b) =>
      STRIP_ORDER.indexOf(a.strip) - STRIP_ORDER.indexOf(b.strip) || a.anchor - b.anchor
  )
  .filter((b) => {
    const pn = resolveLineageName(b.name);
    const lineage = getLineage(pn);
    // Mirrors breedCardKind: only an ancestored lineage makes a level, so a
    // root-only record (flip-only card) never joins the campaign.
    return !breeds.find((x) => x.name === pn)?.slug && !!lineage?.children?.length;
  })
  .map((b, i) => `[level] ${String(i).padStart(2, "0")} ${b.strip} ${b.name}`);

const pctBlob = lines.join("\n") + "\n";
const levelsBlob = levelRows.join("\n") + "\n";

// ---- write or check --------------------------------------------------------
if (process.argv.includes("--check")) {
  let failed = false;
  for (const [file, blob] of [
    [PCT_FILE, pctBlob],
    [LEVELS_FILE, levelsBlob],
  ] as const) {
    const committed = readFileSync(file, "utf8");
    if (committed === blob) {
      console.log(`ok       ${file}`);
    } else {
      failed = true;
      const a = committed.split("\n");
      const b = blob.split("\n");
      const aSet = new Set(a);
      const bSet = new Set(b);
      const removed = a.filter((l) => l && !bSet.has(l));
      const added = b.filter((l) => l && !aSet.has(l));
      console.error(`MISMATCH ${file}: ${removed.length} line(s) gone, ${added.length} new`);
      removed.slice(0, 20).forEach((l) => console.error(`  - ${l}`));
      added.slice(0, 20).forEach((l) => console.error(`  + ${l}`));
    }
  }
  process.exit(failed ? 1 : 0);
} else {
  mkdirSync(FIXTURE_DIR, { recursive: true });
  writeFileSync(PCT_FILE, pctBlob);
  writeFileSync(LEVELS_FILE, levelsBlob);
  console.log(`wrote ${PCT_FILE} (${lines.length} lines)`);
  console.log(`wrote ${LEVELS_FILE} (${levelRows.length} levels)`);
}
