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
  if (value <= 0) return "Low Maintenance";
  if (value <= 25) return "Below typical";
  if (value <= 50) return value === 50 ? "Typical expected scenario" : "Below typical";
  if (value <= 75) return value === 75 ? "Higher medical needs" : "Higher medical needs";
  return "Sick as a dog";
}

export default function RunningCostCard({ config }: Props) {
  const [sliderValue, setSliderValue] = useState(50);
  const sliderId = useId();

  const { low, typical, high } = config.medicalScenarios;

  const medical = medicalAllowance(sliderValue, low, typical, high);
  const fixedAnnual = config.annualCosts.food + config.annualCosts.routineCare + config.annualCosts.dentalAllowance + config.annualCosts.neuteringAllowance;
  const annual = fixedAnnual + medical;
  const lifetime = annual * config.lifespanYears;
  const medicalPct = Math.round((medical / annual) * 100);

  return (
    <>
      <h3 className={styles.heading}>Cost to care</h3>
      <p className={styles.sub}>Just like owning a car or any other liability, upkeep and maintenance is required — and dog ownership is no different. Particular breeds need more attention from the vet, others have higher grooming costs, while others will eat you out of house and home. We have built this tool to help you understand what to expect from owning this breed.</p>

      <div className={styles.sliderWrap}>
        <div className={styles.sliderLabels}>
          <span>Low Maintenance</span>
          <span>Sick as a dog</span>
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
          <div className={styles.outputLabel}>Annual cost*</div>
          <div className={styles.outputValue}>{fmt(annual)}</div>
        </div>
        <div className={styles.outputBlock}>
          <div className={styles.outputLabel}>Lifetime cost*</div>
          <div className={styles.outputValue}>{fmt(lifetime)}</div>
        </div>
      </div>

      <div className={styles.barWrap} aria-hidden="true">
        <div className={styles.barFill} style={{ width: `${medicalPct}%` }} />
      </div>

      <p className={styles.asterisk}>* Projected figures based on breed-typical UK costs ({config.priceYear}). Individual dogs will vary.</p>
    </>
  );
}
