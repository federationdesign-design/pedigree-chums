"use client";

import type { ReactElement } from "react";
import { ICONS } from "../../components/CardDock/CardDock";
import suitabilityScores from "../../data/suitabilityScores";
import exerciseNeeds from "../../data/exerciseNeeds";
import groomingNeeds from "../../data/groomingNeeds";
import trainingDifficulty from "../../data/trainingDifficulty";
import runningCosts from "../../data/runningCosts";
import breedInfo from "../../data/breed-info.json";
import { ancestryBreakdown } from "./breedPanelData";
import styles from "./BreedIconRail.module.css";

// The eight metrics, in the same order and with the same ids as the /chums/[slug]
// dock (components/CardDock ICONS). Each icon opens a simplified panel drawn for
// the knockout result screen; the deep widgets stay on the chum page, which every
// card links to. (Job B stage 6, 22 Aug 2026.)
export const RAIL_METRICS: { id: string; label: string }[] = [
  { id: "infoBox", label: "Temperament" },
  { id: "ancestry", label: "Ancestry" },
  { id: "lifespanExplain", label: "Lifespan" },
  { id: "runningCost", label: "Cost to care" },
  { id: "suitability", label: "Suitability" },
  { id: "exercise", label: "Exercise" },
  { id: "grooming", label: "Grooming" },
  { id: "training", label: "Training" },
];

// Which metrics have data for this dog, so we never show an icon that opens an
// empty panel (mirrors the per-card gating on /chums/[slug]).
export function availableMetrics(slug: string, name: string): Set<string> {
  const info = (breedInfo as Record<string, { temperament: string[]; pros: string[]; cons: string[] } | undefined>)[name];
  const has = new Set<string>();
  if (info && (info.temperament.length > 0 || info.pros.length > 0 || info.cons.length > 0)) has.add("infoBox");
  if (ancestryBreakdown(name).length > 0) has.add("ancestry");
  if (runningCosts[slug]) { has.add("lifespanExplain"); has.add("runningCost"); }
  if (suitabilityScores[slug]) has.add("suitability");
  if (exerciseNeeds[slug]) has.add("exercise");
  if (groomingNeeds[slug]) has.add("grooming");
  if (trainingDifficulty[slug]) has.add("training");
  return has;
}

type Props = {
  slug: string;
  name: string;
  activeMetric: string | null;
  onToggle: (metric: string) => void;
};

export default function BreedIconRail({ slug, name, activeMetric, onToggle }: Props) {
  const available = availableMetrics(slug, name);
  const metrics = RAIL_METRICS.filter((m) => available.has(m.id));
  if (metrics.length === 0) return null;

  return (
    <div className={styles.rail} role="tablist" aria-label={`More about ${name}`}>
      {metrics.map((m) => (
        <button
          key={m.id}
          type="button"
          role="tab"
          aria-selected={activeMetric === m.id}
          className={activeMetric === m.id ? `${styles.icon} ${styles.iconActive}` : styles.icon}
          onClick={() => onToggle(m.id)}
          title={m.label}
          aria-label={m.label}
        >
          <span className={styles.glyph}>{ICONS[m.id] as ReactElement}</span>
        </button>
      ))}
    </div>
  );
}
