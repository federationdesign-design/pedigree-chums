"use client";

import type { ReactNode } from "react";
import suitabilityScores from "../../data/suitabilityScores";
import type { SuitabilityScore } from "../../data/suitabilityScores";
import exerciseNeeds from "../../data/exerciseNeeds";
import groomingNeeds from "../../data/groomingNeeds";
import trainingDifficulty from "../../data/trainingDifficulty";
import runningCosts, { defaultRunningCost } from "../../data/runningCosts";
import breedInfo from "../../data/breed-info.json";
import { ancestryBreakdown } from "./breedPanelData";
import styles from "./BreedIconRail.module.css";

// A plain navy text box drawn for the result screen. Same data as /chums/[slug],
// flattened to paragraph text at card width. The deep widgets stay on the chum
// page (every card links there). Nothing invented. (Job B stage 6, 22 Aug 2026.)

function fmtGBP(n: number): string {
  return "£" + Math.round(n).toLocaleString("en-GB");
}

const PACE = ["", "gentle", "steady", "brisk", "high-energy"];
const SHED = ["", "barely sheds", "sheds a little", "sheds moderately", "sheds a lot", "sheds heavily"];

// Suitability as prose: name the top strengths and the bottom cautions rather than
// six numbers. Approved 22 Aug 2026.
const SUIT_PHRASE: Record<keyof SuitabilityScore, { up: string; down: string }> = {
  children:   { up: "Great with children",        down: "Better without young children" },
  otherDogs:  { up: "Sociable with other dogs",   down: "Prefers to be the only dog" },
  cats:       { up: "Fine living with cats",      down: "Not ideal around cats" },
  smallHome:  { up: "Suits a small home",         down: "Needs more than a small home" },
  firstTimer: { up: "Good for first-time owners", down: "Better with experienced owners" },
  timeAlone:  { up: "Copes well with time alone", down: "Dislikes long spells alone" },
};

function suitabilitySentences(s: SuitabilityScore): string[] {
  const entries = (Object.keys(SUIT_PHRASE) as (keyof SuitabilityScore)[]).map((k) => ({ k, v: s[k] }));
  const strengths = entries.filter((e) => e.v >= 4).sort((a, b) => b.v - a.v).slice(0, 2);
  const cautions = entries.filter((e) => e.v <= 2).sort((a, b) => a.v - b.v).slice(0, 2);
  const out: string[] = [];
  if (strengths.length) out.push(strengths.map((e) => SUIT_PHRASE[e.k].up).join(". ") + ".");
  else out.push(SUIT_PHRASE[[...entries].sort((a, b) => b.v - a.v)[0].k].up + ".");
  if (cautions.length) out.push(cautions.map((e) => SUIT_PHRASE[e.k].down).join(". ") + ".");
  return out;
}

type Props = { slug: string; name: string; metric: string };

export default function BreedInfoPanel({ slug, name, metric }: Props) {
  return <div className={styles.panel} role="tabpanel">{renderText(slug, name, metric)}</div>;
}

function P({ children }: { children: ReactNode }) {
  return <p className={styles.panelText}>{children}</p>;
}

function renderText(slug: string, name: string, metric: string) {
  switch (metric) {
    case "infoBox": {
      const info = (breedInfo as Record<string, { subtitle: string; temperament: string[]; pros: string[]; cons: string[] } | undefined>)[name];
      if (!info) return null;
      return (
        <>
          {info.temperament.length > 0 && <P>{info.temperament.join(", ")}.</P>}
          {info.pros.length > 0 && <P>{info.pros.slice(0, 2).join("; ")}.</P>}
          {info.cons.length > 0 && <P>{info.cons.slice(0, 2).join("; ")}.</P>}
        </>
      );
    }
    case "ancestry": {
      const rows = ancestryBreakdown(name).slice(0, 3);
      if (rows.length === 0) return null;
      return <P>Mainly {rows.map((r) => `${r.name} (${r.pct}%)`).join(", ")}.</P>;
    }
    case "lifespanExplain": {
      const cfg = runningCosts[slug];
      if (!cfg) return null;
      return <P>Typically around {cfg.lifespanYears} years. A general guide; individual dogs vary.</P>;
    }
    case "runningCost": {
      const cfg = runningCosts[slug];
      if (!cfg) return null;
      const { annual, lifetime } = defaultRunningCost(cfg);
      return <P>Around {fmtGBP(annual)} a year, about {fmtGBP(lifetime)} over a lifetime. Breed-typical UK costs, {cfg.priceYear}.</P>;
    }
    case "suitability": {
      const s = suitabilityScores[slug];
      if (!s) return null;
      return <>{suitabilitySentences(s).map((line, i) => <P key={i}>{line}</P>)}</>;
    }
    case "exercise": {
      const e = exerciseNeeds[slug];
      if (!e) return null;
      return <P>About {e.minutesPerDay} minutes a day, at a {PACE[e.intensity]} pace.</P>;
    }
    case "grooming": {
      const g = groomingNeeds[slug];
      if (!g) return null;
      return (
        <>
          <P>{g.coatType}. {SHED[g.sheddingLevel]}. About {g.timePerWeek} minutes brushing a week.</P>
          {g.monthlyProfessionalCost > 0 && <P>Professional grooming about £{g.monthlyProfessionalCost} a month.</P>}
        </>
      );
    }
    case "training": {
      const t = trainingDifficulty[slug];
      if (!t) return null;
      return <P>{t.label} ({t.score} of 5). Watch out: {t.watchOut}.</P>;
    }
    default:
      return null;
  }
}
