// Task 164: DO NOT PRESS THAT BUTTON -- the Boxer's mini-game scenario data.
//
// The spoken copy and the choices are kept SEPARATE from the effect logic (brief section 7.4): a line can
// change without touching JavaScript, and a joke line can never become responsible for what the page does.
// games.ts reads this record for the flow; the effect a button names is applied by lib/boxerEffects.ts.
// Two variants per state (three for the finish) so repeated play does not feel identical; the variant is
// chosen deterministically by a per-game press counter, so there is no Math.random at runtime (house rule).
//
// His voice: bright, informal UK English, a quick comic turn in every line, the useful sense still clear
// under the joke, never brainless. No em dashes; no links written inside the dialogue.

import { BoxerEffectClass } from '../lib/boxerEffects';

export interface BoxerButton {
  id: string; // sent as the move input when the button is tapped
  label: string; // the panel button face
  effect: BoxerEffectClass | null; // the effect to apply, or null for the repair/finish button
  analyticsId: string; // brief section 11 (effect_id / choice_id); also the synthetic responseId suffix
  wobble: boolean; // tagged data-boxer-wobble? Recovery controls are NOT, so they never move under the wobble effect
  announce: string; // the polite aria-live line for this result (brief section 9)
  lines: string[]; // Boxer reaction variants (>= 2)
}

// Two openers (brief section 10). Each admits the panel without formal instructions.
export const BOXER_OPENING_LINES = [
  'The Collie said this panel controls the website. He also said not to touch it, but he used too many words and I lost the middle. Go on, pick one, I will absolutely handle whatever happens.',
  'Right, this is the control panel. The Collie labelled every button and explained the rules very carefully, and I was watching a squirrel through the window. Press one and we will find out together.',
];

// The panel. The opening trio the brief names (LIGHTS, DOOR, ABSOLUTELY NOT) sits first; the last effect
// button and the FIX IT repair follow. Every effect button is tagged for the wobble; FIX IT is not, so the
// way back is always steady.
export const BOXER_BUTTONS: BoxerButton[] = [
  {
    id: 'lights', label: 'LIGHTS', effect: 'boxer-lights-out', analyticsId: 'lights', wobble: true,
    announce: 'The website has dimmed.',
    lines: [
      'That was not the door. Unless the door has become night. I think I changed the time of day. Bold of me. Reversible, I am fairly sure.',
      'Lights. I pressed the one marked lights. It has gone all evening in here. Very cosy, in a way I did not plan and cannot immediately undo.',
    ],
  },
  {
    id: 'door', label: 'DOOR', effect: 'boxer-no-nav', analyticsId: 'door', wobble: true,
    announce: 'The site navigation has faded.',
    lines: [
      'I have removed all the exits. That sounded better before I said it out loud. The menu has only gone faint, mind, it still works, it is just being shy.',
      'The navigation went quiet on me. Do not worry, it is still there and still clicks, it has simply had enough of being looked at for a moment.',
    ],
  },
  {
    id: 'logo', label: 'ABSOLUTELY NOT', effect: 'boxer-giant-logo', analyticsId: 'logo', wobble: true,
    announce: 'The logo has grown very large.',
    lines: [
      'The label said absolutely not, which is basically an invitation. I have made the logo easier to find. It has become somewhat harder to avoid.',
      'I could not help it, the button was far too interesting. Now the logo is enormous and extremely pleased with itself. Look at the size of that dog.',
    ],
  },
  {
    id: 'wobble', label: 'DEFINITELY DO NOT', effect: 'boxer-wobble', analyticsId: 'wobble', wobble: true,
    announce: 'Some buttons are gently moving.',
    lines: [
      'The buttons have gone nervous. They know what happened to the last one I pressed. Give them a second, they will settle. Probably.',
      'Everything is having a little wobble. I think I startled the controls. They are only excited to meet you, they will calm down in a moment.',
    ],
  },
  {
    id: 'transfer', label: 'THE RED ONE', effect: 'boxer-wrong-transfer', analyticsId: 'transfer', wobble: true,
    announce: 'A different dog appeared for a moment, then the Boxer returned.',
    lines: [
      'Wrong button. Hello again. For one second there you nearly had a different dog. I fetched myself straight back. You are stuck with me.',
      'That one almost swapped us over. Do not panic, I grabbed the lead and came right back. Still me, still your Boxer, nothing lost.',
    ],
  },
  {
    id: 'fix', label: 'FIX IT', effect: null, analyticsId: 'repair', wobble: false,
    announce: 'The website has been restored.',
    lines: [
      'There. Everything back where it lives. I fixed it, technically, by pressing the button marked fix, which is the finest sort of fixing.',
      'All tidy. Lights on, exits open, logo a sensible size again. The Collie need never know, unless you tell him, in which case it was teamwork.',
      'Sorted, good as new. We make a decent team, you and me. Nothing broke that did not un-break. Ask me to play again whenever you fancy it.',
    ],
  },
];

// Typed input that is not a panel button: nudge back to the buttons, staying in the game so nothing leaks.
export const BOXER_NUDGE_LINE = 'Use the buttons, pal, they are right there under my nose. My paws are too big for typing, and I trust you far more than I trust the keyboard.';

// Leaving the game (an exit word). Restores the page and returns to normal Boxer conversation.
export const BOXER_EXIT_LINE = 'Panel closed, everything back to normal, no lasting damage. That was a good go. Come and press the forbidden buttons again whenever you like.';
