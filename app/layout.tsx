import type { Metadata } from "next";
import { Luckiest_Guy, Montserrat } from "next/font/google";
import "./globals.css";

const display = Luckiest_Guy({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

const body = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pedigree Chums | The Dog Bingo Game",
  description:
    "The ultimate on-the-go dog spotting game. 54 hand-illustrated breed cards. Fun, educational and addictive, perfect for families, tourists and dog lovers.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
