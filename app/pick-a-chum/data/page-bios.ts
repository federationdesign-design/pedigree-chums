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
// Task 150: `misread` is the Boxer's confidently-wrong read of a page. He is not a clever dog: he has
// misunderstood what the page is and every line drifts further from reality. He MISREADS his own data
// (the reader does the arithmetic he cannot); he never jokes about the illness itself, and every figure
// matches /chums/boxer exactly (brief section 7.1 / 7.2). Served only when the Boxer appears; only the
// three pages he is allocated carry one. PLACEHOLDER copy, pending owner rewrite (section 6/7/8).
// Task 151: `craving` is the Labrador's line on his page. He is not blunt like the Terrier or wrong like
// the Boxer -- he is just hungry, and hot dogs are food. It is served as his Case B appearance line (when
// he did NOT send the visitor). Only /hot-dogs needs it. PLACEHOLDER, owner copy verbatim (section 3/6).
// Task 152/153: `sequence` is a run of messages the dog sends one after another (the first is the chip
// line, the rest arrive whole, spaced by the page's gap). It replaces a single multi-line block so the
// beat between messages can do the work -- the Collie's warning on /good-dog-bad-dog, her listing on
// /dogs-at-work, and the Boxer's /home and /smarter reads (retro-fitted; they shipped as one block before
// the sequence player existed). A page with a `sequence` ignores `misread`/`extended` for the appearance.
// Task 160: the Boxer's /about no longer serves all ten misreads in one block. It serves `misreadOpening`
// (his chip line) then, on open, ONE item from `misreads` picked at random with no repeat until all ten
// have shown (the B57-facts pattern, session-scoped -- see pickMisread in dogAppearance.ts). A different
// misread next visit is a reason to come back. The figures still match /chums/boxer (brief section 5).
export type PageBio = { route: string; name: string; bio: string; extended?: string; misread?: string; misreadOpening?: string; misreads?: string[]; craving?: string; sequence?: string[] };

export const PAGE_BIOS: PageBio[] = [
  { route: '/', name: 'The pit', bio: 'A pit full of chums. Tip them out.', extended: 'A pit full of us. Grab one, chuck it back, grab another. Keep going till one sticks.' },
  { route: '/home', name: 'Home', bio: 'The front page. An overview of our offering', extended: 'The front door. Everything branches off here. Pick a direction and go.', sequence: ['welcome to home, do come in', 'i wasnt expecting anyone. I like it friends dropping in unannounced', 'would you like a cup of tea? i can do tea.', 'click on anything you like, we have videos and a search', 'there is a pre-order button, this will secure your pack for when its released'] },
  { route: '/about', name: 'About', bio: 'A page about the product.', extended: 'What this thing is and who made it. Read it if you like knowing.', misreadOpening: 'this is about page, I can tell you about me if you like?', misreads: ['Boxers have one of the highest cancer rates of any breed.', 'Boxers have a heart condition thats unique to us. It can be fatal if its not managed.', 'My flat face limits my exercise.', 'Boxers can live for eleven years. The smaller the dog the longer it lives.', 'I cost around £2k per year to keep going. whatever £2k is?', 'I am one of the easier dogs to train because I respond to reward based training', 'Boxers puppy energy lasts for years, we are a handful', 'Named after actual boxers because we stand up and spar with our paws.', 'Boxers ancestor was German dog; a bullenbeisser, which means Bull Biter.', 'A famous boxer on TV was called George. he did the mustard adverts'] },
  { route: '/preorder', name: 'Pre-order', bio: 'Where you buy the pack.', extended: 'Where you get the pack. Ask a grown-up first.' },
  { route: '/know-your-chums', name: 'Know Your Chums', bio: 'Learn about the breeds in the pack', extended: 'All 54 of us, one at a time. Tap a face, read the card. Find your favourite.' },
  { route: '/chums/[slug]', name: 'A breed page', bio: 'Learn more about {{BREED}} like lifespan and temperament', extended: 'Everything on the {{BREED}}. The job it was bred for, the size, how long it lasts. Scroll for the lot.' },
  { route: '/britains-dog-history', name: 'Britain\'s Dog History', bio: 'Where you learn the history of British dogs.', extended: 'Where the old dogs are. Dig through the family trees and follow a line back as far as it goes.', sequence: ['oi oi', 'you can learn about all British dogs that have ever existed', 'Dig through the family trees'] },
  // Task 153: the Collie's warning-disguised-as-invitation. THREE separate messages (section 3, verbatim);
  // the beat before the third is the joke. Not softened -- a reader who likes reading is invited in, one
  // who does not is told kindly before committing to 3,000 words.
  { route: '/good-dog-bad-dog', name: 'Good Dog, Bad Dog', bio: 'Learn about why some dogs get called bad, some are good boys', extended: 'Stories of dogs who went good and dogs who went bad. Pick one and read it.', sequence: ['Tuck in if you like history, stories, and dogs and how they all cross over.', 'I like to learn stuff, but these just take too much time to read.', "I'd rather be herding something."] },
  { route: '/name-generator', name: 'Name Generator', bio: 'Where you can generate a name for a real or imaginary dog.', extended: 'Need a name? Press the button till one fits. Works for a real dog or a made-up one.', sequence: ['oi oi', 'Need a name? build a shortlist of the names you like', 'then enter the knockout round to find your favourite'] },
  { route: '/chum-calculator', name: 'Chum Finder', bio: 'Answer questions about your life and we will see which breeds suit you', extended: 'Answer a few questions and it tells you which of us you would get on with. Answer honest.' },
  { route: '/hot-dogs', name: 'Hot Dogs', bio: 'Advise on all kinds of hotdogs', extended: 'Hot dogs. The food and the game flavour, all in one place. Do not overthink it.', craving: 'I like hotdogs' },
  // Task 153: the Collie is the only dog who has DONE these jobs. Three messages: her credentials (a
  // professional listing, not a boast), the dogs-as-technology shrug (true at three levels -- a farming
  // technology, a computer, a character made of code -- landed as a shrug, never explained), and the
  // productivity claim HEDGED ("a farmer told me") because the 40x figure is unverifiable, not wrong: no
  // one has run a controlled comparison of gathering with and without a dog. FLAG 40x FOR THE STATS AUDIT.
  // PLACEHOLDER copy pending owner rewrite (section 4).
  { route: '/dogs-at-work', name: 'Dogs at Work', bio: 'We work, here you can learn about some jobs we have', extended: 'The jobs dogs actually do. Sniffing, herding, guarding. Proper work, not tricks.', sequence: ['I still do this one. I move sheep. Some of the jobs on this page are proper work; some are just fetching.', 'dogs were a technology, once. humans farmed with us. and here I am now, code on a screen. same job, really.', "a farmer told me that back when I was integral to the herding, we let them do about forty times the work they would without us. cant prove it, mind. nobody farms sheep without a dog."] },
  // Task 153 (section 8 note): the Boxer's /smarter read is retro-fitted onto the sequence (it shipped as
  // one multi-line block before the player existed). Three messages now; he is then wrong in chat (the
  // maths gag, Task 145). PLACEHOLDER, pending owner rewrite.
  { route: '/smarter-than-the-test', name: 'Smarter Than the Test', bio: 'Learn about dog intelligence', extended: 'A test of dog brains. See if we beat it. We usually do.', sequence: ['a page about dog intelligence', 'I\'m not sure I should be on this page', 'im not the sharpest sandwich in the box'] },
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