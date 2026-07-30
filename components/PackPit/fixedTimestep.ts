// Fixed-timestep driver for Matter.js.
//
// Replaces Matter.Runner, which ticks once per requestAnimationFrame with a
// delta clamped to a minimum of 16.666ms. On 120Hz displays (iPhone ProMotion,
// high-refresh monitors) that runs the simulation at up to 2x real speed.
//
// This driver accumulates real elapsed time and advances the engine in exact
// 16.666ms steps, so the simulation runs at 1x on every display. All tuned
// constants (gravity, restitution, velocities) keep their designed feel.
//
// Engine.update applies engine.timing.timeScale internally, so slow-mo
// continues to work unchanged. `enabled = false` pauses stepping without a
// catch-up burst on resume. Shared by the main pit now and the mini pit
// after the Matter migration.

export type FixedRunner = {
  enabled: boolean;
  stop: () => void;
  /** Debug: simulation-time advanced vs wall-time elapsed. 1.00 = correct speed. (Reads 0.25 during slow-mo.) */
  ratio: () => number;
};

export function startFixedTimestep(Engine: any, engine: any): FixedRunner {
  const STEP = 1000 / 60; // fixed simulation step (ms)
  const MAX_ACC = 100;    // cap catch-up to 6 steps per frame (background tab, long GC frame)
  let acc = 0;
  let last: number | null = null;
  let raf = 0;
  const samples: { wall: number; sim: number }[] = []; // rolling window for the debug ratio

  const runner: FixedRunner = {
    enabled: true,
    stop: () => cancelAnimationFrame(raf),
    ratio: () => {
      const now = performance.now();
      while (samples.length && now - samples[0].wall > 2000) samples.shift();
      if (samples.length < 2) return 0;
      const a = samples[0], z = samples[samples.length - 1];
      const wall = z.wall - a.wall;
      return wall > 250 ? (z.sim - a.sim) / wall : 0;
    },
  };

  const frame = (t: number) => {
    raf = requestAnimationFrame(frame);
    if (!runner.enabled) { last = null; return; } // paused: drop elapsed time entirely
    if (last === null) { last = t; return; }
    acc += t - last;
    last = t;
    if (acc > MAX_ACC) acc = MAX_ACC;
    while (acc >= STEP) {
      Engine.update(engine, STEP);
      acc -= STEP;
    }
    samples.push({ wall: performance.now(), sim: engine.timing.timestamp });
  };
  raf = requestAnimationFrame(frame);
  return runner;
}
