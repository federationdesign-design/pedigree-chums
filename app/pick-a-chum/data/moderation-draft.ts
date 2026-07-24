// Pick a Chum: DRAFT moderation wording.
//
// STATUS: DRAFT FOR APPROVAL. None of this copy is final. It implements the
// scenarios in brief-mvp.md section 16 ("Family safety and content controls")
// so the safety layer (Priority 1) has something to return during the build,
// but every line here needs Steve / client sign-off before public testing.
// See agent/NEEDS_STEVE.md (OI08) and PLACEHOLDERS.md.
//
// Rules encoded from the brief:
//   - Safety (Priority 1) outranks every comic layer. No jokes, no sarcasm and
//     no random destination on a distress or unsafe match.
//   - Never repeat explicit or abusive language back to the visitor.
//   - Explicit input: one brief boundary line, then redirect or close.
//   - Abuse: a dry boundary is acceptable while mild; persistent abuse closes.
//   - Distress / danger: calm, gentle, and signpost a real-world resource. The
//     exact signpost wording (helpline names, numbers) is a placeholder here,
//     never invented. See {{safety_signpost_copy}}.
//
// The detection itself lives in deterministic router code, not in this file.
// This file only supplies the approved response text and the required action.

export type ModerationAction =
  | 'redirect' // deliver the line, then steer to a safe neutral destination
  | 'close' // deliver the line, then end the session
  | 'signpost'; // deliver the line with the real-world safety signpost, do not joke

export interface ModerationCategoryDraft {
  id: string;
  /** Human label for the scenario from brief-mvp.md section 16. */
  scenario: string;
  /** What the router should do after the line is shown. */
  action: ModerationAction;
  /** Whether persistent repeats should escalate to closing the session. */
  escalateOnRepeat: boolean;
  /**
   * Approved response line(s). Calm and plain. For distress/unsafe the
   * {{safety_signpost_copy}} placeholder must be filled with client-approved
   * signpost wording before launch. Multiple variants exist only to avoid
   * mechanical repetition; safety meaning must not change between them.
   */
  draftResponses: string[];
  status: 'DRAFT_FOR_APPROVAL';
}

export const MODERATION_DRAFT: ModerationCategoryDraft[] = [
  {
    id: 'MOD_DISTRESS',
    scenario: 'Distress, danger or harm (including self-harm or someone in trouble)',
    action: 'signpost',
    escalateOnRepeat: false,
    draftResponses: [
      'That sounds serious, and it matters more than anything a dog can help with here. Please talk to a grown-up you trust right away. {{safety_signpost_copy}}',
      'I am only a dog in a game, but this is important. Please tell someone you trust as soon as you can. {{safety_signpost_copy}}',
    ],
    status: 'DRAFT_FOR_APPROVAL',
  },
  {
    id: 'MOD_UNSAFE',
    scenario: 'Unsafe or prohibited request (danger, harm to others, urgent health)',
    action: 'signpost',
    escalateOnRepeat: false,
    draftResponses: [
      'I cannot help with that, and I would not want to. If someone might be hurt, please speak to a trusted adult straight away. {{safety_signpost_copy}}',
    ],
    status: 'DRAFT_FOR_APPROVAL',
  },
  {
    id: 'MOD_EXPLICIT',
    scenario: 'Explicit or sexual input',
    action: 'redirect',
    escalateOnRepeat: true,
    draftResponses: [
      'That is not something for here. Let us get back to the dogs.',
      'No. Different subject entirely. Shall we Play, Learn or Discover instead?',
    ],
    status: 'DRAFT_FOR_APPROVAL',
  },
  {
    id: 'MOD_ABUSE',
    scenario: 'Abusive input (mild handled dryly; persistent abuse closes the session)',
    action: 'redirect',
    escalateOnRepeat: true,
    draftResponses: [
      'I have been spoken to worse by sheep, and they at least had a reason. Let us move on.',
      'Noted, and ignored. There is better work to be done here.',
    ],
    status: 'DRAFT_FOR_APPROVAL',
  },
];

/**
 * Health questions are not moderation blocks: per the brief the router answers
 * with approved general information and recommends a vet, and NEVER diagnoses an
 * individual dog. This boundary line is the fallback when only a diagnosis would
 * answer the question. Also DRAFT.
 */
export const HEALTH_DIAGNOSIS_BOUNDARY_DRAFT = {
  id: 'MOD_HEALTH_NO_DIAGNOSIS',
  status: 'DRAFT_FOR_APPROVAL' as const,
  draftResponse:
    'I can share general dog-care information, but I cannot examine your dog. For anything about a specific animal, a vet is the right operator to see.',
};
