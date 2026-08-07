// Task 146: Treat Trail, the Labrador's in-chat game. Ten objects, three clues each, three guesses.
//
// This module holds ONLY the game DATA: the object order, the answer word with its accept variants
// (matching data, like data/kennel-sketches.ts), and the responseIds of the workbook rows that carry
// the copy. Per PD-01 and the brief, every serveable line -- the thirty clues and the reaction lines --
// lives in the workbook (Collie Responses, bucket B65), referenced here by id, never written in code.
// SAUSAGE is deliberately last and its finale links to /hot-dogs (the sausage gag).

export interface TreatTrailObject {
  answer: string; // the reveal word ({{ANSWER}} substitution) and the fuzzy-match target
  accept: string[]; // extra accepted spellings the fuzzy matcher cannot reach on its own (e.g. "bal")
  clueIds: [string, string, string]; // B65 rows: clue 1 (vague), 2 (warmer), 3 (nearly gives it away)
  link?: string; // a finale link (SAUSAGE -> /hot-dogs)
}

const ids = (obj: string): [string, string, string] => [
  `B65-TREATTRAIL-${obj}-1`,
  `B65-TREATTRAIL-${obj}-2`,
  `B65-TREATTRAIL-${obj}-3`,
];

export const TREAT_TRAIL_OBJECTS: TreatTrailObject[] = [
  { answer: 'BALL', accept: ['ball', 'balls', 'bal'], clueIds: ids('BALL') },
  { answer: 'BONE', accept: ['bone', 'bones', 'boan'], clueIds: ids('BONE') },
  { answer: 'STICK', accept: ['stick', 'sticks', 'stik'], clueIds: ids('STICK') },
  { answer: 'LEAD', accept: ['lead', 'leads', 'leed', 'leash'], clueIds: ids('LEAD') },
  { answer: 'BOWL', accept: ['bowl', 'bowls', 'boul', 'bole'], clueIds: ids('BOWL') },
  { answer: 'BISCUIT', accept: ['biscuit', 'biscuits', 'biscit', 'biscut', 'bisquit', 'cookie'], clueIds: ids('BISCUIT') },
  { answer: 'SOCK', accept: ['sock', 'socks', 'sok'], clueIds: ids('SOCK') },
  { answer: 'SLIPPER', accept: ['slipper', 'slippers', 'sliper'], clueIds: ids('SLIPPER') },
  { answer: 'POSTMAN', accept: ['postman', 'postmen', 'postie', 'mailman'], clueIds: ids('POSTMAN') },
  { answer: 'SAUSAGE', accept: ['sausage', 'sausages', 'sausige', 'sosage', 'hotdog', 'hotdogs', 'hot dog', 'banger'], clueIds: ids('SAUSAGE'), link: '/hot-dogs' },
];
