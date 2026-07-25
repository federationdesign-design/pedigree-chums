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

export default function PickAChumLauncher() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const wasOpen = useRef(false);

  // Restore focus to the launcher when the experience closes.
  useEffect(() => {
    if (wasOpen.current && !open) buttonRef.current?.focus();
    wasOpen.current = open;
  }, [open]);

  return (
    <>
      {open ? (
        <PickAChumExperience onClose={() => setOpen(false)} />
      ) : (
        <button
          ref={buttonRef}
          type="button"
          className={styles.launcher}
          aria-label="Pick a Chum"
          onClick={() => setOpen(true)}
        >
          <PickAChumIcon />
        </button>
      )}
      {/* DEV-RECORDER (strip for production): renders null on production hosts. */}
      <DevRecorder />
    </>
  );
}
