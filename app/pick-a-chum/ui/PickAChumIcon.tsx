// Launcher mark. Steve's approved icon, served from public/ as a single easily
// replaced asset (Task 62). Kept dependency-free so the closed launcher stays
// lightweight. Sized to the same 60% box the previous placeholder used, so the
// launcher's size and position are unchanged; object-fit keeps the art's aspect
// ratio inside that box.
import styles from './PickAChum.module.css';

// Task 84: the launcher cycles four icon variants (full/mid/minimal/none) once on appearance, so the
// mark is a swappable src. Defaults to the full-marks resting frame; the "pick for me" anchor, which
// reuses this icon, gets the default and never animates.
export default function PickAChumIcon({ src = '/shout-launcher-icon-1.svg' }: { src?: string }) {
  return <img className={styles.launcherIcon} src={src} alt="" aria-hidden="true" />;
}
