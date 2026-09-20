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
  /* Three states, not two, and the third one matters. `null` means "not read
     yet": the server render and the first paint both produce nothing, so there
     is no hydration mismatch and, more visibly, no flash of the question for
     someone who decided months ago. `true` means a stored choice exists and this
     stands down. `false` means genuinely undecided, so ask. */
  const [decided, setDecided] = useState<boolean | null>(null);

  useEffect(() => {
    const read = () => {
      try {
        setDecided(!!localStorage.getItem(CONSENT_KEY));
      } catch {
        /* Private mode: storage throws, so a choice could never be remembered
           and the question would return on every visit. Stay quiet instead,
           which is the same call CookieBar makes. */
        setDecided(true);
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

  /* Hidden once a choice exists, and hidden again on every later visit, because
     the answer is read from storage rather than from this session (Steve,
     20 September 2026). CookieDrop's persist() is what writes it and then fires
     pc:consent, which is what the listener above is waiting for, so the panel
     clears itself the moment a button is pressed, with no reload. */
  if (decided !== false) return null;

  return (
    /* NOT "Cookie choices": CookieBar already labels its own region that, and on
       this page both can be present, which gave a screen reader two landmarks
       with the same name and no way to tell them apart. */
    <section className={styles.panel} aria-label="Your cookie choices">
      {/* The heading is deliberately not rendered: the panel sits directly under
          the page's own "Cookie Policy" H1, so a second title restated the same
          thing twice in a row (Steve, 20 September 2026). The section keeps its
          aria-label, so it is still announced as "Cookie choices". */}
      <p className={styles.text}>
        We use cookies to make the site work and to show our product video. If you
        accept, we also use Google Analytics to see how the site is used, and the
        Meta Pixel, which shares some of your activity with Meta (Facebook and
        Instagram) so we can measure our advertising and show you relevant ads.
        Nothing beyond the essentials loads unless you accept.
      </p>
      {/* The "you currently accept/reject" line has been removed, not hidden: it
          could only appear once a choice existed, and at that point this panel no
          longer renders at all. */}
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
