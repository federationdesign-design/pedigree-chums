# Pedigree Chums — Trade / Wholesale Page
### Roadmap & Content Map (built from the B2B pitch deck)

**Goal of the page:** convert a trade buyer (independent gift shop, museum/attraction shop, garden centre, farm shop, pet shop, toy/book shop) into a sample request or a pro-forma order. Different audience, different page, different job from the consumer site.

**Strategy note:** B2B-first is the right engine for a low-unit-cost impulse product. Keep the consumer site/social running in parallel — it creates the shopper demand that makes retailers want to stock you. Don't merge the two journeys; link between them lightly.

---

## 1. Fix these in the source material BEFORE the page goes near a buyer

### 1a. Reconcile the pricing (the critical one)
The deck shows three different "base/wholesale" numbers and a broken price ladder. A buyer scans the price table first; if it's inconsistent, nothing else on the page is believed. Lock a single table:

| Tier | Qty | Price/unit (ex-VAT) | Notes |
|------|-----|---------------------|-------|
| MOQ | 1,000 | £? | This is the headline number buyers look for |
| Break 1 | 2,000+ | £? | Must be *lower* than MOQ price or it isn't a break |
| Break 2 | 5,000+ | £? | |
| Break 3 | 10,000+ | £? | |
| Trial / sample order | 48 | £? | Distinct from MOQ — label clearly so it doesn't confuse the 1,000 MOQ |

Decisions needed:
- Is the wholesale unit price **£3.71** or **£4.05**? Pick one. (If £3.71 is *your* cost, don't show it — show what the retailer pays.)
- Fix the 2k tier so it's genuinely cheaper than the 1k MOQ.
- Set **suggested RRP** to make the margin story true. At £3.71 cost, an RRP of £7.99–£9.99 gives the retailer ~53–63% margin — *that's* a "high margin" claim you can stand behind. £5 RRP undercuts it; either drop the low end or stop calling it high-margin.

### 1b. Trade essentials the deck never mentions (buyers will ask within one email)
- **EAN / barcode (GTIN-13):** most retailers that scan at the till need one. Do your packs have a barcode? If not, this is a blocker for anything beyond tiny independents.
- **Case / carton quantities:** how many units per inner and per outer carton. Buyers order in cases.
- **Pack dimensions + weight:** for shelf/till-point fit and shipping.
- **Lead time:** the deck says "in stock / UK dispatch / 48hr trial turnaround" — state a clear dispatch time for a full 1,000 order too.
- **Payment terms:** pro-forma (pay-before-dispatch) is normal for a new supplier — say so plainly. Note if you'd offer terms to repeat accounts later.
- **Carriage:** delivery cost, and any free-delivery order threshold.
- **Returns / sale-or-return:** impulse-gift buyers often ask for SOR or a first-order guarantee. Decide your line.
- **VAT position:** state whether prices are ex-VAT and whether VAT is added. This depends on your registration status — confirm with an accountant (I'm not one). Tie this to whether Pedigree Chums is a sole trader or limited company.

### 1c. Claims to soften
- "**Proven** Behavior Drivers / **Boosts** memory, attention, observation" → unverified; use "encourages observation, attention and recall." Overclaiming is a credibility risk in B2B and an ASA risk if it ever appears in ads.
- "Low-Cost, **High-Margin**" → only true at the higher RRP (see 1a). Make the numbers carry it rather than the adjective.

### 1d. Consistency / typos (B2B buyers read sloppiness as operational sloppiness)
- Card count: deck says **54**, your earlier spec said **52**. Pick the true number and use it everywhere, including the physical product.
- Recurring typos to scrub before they reach the page: "recyled" → recycled, "Childerns" → Children's, "moderatly," "envison," "you roster" → your roster, "There is not strict run time," "1 option."

---

## 2. Page content map (section by section)

> URL suggestion: `/trade`, `/wholesale`, or `/stockists`. See decision in §5.

**1. Hero**
- Headline: product + "Now taking trade orders" (e.g. *"The on-the-go dog spotting game — now wholesale, MOQ 1,000."*)
- Subhead: who it's for (gift shops, attractions, garden centres, pet shops).
- Primary CTA: **Request a sample pack** / **Become a stockist**.
- Secondary CTA: **Download the line sheet (PDF)**.

**2. Trust strip** (one scannable row)
- Made in the UK · In stock, fast UK dispatch · Free POS display on 1k+ · Low-risk 48-unit trial · FSC recycled stock.

**3. Why it sells (reframed around the retailer, not the player)**
- Impulse price point at the till · multi-market appeal · no setup / replayable (low return rate) · the margin story with real numbers.

**4. The product at a glance**
- What's in the pack (X cards incl. the designer/doodle pack), format, pocket size, durability, barcode.
- Small spec table: card count, pack dimensions, weight, case qty, EAN, materials.

**5. Trade pricing & terms** *(the section buyers come for — see §1a table)*
- Price-break table, MOQ, suggested RRP + margin %, ex-VAT note, payment terms, lead time, carriage, returns line.

**6. Retail performance drivers**
- Fits by the till · pocket packaging · free-standing POS unit (image) on 1k+ orders.

**7. Sustainability** (genuine differentiator for gift/museum/ethical buyers)
- Printed in UK, FSC recycled card, optional no plastic wrap, fully recyclable packaging.

**8. Low-risk first order**
- The 48-unit trial / sample pack, 48hr turnaround. De-risks the cold first order — give it its own block.

**9. Range potential** (signals a partner worth backing)
- Brand expansion line: soft toys, bandanas, keyrings, cards, bedding. Frame as "a growing range, not a one-off."

**10. Social proof** *(placeholder now)*
- Stockist logos + buyer testimonials once you have them. Leave the slot designed-in.

**11. Trade FAQ**
- MOQ, sample availability, lead time, payment, delivery cost, returns/SOR, "can we set our own RRP?", barcode/EAN, restock time.

**12. Closing CTA + contact**
- Trade enquiry form (fields in §3) + direct `hello@pedigreechums.co.uk` and phone + line-sheet download.

---

## 3. Lead capture & integrations (reuse what you already set up)

**Trade enquiry form fields:** company name · contact name · email · phone · business type (dropdown) · estimated first-order qty · message.

**Wiring:**
- On submit → **Resend** sends a notification to `hello@pedigreechums.co.uk` (your new mailbox — closes the loop on the email work).
- Also push the contact into **MailerLite** tagged as a **`trade`** segment, kept separate from the consumer list so you can mail buyers differently.
- **Line-sheet PDF:** repurpose this deck (cleaned per §1) as a downloadable one-pager/line sheet. Consider gating it behind the form to capture the lead.

> Build note: in Next.js, keep the form server-side (API route / server action) so the Resend key never ships to the client. No `<form>`-to-third-party posting of personal data from the browser.

---

## 4. Build roadmap (phased)

**Phase 0 — Lock inputs.** Resolve everything in §1 (pricing table, EAN, case qty, dimensions, terms, RRP, VAT). The page can't be credible without these. This is the real gating work, not the code.

**Phase 1 — Scaffold.** New route on the existing Next.js/Vercel site, reusing your current brand components and styling. Draft all copy from the content map. Static first.

**Phase 2 — Form + integrations.** Build the trade enquiry form → Resend notification + MailerLite `trade` tag. Produce the cleaned line-sheet PDF and wire the download/gate.

**Phase 3 — Trust & depth.** POS imagery, sustainability block, FAQ, range-potential section, social-proof placeholder.

**Phase 4 — Discoverability & pricing decision.** Trade-intent SEO (title/meta, "wholesale dog game UK / stockist"), product schema. Decide public vs gated pricing (§5). Decide whether `/trade` is in the consumer nav or a quieter standalone.

**Phase 5 — Launch.** Flip live, start taking enquiries/orders. **This is the step that waits on the name being cleared** — everything before it you can do now.

---

## 5. Key decisions to make

1. **URL & placement:** `/trade` vs `/wholesale` vs `/stockists`; in the main nav or a quieter footer/standalone link?
2. **Public pricing vs gated:** showing the price-break table builds trust and speed, but consumers seeing wholesale prices can dent RRP perception. Common fix: a clearly-trade section with indicative pricing, full line sheet behind the enquiry form. Pick a lane.
3. **Separate journeys:** keep consumer (story, email list) and trade (margin, terms, logistics) cleanly apart; cross-link, don't blend.
4. **RRP & margin story:** settle suggested RRP so "high margin" is provably true (§1a).
5. **Go-live timing:** the trademark clearance gates Phase 5, not Phases 0–4.
