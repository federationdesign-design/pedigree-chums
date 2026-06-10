"use client";

import Script from "next/script";

// Elfsight Social Feed (TikTok). The platform script renders any element whose
// class matches the widget id; we load it lazily so it never blocks the page.
const WIDGET_CLASS = "elfsight-app-6dff44a8-19a0-424f-8678-e40302734501";

export default function SocialFeed() {
  return (
    <>
      <Script
        src="https://elfsightcdn.com/platform.js"
        strategy="lazyOnload"
      />
      <div className={WIDGET_CLASS} data-elfsight-app-lazy />
    </>
  );
}
