// Task 140: one line per destination, serving three routes:
//   1. "what is this page" -- answered from where the visitor is standing
//   2. "where do I find X" -- the line plus its link
//   3. fetch -- B03 first, since those were written to be thrown, then these
//      when it runs out. Six jokes, then eighteen more places to go.
//
// Owner copy, 6 August. {{BREED}} on the breed page is substituted at runtime.
// Task 148: `extended` is the Border Terrier's blunt, practical version -- what the page is FOR and what
// to do when you get there (dig here, this is where the old dogs are, not a tour). Served only when the
// Terrier is the active dog; every other dog keeps the owner's short `bio`. AUTHORED BY THE AGENT,
// pending owner approval (brief section 3 / 10). {{BREED}} substitutes on the breed page as with `bio`.
export type PageBio = { route: string; name: string; bio: string; extended?: string };

export const PAGE_BIOS: PageBio[] = [
  { route: '/', name: 'The pit', bio: 'A pit full of chums. Tip them out.', extended: 'A pit full of us. Grab one, chuck it back, grab another. Keep going till one sticks.' },
  { route: '/home', name: 'Home', bio: 'The front page. An overview of our offering', extended: 'The front door. Everything branches off here. Pick a direction and go.' },
  { route: '/about', name: 'About', bio: 'A page about the product.', extended: 'What this thing is and who made it. Read it if you like knowing.' },
  { route: '/preorder', name: 'Pre-order', bio: 'Where you buy the pack.', extended: 'Where you get the pack. Ask a grown-up first.' },
  { route: '/know-your-chums', name: 'Know Your Chums', bio: 'Learn about the breeds in the pack', extended: 'All 54 of us, one at a time. Tap a face, read the card. Find your favourite.' },
  { route: '/chums/[slug]', name: 'A breed page', bio: 'Learn more about {{BREED}} like lifespan and temperament', extended: 'Everything on the {{BREED}}. The job it was bred for, the size, how long it lasts. Scroll for the lot.' },
  { route: '/britains-dog-history', name: 'Britain\'s Dog History', bio: 'Where you learn the history of British dogs.', extended: 'Where the old dogs are. Dig through the family trees and follow a line back as far as it goes.' },
  { route: '/good-dog-bad-dog', name: 'Good Dog, Bad Dog', bio: 'Learn about why some dogs get called bad, some are good boys', extended: 'Stories of dogs who went good and dogs who went bad. Pick one and read it.' },
  { route: '/name-generator', name: 'Name Generator', bio: 'Where you can generate a name for a real or imaginary dog.', extended: 'Need a name? Press the button till one fits. Works for a real dog or a made-up one.' },
  { route: '/chum-calculator', name: 'Chum Finder', bio: 'Answer questions about your life and we will see which breeds suit you', extended: 'Answer a few questions and it tells you which of us you would get on with. Answer honest.' },
  { route: '/hot-dogs', name: 'Hot Dogs', bio: 'Advise on all kinds of hotdogs', extended: 'Hot dogs. The food and the game flavour, all in one place. Do not overthink it.' },
  { route: '/dogs-at-work', name: 'Dogs at Work', bio: 'We work, here you can learn about some jobs we have', extended: 'The jobs dogs actually do. Sniffing, herding, guarding. Proper work, not tricks.' },
  { route: '/smarter-than-the-test', name: 'Smarter Than the Test', bio: 'Learn about dog intelligence', extended: 'A test of dog brains. See if we beat it. We usually do.' },
  { route: '/whats-your-superpower', name: 'What\'s Your Superpower', bio: 'Questions that work out if you have a super power', extended: 'Questions that decide your power. Answer them and find out what you have got.' },
  { route: '/chumspot', name: 'Competitions', bio: 'Currently you can win a 3d Chum', extended: 'Win a 3D chum. Enter, wait, hope. Somebody has to.' },
  { route: '/toy-safety', name: 'Toy Safety', bio: 'What is safe to give a dog.', extended: 'What we can chew and what we cannot. Read it before you hand a dog a toy.' },
  { route: '/independents', name: 'Independents', bio: 'Trade page for Independent retailers', extended: 'For the small shops that stock us. Not for you, unless you run one.' },
  { route: '/trade', name: 'Trade', bio: 'For shops. Not for you, probably.', extended: 'For shops buying stock. Move along if that is not you.' },
  { route: '/privacy', name: 'Privacy', bio: 'What the site does with information.', extended: 'What the site keeps and what it does not. The dull bit, but somebody has to know it.' },
  { route: '/cookies', name: 'Cookies', bio: 'Not the edible sort.', extended: 'The computer sort, not the biscuit sort. What gets stored and why.' },
];

// Longest-prefix match, so /chums/labrador finds the breed-page line and
// /good-dog-bad-dog/bulls-eye finds the essays line. The root is only ever an
// exact match, or it would swallow everything.
export function bioForRoute(route: string): PageBio | null {
  const clean = (route || '/').split('?')[0].replace(/\/+$/, '') || '/';
  if (clean === '/') return PAGE_BIOS.find((p) => p.route === '/') ?? null;
  const dynamic = PAGE_BIOS.find((p) => p.route.includes('[') && clean.startsWith(p.route.split('[')[0]));
  if (dynamic) return dynamic;
  const exact = PAGE_BIOS.filter((p) => p.route !== '/' && (clean === p.route || clean.startsWith(p.route + '/')));
  return exact.sort((a, b) => b.route.length - a.route.length)[0] ?? null;
}