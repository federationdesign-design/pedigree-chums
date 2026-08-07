// Task 147: The Case of the Missing Biscuit, the Border Terrier's in-chat game. Five cases, three
// suspects each, three clues each given ONE AT A TIME ON REQUEST, three guesses.
//
// This module holds ONLY the game DATA: the case order, the suspects (display name + accept variants,
// matching data like data/treat-trail.ts), the index of the guilty suspect, and the responseIds of the
// workbook rows that carry the copy. Per PD-01 and the brief, every serveable line -- the fifteen
// clues, the case titles and his nine lines -- lives in the workbook (Collie Responses, bucket B66),
// referenced here by id, never written in code. The fair-clue rule (each case solvable from its three
// clues) is a property of the approved clue copy, verified by walking every case.

export interface BiscuitSuspect {
  name: string; // display name (shown in the suspect list and the {{ANSWER}} reveal) and match target
  accept: string[]; // accepted spellings/forms a child would type ("cat", "the cat", "grandad")
}

export interface BiscuitCase {
  introId: string; // the workbook row that opens the case: case 1 = his OPENING line; 2-5 = the title
  suspects: BiscuitSuspect[]; // exactly three, in the approved order
  answer: number; // index into suspects of the guilty one
  clueIds: [string, string, string]; // B66 clue rows, given one at a time on request
}

const clues = (n: number): [string, string, string] => [
  `B66-MISSINGBISCUIT-C${n}-1`,
  `B66-MISSINGBISCUIT-C${n}-2`,
  `B66-MISSINGBISCUIT-C${n}-3`,
];

export const BISCUIT_CASES: BiscuitCase[] = [
  {
    introId: 'B66-MISSINGBISCUIT-OPENING', // case 1 opens with his verbatim opening line
    suspects: [
      { name: 'the cat', accept: ['cat', 'the cat', 'kitty'] },
      { name: 'the puppy', accept: ['puppy', 'the puppy', 'pup'] },
      { name: 'grandad', accept: ['grandad', 'granddad', 'grandpa', 'grampa'] },
    ],
    answer: 0,
    clueIds: clues(1),
  },
  {
    introId: 'B66-MISSINGBISCUIT-CASE2-TITLE',
    suspects: [
      { name: 'the labrador', accept: ['labrador', 'the labrador', 'lab'] },
      { name: 'the boxer', accept: ['boxer', 'the boxer'] },
      { name: 'the collie', accept: ['collie', 'the collie'] },
    ],
    answer: 0,
    clueIds: clues(2),
  },
  {
    introId: 'B66-MISSINGBISCUIT-CASE3-TITLE',
    suspects: [
      { name: 'the puppy', accept: ['puppy', 'the puppy', 'pup'] },
      { name: 'the postman', accept: ['postman', 'the postman', 'postie', 'mailman', 'post man'] },
      { name: 'the baby', accept: ['baby', 'the baby'] },
    ],
    answer: 0,
    clueIds: clues(3),
  },
  {
    introId: 'B66-MISSINGBISCUIT-CASE4-TITLE',
    suspects: [
      { name: 'the wind', accept: ['wind', 'the wind'] },
      { name: 'the postman', accept: ['postman', 'the postman', 'postie', 'mailman', 'post man'] },
      { name: 'the boy next door', accept: ['boy next door', 'the boy next door', 'boy', 'the boy', 'neighbour', 'next door'] },
    ],
    answer: 2,
    clueIds: clues(4),
  },
  {
    introId: 'B66-MISSINGBISCUIT-CASE5-TITLE',
    suspects: [
      { name: 'the labrador', accept: ['labrador', 'the labrador', 'lab'] },
      { name: 'the cat', accept: ['cat', 'the cat', 'kitty'] },
      { name: 'me', accept: ['me', 'you', 'the terrier', 'terrier', 'yourself'] },
    ],
    answer: 0,
    clueIds: clues(5),
  },
];
