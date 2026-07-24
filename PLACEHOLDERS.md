# Placeholders

Clearly named placeholder values used by the Pick a Chum build where a real
value was not available. Each links to the decision needed in
`agent/NEEDS_STEVE.md`. Never treat a placeholder as final copy.

| Placeholder | Location | Meaning | Resolve via |
|---|---|---|---|
| Robot-head launcher icon | (styled build, later) | Approved stand-in launcher mark; implement as a single easily swapped asset | NEEDS_STEVE item 8 (runbook rule 3) |
| `{{safety_signpost_copy}}` | `app/pick-a-chum/data/moderation-draft.ts` | Real-world safety signpost wording (trusted-adult / helpline). Not invented. | NEEDS_STEVE item 2 (OI08) |
| `campaign.launchDate = null` | `app/pick-a-chum/data/campaign.ts` | Launch date not public yet | NEEDS_STEVE item 1 (OI04) |
| DST013 Contact `resolvedUrl: null` | `app/pick-a-chum/data/route-map.json` | Contact action deliberately left as a placeholder | NEEDS_STEVE item 3 |
| ART002 / ART003 / ART009 / ART010 `resolvedUrl: null` | `route-map.json` | Planned articles not yet built | NEEDS_STEVE item 4 (OI06) |
| ART001 / ART004 / ART005 tentative routes | `route-map.json` | Best-guess article routes pending confirmation | NEEDS_STEVE item 5 (OI06) |
| FAQ003-006, FAQ011-014 `{{...}}` answers | `generated/faq.json` (from workbook) | Workbook FAQ answers not on the live home FAQ | NEEDS_STEVE item 6 (OI01) |

## Notes

- The moderation copy in `moderation-draft.ts` is DRAFT FOR APPROVAL in full,
  not just the signpost token.
- The commercial model (prices, discount, delivery, pre-order action) was
  confirmed by Steve and is no longer a placeholder; only the launch DATE is.
- Dog records for all 54 pack dogs are real, extracted from the repo's own
  `data/*.ts`; they are not placeholders.
