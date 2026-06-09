# Pedigree Chums — Trade Page Draft (copy + build pack)

**Framing:** pre-launch / founding-stockist. The product is real and play-tested (sample exists); full production follows. Capture trade *interest*, not firm orders. Name-agnostic — only the logo, the brand word, and the domain are name-specific, so a rename is a find-and-replace + new logo.

**Tone split:** playful in the "why it sells / how it plays" sections (match the deck's voice); crisp and factual in pricing, terms and FAQ (buyers want clarity there).

> Placeholders to confirm: **[CARD COUNT]** (deck says 54, earlier spec said 52 — pick one, use everywhere) · **[DISPATCH MONTH]** · **[EAN — pending GS1]**.

---

## Page sections (in order)

### 1. Hero
- **Eyebrow:** Trade & Wholesale
- **Headline:** *The on-the-go dog spotting game — now open to founding stockists.*
- **Sub:** A pocket-size, made-in-UK card game for the dog-mad nation. Played and proven; first production run shipping [DISPATCH MONTH].
- **Primary CTA:** Become a founding stockist → (scrolls to form)
- **Secondary CTA:** See it played (↓ video) · Request the trade price list

### 2. Trust strip (one scannable row)
Made in the UK · FSC recycled card · Low MOQ with a 48-unit trial · Free POS display on 1,000+ · Sample packs available now

### 3. "See it played" — the video block *(credibility anchor)*
- Embed the family play video here, high on the page.
- Caption: *Real game, real dogs, real families. Here's a sample being played on an actual dog walk.*
- This section does the heavy lifting for a buyer committing pre-production — keep it above the pricing.

### 4. Why it sells (retailer-first, with the market data moved up)
- **Impulse price point** — sits by the till at an under-a-tenner RRP.
- **~60% retail margin** at the suggested RRP (see pricing).
- **Multi-market** — gift shops, attractions & museum shops, garden centres, pet shops, tourist spots.
- **Low return risk** — no setup, endlessly replayable, nothing to go wrong.
- **Market backdrop:** UK consumers spend heavily on pet and on games/toys, and a large share of in-store purchases are impulse buys. *(Cite exact Statista figures + year, or drop the shaky ones — a buyer who knows the category will dock you for a stat that's off.)*

### 5. The product at a glance
Short spec table:

| | |
|---|---|
| Cards | [CARD COUNT] illustrated breeds & crossbreeds, incl. the designer/doodle pack |
| Format | Pocket-size deck, durable card |
| Materials | FSC-certified recycled stock, printed in the UK |
| Barcode | EAN-13 [pending GS1] |
| Pack dims / weight | [confirm] |
| Case quantity | [confirm — per inner / per outer] |

### 6. How it plays *(playful, brief — collapse the deck's seven Q&A pages into this one)*
Spot real dogs, match them to your cards. Each card has a cute illustration plus the breed's traits, size, colours and a tell-tale feature. Play on walks, at the beach, on car journeys — deal a few cards and you're off. Quick mode: *first pooch past the post.*

### 7. Trade pricing & terms *(crisp)*
- **MOQ:** 1,000 units
- **Wholesale:** £4.00/unit · **Suggested RRP:** £9.99 · **~60% retailer margin**
- **Volume breaks available** on 2k / 5k / 10k (full ladder on the price list)
- **Free POS display unit** on orders of 1,000+
- **48-unit trial** available to test sell-through before committing to a full run
- **Terms:** pro-forma for first orders · UK dispatch · ex-VAT (no VAT currently applicable)
- **CTA:** Request the full trade price list → (form)

> Decision baked in: show the *structure* publicly, full *price list* on enquiry via the form. Keeps negotiation room and captures the lead. Flip to fully-public if you'd rather.

### 8. Sustainability *(real differentiator for gift/museum/ethical buyers)*
Printed in the UK · FSC recycled card stock · optional plastic-free · fully recyclable packaging.

### 9. POS & display
Free-standing counter display on 1,000+ orders. *(Use a real photo/still once you have the sample shot in the unit.)*

### 10. Start small — the trial
*Not ready for 1,000? Try 48.* A 48-unit trial pack lets you test it on your shelf with a 48-hour turnaround. Samples available now to see and play before you decide.

### 11. A growing range *(signals a partner worth backing)*
Soft toys, bandanas, keyrings, greeting cards and more in the pipeline — a brand to grow with, not a one-off line.

### 12. Social proof *(placeholder)*
Stockist logos + buyer quotes once you have them. Design the slot in now.

### 13. Trade FAQ
MOQ · sample availability · lead time · payment (pro-forma) · delivery cost / free-carriage threshold · returns / sale-or-return line · "can we set our own RRP?" (yes — RRP is a suggestion) · barcode/EAN · restock time.

### 14. Closing CTA + enquiry form
Headline: *Become a founding stockist.* Then the form (below).

---

## Enquiry form (mirrors the homepage, no orders)

Keep it low-friction like the consumer form. Lean required set, rest optional:

- Company / shop name *(required)*
- Contact name *(required)*
- Email *(required)*
- Business type *(dropdown: gift shop / museum or attraction / garden centre / pet shop / other)*
- Phone *(optional)*
- Estimated first order *(optional: trial 48 / 1k / 2k+ / not sure)*
- Message *(optional)*

**Wiring (reuse what's already set up):**
- On submit → **Resend** notifies `hello@pedigreechums.co.uk`.
- Contact also pushed to **MailerLite**, tagged **`trade`**, kept separate from the consumer list.
- Optional: trigger the trade price-list PDF as the form's thank-you/confirmation.

**Build notes:**
- Server-side submit (API route / server action) so the Resend key never ships to the client.
- No personal data in URL params; standard onClick/onChange handlers, not a raw `<form>` POST to a third party.

---

## Video shot list (one shoot, several uses)

- Cards **in-hand**, clean close-ups — the "it's real" proof.
- The **core hook**: spotting a real dog on a walk and matching the card.
- Family **playing** — natural, unpolished, real.
- A few **deliberate still frames** → product photography for the hero + POS shots.
- **Portrait** orientation → doubles as your first TikTok/Reels content.
- Authentic over polished; it matches the made-in-UK, hand-illustrated story, and it survives a name change.

---

## Open inputs before this goes live
1. **[CARD COUNT]** — settle 52 vs 54.
2. **[DISPATCH MONTH]** — indicative date for the pre-order framing.
3. **EAN** — arrives with GS1; needed for the spec table and pack artwork.
4. **Pack dims / weight / case quantities** — for the spec table.
5. **URL** — `/trade`, `/wholesale` or `/stockists`; in main nav or quieter standalone.
6. **Statista figures** — verify or drop.
7. **The gate:** soft interest now; firm orders only once the name's cleared.
