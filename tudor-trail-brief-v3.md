# Tudor trail: giving every dog an ancestry back to Tudor

**Version 3.** Supersedes v1 and v2. Section 14 lists what changed and why, so nothing is re-litigated.

_Measured against the real data at `main`, 8 August 2026._

**This is a WRITING job, not a coding job.** Most failures need new lineage written. Renaming buys almost nothing and the depth cap is not involved at all.

Do it in a session of its own. Do not mix it with the visual work.

---

## 1. The rule

**Every playable dog on the history page should trace back to at least the TUDOR era.**

Tudor, because that is where the writing starts. John Caius published the first real classification of English dogs in 1576. Before that the trail is inference; from Tudor on it can be cited.

**A trail that ends at a Tudor or medieval card is FINISHED, not a gap.** Anything deeper is a bonus.

## 2. What a percentage means. Read this before writing any.

**Percentages are visual reconstruction weights.** They are Pedigree Chums' best estimate of historical contribution. They are **not** measured DNA and **not** documented pedigree proportions.

This matters more the further back you go. A useful hierarchy:

| Era | What the numbers mean |
|---|---|
| Modern documented pedigree | Breeding records may actually exist |
| Historic breed formation | Contributors documented, proportions generally unknown |
| Early-modern working populations | Reconstructed from descriptions, function and geography |
| Ancient populations | Broad influence rather than literal pedigree |

**The rule for the data:** where a named breed is supported by records, use the breed. Where the records describe a population or working type rather than a stable breed, use the population. Where ancestry is disputed, show plausible contributors rather than converting uncertainty into false certainty.

**The public line stays:** "Our best guess, not hard science."

## 3. Where it stands today

- 100 cards on the history page, 93 playable.
- **34 cards fail the rule**: their trail stops before reaching any card in the `c1500`, `medieval` or `ancient` strips.
- **35 distinct ancestor names have no data.** 33 are named in section 6; **finding the other 2 is step 3.**
- **The depth cap is NOT a factor.** Every card that has the data reaches Tudor by depth 4 or less, and `MAX_LINEAGE_DEPTH` is 5. Nothing fails because a real tree could not graft.
- **Step 1 of v2, the Talbot alias, is DONE**, pushed as `a3950ef5`. 34 of 46 dead branches now graft. It did not move the failure count, which was expected.
- **The four placeholder images are DONE**, pushed as `7e702e19`.

**Worked example of the "genuinely no data behind the ancestor" category: `Ancient Molossers`.**

`Ancient Molossers` appears as a node in **11 level trees** (Irish Wolfhound, Mastiff, Ancient Mastiff, Livestock Dog, Cur, Jack Russell Terrier, Bull Terrier, Staffordshire Bull Terrier, Bullmastiff, Fox Terrier, Bulldog) and carries **12 chums**. But it has **NO LINEAGE entry of its own** (`getLineage("Ancient Molossers")` returns null), so every one of those 11 trees **stops dead at it**.

Its three modelled children, `Alaunt war dogs`, `Dogs of the Alan horsemen` and `Old mastiffs of the ancient East`, exist **ONLY inline in the Ancient Mastiff level's tree**. Nothing else can reach them, so each has **zero chums and no descendants**.

Giving `Ancient Molossers` a real LINEAGE entry would extend all 11 trees at once and make the Alaunt line reachable from the mastiff and bulldog trees where it historically belongs. It is an ancient node, deeper than the Tudor boundary, so fixing it is a bonus rather than a rule failure, but it is the clearest single illustration of the category: a named ancestor with no data behind it stops every tree at its own name, and any children drawn only inline for one level go nowhere. (Measured 9 August; see the note added to `data/lineageArchive.ts`.)

---

## 4. THE ORDER. Follow this exactly.

**There is one order. Do not start at section 6.**

### Step 1: the three splits. Three patches, pushed separately.

Section 5. Lowest risk first, and the first one moves the count.

### Step 2: the five renames. One patch.

Section 7. **Expected drop: 0.** See the warning there.

### Step 3: reconcile the missing-ancestor count.

Section 3 says 35 names have no data. Section 6 names 33. **Find the other 2, put them in a family, and tell Steve** before writing anything.

### Step 4: the families, in this order.

| Order | Family | Expected drop | Ancestors to write |
|---|---|---|---|
| 1 | Land and working spaniels | **7** | 4 |
| 2 | Irish, fell and highland terriers | **6** | 4 |
| 3 | Collies and herders | **5** | 7 |
| 4 | Water spaniels | **2** | 3 |
| 5 | Water dogs | **1** | 4 |
| 6 | The two "Old English" terrier populations | **1** | 2 |
| 7 | Toy spaniels and lapdogs | **2** | 4 |
| 8 | Singletons | **2** | 3 |

**Push and test after every family. One family per patch.**

### Step 5: the three medieval dogs. Section 12.

---

## 5. The three splits. Do these first.

Three nodes each carry **two different dogs in one circle**. Split each into two siblings at **50% of the parent's original value**.

**The 50/50 is a modelling estimate, not a known mating.** Do not describe it editorially as documented.

### 5a. `Water spaniel and Collie` — do this one first

- **Parent:** Flat-Coated Retriever. **Appears in 1 level only.** Lowest risk, so it proves the pattern.
- **Splits into:** `Water spaniels` 50%, `Shepherd's Dog` 50%.

**`Shepherd's Dog` is a medieval card**, so the Flat-Coated reaches the era rule immediately. **Expected drop: 1.** 34 becomes 33.

**Steve's decision, taken knowingly.** The intervening Victorian stock, `Old working collies`, is skipped for now and can be inserted later when Family 3 is written. The trail already ends in the right place.

### 5b. `Poodle and Barbet water dogs`

- **Parent:** Irish Water Spaniel. **Appears in 5 levels:** Irish Water Spaniel, Irish Setter, Curly-Coated Retriever, Golden Retriever, Goldendoodle.
- **Splits into:** `Poodle-type water dogs` 50%, `Barbet-type water dogs` 50%.

**Both halves are continental water dogs**, so this split does not cross families. **Expected drop: 0.**

**This was on the rename list in v2, mapping to `Poodle`. That rename is abandoned.**

### 5c. `Barbet and water spaniels` — the biggest, do it last

- **Parent:** Poodle. **Appears in 7 levels:** Curly-Coated Retriever, Cockapoo, Labradoodle, Goldendoodle, Cavapoo, Maltipoo, Jackapoo.
- **Splits into:** `Barbet-type water dogs` 50%, `Water spaniels` 50%.

**The two halves belong to DIFFERENT families.** The Barbet is a continental water dog; water spaniels are a British spaniel branch. Collapsing them treated two traditions as one animal. **Expected drop: 0.**

**It reaches every poodle-cross**, so it must be right.

---

## 6. The families

### Family 1: land and working spaniels. Drop 7.

**Write:** Land spaniels, Heavier working spaniels, Old Welsh land spaniels, Basset and heavy hounds.

**Cards:** Clumber Spaniel, English Springer Spaniel, Welsh Springer Spaniel, Cocker Spaniel, Field Spaniel, Sussex Spaniel, Norfolk Spaniel.

### Family 2: Irish, fell and highland terriers. Drop 6.

**Write:** Native Irish terriers, Low-slung soldiers' dogs, Old fell terriers, Skye terrier stock.

**`Highland mainland terriers` is NOT on this list.** It merges into `Old Highland terriers` in step 2.

**Cards:** Kerry Blue Terrier, Irish Terrier, Soft-Coated Wheaten Terrier, Glen of Imaal Terrier, Welsh Terrier, Cairn Terrier.

**Depends on Family 6.** Welsh Terrier and Irish Terrier also need `Old English Black and Tan Terrier` to have data. **Without Family 6, expect 4 not 6.**

### Family 3: collies and herders. Drop 5.

**Write:** Old working collies, Old hill and bearded collies, Old Scotch Collie, Welsh herding dogs, Cumberland sheepdogs, Early badger hunting dogs, Spitz-type dogs.

**Cards:** Rough Collie, Border Collie, Cardigan Welsh Corgi, Pembroke Welsh Corgi, Cumberland Sheepdog.

**THIS FAMILY CONVERGES.** Every collie herding ancestor should end at **`Shepherd's Dog`**, the medieval card. Suggested skeleton, **a starting point for Steve to correct, not a finished answer**:

```
Shepherd's Dog  (medieval)
   Old working collies
      Old Scotch Collie              -> Rough Collie, Border Collie
      Old hill and bearded collies
      Cumberland sheepdogs           -> Cumberland Sheepdog
   Welsh herding dogs                -> both Corgis
```

**Three rules for this family.**

- **Do NOT make every collie a direct child of Shepherd's Dog.** One or two hops in between is the honest shape. Flattening it loses the intervening stock.
- **Shepherd's Dog is the root of the COLLIE HERDING LINE ONLY.** Droving stock, livestock guardians and the Cur line stay on their own routes. Do not attach them without asking.
- **The Corgis have TWO roots.** Herding stock reaching Shepherd's Dog, and spitz input which goes elsewhere. `Spitz-type dogs` is on this list for that reason.

**The naming chain is real and worth putting in the notes.** Chaucer has "Coll" or "Coaly" for a black-faced sheepdog in the 1300s; Caius in 1576 calls the Shepherd's Dog a Sheepdog or Colley. Coaly became Colley became Collie.

### Family 4: water spaniels. Drop 2.

**Write:** Water spaniels, English Water Spaniel, Old Irish water dogs.

**Cards:** Tweed Water Spaniel, Irish Water Spaniel.

**The Curly-Coated Retriever is deliberately NOT here.** See section 11.

### Family 5: water dogs. Drop 1.

**Write:** St John's Water Dog, Old European water dogs, Fishermen's water dogs, Newfoundland landrace dogs.

**Cards:** Labrador Retriever.

**Depends on step 2.** Labrador also needs the `British Pointers` rename. **Without it, expect 0.**

**`Old European water dogs` should become MORE important, not less.** The honest picture is one old European water-dog population from which the Barbet-type and Poodle-type lines developed, rather than three independent ancestors. **The deeper the tree goes, the more it should move from modern breed names toward historical working populations.**

### Family 6: the two "Old English" terrier populations. Drop 1.

**Write:** Old English Black and Tan Terrier, Old English White Terrier.

**DEPTH CONSTRAINT (added 10 August, carried from Family 2).** `Old English Black and Tan Terrier` must reach a Tudor-or-earlier card in ONE or TWO hops, no more. The Irish terrier line grafts through it and is already deep: Kerry Blue, Soft-Coated Wheaten, Native Irish terriers, Old English Black and Tan Terrier, then this ancestor's own children. That puts Old English Black and Tan Terrier at depth 3. `MAX_LINEAGE_DEPTH` is 5, so a Tudor card must appear by the second hop below it (depth 5) or Kerry Blue will not graft and the Family 2 total will fall short of 6. Keep its tree shallow.

**These are NOT renames.** They are the older working populations the named breeds came out of, exactly like `Old Border terriers` against `Border Terrier`.

- `Old English Black and Tan Terrier` appears as a leaf in **29 trees**, so this is one of the biggest single wins in the data.
- `Old English White Terrier` is described in the data as "the white-bodied fox-working terriers found across Britain since the 1700s", which is a population, not a breed.

**Cards:** English White Terrier.

**Honest note for whoever writes these.** Historically all three white-terrier names refer to one extinct breed; "Old English White Terrier" is a name Victorian writers used for it. **The split is a useful reconstruction, not a documented distinction.** The note must not claim more than the evidence does.

**One data error to fix here:** `lineage.ts` line 522 uses the ancestor's name with the breed's description. Flag it and ask.

### Family 7: toy spaniels and lapdogs. Drop 2.

**Write:** Old toy spaniels, Asian flat-faced toys, Old sporting toy spaniels, Mediterranean bichon lapdogs.

**Cards:** King Charles Spaniel, Cavalier King Charles Spaniel.

### Family 8: singletons. Drop 2.

**Write:** Ancient Molossers, Old British bandogs, Arctic sled dogs.

**Cards:** Mastiff, Northern Inuit Dog.

**Depends on step 2.** Northern Inuit also needs the `German Shepherd Dog` rename.

### The crosses. They follow for free. Do NOT treat them as work.

| Cross | Needs |
|---|---|
| Labradoodle | 5 |
| Cockapoo | 1 and 4 |
| Toy Trawler Spaniel | 1 and 7 |
| Cavapoo | 7 and 5 |
| Cavachon | 7 and 5 |
| Maltipoo | 7, 5 and 3 (spitz) |

**Do not chase a cross directly.** If one has not flipped after its families are written, something in those families did not graft.

---

## 7. The five renames for step 2

| Name in the trees | Existing key |
|---|---|
| British Pointers | Pointer |
| Setter | Irish Setter |
| German Shepherd Dog | German Shepherd |
| White English Terrier | English White Terrier |
| Highland mainland terriers | Old Highland terriers |

**EXPECTED DROP: 0. A count still at 34 after step 2 is the PASS condition, not a failure.**

**Why.** English White Terrier was the only card completing on renames alone, and it needed both "Old English" names renamed. Both are now writing jobs in Family 6.

**Two notes.**

- An alias only reaches Tudor if the **target's** own tree does. Poodle, Pointer, Irish Setter and German Shepherd are modern breeds whose trees may stop short too.
- **`Highland mainland terriers` and `Old Highland terriers` are the same population.** Both notes say "shared" stock; one says every Scottish terrier springs from it, the other says shared with the Scottie and Westie. The Westie was selected out of the same stock as the Cairn for its white coat, so they must share this ancestor. `Old Highland terriers` is the one with a real key and tree. **Report which image is orphaned by the merge.**

**Use the existing mechanism.** These are child nodes, so they belong in `LINEAGE_ALIASES` in `lineage.ts`. `resolveLineageName` in `lineageNames.ts` handles card names and is already wired into `getLineage`. **Do not create a third table.**

---

## 8. Naming rules

**Use `Water spaniels`, plural, for the broad ancestral population.** Reserve singular names for recognised types: English Water Spaniel, Irish Water Spaniel, Tweed Water Spaniel. A singular "Water spaniel" implies one breed when the history describes a working category.

**The `Old X` convention is deliberate and must be preserved.** `Old X` or `X stock` is the ancestral population; `X` is the named breed that came out of it. These pairs are parent and child and must never be merged:

`Border Terrier` / `Old Border terriers` · `Skye Terrier` / `Skye terrier stock` · `Norwich Terrier` / `Norwich terrier stock` · `Irish Terrier` / `Native Irish terriers` · `Bulldog` / `Old English Bulldog` · `Irish Water Spaniel` / `Old Irish water dogs` · `Earth Dog` / `Old earth terriers` · `Ancient Mastiff` / `English Mastiff` / `Mastiff`

**These are NOT related and must not be merged:** `Norfolk Terrier` and `Norfolk Spaniel`, different dogs from the same county. `English Toy Terrier` and `Old toy spaniels`.

---

## 9. How to write a family

`expandNode` grafts a child onto its own `LINEAGE` key automatically, so a new entry needs no wiring.

- Add the ancestor as a top-level key in `data/lineage.ts` with `name`, `note` and `children`.
- Each child needs `name`, `note`, `img` and `value`.

### The values. Two valid shapes.

**`expandNode` handles both differently.**

- **Direct values.** Children carry `value` and the branch scales by their total. Most records use this.
- **The Celtic Heeler shape.** Children are valueless branches and the weight sits in the grandchildren. `expandNode` detects a direct-value total of zero and scales by leaf sum instead.

**Do NOT assume values must total 100.** Steve has flagged Kerry Blue Terrier showing a child at 100% that cannot be right, which is this shape being misread.

**Before writing a family, find an existing entry with the same shape and copy its arithmetic.** Say in your report which shape you used and why.

### Artwork

**Reuse existing ancestor names wherever possible**, so no new artwork is needed. **But check the name you are reusing actually has data**, or you deepen the problem instead of fixing it.

### After every family

```bash
cd ~/pedigree-chums-main && ./node_modules/.bin/tsc --noEmit && ./node_modules/.bin/eslint data/lineage.ts
```

**`data/lineage.ts` is 0 errors, 0 warnings.** One of the few clean files in the repo. Keep it there.

---

## 10. The measurement, run after every patch

Run it inline with `./node_modules/.bin/tsx -e`, so there is no throwaway file to forget to delete. For every card in `ukBreeds`, check whether its expanded tree reaches a card whose strip is `c1500`, `medieval` or `ancient`.

**Report the count against the expected drop.** It starts at 34.

**If the count does not move by the expected amount, STOP and investigate.** Do not write the next family on top of one that did not land.

**Splitting a node should NOT change the count**, except 5a which drops it by 1. Both halves of the other two are still leaves.

---

## 11. The Curly-Coated Retriever. Do not place it.

**Steve's decision: it belongs to NEITHER family. It is an early retriever convergence breed.**

Its real tree, nine nodes, two deep:

```
Curly-Coated Retriever
  English Water Spaniel          35%
  St John's Water Dog            30%
  Irish Water Spaniel            20%
  Poodle                         15%
```

That is **55% water spaniel, 45% water dog.** Near enough half and half, so no rule settles it, and assigning it to whichever side reaches 51% would be arbitrary.

**Modern breed histories agree it is uncertain.** The AKC calls it one of the oldest retrievers and says its ancestry is not known with certainty, with likely contributors including the English Water Spaniel, the St John's Water Dog, retrieving setters, the Irish Water Spaniel and later Poodle influence.

**Its mixed ancestry is historically informative, not a data failure.**

**What to do.** Nothing directly. **Five of its seven ancestors get written by Families 4 and 5 and by the three splits.** Re-run its lineage after those and it may complete on its own. **Do not write anything specifically for it, and do not treat it as a failure in the meantime.**

---

## 12. The three medieval dogs. Do these LAST.

`Shepherd's Dog`, `Drover's Dog` and `Earth Dog` exist as keys with no `children`, so they cannot be played.

**Proposed parents, all using names already in the data:**

- **Shepherd's Dog** → Celtic herdsmen's dogs, Roman shepherd dogs.
- **Drover's Dog** → Celtic herdsmen's dogs, Old British bandogs.
- **Earth Dog** → Ancient Celtic earth dogs, Early badger hunting dogs.

**Three dependencies, which is why this is last.**

- `Old British bandogs` is written in Family 8.
- `Early badger hunting dogs` is written in Family 3.
- **`Shepherd's Dog` becomes a destination for the whole collie line in Family 3 and for the Flat-Coated in split 5a**, so it carries weight before it has ancestry of its own. That is fine by the era rule, but write it carefully.

**Before writing these, verify all five proposed parents have data.** If any is still a bare leaf, say so and stop.

**Historically grounded:** Caius grouped the Shepherd's Dogge and the Mastive as the "Homelye Kinde", and described the Shepherd's Dog as any dog that herded stock, some of which drove stock to market as drovers' dogs.

---

## 13. Cost

| Piece | Cost |
|---|---|
| The three splits | about 1% |
| The five renames | about 0.5% |
| Each family, including research | 1 to 2% |
| Eight families | **8 to 16%** |
| The three medieval dogs | about 1% |

**This is the largest job on the list and the only one that changes the shape of the data rather than the look of it.**

## 14. STOP conditions

- The failure count does not move by the expected amount.
- A family's ancestors depend on a name that is itself a bare leaf.
- `tsc` fails or `data/lineage.ts` moves off 0 errors, 0 warnings.
- You are choosing between two readings of this brief.

**A partial job with a clear report is a good outcome.**

---

## 15. What changed from v2

- **Step 1, the Talbot alias, is done.** Pushed as `a3950ef5`.
- **The four placeholder images are done.** Pushed as `7e702e19`.
- **The three splits moved to the front** and are now a step of their own.
- **`Barbet` and `Poodle` became `Barbet-type water dogs` and `Poodle-type water dogs`**, since these are regional populations, not modern breeds travelling backwards unchanged.
- **`Water spaniel and Collie` splits to `Water spaniels` and `Shepherd's Dog`**, not `Collie`.
- **Two renames became writing jobs**, the two "Old English" terrier populations, now Family 6.
- **`Highland mainland terriers` merges**, removing one ancestor from Family 2.
- **Step 2's expected drop went from 1 to 0**, because the only card completing on renames alone now depends on Family 6.
- **The water family split three ways:** land spaniels, water spaniels, water dogs. Caius listed the Land-spaniel and the Water-spaniel separately in 1576, and water dogs are a third thing again.
- **The Curly-Coated is a convergence breed in neither family**, with a reason rather than a pause.
- **Section 2 is new:** percentages are reconstruction weights, and the evidence hierarchy that goes with them.
- **Section 8 is new:** the naming rules, including which pairs must never be merged.
- **Family 3 now converges on `Shepherd's Dog`**, with three rules to stop it flattening or spreading beyond the collie line.
