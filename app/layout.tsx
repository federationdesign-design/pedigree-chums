import type { Metadata } from "next";
import { Dela_Gothic_One, Luckiest_Guy, Montserrat, Open_Sans, Press_Start_2P } from "next/font/google";
import localFont from "next/font/local";
import CookieBanner from "../components/CookieBanner/CookieBanner";
import Analytics from "../components/Analytics/Analytics";
import OfferLauncher from "../components/Offer/OfferLauncher";
import "./globals.css";

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

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://pedigree-chums.vercel.app";

const TITLE = "Pedigree Chums™ | The Dog Bingo Game";
const DESCRIPTION =
  "The ultimate on-the-go dog spotting game. 54 uniquely-illustrated breed cards. Fun, educational and addictive, perfect for families, tourists and dog lovers.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
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
    <html lang="en" className={`${display.variable} ${body.variable} ${pct.variable} ${stackNotch.variable} ${score.variable} ${arrowFont.variable}`}>
      <body>
        {children}
        <OfferLauncher />
        <CookieBanner />
        <Analytics />
      </body>
    </html>
  );
}
