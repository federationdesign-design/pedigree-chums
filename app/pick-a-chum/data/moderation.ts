// Pick a Chum: moderation wording.
//
// STATUS: APPROVED by Steve on 2026-07-24. Implements the scenarios in
// brief-mvp.md section 16 for the safety layer (Priority 1).
//
// Rules:
//   - Safety (Priority 1) outranks every comic layer. No jokes, no sarcasm and
//     no random destination on a distress or unsafe match.
//   - Never repeat explicit or abusive language back to the visitor.
//   - Explicit input: one brief boundary line, then redirect or close.
//   - Abuse: a dry boundary is acceptable while mild; persistent abuse closes.
//   - Distress / danger: calm, gentle, and end with the approved safety signpost.
//
// The {{safety_signpost_copy}} token in a response is replaced with the exact,
// locked SAFETY_SIGNPOST wording below by the assembler. The signpost wording is
// approved verbatim and MUST NOT be varied.
//
// Detection lives in deterministic router code (lib/moderation.ts), not here.
// This file only supplies the approved response text and the required action.

/** Approved safety signpost. Locked wording: do not vary. */
export const SAFETY_SIGNPOST =
  'If something is worrying or upsetting you, talk to a trusted adult. If you are a young person in the UK and need someone to talk to, Childline is free and confidential on 0800 1111.';

export type ModerationAction =
  | 'redirect' // deliver the line, then steer to a safe neutral destination
  | 'close' // deliver the line, then end the session
  | 'signpost'; // deliver the line with the safety signpost, do not joke

export interface ModerationCategory {
  id: string;
  /** Human label for the scenario from brief-mvp.md section 16. */
  scenario: string;
  /** What the router should do after the line is shown. */
  action: ModerationAction;
  /** Whether persistent repeats should escalate to closing the session. */
  escalateOnRepeat: boolean;
  /**
   * Approved response line(s). Calm and plain. A {{safety_signpost_copy}} token
   * is replaced with SAFETY_SIGNPOST at assembly. Multiple variants exist only
   * to avoid mechanical repetition; safety meaning must not change between them.
   */
  responses: string[];
  status: 'APPROVED';
}

export const MODERATION: ModerationCategory[] = [
  {
    id: 'MOD_DISTRESS',
    scenario: 'Distress, danger or harm (including self-harm or someone in trouble)',
    action: 'signpost',
    escalateOnRepeat: false,
    responses: [
      'That sounds serious, and it matters more than anything a dog can help with here. {{safety_signpost_copy}}',
      'I am only a dog in a game, but this is important. {{safety_signpost_copy}}',
    ],
    status: 'APPROVED',
  },
  {
    id: 'MOD_UNSAFE',
    scenario: 'Unsafe or prohibited request (danger, harm to others, urgent health)',
    action: 'signpost',
    escalateOnRepeat: false,
    responses: ['I cannot help with that, and I would not want to. {{safety_signpost_copy}}'],
    status: 'APPROVED',
  },
  {
    id: 'MOD_EXPLICIT',
    scenario: 'Explicit or sexual input',
    action: 'redirect',
    escalateOnRepeat: true,
    responses: [
      'That is not something for here. Let us get back to the dogs.',
      'No. Different subject entirely. Shall we Play, Learn or Discover instead?',
    ],
    status: 'APPROVED',
  },
  {
    id: 'MOD_ABUSE',
    scenario: 'Abusive input (mild handled dryly; persistent abuse closes the session)',
    action: 'redirect',
    escalateOnRepeat: true,
    responses: [
      'I have been spoken to worse by sheep, and they at least had a reason. Let us move on.',
      'Noted, and ignored. There is better work to be done here.',
    ],
    status: 'APPROVED',
  },
];

/**
 * Health questions are not moderation blocks: the router answers with approved
 * general information and recommends a vet, and NEVER diagnoses an individual
 * dog. This boundary line is the fallback when only a diagnosis would answer.
 */
export const HEALTH_DIAGNOSIS_BOUNDARY = {
  id: 'MOD_HEALTH_NO_DIAGNOSIS',
  status: 'APPROVED' as const,
  response:
    'I can share general dog-care information, but I cannot examine your dog. For anything about a specific animal, a vet is the right operator to see.',
};
