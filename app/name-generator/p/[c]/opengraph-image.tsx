import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { decodeSharedPodium, type PodiumEntry } from "../../shareLink";
import { podiumArtFor } from "../../podiumArt";
import { SITE_URL } from "../../../../lib/site";

/* NG-SHARE-2, 31 Aug 2026. The social card for a shared podium.

   REWRITTEN. The first version laid the names out as plain text on a gradient.
   Steve wants what the app itself produces: the real podium artwork with the
   names burned onto the placards, the same picture the knockout screen draws.

   So this mirrors KnockoutRound's canvas. That canvas draws the podium jpg at
   its natural 1254x1006 and places three placards at fixed coordinates,
   KnockoutRound.tsx line 517:

     1st  centre (627, 527)  nick 72px  full 32px  rotate  5deg  maxW 460
     2nd  left   (270, 754)  nick 44px  full 20px  rotate -6deg  maxW 270
     3rd  right  (983, 779)  nick 40px  full 18px  rotate -5deg  maxW 270

   Those numbers are duplicated here on purpose rather than shared: the canvas
   version runs in the browser against a live ctx.measureText, this one runs on
   the server with no canvas at all. If the artwork is ever re-cut, BOTH need
   updating.

   Fitting 1254x1006 (1.25:1) into 1200x630 (1.91:1): the image is drawn at full
   width and the overflow is clipped equally top and bottom. That loses 333px of
   the 963 scaled height, but all three placards sit between y=527 and y=779 in
   source coordinates, well inside the kept band of 174 to 832, so nothing that
   carries a name is cut. Letterboxing instead would waste 415px of a 1200px card.

   Satori renders this. Flexbox only, every multi-child div needs an explicit
   display:flex, and there is no ctx.measureText, so the shrink-to-fit below is
   an estimate from character count rather than a measurement. */

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "A dog name podium from Pedigree Chums";

const SRC_W = 1254;
const SRC_H = 1006;
const SCALE = size.width / SRC_W;                    // 0.957
const OFFSET_Y = (SRC_H * SCALE - size.height) / 2;  // 166.5, clipped top and bottom

// Placard geometry, mirroring KnockoutRound.tsx line 517.
const PLACARDS = [
  { x: 627, y: 527, nick: 72, full: 32, rot: 5, maxW: 460 },
  { x: 270, y: 754, nick: 44, full: 20, rot: -6, maxW: 270 },
  { x: 983, y: 779, nick: 40, full: 18, rot: -5, maxW: 270 },
];

// Satori cannot measure text, so approximate. Luckiest Guy is a wide display
// face, Montserrat Bold narrower. These ratios are chosen to under-run rather
// than over-run: a name slightly too small looks fine, one that overflows the
// placard does not.
function fit(text: string, start: number, maxW: number, perChar: number, floor: number) {
  let s = start;
  while (text.length * s * perChar > maxW && s > floor) s -= 1;
  return s;
}

export default async function Image({ params }: { params: Promise<{ c: string }> }) {
  const { c } = await params;
  const data = decodeSharedPodium(c);

  const [display, body] = await Promise.all([
    readFile(join(process.cwd(), "public/fonts/LuckiestGuy-Regular.ttf")),
    readFile(join(process.cwd(), "public/fonts/Montserrat-Bold.ttf")),
  ]);
  const fonts = [
    { name: "Luckiest Guy", data: display, style: "normal" as const, weight: 400 as const },
    { name: "Montserrat", data: body, style: "normal" as const, weight: 700 as const },
  ];

  /* The podium art is fetched over HTTP, not read from disk. This looks like the
     long way round, and it is deliberate.

     The first version did `readFile(join(process.cwd(), "public", artPath))`.
     Because artPath is computed at runtime, Next's file tracer cannot tell which
     file is needed, so it bundles the whole of public/ into the function. That is
     293MB, and the build failed on Vercel's 250MB uncompressed limit:

       "The Vercel Function name-generator/p/[c]/opengraph-image is 328.01mb
        uncompressed which exceeds the maximum uncompressed size limit of 250mb."

     Vercel's own suggestion is to set VERCEL_SUPPORT_LARGE_FUNCTIONS=1. Do NOT.
     That ships a 328MB function to serve one 100KB jpg, with the cold start to
     match. Fetching the image instead keeps the function tiny.

     The two font reads above stay on disk on purpose: their paths are string
     literals, so the tracer includes exactly those two files and nothing else.
     Never make a path in this file dynamic against process.cwd().

     Same fallback as the canvas: /name-podium.jpg covers the breeds with no art,
     currently Weimaraner, Dalmatian and Poodle. */
  const artPath = (data?.b && podiumArtFor(data.b)) || "/name-podium.jpg";
  // SITE_URL from lib/site, the one place the base URL is decided. The first
  // version reimplemented the fallback chain here and fell through to VERCEL_URL,
  // which is SSO-protected, so the fetch returned a login page and the card
  // rendered half drawn. Do not reintroduce a local copy of this.
  const artUrl = `${SITE_URL.replace(/\/$/, "")}${artPath}`;

  const places: PodiumEntry[] = data?.places ?? [];

  return new ImageResponse(
    (
      <div
        style={{
          width: size.width,
          height: size.height,
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: "#0b78bd",
        }}
      >
        {artUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={artUrl}
            alt=""
            width={size.width}
            height={Math.round(SRC_H * SCALE)}
            style={{ position: "absolute", left: 0, top: -OFFSET_Y }}
          />
        ) : null}

        {places.slice(0, 3).map((p: PodiumEntry, i: number) => {
          const g = PLACARDS[i];
          const nickname = p.k || p.f;
          const fullName = p.f && p.f !== nickname ? p.f : "";
          const maxW = g.maxW * SCALE;
          const ns = fit(nickname, g.nick * SCALE, maxW, 0.55, 22);
          const fs = fullName ? fit(fullName, g.full * SCALE, maxW, 0.52, 13) : 0;
          return (
            <div
              key={p.f + i}
              style={{
                position: "absolute",
                left: g.x * SCALE - maxW / 2,
                top: g.y * SCALE - OFFSET_Y - (g.nick * SCALE) / 2 - (fullName ? fs : 0),
                width: maxW,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                transform: `rotate(${g.rot}deg)`,
                color: "#0a3a57",
              }}
            >
              <div style={{ display: "flex", fontFamily: "Luckiest Guy", fontSize: ns, lineHeight: 1 }}>
                {nickname}
              </div>
              {fullName ? (
                <div style={{ display: "flex", fontFamily: "Montserrat", fontSize: fs, lineHeight: 1.2, marginTop: ns * 0.22, textAlign: "center" }}>
                  {fullName}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    ),
    { ...size, fonts }
  );
}
