'use client';

// Global Pick a Chum launcher. Mounted once in the root layout, so it appears on
// every page. Deliberately lightweight: this file imports only the icon and the
// CSS module. The heavy conversation experience (engine + all the data records)
// is code-split behind next/dynamic and only downloaded when the visitor opens
// the launcher, so no page pays a bundle cost for a chatbot it never opens.

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import styles from './PickAChum.module.css';
import PickAChumIcon from './PickAChumIcon';
// DEV-RECORDER (strip for production): preview-only conversation recorder. It is
// inert on production hosts anyway (see lib/turn-tap.ts recorderEnabled).
import DevRecorder from '../dev/DevRecorder';

const PickAChumExperience = dynamic(() => import('./PickAChumExperience'), { ssr: false });

// Task 84: the launcher icon plays a one-shot four-frame "shout" when it appears, then rests on
// full. Placeholders all point at the current icon; swap each filename to the real variant (marks at
// full, mid, minimal, none). Frame 0 (full) is the resting state; the cycle holds 0.2s per frame.
const ICON_FRAMES = [
  '/shout-launcher-icon.svg', // 0 full (resting)
  '/shout-launcher-icon.svg', // 1 mid
  '/shout-launcher-icon.svg', // 2 minimal
  '/shout-launcher-icon.svg', // 3 none
];
const FRAME_MS = 200;

export default function PickAChumLauncher() {
  const [open, setOpen] = useState(false);
  const [frame, setFrame] = useState(0); // Task 84: current icon frame index
  // Whether the Pedigree Chums logo is currently showing. The launcher anchors to
  // the logo (top-left), so it only appears when the logo does. The Nav owns this
  // state and publishes it as data-pc-logo on its header; we watch that attribute
  // rather than re-deriving it from scroll.
  const [logoShowing, setLogoShowing] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const wasOpen = useRef(false);

  // Restore focus to the launcher when the experience closes.
  useEffect(() => {
    if (wasOpen.current && !open) buttonRef.current?.focus();
    wasOpen.current = open;
  }, [open]);

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

  // Task 84: one-shot four-frame rattle each time the launcher appears, then settle on full (frame
  // 0). Skipped entirely under prefers-reduced-motion (a four-frame rattle reads as a bark; it rests
  // on full instead). Cleared if the launcher hides mid-cycle.
  useEffect(() => {
    if (!logoShowing) {
      setFrame(0);
      return;
    }
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setFrame(0);
      return;
    }
    let i = 0;
    setFrame(0);
    const id = window.setInterval(() => {
      i += 1;
      if (i >= ICON_FRAMES.length) {
        setFrame(0); // settle on full
        window.clearInterval(id);
      } else {
        setFrame(i);
      }
    }, FRAME_MS);
    return () => window.clearInterval(id);
  }, [logoShowing]);

  return (
    <>
      {open ? (
        <PickAChumExperience onClose={() => setOpen(false)} />
      ) : (
        <button
          ref={buttonRef}
          type="button"
          className={`${styles.launcher} ${logoShowing ? styles.launcherOn : ''}`}
          aria-label="Pick a Chum"
          onClick={() => setOpen(true)}
        >
          <PickAChumIcon src={ICON_FRAMES[frame]} />
        </button>
      )}
      {/* DEV-RECORDER (strip for production): renders null on production hosts. */}
      <DevRecorder />
    </>
  );
}
