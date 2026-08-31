# Press pack revisions, round 13

**Owner notes, 31 August 2026. Build exactly as written.**

Slides are identified by title, not number.

---

## Turning Imagination Into Reality

- The three images sit too low on the page. They should share the same top alignment
  as the two-image slides.

Report why they differ before changing anything, then match them.

### Diagnosis

Both the two-image slides ("The Card Is the Lens" etc.) and this three-image slide use
the same overlay wideTop container (`.overlayMediaWideTop`, `align-items: center`), and
both children fill the media height, so the container's alignment is moot. The real
difference is the child's OWN alignment:

- `.diptych { align-items: start }` -> images at the media top (measured 275px at 1280).
- `.gallery { align-items: center }` -> images centred, 59px lower (measured 334px).

### Fix

`.gallery` now uses `align-items: flex-start`, matching `.diptych`, so the gallery's
images share the two-image slides' top (275px). Turning Imagination is the only gallery
in the pack, so no other slide is affected.
