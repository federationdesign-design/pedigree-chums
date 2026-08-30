import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { decodeSharedPodium, type PodiumEntry } from "../../shareLink";

/* NG-SHARE-2, 30 Aug 2026. The social card for a shared podium.

   Built at 1200x630, the ratio Facebook and LinkedIn crop to, so nothing is cut.
   Composed here rather than reusing the podium artwork, which is 1254x1006 and
   would lose 349px off its height to the crop.

   Fonts are read off disk, not fetched. ImageResponse cannot use next/font, and
   a runtime fetch to fonts.gstatic.com is exactly what NG-FONT-1 removed from the
   two share canvases. Same .ttf files, one copy for everything.

   Satori, which renders this, supports a subset of CSS: flexbox only, every div
   with more than one child needs an explicit display:flex, and there is no
   text-shadow. Keep the layout plain. */

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "A dog name podium from Pedigree Chums";

const MEDALS = ["1st", "2nd", "3rd"];

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

  if (!data) {
    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(to top right, #00e2ff, #008eff)" }}>
          <div style={{ fontFamily: "Luckiest Guy", fontSize: 78, color: "#ffffff" }}>Pedigree Chums</div>
        </div>
      ),
      { ...size, fonts }
    );
  }

  const first = data.places[0];
  const rest = data.places.slice(1);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "48px 64px",
          background: "linear-gradient(to top right, #00e2ff, #008eff)",
        }}
      >
        <div style={{ display: "flex", fontFamily: "Montserrat", fontSize: 26, letterSpacing: 4, color: "#0a3a57", marginBottom: 18 }}>
          {(data.b ? `${data.b.toUpperCase()} ` : "") + "NAME KNOCKOUT WINNER"}
        </div>

        <div style={{ display: "flex", fontFamily: "Luckiest Guy", fontSize: first.k && first.k.length <= 14 ? 128 : 88, color: "#ffffff", lineHeight: 1 }}>
          {first.k || first.f}
        </div>

        {first.k ? (
          <div style={{ display: "flex", fontFamily: "Montserrat", fontSize: 34, color: "#0a3a57", marginTop: 14 }}>
            {first.f}
          </div>
        ) : null}

        {rest.length > 0 ? (
          <div style={{ display: "flex", marginTop: 40, gap: 56 }}>
            {rest.map((p: PodiumEntry, i: number) => (
              <div key={p.f + i} style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", fontFamily: "Montserrat", fontSize: 20, letterSpacing: 3, color: "#0a3a57", opacity: 0.8 }}>
                  {MEDALS[i + 1]}
                </div>
                <div style={{ display: "flex", fontFamily: "Luckiest Guy", fontSize: 44, color: "#ffffff", marginTop: 6 }}>
                  {p.k || p.f}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <div style={{ display: "flex", position: "absolute", right: 64, bottom: 44, fontFamily: "Luckiest Guy", fontSize: 30, color: "#ffed00" }}>
          pedigreechums.co.uk
        </div>
      </div>
    ),
    { ...size, fonts }
  );
}
