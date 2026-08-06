// Task 140: one line per destination, serving three routes:
//   1. "what is this page" -- answered from where the visitor is standing
//   2. "where do I find X" -- the line plus its link
//   3. fetch -- B03 first, since those were written to be thrown, then these
//      when it runs out. Six jokes, then eighteen more places to go.
//
// Owner copy, 6 August. {{BREED}} on the breed page is substituted at runtime.
export type PageBio = { route: string; name: string; bio: string };

export const PAGE_BIOS: PageBio[] = [
  { route: '/', name: 'The pit', bio: 'A pit full of chums. Tip them out.' },
  { route: '/home', name: 'Home', bio: 'The front page. An overview of our offering' },
  { route: '/about', name: 'About', bio: 'A page about the product.' },
  { route: '/preorder', name: 'Pre-order', bio: 'Where you buy the pack.' },
  { route: '/know-your-chums', name: 'Know Your Chums', bio: 'Learn about the breeds in the pack' },
  { route: '/chums/[slug]', name: 'A breed page', bio: 'Learn more about {{BREED}} like lifespan and temperament' },
  { route: '/britains-dog-history', name: 'Britain\'s Dog History', bio: 'Where you learn the history of British dogs.' },
  { route: '/good-dog-bad-dog', name: 'Good Dog, Bad Dog', bio: 'Learn about why some dogs get called bad, some are good boys' },
  { route: '/name-generator', name: 'Name Generator', bio: 'Where you can generate a name for a real or imaginary dog.' },
  { route: '/chum-calculator', name: 'Chum Finder', bio: 'Answer questions about your life and we will see which breeds suit you' },
  { route: '/hot-dogs', name: 'Hot Dogs', bio: 'Advise on all kinds of hotdogs' },
  { route: '/dogs-at-work', name: 'Dogs at Work', bio: 'We work, here you can learn about some jobs we have' },
  { route: '/smarter-than-the-test', name: 'Smarter Than the Test', bio: 'Learn about dog intelligence' },
  { route: '/whats-your-superpower', name: 'What\'s Your Superpower', bio: 'Questions that work out if you have a super power' },
  { route: '/chumspot', name: 'Competitions', bio: 'Currently you can win a 3d Chum' },
  { route: '/toy-safety', name: 'Toy Safety', bio: 'What is safe to give a dog.' },
  { route: '/independents', name: 'Independents', bio: 'Trade page for Independent retailers' },
  { route: '/trade', name: 'Trade', bio: 'For shops. Not for you, probably.' },
  { route: '/privacy', name: 'Privacy', bio: 'What the site does with information.' },
  { route: '/cookies', name: 'Cookies', bio: 'Not the edible sort.' },
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