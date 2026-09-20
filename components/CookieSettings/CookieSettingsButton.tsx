"use client";
import styles from "./CookieSettingsButton.module.css";
import CookieIcon from "./CookieIcon";

// Opens the CookieDrop banner in manage mode from anywhere it is placed (the Footer
// and the Nav menu), so consent can be changed or withdrawn as easily as it was
// given. It only dispatches the event; CookieDrop owns the UI and the state.
// `icon` swaps the words for the cookie mark. Opt-in, not the default, because this
// button is also in the Footer, where the label is the only thing identifying it and
// there is room for words. The Nav's top row is the only caller that wants the mark.
// The accessible name moves to aria-label in that mode, so the control still reads as
// "Cookie settings" to a screen reader.
export default function CookieSettingsButton({ className, onActivate, icon = false }: { className?: string; onActivate?: () => void; icon?: boolean }) {
  return (
    <button
      type="button"
      className={`${styles.link}${className ? " " + className : ""}`}
      aria-label={icon ? "Cookie settings" : undefined}
      onClick={() => { window.dispatchEvent(new Event("pc:manage-cookies")); onActivate?.(); }}
    >
      {icon ? <CookieIcon /> : "Cookie settings"}
    </button>
  );
}
