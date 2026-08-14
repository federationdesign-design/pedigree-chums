'use client';

// Task 156: the dog-birthday fact image on /britains-dog-history carries the ELEVENTH (bonus) hat.
// Clicking it finds it. Only that one image is a hat; every other fact image renders exactly as before.
// reportHat carries the protected guard itself, so there is nothing to gate here.

import Image from 'next/image';
import { reportHat } from '../../lib/hiddenGames/browserEngine';
import { BRITAIN_HISTORY_HAT_ID } from '../../lib/hiddenGames/hatHunt';

const HAT_SRC = '/history/dog-birthday.jpg';

export default function FactHatImage({ src, alt, width, height }: { src: string; alt?: string; width: number; height: number }) {
  const isHat = src === HAT_SRC;
  return (
    <Image
      src={src}
      alt={alt || ""}
      width={width}
      height={height}
      unoptimized
      onClick={isHat ? () => reportHat(BRITAIN_HISTORY_HAT_ID) : undefined}
    />
  );
}
