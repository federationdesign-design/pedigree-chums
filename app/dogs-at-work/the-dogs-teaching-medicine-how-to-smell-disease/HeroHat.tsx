'use client';

// Task 156 (§4): the essay's hero image carries one of the ten hidden hats. Clicking it finds it. A thin
// client island so the otherwise-server essay page stays server-rendered. reportHat carries the protected
// guard itself (a disclosed session never advances the hunt), so there is nothing to gate here.

import { reportHat } from '../../../lib/hiddenGames/browserEngine';
import { ESSAY_HAT_ID } from '../../../lib/hiddenGames/hatHunt';

export default function HeroHat({ className }: { className?: string }) {
  return (
    <img
      src="/Bumper-and-peatnut.jpg"
      alt="Bumper and Peanut, the Parkinson's bio-detection dogs"
      className={className}
      onClick={() => reportHat(ESSAY_HAT_ID)}
    />
  );
}
