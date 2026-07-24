# Pick a Chum: needs Steve

Run 0 gathered everything gatherable from the repo. This is the short list of
what could not be resolved from code and needs a decision, an asset or approved
wording. Grouped by urgency. Workbook input IDs (OI##) reference the Open Inputs
sheet.

## Resolved by Steve during Run 0 (recorded, no longer blocking)

- Commercial model (OI04, partial): CONFIRMED. Retail £9.99, pre-release £6.99
  (the "30% off" = £9.99 to £6.99), free UK mainland delivery, taken via the live
  Stripe pre-order plus email capture for a launch-day code. Buying intent (B01)
  opens the existing OfferModal. Captured in `app/pick-a-chum/data/campaign.ts`.
- Rules destination (OI02, partial): CONFIRMED there is no rules page and none is
  planned. Rules are stored as a content record the dogs answer with directly:
  `app/pick-a-chum/data/rules.ts` (six stages). Destination DST011 is in-chat.

## Still needs Steve

1. Launch DATE (OI04). Not public yet ("launching very soon"). `campaign.ts`
   holds `launchDate: null` and `launchDateConfirmed: false`. Needed before any
   copy states a date.

2. Moderation wording approval (OI08). `app/pick-a-chum/data/moderation-draft.ts`
   is DRAFT FOR APPROVAL (explicit, abusive, distress, unsafe, no-diagnosis). It
   also contains a `{{safety_signpost_copy}}` placeholder for the real-world
   signpost wording (helpline / trusted-adult copy), which must not be invented.
   Approve or replace before public testing.

3. Contact action (OI02). Left as a placeholder per Steve. There is no `/contact`
   route; the site currently uses `hello@Pedigree-Chums.co.uk`. Destination DST013
   has `resolvedUrl: null`. Decide the contact action (mailto, a new page, or a
   form) when ready.

4. Planned articles not yet built (OI06). These have no URL because the page does
   not exist. Point them at a live article, or write them:
   - ART002 The Secret Language of the Head Tilt (workbook status: Planned)
   - ART003 Hot/Dogs Heat Safety (no heat-safety article exists; `/hot-dogs` is
     the game mode, not safety)
   - ART009 Learning Through Play (Planned)
   - ART010 The Power of Smell (Planned; closest live: the Dogs at Work scent
     articles)

5. Tentative article mappings to confirm (OI06). Best-guess routes, flagged in
   `route-map.json`:
   - ART001 Dog Intelligence Essay -> `/smarter-than-the-test` (closest live page)
   - ART004 Dogs at Work: Detection and Scent ->
     `/dogs-at-work/the-dogs-teaching-medicine-how-to-smell-disease` (or
     `/dogs-at-work/the-electronic-nose`)
   - ART005 Dogs at Work: Herding -> `/dogs-at-work` index (no herding article
     exists)

6. Workbook FAQ answers not on the live home FAQ (OI01). These workbook questions
   have no matching approved answer on `/home`, so their records still carry
   `{{placeholder}}` answers. Paste approved wording into the workbook's Canonical
   answer column (the intended editing surface):
   - FAQ003 Do I need to own a dog?
   - FAQ004 What is in the pack? (partially answerable: "54 illustrated breed cards")
   - FAQ005 How many people can play? (live copy: "plays best with 2 or more")
   - FAQ006 Can we play indoors? (live copy: "made for walks... anywhere dogs happen")
   - FAQ011 How do I enter the competition? (see `/chumspot`)
   - FAQ012 How do I contact you? (see item 3)
   - FAQ013 What materials are used?
   - FAQ014 Do you deliver outside the UK? (live copy only covers UK mainland)

7. Collie B01 response wording (content review). The workbook's B01 (buying)
   response bank was written for a mailing-list-only pre-launch and says things
   like "Not yet. Buying comes later" and "you cannot take it home today". Now
   that pre-order buying is the confirmed model, several B01 templates should be
   revised in the workbook so the Collie can point at the live pre-order rather
   than implying you cannot buy yet.

8. Final dog and interface assets (OI09, OI10). The launcher robot head is the
   approved placeholder (runbook rule 3). Still needed for the styled build:
   full-quality dog portraits for Collie, Labrador, Border Terrier and Boxer for
   the dialogue HUD, plus the random-dog dice control visual and wording. (Breed
   card images exist at `/public/<slug>-square.jpg` but are not portrait crops.)
