// Pick a Chum route. The launcher is now mounted globally in the root layout, so
// it appears on this page (and every page) via that mount. This route is just a
// light landing surface; it does not render its own launcher to avoid a
// duplicate.

import styles from './page.module.css';

export default function PickAChumPage() {
  return (
    <main className={styles.host}>
      <h1 className={styles.title}>Pick a Chum</h1>
      <p className={styles.lede}>
        Meet the chums. Tap the launcher in the lower-left, choose a dog, and see what it makes of you.
      </p>
    </main>
  );
}
