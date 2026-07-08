"use client";

import { useState, useId } from "react";
import styles from "./RunningCostCard.module.css";
import type { RunningCostConfig } from "../../data/runningCosts";

interface Props {
  config: RunningCostConfig;
}

function medicalAllowance(sliderValue: number, low: number, typical: number, high: number): number {
  const s = Math.min(1, Math.max(0, sliderValue / 100));
  if (s <= 0.5) {
    return low + (typical - low) * Math.pow(2 * s, 1.35);
  }
  return typical + (high - typical) * Math.pow(2 * s - 1, 1.70);
}

function fmt(n: number): string {
  return "£" + Math.round(n).toLocaleString("en-GB");
}

function scenarioLabel(value: number): string {
  if (value <= 0) return "Lower medical needs";
  if (value <= 25) return "Below typical";
  if (value <= 50) return value === 50 ? "Typical expected scenario" : "Below typical";
  if (value <= 75) return value === 75 ? "Higher medical needs" : "Higher medical needs";
  return "Complex medical needs";
}

export default function RunningCostCard({ config }: Props) {
  const [sliderValue, setSliderValue] = useState(50);
  const sliderId = useId();

  const { food, routineCare, dentalAllowance, neuteringAllowance } = config.annualCosts;
  const { low, typical, high } = config.medicalScenarios;

  const medical = medicalAllowance(sliderValue, low, typical, high);
  const fixedAnnual = food + routineCare + dentalAllowance + neuteringAllowance;
  const annual = fixedAnnual + medical;
  const lifetime = annual * config.lifespanYears;
  const medicalPct = Math.round((medical / annual) * 100);

  return (
    <div className={styles.card}>
      <h3 className={styles.heading}>Cost to care</h3>
      <p className={styles.sub}>Adjust the slider to explore different health-needs scenarios.</p>

      <div className={styles.sliderWrap}>
        <div className={styles.sliderLabels}>
          <span>Lower medical needs</span>
          <span>Higher medical needs</span>
        </div>
        <input
          id={sliderId}
          type="range"
          min={0}
          max={100}
          step={1}
          value={sliderValue}
          onChange={(e) => setSliderValue(Number(e.target.value))}
          className={styles.slider}
          aria-label="Health needs level"
          aria-valuetext={scenarioLabel(sliderValue)}
        />
        <div className={styles.scenarioLabel}>{scenarioLabel(sliderValue)}</div>
      </div>

      <div className={styles.outputs}>
        <div className={styles.outputBlock}>
          <div className={styles.outputValue}>{fmt(annual)}</div>
          <div className={styles.outputLabel}>Estimated annual care cost</div>
        </div>
        <div className={styles.divider} />
        <div className={styles.outputBlock}>
          <div className={styles.outputValue}>{fmt(lifetime)}</div>
          <div className={styles.outputLabel}>Estimated lifetime care cost</div>
        </div>
      </div>

      <div className={styles.breakdown}>
        <div className={styles.breakdownTitle}>Your estimate includes</div>
        <div className={styles.breakdownRow}>
          <span>Food</span>
          <span>{fmt(food)}</span>
        </div>
        <div className={styles.breakdownRow}>
          <span>Routine and preventive care</span>
          <span>{fmt(routineCare)}</span>
        </div>
        <div className={styles.breakdownRow}>
          <span>Dental allowance</span>
          <span>{fmt(dentalAllowance)}</span>
        </div>
        <div className={styles.breakdownRow}>
          <span>Neutering allowance</span>
          <span>{fmt(neuteringAllowance)}</span>
        </div>
        <div className={styles.breakdownRowVariable}>
          <span>Medical-risk allowance</span>
          <span>{fmt(medical)} <span className={styles.pct}>({medicalPct}%)</span></span>
        </div>
      </div>

      <div className={styles.barWrap} aria-hidden="true">
        <div className={styles.barFill} style={{ width: `${medicalPct}%` }} />
      </div>

      <p className={styles.disclaimer}>
        Illustrative UK estimates ({config.priceYear}). Not a veterinary prognosis or guarantee. Actual costs vary with the individual dog, sex, weight, health, location and price changes. The high-needs scenario is not a maximum possible veterinary bill.
      </p>

      <div className={styles.modelTag}>{config.modelVersion}</div>
    </div>
  );
}
