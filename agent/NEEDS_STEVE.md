# Pick a Chum: needs Steve

Short list of what still needs a decision, an asset or approved wording.
Workbook input IDs (OI##) reference the Open Inputs sheet.

## Resolved by Steve (recorded, no longer blocking)

- Commercial model (OI04, partial): retail £9.99, pre-release £6.99 (30% off),
  free UK mainland delivery, via the live pre-order plus email capture. B01 opens
  the OfferModal. In `campaign.ts`.
- Rules (OI02, partial): no rules page; stored as a content record the dogs
  answer with (`rules.ts`, six stages). DST011 is in-chat.
- Moderation (OI08): APPROVED as drafted, with the locked safety signpost
  (Childline 0800 1111). In `moderation.ts`.
- Contact (OI02): DST013 = `mailto:hello@Pedigree-Chums.co.uk`.
- Article mappings (OI06): ART001 -> /smarter-than-the-test; ART004 -> the
  Dogs at Work teaching-medicine article; ART005 -> /dogs-at-work index. ART010
  interim -> the teaching-medicine article until 'The Power of Smell' is written.
- Chatbot assets: the square card images `/public/<slug>-square.jpg` are FINAL.
  The HUD portrait frame and selector fan are built around the square format.

## Still needs Steve

1. Launch DATE (OI04). Not public yet. `campaign.ts` holds `launchDate: null`;
   no copy states a date. Needed before any date is shown.

2. Planned articles not yet built (OI06). No URL because the page does not exist.
   Write them, or repoint:
   - ART002 The Secret Language of the Head Tilt
   - ART003 Hot/Dogs Heat Safety (no heat-safety article exists)
   - ART009 Learning Through Play
   (ART010 The Power of Smell has an interim mapping, see above.)

3. Workbook FAQ answers (OI01). FAQ003-006 and FAQ011-014 have no answer on the
   live home FAQ, so those records keep `{{placeholder}}` answers. Steve will
   paste approved wording into the workbook's Canonical answer column.

4. Revised B01 buying responses (approval at STOP 1). The workbook's B01 bank
   was written for a mailing-list-only pre-launch. Revised drafts reflecting the
   live pre-order model are in `app/pick-a-chum/data/collie-b01-revised-draft.ts`
   for approval, then to be pasted into the workbook. DRAFT, not final.

5. Interface assets for the styled build (OI09). The launcher robot head is the
   approved placeholder (runbook rule 3). The random-dog control treatment will
   be proposed for approval at Checkpoint 2.
