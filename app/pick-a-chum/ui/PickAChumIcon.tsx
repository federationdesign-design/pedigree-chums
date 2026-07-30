// Launcher mark. Steve's approved icon, served from public/ as a single easily
// replaced asset (Task 62). Kept dependency-free so the closed launcher stays
// lightweight. Sized to the same 60% box the previous placeholder used, so the
// launcher's size and position are unchanged; object-fit keeps the art's aspect
// ratio inside that box.
import styles from './PickAChum.module.css';

export default function PickAChumIcon() {
  return <img className={styles.launcherIcon} src="/shout-launcher-icon.svg" alt="" aria-hidden="true" />;
}
