# Press pack revisions, round 6

**Owner notes, 30 August 2026. Build exactly as written.**

Do not edit, improve, substitute or question any request below.

---

## Before anything else: the stale desktop twin

Several earlier rounds edited only the mobile base rules while the `@media (min-width: 769px)` block at the end of `page.module.css` kept the old values and won at desktop width. Two twins were found and fixed, `.arrow` and `.slide`. Others may remain.

**For every change in this round, check whether the rule has a twin in that media block, and update or delete the twin.** A change that works on a phone and does nothing on desktop is not done.

---

## Global

- Increase the "Press Pack" title size by 4pt.
- Get the Scotty dog progress bar to appear at the bottom of the page.

---

## The arrows, still outstanding

The arrows on `/press` are a text chevron glyph scaled up. That is not what was asked for.

Find the actual arrow used on the Dogs at Work page. Report what it is, an SVG, a file in `public/`, or an icon component, and where it lives. Then use that exact asset.

Do not approximate it, do not restyle a chevron to resemble it, and do not build a new one.

---

## Screen 1

- Reduce the video size by 25%. A 20% reduction was asked for in an earlier round and never took effect, so check the media block twin.

---

## Screen 2

- Move the images down, as previously instructed.
- Reduce the column gutter to 10px.
- Move the white text that sits over the two images down by 10px, so there is more padding between the text and the top edge of the image.

---

## Screen 3

- Make the images match screen 2's images exactly in size, style and position. They are currently smaller than the pair on screen 2.
- Add the five images below the two columns: `alt-pug1.jpeg`, `alt-pug2.jpeg`, `alt-pug3.jpeg`, `alt-pug4.jpeg`, `alt-pug5.jpg`. All are in `~/Downloads` root. Note the mixed extensions, four `.jpeg` and one `.jpg`, which is why an earlier search for five `.jpg` files found nothing. Normalise them to `.jpg` on copy and report the names used.

---

## Screen 4

- The video looks very dark. Report why before changing it.
- Remove the transparency layer if one is in place.
- The video has black bars top and bottom because there is too much vertical space in its container. Reduce that vertical height so there are no bars.

---

## Notes for the build

**Report anything that will not work only after building the rest.**

**Verify every change at 1280px, not just at 390px.** Every fault in this round's list was a change that looked applied on mobile and did nothing on desktop.
