"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import type { LineageNode } from "../../../data/lineage";
import Footer from "../../../components/Footer/Footer";
import { lifespanCurves } from "../../../data/lifespanCurves";
import LifespanChart from "../../../components/LifespanChart/LifespanChart";
import RunningCostCard from "../../../components/RunningCostCard/RunningCostCard";
import runningCosts from "../../../data/runningCosts";
import suitabilityScores from "../../../data/suitabilityScores";
import exerciseNeeds from "../../../data/exerciseNeeds";
import groomingNeeds from "../../../data/groomingNeeds";
import trainingDifficulty from "../../../data/trainingDifficulty";
import healthConditions from "../../../data/healthConditions";
import famousDogs from "../../../data/famousDogs";
import styles from "./breed-mobile.module.css";

interface Props {
  name: string;
  slug: string;
  image: string;
  info: { subtitle: string; temperament: string[]; pros: string[]; cons: string[] };
  lineage: LineageNode | null;
  breed: {
    size: string;
    weight: string;
    coatLength: string;
    coatColour: string;
    lookFor: string;
    character: string;
  };
}

// ── Ancestry helpers ────────────────────────────────────────
function sumLeaves(n: LineageNode): number {
  if (!n.children?.length) return n.value ?? 1;
  return n.children.reduce((s, c) => s + sumLeaves(c), 0);
}

function getAncestry(lineage: LineageNode): { name: string; pct: number }[] {
  const rootLeaves = sumLeaves(lineage);
  const results: { name: string; pct: number }[] = [];
  function walk(n: LineageNode) {
    if (!n.children?.length) return;
    n.children.forEach((c) => {
      const pct = Math.round((sumLeaves(c) / rootLeaves) * 100);
      if (pct > 0) results.push({ name: c.name, pct });
      walk(c);
    });
  }
  walk(lineage);
  const merged = new Map<string, number>();
  results.forEach(({ name, pct }) => merged.set(name, (merged.get(name) ?? 0) + pct));
  return [...merged.entries()]
    .map(([name, pct]) => ({ name, pct }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 8);
}

// ── Colour helpers ──────────────────────────────────────────
const SEVERITY_COLOURS = ["#22c55e", "#84cc16", "#ffd23e", "#fb923c", "#ef4444"];
const SCORE_COLOURS = ["#22c55e", "#4ade80", "#ffd23e", "#fb923c", "#ef4444"];
const SEVERITY_LABELS  = ["Minor", "Mild", "Moderate", "Serious", "Severe"];
const LIKELIHOOD_TEXT: Record<string, string> = {
  "rare": "#5cc4ee", "occasional": "#ffd23e", "common": "#fb923c", "very-common": "#ef4444",
};
const LIKELIHOOD_LABELS: Record<string, string> = {
  "rare": "Rare", "occasional": "Occasional", "common": "Common", "very-common": "Very common",
};
const TYPE_COLOURS: Record<string, string> = {
  "Real": "#22c55e", "Real / animation": "#22c55e", "Animated": "#5cc4ee",
  "Live-action film": "#ffd23e", "Live-action TV": "#ffd23e",
  "Literature": "#fb923c", "Literature / film": "#fb923c", "Literature / animation": "#fb923c",
  "Advertising": "#a855f7", "Comics": "#5cc4ee", "Comics / film": "#5cc4ee",
  "Legend": "#fb923c", "Mascot": "#a855f7",
};
const TYPE_ORDER: Record<string, number> = {
  "Real": 0, "Real / animation": 0, "Legend": 1,
  "Live-action TV": 2, "Live-action film": 2,
  "Literature": 3, "Literature / film": 3, "Literature / animation": 3,
  "Animated": 4, "Comics": 5, "Comics / film": 5, "Advertising": 6, "Mascot": 6,
};

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ── Section wrapper ─────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {children}
    </section>
  );
}

// ── Main component ──────────────────────────────────────────
export default function BreedMobile({ name, slug, image, info, lineage, breed }: Props) {
  const [openHealth, setOpenHealth] = useState<number | null>(null);
  const ancestry = useMemo(() => lineage ? getAncestry(lineage) : [], [lineage]);
  const hasLifespan = !!lifespanCurves[name];
  const cost = runningCosts[slug];
  const suitability = suitabilityScores[slug];
  const exercise = exerciseNeeds[slug];
  const grooming = groomingNeeds[slug];
  const training = trainingDifficulty[slug];
  const health = healthConditions[slug];
  const famous = famousDogs[slug];

  const sortedHealth = health
    ? [...health.conditions].sort((a, b) => {
        if (b.severity !== a.severity) return b.severity - a.severity;
        const lo = { "very-common": 0, "common": 1, "occasional": 2, "rare": 3 };
        return lo[a.likelihood as keyof typeof lo] - lo[b.likelihood as keyof typeof lo];
      })
    : [];

  const sortedFamous = famous
    ? [...famous].sort((a, b) => (TYPE_ORDER[a.type] ?? 99) - (TYPE_ORDER[b.type] ?? 99))
    : [];

  // Suitability axes
  const suitAxes = suitability ? [
    { key: "children",    label: "Children" },
    { key: "otherDogs",   label: "Other dogs" },
    { key: "cats",        label: "Cats" },
    { key: "smallHome",   label: "Small home" },
    { key: "firstTimer",  label: "First-time owner" },
    { key: "timeAlone",   label: "Time alone" },
  ] : [];

  // Exercise week pattern
  const weekDays = exercise
    ? DAY_LABELS.map((day, i) => ({
        day,
        mins: Math.round(exercise.minutesPerDay * exercise.weekPattern[i]),
      }))
    : [];
  const maxMins = weekDays.length ? Math.max(...weekDays.map((d) => d.mins)) : 1;

  // Training gauge
  const score = training?.score ?? 3;
  const fillDeg = ((6 - score) / 5) * 180;
  const gaugeColour = SCORE_COLOURS[score - 1] ?? "#ffd23e";

  return (
    <div className={styles.page}>

      {/* ── Hero ── */}
      <div className={styles.hero}>
        {image && (
          <div className={styles.heroImage}>
            <Image src={image} alt={name} fill style={{ objectFit: "cover" }} />
          </div>
        )}
        <div className={styles.heroText}>
          <h1 className={styles.heroName}>{name}</h1>
          <p className={styles.heroSub}>{info.subtitle}</p>
        </div>
      </div>

      {/* ── Quick stats ── */}
      <div className={styles.statsBar}>
        <div className={styles.stat}><span className={styles.statLabel}>Size</span><span className={styles.statValue}>{breed.size}</span></div>
        <div className={styles.stat}><span className={styles.statLabel}>Weight</span><span className={styles.statValue}>{breed.weight}</span></div>
        <div className={styles.stat}><span className={styles.statLabel}>Coat</span><span className={styles.statValue}>{breed.coatLength}</span></div>
      </div>

      {/* ── Temperament ── */}
      <Section title="Temperament">
        <div className={styles.traitPills}>
          {info.temperament.map((t) => (
            <span key={t} className={styles.traitPill}>{t}</span>
          ))}
        </div>
        {breed.character && <p className={styles.bodyText}>{breed.character}</p>}
        <div className={styles.prosCons}>
          <div className={styles.prosCol}>
            <p className={styles.prosConsTitle}>Strengths</p>
            {info.pros.map((p) => <p key={p} className={styles.prosItem}>+ {p}</p>)}
          </div>
          <div className={styles.consCol}>
            <p className={styles.prosConsTitle}>Considerations</p>
            {info.cons.map((c) => <p key={c} className={styles.consItem}>- {c}</p>)}
          </div>
        </div>
      </Section>

      {/* ── Ancestry ── */}
      {ancestry.length > 0 && (
        <Section title="Ancestry">
          <p className={styles.bodyText}>The breeds and types that shaped {name}.</p>
          <div className={styles.ancestryList}>
            {ancestry.map(({ name: aName, pct }) => (
              <div key={aName} className={styles.ancestryRow}>
                <span className={styles.ancestryName}>{aName}</span>
                <div className={styles.ancestryBarWrap}>
                  <div className={styles.ancestryBar} style={{ width: `${pct}%` }} />
                </div>
                <span className={styles.ancestryPct}>{pct}%</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── Lifespan ── */}
      {hasLifespan && (
        <Section title="Lifespan">
          <div className={styles.lifespanScroll}>
            <LifespanChart breedName={name} />
          </div>
        </Section>
      )}

      {/* ── Cost to care ── */}
      {cost && (
        <Section title="Cost to care">
          <RunningCostCard config={cost} />
        </Section>
      )}

      {/* ── Suitability ── */}
      {suitability && (
        <Section title="Suitability">
          <div className={styles.suitList}>
            {suitAxes.map(({ key, label }) => {
              const val = suitability[key as keyof typeof suitability] as number ?? 0;
              return (
                <div key={key} className={styles.suitRow}>
                  <span className={styles.suitLabel}>{label}</span>
                  <div className={styles.suitDots}>
                    {[1,2,3,4,5].map((d) => (
                      <span key={d} className={styles.suitDot} style={{ background: d <= val ? "#ffd23e" : "rgba(255,255,255,0.15)" }} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* ── Exercise ── */}
      {exercise && (
        <Section title="Exercise">
          <p className={styles.bodyText}>{exercise.minutesPerDay} minutes per day recommended.</p>
          <div className={styles.exerciseChart}>
            {weekDays.map(({ day, mins }, i) => (
              <div key={day} className={styles.exerciseCol}>
                <div className={styles.exerciseBarWrap}>
                  <div
                    className={styles.exerciseBar}
                    style={{
                      height: `${(mins / maxMins) * 100}%`,
                      background: i >= 5 ? "var(--yellow, #ffd23e)" : "var(--blue-deep, #0b78bd)",
                    }}
                  />
                </div>
                <span className={styles.exerciseDay}>{day}</span>
                <span className={styles.exerciseMins}>{mins}m</span>
              </div>
            ))}
          </div>
          {exercise.notes && <p className={styles.bodyText}>{exercise.notes}</p>}
        </Section>
      )}

      {/* ── Grooming ── */}
      {grooming && (
        <Section title="Grooming">
          <div className={styles.groomingGrid}>
            <div className={styles.groomingStat}>
              <span className={styles.groomingValue}>⏱ {grooming.timePerWeek}min</span>
              <span className={styles.groomingLabel}>Per week</span>
            </div>
            {grooming.monthlyProfessionalCost > 0 && (
              <div className={styles.groomingStat}>
                <span className={styles.groomingValue}>£{grooming.monthlyProfessionalCost}</span>
                <span className={styles.groomingLabel}>Professional/mo</span>
              </div>
            )}
          </div>
          <div className={styles.groomingRow}>
            <span className={styles.groomingLabel}>Shedding</span>
            <div className={styles.suitDots}>
              {[1,2,3,4,5].map((d) => (
                <span key={d} className={styles.suitDot} style={{ background: d <= grooming.sheddingLevel ? "#ffd23e" : "rgba(255,255,255,0.15)" }} />
              ))}
            </div>
          </div>
          {grooming.coatType && <p className={styles.bodyText}>{grooming.coatType}</p>}
          {grooming.notes && <p className={styles.bodyText}>{grooming.notes}</p>}
        </Section>
      )}

      {/* ── Training ── */}
      {training && (
        <Section title="Training">
          <div className={styles.trainingGauge}>
            <svg viewBox="0 0 200 110" width="200" height="110">
              {/* Track */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="14" strokeLinecap="round"
              />
              {/* Fill */}
              {fillDeg > 0 && (() => {
                const rad = (180 - fillDeg) * Math.PI / 180;
                const ex = 100 + 80 * Math.cos(rad);
                const ey = 100 - 80 * Math.sin(rad);
                const lg = fillDeg > 180 ? 1 : 0;
                return (
                  <path
                    d={`M 20 100 A 80 80 0 ${lg} 1 ${ex.toFixed(1)} ${ey.toFixed(1)}`}
                    fill="none" stroke={gaugeColour} strokeWidth="14" strokeLinecap="round"
                  />
                );
              })()}
              <text x="100" y="92" textAnchor="middle" fill={gaugeColour} fontSize="28" fontFamily="Luckiest Guy, cursive">{score}</text>
              <text x="24" y="112" textAnchor="middle" fill="#ffffff" fontSize="9" fontFamily="Montserrat, sans-serif">Easy</text>
              <text x="176" y="112" textAnchor="middle" fill="#ffffff" fontSize="9" fontFamily="Montserrat, sans-serif">Hard</text>
            </svg>
          </div>
          <p className={styles.trainingLabel}>{training.label}</p>
          {training.traits && (
            <div className={styles.trainingTraits}>
              {training.traits.map((t: string) => <p key={t} className={styles.bodyText}>-- {t}</p>)}
            </div>
          )}
        </Section>
      )}

      {/* ── Health conditions ── */}
      {health && (
        <Section title="Known health conditions">
          <p className={styles.bodyText}>{health.generalNote}</p>
          <div className={styles.healthList}>
            {sortedHealth.map((c, i) => {
              const colour = SEVERITY_COLOURS[c.severity - 1];
              const isOpen = openHealth === i;
              return (
                <div key={c.name} className={`${styles.healthRow} ${isOpen ? styles.healthRowOpen : ""}`}>
                  <button className={styles.healthBtn} onClick={() => setOpenHealth(isOpen ? null : i)}>
                    <span className={styles.healthName}>{c.name}</span>
                    <div className={styles.healthMeta}>
                      <span className={styles.healthSeverity} style={{ color: colour }}>{SEVERITY_LABELS[c.severity - 1]}</span>
                      <span className={styles.healthLikelihood} style={{ color: LIKELIHOOD_TEXT[c.likelihood] }}>{LIKELIHOOD_LABELS[c.likelihood]}</span>
                      <span className={`${styles.healthChevron} ${isOpen ? styles.healthChevronOpen : ""}`}>↓</span>
                    </div>
                  </button>
                  {isOpen && <p className={styles.healthDesc}>{c.description}</p>}
                </div>
              );
            })}
          </div>
          <p className={styles.disclaimer}>General guide only. Not all dogs will develop these conditions. Always obtain health-tested parents from a responsible breeder and maintain regular vet check-ups.</p>
        </Section>
      )}

      {/* ── Famous Chums ── */}
      {sortedFamous.length > 0 && (
        <Section title="Famous Chums">
          <div className={styles.famousGrid}>
            {sortedFamous.map((dog) => {
              const colour = TYPE_COLOURS[dog.type] ?? "#ffffff";
              return (
                <a key={dog.name} href={dog.sourceUrl} target="_blank" rel="noopener noreferrer" className={styles.famousCard}>
                  <span className={styles.famousType} style={{ color: colour, borderColor: colour }}>{dog.type}</span>
                  <span className={styles.famousName}>{dog.name}</span>
                  <span className={styles.famousKnown}>{dog.knownFor}</span>
                </a>
              );
            })}
          </div>
        </Section>
      )}

    </div>
    <Footer />
  );
}
