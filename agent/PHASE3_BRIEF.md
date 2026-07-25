# Phase 3 voice package brief

Steve's three completed per-dog copy decks (Labrador, Border Terrier, Boxer),
delivered early. This brief records what has landed and the decisions attached
to it. Nothing here is wired into routing yet.

## Status: PARKED

The three decks are copied into `agent/` as source and committed, but NOT wired.
Only the Collie speaks until the Phase 3 per-dog build stands up the per-dog
response pools (identity, orientation, commands, my-dog, transfers, quick wins
for each specialist). The engine has no per-dog routing beyond the existing
transfers.

- `agent/pick-a-chum-labrador-copy-deck-v1.xlsx`
- `agent/pick-a-chum-border-terrier-copy-deck-v1.xlsx`
- `agent/pick-a-chum-boxer-copy-deck-v1.xlsx`

## Canon folded into the workbook

Each deck's canon sheet is folded into the workbook `Character Canon` sheet.
The four **Name** canons (Collie, Labrador, Border Terrier, Boxer) are **locked
verbatim**; every other per-dog canon area is **Proposed (pending Phase 3)**.
The locked Name canons, verbatim:

- Collie: "Everyone calls him Collie, or the Collie. It is his breed, his role
  and effectively his name within the operation. Whether he has another name is
  never stated. He may have a private name, but he clearly considers it
  irrelevant to the work."
- Labrador: "Everyone calls him Labrador or Lab. It functions as his name and
  role. No private name is confirmed."
- Border Terrier: "Everyone calls him Terrier or the Terrier. Border Terrier is
  used when clarity is needed. No private pet name is confirmed."
- Boxer: "Everyone calls him Boxer or the Boxer. No private pet name is
  confirmed."

## Routing design decision: the Labrador is the live commercial specialist

Steve's canons assign the **Labrador as the customer-facing commercial
specialist** (buying, launch, delivery, food, rewards, welcome). The **Collie
handles buying pre-launch only**. So in the Phase 3 build, commercial/buying
intent should route to (or transfer to) the Labrador once per-dog pools exist:

- Boxer canon: "The Labrador remains the commercial specialist. The Boxer can
  transfer after a joke."
- Terrier canon: "He can transfer buying questions to the Labrador after
  confirming what the visitor actually asked."

This is a routing change for Phase 3, not now. Today's B01 commercial bucket
stays with the Collie (pre-launch), unchanged.

## Audits (this delivery)

All three decks passed the standard audits: no em dashes, and every response
line (77 per deck) within the 15 to 45 word guideline. No failures.

## Authorship rule (unchanged)

Steve writes every line the dogs speak. The agent builds detection, structure,
placeholders and tests in Phase 3, and never invents response copy.
