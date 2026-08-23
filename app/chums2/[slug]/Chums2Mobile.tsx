"use client";

import { useCallback, useState } from "react";
import styles from "./chums2mobile.module.css";
import type { LineageNode } from "../../../data/lineage";
import { breedInfo } from "../../../data/breedInfo";
import BreedTreeMap, { type FrameNode } from "../../../components/BreedTreeMap/BreedTreeMap";
import FamousDogsSection from "../../../components/FamousDogsSection/FamousDogsSection";
import famousDogs from "../../../data/famousDogs";
import TileZoom from "../../../components/TileZoom/TileZoom";

type BreedInfo = { subtitle: string; temperament: string[]; pros: string[]; cons: string[] };

type Props = {
  name: string;
  slug: string;
  image: string;
  info: BreedInfo;
  lineage: LineageNode | null;
  character: string;
};

// /chums2 MOBILE v1 section flags. Stage 1: the header, the blue intro box, the ancestor
// pack and famous chums are ON; the intro-box SLOT swap, the bottom icon RAIL, the LIFESPAN
// chart and the rail CARDS are OFF behind their flags until their stages land. The circular
// diagram and the family tree are OMITTED from mobile v1 entirely (no icons, not mounted).
const MOBILE_SECTIONS = {
  header: true,
  introBox: true,
  ancestorPack: true,
  famousChums: true,
  slot: false,          // rail-icon card content REPLACES the intro-box slot
  rail: false,          // bottom two-row icon rail (fixed to the viewport bottom)
  lifespanChart: false, // lifted from BreedMobile's .lifespanScroll
  cards: false,         // shared card components (HealthSection, ExerciseCard, ...) in the slot
};

// Duplicated (NOT shared) from the desktop client so the desktop stays byte-identical: the
// intro-box write-up alias and the small %-popout helpers. Data-only, trivial.
const INTRO_ALIASES: Record<string, string> = {
  "Corgi": "Pembroke Welsh Corgi",
  "West Highland Terrier": "West Highland White Terrier",
  "German Shepherd": "German Shepherd Dog",
  "Dachshund": "Teckel (Dachshund) family",
  "Springer Spaniel": "English Springer Spaniel",
  "Labrador": "Labrador Retriever",
};
const PCT_TITLES = [
  "Our best guess, not hard science.",
  "An educated guess, not gospel.",
  "Informed estimate, not exact science.",
  "Our reckoning, not the final word.",
  "A considered guess, not cold fact.",
  "Best judgement, not laboratory proof.",
  "Our read on it, not a certainty.",
  "A fair estimate, not a fixed figure.",
  "Studied guesswork, not hard data.",
  "Our interpretation, not established fact.",
];
const genLabel = (d: number) =>
  d <= 0 ? "the breed itself" : d === 1 ? "parent" : d === 2 ? "grandparent" : `${"great-".repeat(d - 2)}grandparent`;
const pctTxt = (v: number) => (v < 1 ? "<1%" : `${Math.round(v)}%`);
const pctTitleFor = (id: string) =>
  PCT_TITLES[Math.abs([...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7)) % PCT_TITLES.length];

// ── Mobile component ─────────────────────────────────────────────────────────
// Stage 1: header + default in-flow view (intro box, ancestor pack with tap popouts,
// famous chums). Shares the same DATA as the desktop client, never its layout.
export default function Chums2Mobile({ name, slug, image, info, lineage }: Props) {
  // The intro box shows the breed write-up (data/breedInfo.ts, via the alias). No "tap a
  // circle" prompt on mobile: the diagram is omitted, so there is nothing to tap.
  const introText = breedInfo[INTRO_ALIASES[name] ?? name] ?? "";

  // Ancestor pack, fed by a hidden BreedTreeMap exactly as the desktop client (D24/D60).
  const [frames, setFrames] = useState<FrameNode[]>([]);
  const handleFramesReady = useCallback((nodes: FrameNode[]) => {
    setFrames((prev) => {
      if (prev.length > 0) return prev;
      const seen = new Set<string>();
      return nodes.filter((n) => (seen.has(n.id) ? false : (seen.add(n.id), true)));
    });
  }, []);

  // One tap popout at a time: the enlarged image, the % card, or the i info card. Tapping
  // outside closes the i/% cards (their trigger/body stop propagation); the image self-
  // closes the mini pit's way. Same shape/data as desktop.
  const [openPop, setOpenPop] = useState<{ id: string; kind: "info" | "pct" | "image"; anchor?: { x: number; y: number; size: number } } | null>(null);

  const frameBorder = (status?: FrameNode["status"]) =>
    status === "extinct" ? "#ef4444" : status === "endangered" || status === "in-decline" ? "#f97316" : "#22c55e";

  // Oldest-first, matching desktop (uk-breeds anchor; no-anchor last).
  const orderedFrames = [...frames].sort((a, b) => {
    if (a.anchor == null && b.anchor == null) return 0;
    if (a.anchor == null) return 1;
    if (b.anchor == null) return -1;
    return a.anchor - b.anchor;
  });

  return (
    <div className={styles.page}>
      {/* Header: chum square on top, wrapped title below, subtitle under it. Centred,
          scaled to phone width. (Proposal - Steve to judge on screen: 96px square,
          20px lead / 30px name.) */}
      {MOBILE_SECTIONS.header && (
        <header className={styles.header}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={styles.headerImg} src={image} alt={name} />
          <h1 className={styles.title}>
            <span className={styles.titleLead}>Learn about the</span>
            <span className={styles.titleName}>{name}</span>
          </h1>
          {info.subtitle && <p className={styles.subtitle}>{info.subtitle}</p>}
        </header>
      )}

      {/* Blue intro box: the breed write-up. In flow (no fixed height on mobile). */}
      {MOBILE_SECTIONS.introBox && introText && (
        <div className={styles.introBox}>
          <p className={styles.introBody}>{introText}</p>
        </div>
      )}

      {/* Ancestor pack: phone-sized tiles wrapping to the width; tap opens the same popout
          data as desktop (enlarge image, i card, % card). */}
      {MOBILE_SECTIONS.ancestorPack && orderedFrames.length > 0 && (
        <section className={styles.packSection}>
          <p className={styles.sectionTitle}>Ancestor Pack</p>
          <div className={styles.packGrid}>
            {orderedFrames.map((f) => (
              <div key={f.id} className={styles.frame} style={{ borderColor: frameBorder(f.status) }}>
                <div className={styles.frameInner}>
                  <button
                    type="button"
                    className={styles.frameImgBtn}
                    data-frame-id={f.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      setOpenPop(openPop?.id === f.id && openPop.kind === "image" ? null : { id: f.id, kind: "image", anchor: { x: r.left, y: r.top, size: r.width } });
                    }}
                    aria-label={`Enlarge ${f.name}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className={styles.frameImg} src={f.img} alt={f.name} />
                  </button>
                  <button
                    type="button"
                    className={styles.frameInfoBtn}
                    onClick={(e) => { e.stopPropagation(); setOpenPop(openPop?.id === f.id && openPop.kind === "info" ? null : { id: f.id, kind: "info" }); }}
                    aria-label={`About ${f.name}`}
                  >i</button>
                  {openPop?.id === f.id && openPop.kind === "info" && (
                    <div className={styles.framePopover} onClick={(e) => e.stopPropagation()}>
                      <p className={styles.framePopoverName}>{f.name}</p>
                      {f.era && <p className={styles.framePopoverEra}>Era: {f.era}</p>}
                      {f.note && <p className={styles.framePopoverNote}>{f.note}</p>}
                      <button type="button" className={styles.framePopoverClose} onClick={(e) => { e.stopPropagation(); setOpenPop(null); }} aria-label="Close">&times;</button>
                    </div>
                  )}
                  <button
                    type="button"
                    className={styles.framePct}
                    onClick={(e) => { e.stopPropagation(); setOpenPop(openPop?.id === f.id && openPop.kind === "pct" ? null : { id: f.id, kind: "pct" }); }}
                    aria-label={`Percentage detail for ${f.name}`}
                  >{f.pct != null && f.pct < 1 ? "<1%" : `${f.pct ?? "?"}%`}</button>
                  {openPop?.id === f.id && openPop.kind === "pct" && (
                    <div className={styles.framePctCard} onClick={(e) => e.stopPropagation()}>
                      <button type="button" className={styles.framePopoverClose} onClick={(e) => { e.stopPropagation(); setOpenPop(null); }} aria-label="Close">&times;</button>
                      <p className={styles.pctCardName}>{f.name}</p>
                      <p className={styles.pctCardBig}>{pctTxt(f.pct ?? 0)} of your chum</p>
                      <div className={styles.pctCardRows}>
                        <div>As {genLabel(f.depth ?? 1)}: {pctTxt(f.share ?? f.pct ?? 0)}</div>
                        <div>Share of your chum: {pctTxt(f.pct ?? 0)}</div>
                      </div>
                      <p className={styles.pctCardTitle}>{pctTitleFor(f.id)}</p>
                      <p className={styles.pctCardDisclaimer}>These figures come from history and old breeding records, our viewpoint, not proven fact.</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Famous chums: the shared section, at mobile width. */}
      {MOBILE_SECTIONS.famousChums && famousDogs[slug] && (
        <div className={styles.famousWrap}>
          <FamousDogsSection dogs={famousDogs[slug]} />
        </div>
      )}

      {/* Hidden BreedTreeMap: feeds the ancestor-pack frames via onFramesReady only. Not the
          circular diagram (BreedTree) or the family tree (LineageMap) - those are omitted. */}
      {MOBILE_SECTIONS.ancestorPack && lineage && (
        <div className={styles.hiddenMap} aria-hidden="true">
          <BreedTreeMap lineage={lineage} rootImage={image} filledIds={[]} onFramesReady={handleFramesReady} />
        </div>
      )}

      {/* Enlarged ancestor image: the shared mini-pit TileZoom, anchored to the tapped tile. */}
      {openPop?.kind === "image" && (() => {
        const f = frames.find((x) => x.id === openPop.id);
        if (!f || !openPop.anchor) return null;
        return (
          <TileZoom
            key={f.id}
            open={{ img: f.img, name: f.name, description: f.note || "", anchor: openPop.anchor }}
            onClose={() => setOpenPop(null)}
          />
        );
      })()}
    </div>
  );
}
