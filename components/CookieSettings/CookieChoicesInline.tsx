"use client";

import { useEffect, useState } from "react";
import { CONSENT_KEY } from "../../lib/consent";
import styles from "./CookieChoicesInline.module.css";

/* The consent choices sitting IN THE PAGE at the top of /cookies, instead of the
   CookieDrop overlay.

   WHY. Opening CookieDrop on the cookie policy page put a transparent,
   backdrop-blurred panel of white text directly over a white content card, so the
   notice and the policy were readable through one another and neither could be
   read at all. The page that explains cookies was the one page where the notice
   was unusable. In flow it cannot overlap anything.

   IT OWNS NO STATE. Accept and Reject dispatch the same
   pc:cookies-accepted / pc:cookies-rejected events the pit objects, CookieBar and
   CookieDrop already dispatch; CookieDrop's listener still does the writing, the
   cookie clearing and the reload on withdrawal. One consent bridge, not two,
   which is the rule CookieBar set and this follows.

   It reads the stored choice only to SHOW it, and re-reads on pc:consent so the
   line stays true when a choice is made anywhere else on the page. */
export default function CookieChoicesInline() {
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => {
    const read = () => {
      try {
        setCurrent(localStorage.getItem(CONSENT_KEY));
      } catch {
        /* Private mode: storage throws. Show no state line rather than guess. */
        setCurrent(null);
      }
    };
    /* rAF for the reason MetaPixel and CookieBar use one: keeps the first paint
       free of anything that depends on localStorage, so there is no hydration
       mismatch between the server HTML and the client. */
    const raf = requestAnimationFrame(read);
    window.addEventListener("pc:consent", read);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pc:consent", read);
    };
  }, []);

  const choose = (accept: boolean) => {
    window.dispatchEvent(new Event(accept ? "pc:cookies-accepted" : "pc:cookies-rejected"));
  };

  return (
    <section className={styles.panel} aria-label="Cookie choices">
      <h2 className={styles.title}>Cookies on Pedigree Chums</h2>
      <p className={styles.text}>
        We use cookies to make the site work and to show our product video. If you
        accept, we also use Google Analytics to see how the site is used, and the
        Meta Pixel, which shares some of your activity with Meta (Facebook and
        Instagram) so we can measure our advertising and show you relevant ads.
        Nothing beyond the essentials loads unless you accept.
      </p>
      {current && (
        <p className={styles.state}>
          You currently {current === "accepted" ? "accept" : "reject"} non-essential cookies.
        </p>
      )}
      <div className={styles.actions}>
        <button
          type="button"
          className={`${styles.btn} ${styles.accept}`}
          onClick={() => choose(true)}
        >
          Accept
        </button>
        <button
          type="button"
          className={`${styles.btn} ${styles.reject}`}
          onClick={() => choose(false)}
        >
          Reject
        </button>
      </div>
    </section>
  );
}
