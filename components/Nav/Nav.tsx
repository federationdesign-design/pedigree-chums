"use client";
import { useState, useEffect, useRef, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Montserrat } from "next/font/google";
import BentoBoard from "./BentoBoard";
import styles from "./Nav.module.css";

// Montserrat 900 loaded explicitly -- the global --font-body only ships 400-800,
// so a plain font-weight:900 would fall back. This guarantees the heavy face.
const backFont = Montserrat({ subsets: ["latin"], weight: ["900"] });

// Menu images worth preloading so the launcher opens without pop-in.
const PRELOAD_IMAGES = [
  "/name-gen-bento-menu-img.jpg", "/product-img.jpg", "/history-hero.jpg",
  "/bulls-eye-img.jpg", "/never-clocking-off.jpg", "/home-hero.jpg",
  "/know-your-chums.jpg", "/hot-dog-hearo-img.jpg", "/inteligent-dogs.jpg",
];

const tradeNavLinks = [
  { label: "Trade Enquiry", href: "/trade#enquire" },
  { label: "Independent Stockists", href: "/independents#enquire" },
  { label: "Evidence Register", href: "/evidence-register" },
  { label: "Toy Safety Technical File", href: "/toy-safety" },
];

export default function Nav({ hideLogo = false, dockBottomLeft = false, showLogo = false, tradeLinks = false }: { hideLogo?: boolean; dockBottomLeft?: boolean; showLogo?: boolean; tradeLinks?: boolean }) {
  const router = useRouter();
  /* PREFETCH ON INTENT, NOT ON OPEN.

     next/link only prefetches once a link has scrolled into view, and this menu
     is a board you scroll, so most tiles are never prefetched at all. That is
     part of why tapping one sits there.

     Prefetching every destination the moment the menu opens would fix that and
     recreate the problem underneath it: several page payloads racing the tiles
     for the same connection. So it happens on intent instead. A pointer over a
     tile, or a finger down on it, is a good enough signal, and touchstart fires
     a beat before the tap completes.

     Each href is fetched once per mount. router.prefetch is a no-op on repeats
     anyway, but the set keeps it honest. */
  const prefetched = useRef<Set<string>>(new Set());
  const prefetchNow = (href: string) => {
    if (!href.startsWith("/") || prefetched.current.has(href)) return;
    prefetched.current.add(href);
    try { router.prefetch(href); } catch { /* not fatal: the tap still works */ }
  };
  /* One listener for the whole overlay rather than a prop threaded through
     every tile, board and link. It reads the href off whatever was touched. */
  const onIntent = (e: React.PointerEvent<HTMLDivElement>) => {
    const t = e.target as HTMLElement | null;
    const a = t && t.closest ? t.closest("a[href]") : null;
    if (a) prefetchNow(a.getAttribute("href") || "");
  };
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  // Set only when the menu is closing because the visitor picked a link. The
  // scroll restore in the body-lock cleanup is then skipped, so the page they
  // are travelling to always opens at the top.
  const navigatingRef = useRef(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    const raf = requestAnimationFrame(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    const openMenu = () => setOpen(true);
    window.addEventListener("pc:open-menu", openMenu);
    return () => window.removeEventListener("pc:open-menu", openMenu);
  }, []);

  // The logo is visible when the page opted in (showLogo) or once scrolled, and
  // never on a page that hides it. This is the one source of truth for the Pick a
  // Chum launcher, which anchors to the logo -- it must not re-derive it from the
  // scroll position. Exposed as data-pc-logo on the header (below) and announced on
  // change so the launcher (which lives in the root layout, outside this tree, and
  // persists across navigations) can react without polling scroll.
  const logoShowing = !hideLogo && !open && (showLogo || scrolled);
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("pc:logo", { detail: logoShowing }));
  }, [logoShowing]);

  // Preload the menu images on page load so the launcher opens without pop-in.
  useEffect(() => {
    PRELOAD_IMAGES.forEach((s) => { const im = new window.Image(); im.src = s; });
  }, []);

  // Lock the page body while the menu is open. On iOS a touch drag on a fixed
  // overlay otherwise scrolls the body behind it instead of the overlay, so the
  // menu appears "stuck". Fixing the body (and restoring scroll on close) keeps
  // the gesture on the overlay.
  useEffect(() => {
    if (!open) return;
    const body = document.body;
    const scrollY = window.scrollY;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
    };
    // iOS: position:fixed + overflow:hidden on body is the usual scroll-lock
    // pattern, but it also kills touch scrolling INSIDE the overlay, so the
    // menu could not be scrolled on a real device. The overlay is a fixed
    // full-viewport layer with its own overflow-y, so the page behind it
    // cannot be reached anyway and the lock is not needed.
    // Nothing is set on body: the overlay is a fixed full-viewport layer with
    // its own overflow-y, so the page behind it cannot be reached, and any
    // body-level lock stops iOS scrolling the overlay itself.

    return () => {
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.left = prev.left;
      body.style.right = prev.right;
      body.style.width = prev.width;
      body.style.overflow = prev.overflow;
      if (navigatingRef.current) {
        // Leaving for another page. Fixing the body already collapsed the scroll
        // to 0, so doing nothing here is what lands the new page at the top.
        navigatingRef.current = false;
      } else {
        // Closing back onto the same page: return to the exact spot. Instant,
        // because the global `scroll-behavior: smooth` would otherwise animate
        // this and the animation can outlive a later navigation.
        window.scrollTo({ top: scrollY, left: 0, behavior: "instant" });
      }
    };
  }, [open]);

  function openOffer() {
    setOpen(false);
    window.dispatchEvent(new CustomEvent("pc:open-offer"));
  }

  /* THE MENU HOLDS UNTIL THE NEW PAGE IS READY.

     It used to close on the tap. The page being left was then revealed, whole
     and interactive, for as long as the next one took to arrive, so the reader
     believed they had arrived, started using the wrong page, and had it swap
     under them a few seconds later.

     Now the tap is taken here instead of by the link: the navigation runs as a
     transition and the menu stays up, marked as working, until React has the
     new page. Nothing is revealed until there is something to reveal. */
  const [pending, startTransition] = useTransition();
  const goingToRef = useRef(false);
  const navTo = (href: string) => {
    navigatingRef.current = true;
    goingToRef.current = true;
    startTransition(() => { router.push(href); });
  };
  /* The transition finishing is the only signal that the page is ready, and it
     arrives as a prop change rather than a callback, so this has to watch it.
     It closes once per navigation, guarded by the ref. */
  useEffect(() => {
    if (!pending && goingToRef.current) {
      goingToRef.current = false;
      setOpen(false);
    }
  }, [pending]);
  /* One handler for the whole overlay, the same shape as the prefetch above.
     Anything that is a plain internal link is taken over; modified clicks and
     new-tab gestures are left to the browser. */
  const onOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const t = e.target as HTMLElement | null;
    const a = t && t.closest ? (t.closest("a[href]") as HTMLAnchorElement | null) : null;
    if (!a) return;
    const href = a.getAttribute("href") || "";
    if (!href.startsWith("/") || a.target === "_blank") return;
    e.preventDefault();
    navTo(href);
  };
  // Kept for the few controls that are not links and close the menu themselves.
  const closeForNav = () => { navigatingRef.current = true; setOpen(false); };

  return (
    <header className={`pc-nav ${styles.bar} ${dockBottomLeft ? styles.barDock : ""} ${scrolled ? styles.scrolled : ""} ${showLogo ? styles.showLogo : ""}`} data-pc-logo={logoShowing ? "true" : "false"}>
      {/* Header contents hide while the menu is open -- no logo, no hamburger. */}
      {!open && !hideLogo && (
        <Link href="/" className={styles.logo} aria-label="Pedigree Chums™ home">
          <Image src="/dogbingo.svg" alt="Pedigree Chums™" width={150} height={64} priority />
        </Link>
      )}
      {!open && !dockBottomLeft && (
        <button type="button" className={styles.burger} onClick={() => setOpen(true)} aria-label="Open menu">
          <span />
          <span />
          <span />
        </button>
      )}

      {open && (
        <div
          className={`${styles.overlay} ${!tradeLinks ? styles.overlayScroll : ""}`}
          role="dialog"
          aria-modal="true"
          onPointerDown={onIntent}
          onPointerOver={onIntent}
          onClick={onOverlayClick}
        >
          {/* Working. The menu stays readable underneath rather than being
              covered, so it is clear the tap landed and nothing has moved yet. */}
          {pending && (
            <div className={styles.navBusy} aria-live="polite">
              <span className={styles.navBusyDots} aria-hidden="true">
                <span /><span /><span />
              </span>
            </div>
          )}
          {tradeLinks ? (
            <button type="button" className={styles.close} onClick={() => setOpen(false)} aria-label="Close menu">{"×"}</button>
          ) : (
            <>
              <button type="button" className={styles.backLink} onClick={() => setOpen(false)}>
                <span className={`${styles.backArrow} ${backFont.className}`} aria-hidden>←</span>
                <span className={styles.backText}>Back to page</span>
              </button>
              <nav className={styles.topNav} aria-label="Site links">
                <Link href="/home" className={styles.topNavLink} onClick={closeForNav}>Home</Link>
                <span className={styles.topNavSep}>|</span>
                <Link href="/about" className={styles.topNavLink} onClick={closeForNav}>About</Link>
                <span className={styles.topNavSep}>|</span>
                <Link href="/preorder" className={styles.topNavLink} onClick={closeForNav}>Pre-order</Link>
                <a href="https://www.instagram.com" target="_blank" rel="noreferrer" className={styles.socialIcon} aria-label="Instagram">
                  <svg viewBox="440 0 261 341" fill="currentColor" aria-hidden="true">
                    <path d="M476.4,15.5v15.2h146.5c9.2,0,17.9,1.9,25.9,5.2,11.9,5,22.1,13.5,29.2,24.1,7.2,10.6,11.3,23.3,11.3,37.1v146.5c0,9.2-1.8,17.9-5.2,25.9-5,11.9-13.5,22.1-24.1,29.2-10.6,7.2-23.3,11.3-37.1,11.4h-146.5c-9.2,0-17.9-1.9-25.9-5.2-11.9-5-22.1-13.5-29.2-24.1-7.2-10.6-11.4-23.3-11.4-37.1V97.2c0-9.2,1.9-17.9,5.2-25.9,5-11.9,13.5-22.1,24.1-29.2,10.6-7.2,23.3-11.3,37.1-11.4V.4c-13.3,0-26.1,2.7-37.7,7.6-17.4,7.4-32.1,19.6-42.6,35.1-10.4,15.4-16.6,34.1-16.6,54.1v146.5c0,13.3,2.7,26.1,7.6,37.7,7.4,17.4,19.6,32.1,35.1,42.6,15.4,10.4,34.1,16.6,54.1,16.5h146.5c13.3,0,26.1-2.7,37.7-7.6,17.4-7.4,32.2-19.6,42.6-35,10.4-15.4,16.5-34.1,16.5-54.1V97.2c0-13.3-2.7-26.1-7.6-37.7-7.4-17.4-19.6-32.1-35-42.6-15.4-10.4-34.1-16.6-54.1-16.5h-146.5v15.2Z"/>
                    <path d="M549.6,98.2v15.2c7.9,0,15.4,1.6,22.2,4.5,10.2,4.3,18.9,11.6,25.1,20.7,3.1,4.5,5.5,9.6,7.2,14.9,1.7,5.3,2.6,11,2.6,17s-1.6,15.4-4.5,22.2c-4.3,10.2-11.6,18.9-20.7,25.1-4.5,3.1-9.6,5.5-14.9,7.2-5.3,1.7-11,2.6-17,2.6s-15.4-1.6-22.2-4.5c-10.2-4.3-18.9-11.6-25.1-20.7-3.1-4.5-5.5-9.6-7.2-14.9-1.7-5.3-2.6-11-2.6-17s1.6-15.4,4.5-22.2c4.3-10.2,11.6-18.9,20.7-25.1,4.5-3.1,9.6-5.5,14.9-7.2,5.3-1.7,11-2.6,17-2.6v-30.3c-12,0-23.6,2.4-34,6.9-15.7,6.6-29,17.7-38.4,31.7-9.4,13.9-15,30.8-14.9,48.9,0,12,2.4,23.6,6.9,34,6.6,15.7,17.7,29,31.7,38.4,13.9,9.4,30.8,15,48.9,15s23.6-2.5,34-6.9c15.7-6.6,29-17.7,38.4-31.6,9.4-13.9,15-30.8,14.9-48.9,0-12-2.4-23.6-6.9-34-6.6-15.7-17.7-29-31.7-38.4-13.9-9.4-30.8-15-48.9-14.9v15.2Z"/>
                    <path d="M640.7,59.5c11,0,19.9,8.9,19.9,19.9s-8.9,19.9-19.9,19.9-19.9-8.9-19.9-19.9,8.9-19.9,19.9-19.9"/>
                  </svg>
                </a>
                <a href="https://www.tiktok.com/@pedigree_chums" target="_blank" rel="noreferrer" className={styles.socialIcon} aria-label="TikTok">
                  <svg viewBox="0 0 285 341" fill="currentColor" aria-hidden="true">
                    <path d="M239.9,76.8c-21.8-14.3-35-38.6-35-64.8h-55.3v222.6c-1.1,25.7-22.7,45.8-48.3,44.8-25.6-1-45.7-22.7-44.6-48.4.9-25.1,21.5-44.9,46.4-44.9s9.3.8,13.7,2.2v-56.7c-4.6-.7-9.1-1-13.7-1C47,130.6,1.3,176.4,1.3,232.8c.1,56.4,45.6,102.2,101.8,102.2,56.1,0,101.8-45.8,101.8-102.2v-112.8c22.4,16.2,49.3,24.9,76.9,24.9v-55.5c-14.9,0-29.5-4.3-41.9-12.5"/>
                  </svg>
                </a>
              </nav>
            </>
          )}

          {tradeLinks ? (
            <nav className={styles.menu}>
              {tradeNavLinks.map((l) => (
                <Link key={l.href} href={l.href} className={styles.menuLink} onClick={closeForNav}>{l.label}</Link>
              ))}
              <Link href="/preorder" className={styles.menuLink} onClick={closeForNav}>Get pre-order discount code</Link>
            </nav>
          ) : (
            <BentoBoard onNavigate={closeForNav} onOffer={openOffer} animateIn />
          )}
        </div>
      )}
    </header>
  );
}
