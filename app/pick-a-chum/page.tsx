// Pick a Chum route. Self-contained: the interface mounts here only (the
// site-wide launcher is not wired into the global layout until Steve approves
// Checkpoint 2). The host content sits behind the focus wash when the interface
// opens, matching the client mock-ups.

import PickAChum from './ui/PickAChum';
import styles from './page.module.css';

export default function PickAChumPage() {
  return (
    <main className={styles.host}>
      <h1 className={styles.title}>Pick a Chum</h1>
      <p className={styles.lede}>
        Meet the chums. Tap the launcher in the lower-right, choose a dog, and see what it makes of you.
      </p>
      <PickAChum />
    </main>
  );
}
