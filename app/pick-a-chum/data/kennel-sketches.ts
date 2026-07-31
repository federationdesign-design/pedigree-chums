/**
 * Kennel Sketch drawings.
 *
 * Nine ASCII drawings of dog things, drawn by Steve on 31 July 2026.
 * The clue lines mirror the "Look for:" wording on the printed cards.
 *
 * These live here rather than in the workbook because a spreadsheet cell
 * mangles leading whitespace, and the alignment is the whole picture.
 *
 * The panel must render these in a MONOSPACE font or every one collapses.
 *
 * The tenth clue row in workbook bucket B44 (NOSE) has no drawing and is
 * surplus. Ignore it.
 */

export type KennelSketch = {
  answer: string;
  accept: string[];
  clue: string;
  art: string;
};

export const KENNEL_SKETCHES: KennelSketch[] = [
  {
    answer: 'BONE',
    accept: ['bone', 'a bone', 'dog bone'],
    clue: 'Look for: I chew it',
    art: [
      '  __        __',
      ' /  \\______/  \\',
      ' \\__/      \\__/',
    ].join('\n'),
  },
  {
    answer: 'BALL',
    accept: ['ball', 'a ball', 'tennis ball'],
    clue: 'Look for: I fetch it',
    art: [
      '   ___',
      '  /   \\',
      ' |     |',
      '  \\___/',
    ].join('\n'),
  },
  {
    answer: 'BOWL',
    accept: ['bowl', 'a bowl', 'dog bowl', 'food bowl', 'dish'],
    clue: 'Look for: dinner',
    art: [
      ' \\_______________/',
      '  \\             /',
      '   \\___________/',
    ].join('\n'),
  },
  {
    answer: 'LEAD',
    accept: ['lead', 'a lead', 'leash', 'collar and lead'],
    clue: 'Look for: walks',
    art: [
      'O====================',
    ].join('\n'),
  },
  {
    answer: 'STICK',
    accept: ['stick', 'a stick', 'branch'],
    clue: 'Look for: from a tree',
    art: [
      ' =================',
    ].join('\n'),
  },
  {
    answer: 'KENNEL',
    accept: ['kennel', 'a kennel', 'dog house', 'doghouse', 'house'],
    clue: 'Look for: I sleep in it',
    art: [
      '      /\\',
      '     /  \\',
      '    /____\\',
      '    | __ |',
      '    ||  ||',
      '    ||__||',
    ].join('\n'),
  },
  {
    answer: 'PAW',
    accept: ['paw', 'a paw', 'paws', 'foot', 'paw print'],
    clue: 'Look for: I have four',
    art: [
      '   ()  ()  ()  ()',
      '      .------.',
      '     (        )',
      "      '------'",
    ].join('\n'),
  },
  {
    answer: 'TAIL',
    accept: ['tail', 'a tail', 'wag', 'wagging tail'],
    clue: 'Look for: it wags',
    art: [
      '  _/  _/',
    ].join('\n'),
  },
  {
    answer: 'EARS',
    accept: ['ears', 'ear', 'dog ears'],
    clue: 'Look for: I hear with them',
    art: [
      '   /\\       /\\',
      '  /  \\_____/  \\',
      ' /             \\',
    ].join('\n'),
  },
];
