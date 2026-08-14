'use client';

// Global Pick a Chum launcher. Mounted once in the root layout, so it appears on
// every page. Deliberately lightweight: this file imports only the icon and the
// CSS module. The heavy conversation experience (engine + all the data records)
// is code-split behind next/dynamic and only downloaded when the visitor opens
// the launcher, so no page pays a bundle cost for a chatbot it never opens.

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import styles from './PickAChum.module.css';
import PickAChumIcon from './PickAChumIcon';
// DEV-RECORDER (strip for production): preview-only conversation recorder. It is
// inert on production hosts anyway (see lib/turn-tap.ts recorderEnabled).
import DevRecorder from '../dev/DevRecorder';
// Task 163: the gap-log. OFF by default (renders null unless ?gaplog=1); collects only the unanswerable
// no-subject fallback, holding nothing about any child. See dev/gap-log.ts for the controls and caveat.
import GapLog from '../dev/GapLog';
import SheetSync from '../dev/SheetSync';
// Task 148: the Terrier's job. Type-only import (erased) keeps the heavy experience code-split; the
// helper + registry + page-bios are lightweight (no chatbot engine), so the launcher stays cheap.
import type { AutoAppear } from './PickAChumExperience';
import { canDogAppear, isDismissed, markDismissed, unfoundGameHint, appearanceForRoute, pickMisread, type DogAppearance } from './dogAppearance';
import { CHAT_KEY, PROTECTED_FLAG } from './pcKeys';
import { bioForRoute } from '../data/page-bios';
import { getHiddenGamesEngine } from '../../../lib/hiddenGames/browserEngine';
import { HAT_COUNTDOWN_LINES } from '../../../lib/hiddenGames/hatHunt';

const PickAChumExperience = dynamic(() => import('./PickAChumExperience'), { ssr: false });

// Task 84/89: the launcher icon plays a one-shot four-frame "shout" when it appears, then rests on
// full (frame 0). The four real variants (marks at full, mid, minimal, none); the cycle holds 0.2s
// per frame.
// Task 98: versioned filenames (-v2) so a new export actually reaches people past the browser/CDN
// cache. ROUTINE: bump the suffix (-v3, -v4, ...) every time the art changes; same-name overwrites
// are served stale.
const ICON_FRAMES = [
  '/shout-launcher-icon-1-v3.svg', // 0 full (resting)
  '/shout-launcher-icon-2-v3.svg', // 1 mid
  '/shout-launcher-icon-3-v3.svg', // 2 minimal
  '/shout-launcher-icon-4-v3.svg', // 3 none
];
const FRAME_MS = 200;
const CYCLES = 3; // Task 97: play the four-frame sequence this many times on appearance, then rest
const APPEAR_HOLD_MS = 2000; // Task (JS hold): wait this long after the logo becomes visible, then reveal
// Task 148: the Terrier's unbidden lines. His two auto-appear pages carry OI_OI; a game find, ten
// seconds on, carries HINT_OFFER. Both open MINIMISED (his chip), and section 2's suppression rule
// (canDogAppear) is checked before either fires.
const OI_OI = 'oi oi I know all about this page if you want help';
// Task 150: the Boxer's confidently-wrong opener (his chip line). He is certain he knows what the page
// is; the reveal (his misread) shows how wrong. PLACEHOLDER, pending owner rewrite.
const BOXER_OPENER = 'oh! this page? i know this one. i know EXACTLY what this is';
const HINT_OFFER = 'you found a game. you want a hint for where another is?';
// Task 150 section 3: the Boxer's scroll gate. He appears only once the visitor is halfway down -- a
// commitment signal, not a greeter at the door. Half the scrollable height.
const SCROLL_GATE = 0.5;
// Task 151 Case A: the Labrador picks up a thread on /hot-dogs when a chat already exists (he often sent
// the visitor there himself). He speaks first, from the minimised chip -- new in the product, every line
// so far has been a reply. Owner copy, verbatim. The experience injects it; the launcher only decides.
const LAB_HOTDOG_ROUTE = '/hot-dogs';
const HINT_DELAY_MS = 10000; // ten seconds after a game is found (brief section 7)
const PULSE_MS = 700; // dead-click launcher pulse duration (matches the CSS keyframe)

export default function PickAChumLauncher() {
  const [open, setOpen] = useState(false);
  const [frame, setFrame] = useState(0); // Task 84: current icon frame index
  // Whether the Pedigree Chums logo is currently showing. The launcher anchors to
  // the logo (top-left), so it only appears when the logo does. The Nav owns this
  // state and publishes it as data-pc-logo on its header; we watch that attribute
  // rather than re-deriving it from scroll.
  const [logoShowing, setLogoShowing] = useState(false);
  // Task (JS hold): whether the launcher has been revealed yet. Gated behind APPEAR_HOLD_MS after the
  // logo becomes visible, so the reveal (fade + icon cycles) is a reliable hold, not a soft CSS delay.
  const [shown, setShown] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const wasOpen = useRef(false);
  // Task 148: the Terrier's unbidden appearance (auto-appear page bio, or a game hint) and the
  // dead-click pulse. Live refs so the 10s hint timer and the dead-click listener read current values.
  const pathname = usePathname();
  const [autoAppear, setAutoAppear] = useState<AutoAppear | null>(null);
  const [pulse, setPulse] = useState(false);
  // Task 151 Case A: the route to hand the experience for a thread pickup (the Labrador speaking into an
  // existing /hot-dogs chat), or null. Decided by whether a chat exists, not by detecting the link.
  const [pickupRoute, setPickupRoute] = useState<string | null>(null);
  // Task 156 (§8): the Terrier's hat-hunt countdown line to hand the experience. It lands in an open
  // chat (he speaks it) or, with none open, brings him on as an appearance.
  const [terrierSay, setTerrierSay] = useState<string | null>(null);
  const openRef = useRef(open);
  const pathnameRef = useRef(pathname);
  openRef.current = open;
  pathnameRef.current = pathname;

  // Restore focus to the launcher when the experience closes.
  useEffect(() => {
    if (wasOpen.current && !open) buttonRef.current?.focus();
    wasOpen.current = open;
  }, [open]);

  // Task 105: an open chat persists across navigation. If one was persisted (and not a protected
  // session -- the experience never writes those), reopen it on mount. This OVERRIDES the logo rule:
  // an open panel stays open even on a page where the launcher itself would be hidden.
  useEffect(() => {
    try {
      if (window.sessionStorage.getItem('pc-chat')) setOpen(true);
    } catch {}
  }, []);

  // Task 105: an explicit close (X / Escape) clears the persisted chat, so a deliberately-closed panel
  // does not reopen on the next page. (Navigating with it open keeps the key and reopens it.)
  const closeExperience = () => {
    setOpen(false);
    // Task 148 section 8: closing an unbidden appearance dismisses him for that page for the session --
    // he does not reappear on the same page. (An ordinary chat close just clears the key, as before.)
    if (autoAppear) {
      markDismissed(autoAppear.route);
      setAutoAppear(null);
    }
    try {
      window.sessionStorage.removeItem('pc-chat');
    } catch {}
  };

  // Watch the nav's data-pc-logo. A MutationObserver catches same-header changes
  // (scroll toggling the logo); the nav's pc:logo signal re-runs attach() so we
  // re-find and re-read the header after a client navigation (this launcher lives
  // in the root layout and persists while each page mounts its own Nav). Pages with
  // no logo (or no nav) simply never set it true, so the launcher stays hidden.
  useEffect(() => {
    let current: Element | null = null;
    const sync = () => setLogoShowing(current?.getAttribute('data-pc-logo') === 'true');
    const obs = new MutationObserver(sync);
    const attach = () => {
      const header = document.querySelector('header.pc-nav');
      if (header && header !== current) {
        obs.disconnect();
        current = header;
        obs.observe(header, { attributes: true, attributeFilter: ['data-pc-logo'] });
      }
      sync();
    };
    attach();
    window.addEventListener('pc:logo', attach as EventListener);
    return () => {
      obs.disconnect();
      window.removeEventListener('pc:logo', attach as EventListener);
    };
  }, []);

  // Task 84: preload all four frames on mount so the first cycle never flickers while they fetch.
  useEffect(() => {
    ICON_FRAMES.forEach((src) => {
      const im = new window.Image();
      im.src = src;
    });
  }, []);

  // Task (JS hold): reveal the launcher APPEAR_HOLD_MS after the logo becomes visible, so it arrives
  // after the visitor has looked at the page rather than with it -- a reliable JS hold, not a soft
  // CSS delay. If the logo hides before the hold elapses, the reveal is cancelled and reset.
  useEffect(() => {
    if (!logoShowing) {
      setShown(false);
      return;
    }
    const id = window.setTimeout(() => setShown(true), APPEAR_HOLD_MS);
    return () => window.clearTimeout(id);
  }, [logoShowing]);

  // Task 84/97: once revealed (after the hold), the four-frame sequence plays CYCLES times through
  // (12 frames, ~2.4s at 0.2s each), then rests on full (frame 0). Skipped entirely under
  // prefers-reduced-motion (a rattle reads as a bark; it rests on full instead).
  useEffect(() => {
    if (!shown) {
      setFrame(0);
      return;
    }
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setFrame(0);
      return;
    }
    const total = ICON_FRAMES.length * CYCLES;
    let step = 0;
    setFrame(0);
    const id = window.setInterval(() => {
      step += 1;
      if (step >= total) {
        setFrame(0); // rest on full
        window.clearInterval(id);
      } else {
        setFrame(step % ICON_FRAMES.length);
      }
    }, FRAME_MS);
    return () => window.clearInterval(id);
  }, [shown]);

  // Task 148/150: open a dog's unbidden appearance MINIMISED (his chip). The Terrier carries his blunt
  // `extended` bio, the Boxer his confidently-wrong `misread`; each dog its own opener line. Section 2's
  // suppression (canDogAppear) is the caller's responsibility -- this only builds the appearance.
  const appear = useCallback((app: DogAppearance, route: string) => {
    const bio = bioForRoute(route);
    // Task 153: /know-your-chums is the one DYNAMIC appearance -- the Collie names three RANDOM breeds. The
    // lines are generated in the experience (so this lightweight launcher never pulls the breed data), so
    // here it is just flagged with `chums`.
    if (app.dog === 'collie' && app.trigger === 'section') {
      setAutoAppear({ dog: 'collie', offer: '', route, chums: true, gapMs: app.gapMs });
      setOpen(true);
      return;
    }
    // Task 152/153: a page with a `sequence` sends its messages one after another (the first is the chip
    // line, the rest arrive whole, spaced by the page's gap). The Collie's warning/listing, and the Boxer's
    // /home and /smarter reads that shipped as one block before the sequence player existed.
    const seq = bio?.sequence;
    if (seq && seq.length) {
      setAutoAppear({ dog: app.dog, offer: seq[0], followUps: seq.slice(1), gapMs: app.gapMs, route });
      setOpen(true);
      return;
    }
    // Otherwise a single reveal-after-open appearance: the Terrier's blunt extended bio, the Boxer's misread
    // (his /about stat list stays one block -- ten items overflow the three-message cap), or the Labrador's
    // plain hunger opener with no second beat. The reveal rides `followUps` so it flows through the ONE gated
    // playSequence in the experience -- it lands as a beat after the open, not instantly alongside the opener.
    // Task 160: the Boxer's /about opens with his own line and reveals ONE misread (picked no-repeat), not
    // all ten in a block. As a followUp it only arrives once the visitor opens the chip, per section 2, and
    // the empty case (the Labrador's Case B) simply carries no followUp. Falls back to the old single
    // `misread` if present.
    const boxerMisread = app.dog === 'boxer' && bio?.misreads?.length ? pickMisread(bio.misreads) : null;
    const offer = app.dog === 'boxer' ? bio?.misreadOpening ?? BOXER_OPENER : app.dog === 'labrador' ? bio?.craving ?? 'I like hotdogs' : OI_OI;
    const reveal = app.dog === 'boxer' ? boxerMisread ?? bio?.misread ?? '' : app.dog === 'labrador' ? '' : bio?.extended ?? bio?.bio ?? '';
    setAutoAppear({ dog: app.dog, offer, followUps: reveal.trim() ? [reveal] : [], route });
    setOpen(true);
  }, []);

  // Task 148 section 4: the ARRIVAL dogs (the Terrier's two pages) appear the moment the page settles,
  // after the same reveal hold the launcher uses. Section 2 removes the whole problem -- a chat already
  // open, a protected session, the offer or checkout all veto via canDogAppear(); a per-page dismissal
  // keeps him gone once shut.
  useEffect(() => {
    if (!shown || open) return;
    const route = pathname ?? '';
    const app = appearanceForRoute(route);
    if (!app || app.trigger !== 'arrival') return;
    if (!canDogAppear() || isDismissed(route)) return;
    appear(app, route);
  }, [shown, pathname, open, appear]);

  // Task 150 section 3: the SCROLL-GATE dogs (the Boxer's three) appear only once the visitor has
  // scrolled halfway down -- someone that far in is engaged, not just arriving, and it keeps him off the
  // front door of high-traffic /home. Same suppression and per-page dismissal as arrival. The listener
  // removes itself the moment he appears; the effect re-runs (and cleans up) on navigation or open.
  useEffect(() => {
    if (!shown || open) return;
    const route = pathname ?? '';
    const app = appearanceForRoute(route);
    if (!app || app.trigger !== 'scroll') return;
    if (isDismissed(route)) return;
    const check = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max <= 0) return false; // nothing to scroll yet
      if (window.scrollY / max < SCROLL_GATE) return false;
      if (!canDogAppear() || isDismissed(route)) return false;
      appear(app, route);
      return true;
    };
    if (check()) return; // already past halfway (a restored scroll position, or a short page)
    const onScroll = () => {
      if (check()) window.removeEventListener('scroll', onScroll);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [shown, pathname, open, appear]);

  // Task 153: the SECTION-GATE (the Collie on /know-your-chums). She appears only when a specific section
  // scrolls into view -- the image rails, marked with data-pc-appear. NOT a percentage: the rails sit near
  // the foot of a long page, so "when they reach that section" needs the element, not a number. Same
  // suppression and per-page dismissal as the others. The rails are in the DOM from render (just below the
  // fold), so by the time the launcher has revealed (`shown`) the element exists to observe.
  useEffect(() => {
    if (!shown || open) return;
    const route = pathname ?? '';
    const app = appearanceForRoute(route);
    if (!app || app.trigger !== 'section' || !app.selector) return;
    if (isDismissed(route)) return;
    const el = document.querySelector(app.selector);
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        if (!canDogAppear() || isDismissed(route)) return;
        appear(app, route);
        io.disconnect();
      },
      { threshold: 0.01 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [shown, pathname, open, appear]);

  // Task 151 Case A: on /hot-dogs, decide the thread pickup purely by whether a chat exists (brief
  // section 3). Chat present -> hand /hot-dogs to the experience so the Labrador speaks from the chip;
  // no chat -> null, and the Case B arrival appearance above handles it instead. Never into a protected
  // session: a child who disclosed something and then followed a link must not have a dog start chatting.
  useEffect(() => {
    if ((pathname ?? '') !== LAB_HOTDOG_ROUTE) {
      setPickupRoute(null);
      return;
    }
    try {
      const hasChat = !!window.sessionStorage.getItem(CHAT_KEY);
      const wasProtected = !!window.sessionStorage.getItem(PROTECTED_FLAG);
      setPickupRoute(hasChat && !wasProtected ? LAB_HOTDOG_ROUTE : null);
    } catch {
      setPickupRoute(null);
    }
  }, [pathname]);

  // Task 148 section 7: ten seconds after a game is found, if still on the same page and nothing open,
  // he offers a hint at a game not yet found (derived from the registry; null when all eight are found,
  // so he says nothing). Suppression applies. subscribeDiscovery does not fire on the eighth find, which
  // is fine -- there is nothing left to hint.
  useEffect(() => {
    return getHiddenGamesEngine().subscribeDiscovery(() => {
      const route = pathnameRef.current ?? '';
      window.setTimeout(() => {
        if (openRef.current || (pathnameRef.current ?? '') !== route) return;
        if (!canDogAppear() || isDismissed(route)) return;
        const hint = unfoundGameHint();
        if (!hint) return;
        setAutoAppear({ dog: 'terrier', offer: HINT_OFFER, followUps: [hint], route });
        setOpen(true);
      }, HINT_DELAY_MS);
    });
  }, []);

  // Task 156 (§8): the Terrier counts the hats down IN THE CHAT (6 -> 4 to go ... 10 -> congratulations).
  // Not a toast: if a chat is open the line lands in it (he speaks it, via the terrierSay prop); with none
  // open he comes on as an appearance. Suppression: a session that has ever been protected gets nothing
  // (reportHat is already suppressed there, so no milestone fires -- this is belt-and-braces).
  useEffect(() => {
    return getHiddenGamesEngine().subscribeHatMilestone((found) => {
      const line = HAT_COUNTDOWN_LINES[found];
      if (!line) return;
      try {
        if (window.sessionStorage.getItem(PROTECTED_FLAG)) return;
      } catch {
        return;
      }
      let hasChat = false;
      try {
        hasChat = !!window.sessionStorage.getItem(CHAT_KEY);
      } catch {}
      if (hasChat || openRef.current) {
        setTerrierSay(line); // land it in the open chat
        setOpen(true);
      } else {
        setAutoAppear({ dog: 'terrier', offer: line, route: pathnameRef.current ?? '' });
        setOpen(true);
      }
    });
  }, []);

  // Task 148 section 6: a click on an explicitly marked dead element (data-pc-dead) summons NOTHING --
  // it pulses the launcher already on screen. No guessing, no false positives. Only while the launcher
  // (not the open chat) is showing. Capture phase, so it fires even if the element stops propagation.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (openRef.current) return;
      const t = e.target as Element | null;
      if (!t || !t.closest?.('[data-pc-dead]')) return;
      setPulse(true);
      window.setTimeout(() => setPulse(false), PULSE_MS);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  return (
    <>
      {/* Task 118/170: the brand-blue scrim moved INTO the experience so it can follow the dog (it needs her
          live position). It renders only while the experience is open, exactly as this launcher copy did. */}
      {open ? (
        <PickAChumExperience onClose={closeExperience} autoAppear={autoAppear ?? undefined} pickupRoute={pickupRoute} terrierSay={terrierSay} />
      ) : (
        <button
          ref={buttonRef}
          type="button"
          className={`${styles.launcher} ${shown ? styles.launcherOn : ''} ${pulse ? styles.launcherPulse : ''}`}
          aria-label="Pick a Chum"
          data-pc-reach
          onClick={() => setOpen(true)}
        >
          <PickAChumIcon src={ICON_FRAMES[frame]} />
        </button>
      )}
      {/* DEV-RECORDER (strip for production): renders null on production hosts. */}
      <DevRecorder />
      {/* GAP-LOG (Task 163): renders null unless the ?gaplog=1 flag is on; off by default everywhere. */}
      <GapLog />
      {/* SHEET-SYNC (Task 171): headless. Buffers and posts tester transcripts ONLY when ?rec=1 AND the
          runtime Edge Config switch is enabled; off by default everywhere, and renders nothing. */}
      <SheetSync />
    </>
  );
}
