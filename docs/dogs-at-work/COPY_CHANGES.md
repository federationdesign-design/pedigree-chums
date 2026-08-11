# Dogs at Work: checkpoint 8 copy correction pass

Per brief v3.0 section 14. Silent corrections (spelling, punctuation, grammar,
UK-for-US, and the section 11 label corrections) are applied and logged here.
Anything that touches meaning, a fact, or the editorial voice is listed for Steve
and not applied.

## Change log: corrected silently

| # | Where | Before | After | Basis |
|---|---|---|---|---|
| 1 | `app/dogs-at-work/the-electronic-nose/page.tsx` (hero sub-label pill, line ~204) | `The machine the dogs built` | `Bio-detection dogs` | Section 11: the sub-label names a kind of working dog, not an editorial phrase. The index card was corrected at checkpoint 5, but the article-page hero pill was missed; section 14 licenses label corrections across all four articles. |

### Already applied in earlier checkpoints (confirmed correct, no new edit)

- "helping identify **diseased** by smell" -> "disease" — `slides.ts` blue panel 4 already reads "disease".
- Missing terminal full stops in the "What we owe dogs" panel — `slides.ts` blue panel 3 already ends "...a place inside our families." and "...jobs chosen for enjoyment rather than survival." with full stops.
- Family and sub-label labels on articles 1, 2, 4 and all index cards — applied at checkpoint 5 and confirmed here (Medical / Bio-detection dogs, Medical / Medical alert dogs, Rural / Sheepdogs).

### Checked, nothing to correct

- American spellings: none found in the editorial copy (the only `color` hits are CSS `color:` properties, not prose).

## Escalation list: NOT applied, for Steve

1. **Article 2 editor's note calls Bramble and Sarah illustrative placeholders.**
   Bramble is confirmed real (v3.0), so this is now wrong.
   File `app/dogs-at-work/the-colleague-who-never-clocks-off/page.tsx`, **line 69**
   (inside the `CARDS` "editors-note" node). Exact wording:
   > "Bramble" and "Sarah" are illustrative while we finalise a real, currently-working alert dog to feature -- with the organisation's and owner's permission.
   This is body copy on an editorially-unchanged article, so it is not mine to
   remove or rewrite. (It also contains a `--`; see item 2.)

2. **Literal double hyphens `--` in body copy render as "--", not em dashes.**
   The article body arrays use `--` where an em dash is intended, and it renders
   literally. This is inconsistent with the sidebar cards, which use `&mdash;`
   (a real em dash). Converting changes the rendered text, so it is escalated
   rather than applied (as instructed).
   Scope of ` -- ` occurrences: article 1 = 13, article 2 = 12, article 3 = 16
   (including the metadata description), `slides.ts` = 2; article 4 = 0.
   Example, article 1: "the best game in the world -- the one where you find the
   funny-smelling sample".

3. **Article 3's page title keeps the retired "The Electronic Nose:" prefix.**
   Section 11 dropped the prefix for the display title, and the index card now
   reads "The Machine That May Owe Dogs a Biscuit", so a reader sees a different
   title on the card than on the article page. Changing the article's own
   headline is beyond the mechanical/label licence, so it is escalated.
   File `app/dogs-at-work/the-electronic-nose/page.tsx`: metadata `title`
   (**line 12**) and the `<h1>` (**line 206**), both
   "The Electronic Nose: The Machine That May Owe Dogs a Biscuit".
