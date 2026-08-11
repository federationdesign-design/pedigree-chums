# Dogs at Work: checkpoint 8 copy correction pass

Per brief v3.0 section 14. Silent corrections (spelling, punctuation, grammar,
UK-for-US, and the section 11 label corrections) are applied and logged here.
Anything that touches meaning, a fact, or the editorial voice is listed for Steve
and not applied.

## Change log: corrected silently

| # | Where | Before | After | Basis |
|---|---|---|---|---|
| 1 | `app/dogs-at-work/the-electronic-nose/page.tsx` (hero sub-label pill, line ~204) | `The machine the dogs built` | `Bio-detection dogs` | Section 11: the sub-label names a kind of working dog, not an editorial phrase. The index card was corrected at checkpoint 5, but the article-page hero pill was missed; section 14 licenses label corrections across all four articles. |
| 2 | Body copy of articles 1 to 3 and `slides.ts` (deks) | ` -- ` (literal double hyphen, rendered as "--") | ` — ` (em dash, one space each side) | Steve's instruction (11 Aug). 52 conversions in total, all pure `--`->`—`: article 1 = 17, article 2 = 13, article 3 = 20, slide record = 2. A git word-diff confirmed every change is only the dash token; the words and the space either side are unchanged, so the em-dash spacing matches the sidebar cards. **One occurrence held**: article 2's editor's note (line 69), because that note is on hold under escalation 1. |
| 3 | `the-electronic-nose/page.tsx` metadata `title` (line 12) and `<h1>` (line 206) | `The Electronic Nose: The Machine That May Owe Dogs a Biscuit` | `The Machine That May Owe Dogs a Biscuit` | Steve's instruction (11 Aug). Section 11 retired the prefix for the display title; card and page now read the same. The URL slug (`the-electronic-nose`) is left unchanged. |

### Already applied in earlier checkpoints (confirmed correct, no new edit)

- "helping identify **diseased** by smell" -> "disease" — `slides.ts` blue panel 4 already reads "disease".
- Missing terminal full stops in the "What we owe dogs" panel — `slides.ts` blue panel 3 already ends "...a place inside our families." and "...jobs chosen for enjoyment rather than survival." with full stops.
- Family and sub-label labels on articles 1, 2, 4 and all index cards — applied at checkpoint 5 and confirmed here (Medical / Bio-detection dogs, Medical / Medical alert dogs, Rural / Sheepdogs).

### Checked, nothing to correct

- American spellings: none found in the editorial copy (the only `color` hits are CSS `color:` properties, not prose).

## Escalation list: NOT applied, for Steve

**Resolved 11 Aug 2026 (applied on Steve's instruction):** the `--` sweep
(escalation 2) and the article 3 title reconciliation (escalation 3) are now
recorded in the change log above (rows 2 and 3).

**Still held: article 2's editor's note (line 69).**
   Bramble is confirmed real, so the note is wrong about him. But it also names
   **Sarah**, who is not confirmed. Removing the note would leave a named, specific
   person, with a specific life-saving story, presented as fact throughout the
   body. So the decision (remove vs reword) is Steve's. The note's own `--` is
   held from the em-dash sweep until then.
   File `app/dogs-at-work/the-colleague-who-never-clocks-off/page.tsx`, **line 69**
   (inside the `CARDS` "editors-note" node). Exact wording:
   > "Bramble" and "Sarah" are illustrative while we finalise a real, currently-working alert dog to feature -- with the organisation's and owner's permission.

   Every place the article body presents Sarah, for the fact-check:
   - **L22:** His job is Sarah. Just Sarah. Not people in general — one specific human, whose body he knows better than most doctors ever could.
   - **L23:** And when Sarah's blood sugar starts to slide, Bramble knows. Often before Sarah does.
   - **L24** (pronoun, same person): The way she tells it, he has saved her life more times than she can count. And then the line that stays with you: she doesn't lie awake anymore wondering whether she will wake up.
   - **L28:** ...He has learned one person's normal. Sarah's baseline. Her ordinary, everyday, slightly boring human smell.
   - **L31:** When Sarah's blood sugar drops, her chemistry shifts and the smell changes. Bramble notices...
   - **L36:** ...He is thinking, in dog: Sarah smells wrong, this is the part where I boop her...
   - **L39:** ...Sarah gets to sleep. She gets to go out. She gets to stop living braced for an emergency that Bramble will now spot first...

   Also in the sidebar (not body), the "What the dog thinks" card (**line 82**):
   "What Bramble thinks: Sarah smells wrong. Boop Sarah. Receive biscuit. Be brilliant."
