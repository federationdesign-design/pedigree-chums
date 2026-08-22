"use client";

import { useEffect } from "react";
import RunningCostCard from "../../components/RunningCostCard/RunningCostCard";
import SuitabilityRadar from "../../components/SuitabilityRadar/SuitabilityRadar";
import ExerciseCard from "../../components/ExerciseCard/ExerciseCard";
import GroomingCard from "../../components/GroomingCard/GroomingCard";
import TrainingCard from "../../components/TrainingCard/TrainingCard";
import BreedTemperament from "../../components/BreedTemperament/BreedTemperament";
import BreedAncestry from "../../components/BreedAncestry/BreedAncestry";
import runningCosts from "../../data/runningCosts";
import suitabilityScores from "../../data/suitabilityScores";
import exerciseNeeds from "../../data/exerciseNeeds";
import groomingNeeds from "../../data/groomingNeeds";
import trainingDifficulty from "../../data/trainingDifficulty";
import breedInfo from "../../data/breed-info.json";
import { ancestryBreakdown } from "./breedPanelData";
import { RAIL_METRICS } from "./BreedIconRail";
import styles from "./ChumInfoPopout.module.css";

// A floating pop-out that reuses the REAL /chums/[slug] widgets, one at a time, with
// a close X. Driven by the openPanel state (not DragCard). The deep lifespan chart is
// fixed at 1008px and does not fit a pop-out, so lifespan shows text + the "~N years"
// figure here and the full chart stays on the chum page (every card links there).
// (Job B stage 6, 22 Aug 2026.)

type Props = { slug: string; name: string; metric: string; onClose: () => void };

function metricLabel(metric: string): string {
  return RAIL_METRICS.find((m) => m.id === metric)?.label ?? "";
}

export default function ChumInfoPopout({ slug, name, metric, onClose }: Props) {
  // Close on Escape, like a normal dialog.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={`${name}: ${metricLabel(metric)}`}
      onClick={onClose}
    >
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <button className={styles.close} onClick={onClose} aria-label="Close">&times;</button>
        {renderWidget(slug, name, metric)}
      </div>
    </div>
  );
}

function renderWidget(slug: string, name: string, metric: string) {
  switch (metric) {
    case "infoBox": {
      const info = (breedInfo as Record<string, { temperament: string[]; pros: string[]; cons: string[] } | undefined>)[name];
      return info ? <BreedTemperament info={info} /> : null;
    }
    case "ancestry": {
      const rows = ancestryBreakdown(name);
      return rows.length > 0 ? <BreedAncestry breakdown={rows} /> : null;
    }
    case "lifespanExplain": {
      const cfg = runningCosts[slug];
      if (!cfg) return null;
      return (
        <div className={styles.lifespan}>
          <p className={styles.lifeHeading}>Typical lifespan</p>
          <p className={styles.lifeFigure}>~{cfg.lifespanYears} years</p>
          <p className={styles.lifeNote}>
            A general guide, individual dogs vary. The full lifespan diagram is on this breed&apos;s chum page.
          </p>
        </div>
      );
    }
    case "runningCost": {
      const cfg = runningCosts[slug];
      return cfg ? <RunningCostCard config={cfg} /> : null;
    }
    case "suitability": {
      const s = suitabilityScores[slug];
      return s ? <SuitabilityRadar score={s} breedName={name} /> : null;
    }
    case "exercise": {
      const e = exerciseNeeds[slug];
      return e ? <ExerciseCard data={e} narrow /> : null;
    }
    case "grooming": {
      const g = groomingNeeds[slug];
      return g ? <GroomingCard data={g} /> : null;
    }
    case "training": {
      const t = trainingDifficulty[slug];
      return t ? <TrainingCard data={t} /> : null;
    }
    default:
      return null;
  }
}
