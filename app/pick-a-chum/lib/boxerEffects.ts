// Task 164: the Boxer's DO NOT PRESS THAT BUTTON effect controller.
//
// The ONE place that touches the page for his mini-game (brief section 7.3). The dialogue engine never
// writes to the DOM: it records which effect is live in the game state, and the experience mirrors that
// into applyBoxerEffect here, declaratively, exactly like the cookie tray mirrors its pills. Effects are
// allow-listed classes on <body> acting on the SITE layer (#pc-site, which wraps the page in layout.tsx)
// and the nav. They never touch the chat: the Pick a Chum overlay is a SIBLING of #pc-site at a higher
// stacking level (z-index 301), so it stays bright and clickable while an effect runs, which is what keeps
// the emergency reset reachable.
//
// Reset is a hard requirement, not a convenience. It runs before every apply (only one effect at a time),
// and the experience also calls it on route change, on minimise, on close/unmount and on a JS error
// (Task 164 sections 2.1-2.3). resetBoxerEffects is idempotent, so calling it when nothing is running is
// safe. The CSS for these classes lives in app/globals.css (global, since they target <body> and site
// chrome outside any CSS-module scope); every layer a class paints carries pointer-events: none there, so
// a joke can never trap a visitor.

export const BOXER_EFFECT_CLASSES = [
  'boxer-lights-out',
  'boxer-no-nav',
  'boxer-wobble',
  'boxer-giant-logo',
  'boxer-wrong-transfer',
] as const;

export type BoxerEffectClass = (typeof BOXER_EFFECT_CLASSES)[number];

function isEffectClass(c: string): c is BoxerEffectClass {
  return (BOXER_EFFECT_CLASSES as readonly string[]).includes(c);
}

// Strip every Boxer effect class. Safe to call from any reset hook, running or not.
export function resetBoxerEffects(): void {
  if (typeof document === 'undefined') return;
  document.body.classList.remove(...BOXER_EFFECT_CLASSES);
}

// Apply exactly one effect. Reset first (only one at a time, brief section 4). Never fire during commerce:
// while the discount offer is open the body carries data-offer-open and the site is left untouched (brief
// section 5). An unknown class would be a programming error, but it must never leave the page half-changed,
// so we reset and bail rather than throw inside a React effect.
export function applyBoxerEffect(effectClass: string): void {
  if (typeof document === 'undefined') return;
  resetBoxerEffects();
  if (document.body.hasAttribute('data-offer-open')) return; // commerce: do not touch the page
  if (!isEffectClass(effectClass)) return; // unknown effect: stay reset
  document.body.classList.add(effectClass);
}
