// Task 149: Feed the Dog a Cookie -- the Labrador's second game. The visitor feeds him digital cookies,
// each a real kind of web cookie shown as a tappable pill; he eats them all (he eats anything) and the
// visitor learns what cookies are.
//
// THE COLOUR SPLIT IS BY WHAT A COOKIE DOES, NOT WHO RUNS IT (brief section 3):
//   BLUE  helps a site work        preferences, fonts, analytics, video
//   RED   follows you elsewhere    cross-site tracking, ad networks
// Google Analytics / Google Fonts / the Vimeo video are BLUE, honestly labelled, because that is what
// this site actually uses (matched to /cookies). The site uses NO advertising cookies, so every RED
// pill carries the tooltip below -- saying plainly it is not used is the point of teaching it.
//
// This module holds the UI-level structure (pill id, label, colour) and the fixed red tooltip. The
// serveable copy -- his reactions and the one-line lesson per cookie -- lives in the workbook (bucket
// B67), referenced by responseId, per PD-01.

export interface CookiePill {
  id: string; // the "feed" move (a tap sends it) and the B67 responseId suffix
  label: string; // shown on the pill
  red: boolean; // true = follows you elsewhere (red + tooltip); false = helps the site work (blue)
  teachId: string; // B67 row: the one short line on what this cookie does (the lesson), in a child's words
}

// Brief section 5, verbatim and approved. Every red pill shows it on hover AND on tap; blue pills get none.
export const RED_TOOLTIP = 'we dont use this one. it follows you to other websites';

const teach = (id: string) => `B67-FEEDCOOKIE-${id.toUpperCase()}`;

export const FEED_COOKIES: CookiePill[] = [
  // BLUE -- helps a site work. The first four are what this site actually uses (matched to /cookies).
  { id: 'pref', label: 'Preferences', red: false, teachId: teach('pref') },
  { id: 'analytics', label: 'Analytics', red: false, teachId: teach('analytics') },
  { id: 'fonts', label: 'Fonts', red: false, teachId: teach('fonts') },
  { id: 'video', label: 'Video', red: false, teachId: teach('video') },
  { id: 'session', label: 'Session', red: false, teachId: teach('session') },
  { id: 'language', label: 'Language', red: false, teachId: teach('language') },
  { id: 'security', label: 'Security', red: false, teachId: teach('security') },
  // RED -- follows you elsewhere. This site uses none of these (hence the tooltip).
  { id: 'ads', label: 'Advertising', red: true, teachId: teach('ads') },
  { id: 'tracking', label: 'Tracking', red: true, teachId: teach('tracking') },
  { id: 'social', label: 'Social', red: true, teachId: teach('social') },
  { id: 'retarget', label: 'Retargeting', red: true, teachId: teach('retarget') },
  { id: 'pixel', label: 'Ad pixel', red: true, teachId: teach('pixel') },
];
