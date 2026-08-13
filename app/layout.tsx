import type { Metadata } from "next";
import { Dela_Gothic_One, Luckiest_Guy, Montserrat, Open_Sans, Press_Start_2P, Unica_One } from "next/font/google";
import localFont from "next/font/local";
import CookieBanner from "../components/CookieBanner/CookieBanner";
import Analytics from "../components/Analytics/Analytics";
import OfferLauncher from "../components/Offer/OfferLauncher";
import HiddenGamesCounter from "../components/HiddenGamesCounter/HiddenGamesCounter";
import HideImages from "../components/HideImages/HideImages";
import HiddenGamesToast from "../components/HiddenGamesToast/HiddenGamesToast";
import PickAChumLauncher from "./pick-a-chum/ui/PickAChumLauncher";
import "./globals.css";
// Task 6: the one scheme-override file. Global by necessity (it targets hashed
// module classes across components). All rules are scoped under
// :root[data-pc-contrast-scheme], so it is inert in the default view.
import "./contrast-schemes.css";

const display = Luckiest_Guy({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

// Dela Gothic One supplies chunky arrow glyphs (from its Japanese set) for UI arrows.
const arrowFont = Dela_Gothic_One({
  // no subsets declared -> all available subsets included; the arrow glyph
  // (U+2190) lives in the Japanese slices, which the latin subset excludes
  weight: "400",
  variable: "--font-arrow",
  display: "swap",
  preload: false,
});

const body = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-body",
  display: "swap",
});

// Open Sans drives the small percentage figures (pit circles and the breed-tree shares).
const stackNotch = localFont({
  src: "../public/fonts/StackSansNotch-Bold.ttf",
  variable: "--font-stack-notch",
  display: "swap",
});

const pct = Open_Sans({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-pct",
  display: "swap",
});

// Press Start 2P is the arcade pixel face used for the running score.
const score = Press_Start_2P({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-score",
  display: "swap",
});

// Unica One (Eduardo Tunni) is used for the "Warning:" line of the Hidden Games
// prelude card (C03).
const unica = Unica_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-unica",
  display: "swap",
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://pedigree-chums.vercel.app";

const TITLE = "Pedigree Chums™ | The Dog Bingo Game";
// Every page's <title> is page-name first, then this identical site suffix, per
// WCAG 2.4.2 (Page Titled): each route must be uniquely and descriptively named.
// The suffix lives here once as a template so it cannot drift; child pages set
// only their own name (title: "About") and Next composes "About | <suffix>". The
// template applies to child segments only, so the root page.tsx below keeps the
// brand default unchanged.
const TITLE_TEMPLATE = "%s | Pedigree Chums™ The Dog Bingo Game";
const DESCRIPTION =
  "The ultimate on-the-go dog spotting game. 54 uniquely-illustrated breed cards. Fun, educational and addictive, perfect for families, tourists and dog lovers.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: TITLE_TEMPLATE,
  },
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "Pedigree Chums™",
    locale: "en_GB",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Pedigree Chums™ - The Dog Bingo Game",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${pct.variable} ${stackNotch.variable} ${score.variable} ${arrowFont.variable} ${unica.variable}`}>
      <body>
        {/* Before first paint: mirror the stored contrast scheme onto <html> so
            a returning scheme user never sees a flash of the default view (brief
            v5, task 5). Built with string concatenation, NOT a template literal:
            backticks inside an inline script have broken this build before. Keep
            the key, attribute name and values in sync with lib/contrastScheme.ts. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{" +
              "var v=window.localStorage.getItem('pc-contrast-scheme');" +
              "if(v==='black-on-white'||v==='white-on-black'){" +
              "document.documentElement.setAttribute('data-pc-contrast-scheme',v);" +
              "}" +
              "if(window.localStorage.getItem('pc-hide-images')==='1'){" +
              "document.documentElement.setAttribute('data-pc-hide-images','');" +
              "}}catch(e){}})();",
          }}
        />
        {/* Task 164: the SITE layer. The page content is wrapped so the Boxer's DO NOT PRESS THAT BUTTON
            effects (a brightness filter, a nav fade) can act on the whole site WITHOUT touching the chat:
            the Pick a Chum overlay is a SIBLING of #pc-site below, at a higher stacking level, so it stays
            bright and clickable while an effect runs. A CSS filter cannot be escaped by a descendant, which
            is why the chat must sit outside this wrapper (brief section 7.1). The body gradient and paw
            pattern live on <body>, outside #pc-site, so they stay bright under "lights out" (dim, not black). */}
        <div id="pc-site">{children}</div>
        {/* Task 7: draws the alt-text blocks when data-pc-hide-images is set. */}
        <HideImages />
        <PickAChumLauncher />
        <OfferLauncher />
        {/* Hidden Games Stage 1 counter. Owner-approved layout mount, 28 Jul
            2026 (BRIEF 6.1, NEEDS_OWNER Q01). */}
        <HiddenGamesCounter />
        {/* Discovery toast (C02): confirms each non-final find, above the mini
            pit modal so a G02 find is visible. */}
        <HiddenGamesToast />
        {/* G01 awards on the first pointer interaction with the Main Pit
            (CHANGE-LIST C01), wired inside PackPit. RouteWatcher was removed
            (NEEDS_OWNER Q06). */}
        <CookieBanner />
        <Analytics />
      </body>
    </html>
  );
}
