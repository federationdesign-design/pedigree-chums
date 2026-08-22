"use client";

import suitabilityScores from "../../data/suitabilityScores";
import type { SuitabilityScore } from "../../data/suitabilityScores";
import exerciseNeeds from "../../data/exerciseNeeds";
import groomingNeeds from "../../data/groomingNeeds";
import trainingDifficulty from "../../data/trainingDifficulty";
import runningCosts, { defaultRunningCost } from "../../data/runningCosts";
import breedInfo from "../../data/breed-info.json";
import { ancestryBreakdown } from "./breedPanelData";
import styles from "./BreedIconRail.module.css";

// Simplified, context-drawn version of each /chums/[slug] widget. The deep widgets
// are not reflowed: they stay on the chum page (every card links there). All values
// map to real data fields, nothing is invented. Cost figures come from the shared
// defaultRunningCost so they match the chum page exactly. (Job B stage 6, 22 Aug 2026.)

function fmtGBP(n: number): string {
  return "£" + Math.round(n).toLocaleString("en-GB");
}

function Dots({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <span className={styles.dots} aria-hidden="true">
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className={i < value ? `${styles.dot} ${styles.dotOn}` : styles.dot} />
      ))}
    </span>
  );
}

const SUIT_ROWS: { key: keyof SuitabilityScore; label: string }[] = [
  { key: "children", label: "Children" },
  { key: "otherDogs", label: "Other dogs" },
  { key: "cats", label: "Cats" },
  { key: "smallHome", label: "Small home" },
  { key: "firstTimer", label: "First-time owner" },
  { key: "timeAlone", label: "Time alone" },
];

type Props = { slug: string; name: string; metric: string };

export default function BreedInfoPanel({ slug, name, metric }: Props) {
  return (
    <div className={styles.panel} role="tabpanel">
      <p className={styles.panelHead}>{name}</p>
      {renderBody(slug, name, metric)}
    </div>
  );
}

function renderBody(slug: string, name: string, metric: string) {
  switch (metric) {
    case "infoBox": {
      const info = (breedInfo as Record<string, { subtitle: string; temperament: string[]; pros: string[]; cons: string[] } | undefined>)[name];
      if (!info) return null;
      return (
        <div className={styles.section}>
          <p className={styles.panelTitle}>Temperament</p>
          {info.temperament.length > 0 && (
            <div className={styles.chips}>
              {info.temperament.map((t) => <span key={t} className={styles.chip}>{t}</span>)}
            </div>
          )}
          <div className={styles.prosCons}>
            {info.pros.length > 0 && (
              <div>
                <p className={styles.pcHead}>Pros</p>
                <ul className={styles.pcList}>{info.pros.slice(0, 2).map((p) => <li key={p}>{p}</li>)}</ul>
              </div>
            )}
            {info.cons.length > 0 && (
              <div>
                <p className={styles.pcHead}>Cons</p>
                <ul className={styles.pcList}>{info.cons.slice(0, 2).map((c) => <li key={c}>{c}</li>)}</ul>
              </div>
            )}
          </div>
        </div>
      );
    }
    case "ancestry": {
      const rows = ancestryBreakdown(name).slice(0, 3);
      if (rows.length === 0) return null;
      return (
        <div className={styles.section}>
          <p className={styles.panelTitle}>Main ancestry</p>
          {rows.map((r) => (
            <div key={r.name} className={styles.barRow}>
              <span className={styles.barLabel}>{r.name}</span>
              <span className={styles.barTrack}><span className={styles.barFill} style={{ width: `${r.pct}%` }} /></span>
              <span className={styles.barPct}>{r.pct}%</span>
            </div>
          ))}
        </div>
      );
    }
    case "lifespanExplain": {
      const cfg = runningCosts[slug];
      if (!cfg) return null;
      return (
        <div className={styles.section}>
          <p className={styles.panelTitle}>Typical lifespan</p>
          <p className={styles.bigStat}>~{cfg.lifespanYears} years</p>
          <p className={styles.caption}>A general guide. Individual dogs vary.</p>
        </div>
      );
    }
    case "runningCost": {
      const cfg = runningCosts[slug];
      if (!cfg) return null;
      const { annual, lifetime } = defaultRunningCost(cfg);
      return (
        <div className={styles.section}>
          <p className={styles.panelTitle}>Cost to care</p>
          <p className={styles.bigStat}>~{fmtGBP(annual)}<span className={styles.statUnit}> / year</span></p>
          <p className={styles.subStat}>{fmtGBP(lifetime)} over a lifetime</p>
          <p className={styles.caption}>Breed-typical UK costs, {cfg.priceYear}. Individual dogs vary.</p>
        </div>
      );
    }
    case "suitability": {
      const s = suitabilityScores[slug];
      if (!s) return null;
      return (
        <div className={styles.section}>
          <p className={styles.panelTitle}>Suitability</p>
          <div className={styles.suitGrid}>
            {SUIT_ROWS.map((row) => (
              <div key={row.key} className={styles.suitRow}>
                <span className={styles.suitLabel}>{row.label}</span>
                <Dots value={s[row.key]} />
              </div>
            ))}
          </div>
        </div>
      );
    }
    case "exercise": {
      const e = exerciseNeeds[slug];
      if (!e) return null;
      return (
        <div className={styles.section}>
          <p className={styles.panelTitle}>Exercise</p>
          <p className={styles.bigStat}>~{e.minutesPerDay} min<span className={styles.statUnit}> a day</span></p>
          <p className={styles.subStat}>Intensity {e.intensity}/4</p>
        </div>
      );
    }
    case "grooming": {
      const g = groomingNeeds[slug];
      if (!g) return null;
      return (
        <div className={styles.section}>
          <p className={styles.panelTitle}>Grooming</p>
          <p className={styles.subStat}>{g.coatType}</p>
          <div className={styles.suitRow}>
            <span className={styles.suitLabel}>Shedding</span>
            <Dots value={g.sheddingLevel} />
          </div>
          <p className={styles.subStat}>~{g.timePerWeek} min a week at home</p>
          {g.monthlyProfessionalCost > 0 && (
            <p className={styles.caption}>
              Groomer: £{g.monthlyProfessionalCost} a month{g.professionalFrequency ? `, ${g.professionalFrequency.toLowerCase()}` : ""}
            </p>
          )}
        </div>
      );
    }
    case "training": {
      const t = trainingDifficulty[slug];
      if (!t) return null;
      return (
        <div className={styles.section}>
          <p className={styles.panelTitle}>Training</p>
          <p className={styles.bigStat}>{t.label}</p>
          <p className={styles.subStat}>Difficulty {t.score}/5</p>
          <p className={styles.caption}>Watch out: {t.watchOut}</p>
        </div>
      );
    }
    default:
      return null;
  }
}
