"use client";

import { useEffect, useRef, useState } from "react";

/*
  One word, scaled to fill the width it is given.

  WHY SVG. CSS cannot size text to fit a box: `font-size` is a number you
  supply, not one the browser derives. Drawing the word into an SVG whose
  viewBox is the word's own bounding box means `width: 100%` scales the glyphs
  to the container exactly, at any screen size, with no distortion. The
  alternative, `textLength`, stretches the letterforms rather than scaling
  them, which is not the same thing and looks wrong in a display face.

  THE TRAP THIS HANDLES: `getBBox` measured before the webfont has loaded
  returns the FALLBACK font's metrics, so the viewBox is cut to the wrong
  shape and the word renders at the wrong size for good. Luckiest Guy arrives
  from Google at runtime, so the first measurement is almost always the wrong
  one. It re-measures on `document.fonts.ready`, which is the only reliable
  signal that the real face is in.
*/
export default function FitWord({ text, className }: { text: string; className?: string }) {
  const textRef = useRef<SVGTextElement | null>(null);
  const [box, setBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    let live = true;

    const measure = () => {
      if (!live || !textRef.current) return;
      const b = textRef.current.getBBox();
      if (b.width > 0 && b.height > 0) {
        setBox({ x: b.x, y: b.y, w: b.width, h: b.height });
      }
    };

    measure();
    // Re-measure once the real face has landed. Without this the word keeps
    // the fallback font's proportions.
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    if (fonts && fonts.ready) fonts.ready.then(measure).catch(() => {});

    return () => {
      live = false;
    };
  }, [text]);

  return (
    <svg
      className={className}
      viewBox={box ? `${box.x} ${box.y} ${box.w} ${box.h}` : "0 0 100 100"}
      // Hidden until measured, so the fallback font is never seen at the wrong
      // size. It reveals on the same frame the viewBox is set.
      style={{ visibility: box ? "visible" : "hidden" }}
      role="img"
      aria-label={text}
    >
      {/* 100 is an arbitrary measuring size. The viewBox does the scaling, so
          the number never reaches the screen. */}
      <text ref={textRef} x="0" y="0" fontSize="100" dominantBaseline="text-before-edge">
        {text}
      </text>
    </svg>
  );
}
