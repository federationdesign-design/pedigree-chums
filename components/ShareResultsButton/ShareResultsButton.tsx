"use client";

// Shared Share-results button for both Chum Calculator end screens (the direct
// reveal and the knockout result). Native navigator.share of the breed names + a
// link, clipboard fallback on desktop. Extracted from ChumKnockout so the two
// screens don't duplicate it. (Job B stage 6, 24 Aug 2026.)

type Props = {
  names: string[];
  className?: string;
};

export default function ShareResultsButton({ names, className }: Props) {
  async function share() {
    if (typeof navigator === "undefined") return;
    const text = `My Pedigree Chums result${names.length !== 1 ? "s" : ""}: ${names.join(", ")}`;
    const url = typeof window !== "undefined" ? `${window.location.origin}/chum-calculator` : "";
    try {
      if (navigator.share) await navigator.share({ title: "Pedigree Chums", text, url });
      else if (navigator.clipboard) await navigator.clipboard.writeText(`${text} ${url}`.trim());
    } catch {
      // share cancelled or unsupported; nothing to do
    }
  }

  return (
    <button type="button" className={className} onClick={share}>
      Share results
    </button>
  );
}
