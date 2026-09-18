/* LINEAGE DRIFT CHECK
   ==================
   Asserts that every dog name in data/lineage.ts carries the SAME children
   wherever it appears.

   WHY IT EXISTS. lineage.ts is literal all the way down: there is no reuse
   mechanism, so a subtree that appears in four trees is written out four times.
   Deepen one copy and the others go stale, and nothing notices. That has already
   happened to 23 names. This is the thing that notices.

   ECHOES ARE EXCLUDED FROM EVERY CHILD SET, and that is not a detail. An echo (a
   child repeating its parent's name) is load-bearing: the tree builder collapses
   any valueless node down to its only child, so a node with one real parent needs
   an echo beside it or it is deleted outright. Comparing raw child lists would
   flag every one of those as drift. Whether a node CARRIES an echo is reported
   separately, because that is a real difference worth knowing about, but it never
   fails the check on its own.

   THE DEPTH CEILING IS NOT DRIFT EITHER. The archive's deepest lines reach 8
   generations, and a tree that runs out of room stops a name short without anyone
   having forgotten anything. A name that is only ever truncated DEEPER than it is
   full is reported as a ceiling, not as a fault. Only a name truncated at a depth
   it is also full at is counted against the check.

   HOW TO RUN IT
     ./node_modules/.bin/tsx scripts/lineage-drift-check.mts
     ./node_modules/.bin/tsx scripts/lineage-drift-check.mts --all   (ceilings too)

   EXIT CODE. 1 if any real drift is found, 0 otherwise, so it can be wired into a
   build when the existing backlog is cleared. See the note by BASELINE. */
import { LINEAGE_ROOTS, getLineage } from "../data/lineage";

type N = { name: string; note?: string; value?: number; children?: N[] };

/* THE BACKLOG, AND WHY THIS IS NOT ZERO YET (18 September 2026). SEVEN names are
   genuinely drifted today: four gaps and three disjoint. Until they are fixed the
   check cannot fail a build without failing every build, so it reports by default
   and only fails when the count RISES above this line.

   DO NOT RAISE THIS NUMBER TO MAKE THE CHECK PASS. Lower it as they are fixed, and
   when it reaches 0, wire --strict into the build and delete this constant.

   TWO OF THE SEVEN ARE NOT WHAT THEY LOOK LIKE, and are worth reading before
   anyone "fixes" them:
     Old working collies   carries Shepherd's Dogs TWICE as a child in 13 trees,
                           with identical subtrees. That is a duplicate, not an
                           echo, and it is probably a paste that was never noticed.
     Manchester Terrier    disagrees only between "Old English Black & Tan Terrier"
                           and "Black and Tan Terrier". That is one dog under two
                           spellings, so the fix is a rename, not a re-link, and it
                           also means treesContaining counts it as two dogs. */
const BASELINE = 7;

const showAll = process.argv.includes("--all");
const strict = process.argv.includes("--strict");

type Occ = { tree: string; depth: number; kids: string[]; echo: boolean };
const occ = new Map<string, Occ[]>();

for (const root of LINEAGE_ROOTS) {
  const t = getLineage(root) as N | null;
  if (!t) continue;
  const walk = (n: N, parent: N | null, depth: number) => {
    const kids = (n.children ?? []).filter((c) => c.name !== n.name);
    const isEchoNode = !!parent && parent.name === n.name;
    if (depth > 0 && !isEchoNode) {
      if (!occ.has(n.name)) occ.set(n.name, []);
      occ.get(n.name)!.push({
        tree: root,
        depth,
        kids: kids.map((c) => c.name).sort(),
        echo: (n.children ?? []).some((c) => c.name === n.name),
      });
    }
    (n.children ?? []).forEach((c) => walk(c, n, depth + 1));
  };
  walk(t, null, 0);
}

type Finding = { name: string; trees: number; kind: "gap" | "disjoint" | "ceiling"; detail: string };
const findings: Finding[] = [];

for (const [name, list] of occ) {
  const byKids = new Map<string, { kids: string[]; trees: Set<string>; depths: number[] }>();
  for (const o of list) {
    const key = o.kids.join("|");
    if (!byKids.has(key)) byKids.set(key, { kids: o.kids, trees: new Set(), depths: [] });
    byKids.get(key)!.trees.add(o.tree);
    byKids.get(key)!.depths.push(o.depth);
  }
  if (byKids.size < 2) continue;

  const variants = [...byKids.values()].sort((a, b) => b.kids.length - a.kids.length);
  const fullest = variants[0];
  const empty = variants.find((v) => v.kids.length === 0);
  const trees = new Set(list.map((o) => o.tree)).size;

  if (empty) {
    const cut = Math.min(...empty.depths);
    const full = Math.min(...fullest.depths);
    if (cut > full) {
      findings.push({ name, trees, kind: "ceiling",
        detail: `stops dead only at depth ${cut}; full (${fullest.kids.length} children) as shallow as ${full}` });
    } else {
      findings.push({ name, trees, kind: "gap",
        detail: `stops dead at depth ${cut} in ${empty.trees.size} tree(s) but is full at depth ${full}: ${fullest.kids.join(", ")}` });
    }
    continue;
  }
  const subset = variants.slice(1).every((v) => v.kids.every((k) => fullest.kids.includes(k)));
  findings.push({ name, trees, kind: subset ? "ceiling" : "disjoint",
    detail: subset
      ? `shorter sets are subsets of the fullest (${fullest.kids.join(", ")})`
      : variants.map((v) => `[${v.kids.join(", ") || "none"}] in ${v.trees.size}`).join("  vs  ") });
}

findings.sort((a, b) => b.trees - a.trees || a.name.localeCompare(b.name));
const real = findings.filter((f) => f.kind !== "ceiling");
const ceilings = findings.filter((f) => f.kind === "ceiling");

const line = (f: Finding) => `  ${String(f.trees).padStart(3)} trees  ${f.kind.toUpperCase().padEnd(8)} ${f.name}\n              ${f.detail}`;
console.log(`\nlineage drift check: ${occ.size} distinct names across ${LINEAGE_ROOTS.length} trees\n`);
if (real.length) {
  console.log(`REAL DRIFT (${real.length}), ordered by how many trees the name appears in:\n`);
  real.forEach((f) => console.log(line(f)));
} else {
  console.log("REAL DRIFT: none.");
}
console.log(`\nDEPTH CEILINGS (${ceilings.length}), not counted as drift${showAll ? "" : "; pass --all to list them"}:`);
if (showAll) ceilings.forEach((f) => console.log(line(f)));

console.log(`\nreal drift ${real.length}, baseline ${BASELINE}`);
if (real.length > BASELINE) {
  console.log(`FAIL: ${real.length - BASELINE} more than the recorded backlog. A copy has gone stale.`);
  process.exit(1);
}
if (strict && real.length > 0) {
  console.log("FAIL (--strict): the backlog is not clear.");
  process.exit(1);
}
if (real.length < BASELINE) console.log(`Lower BASELINE to ${real.length} in this file: some drift has been fixed.`);
console.log("OK");
