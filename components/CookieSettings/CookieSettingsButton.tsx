"use client";
import styles from "./CookieSettingsButton.module.css";

// Opens the CookieDrop banner in manage mode from anywhere it is placed (the Footer
// and the Nav menu), so consent can be changed or withdrawn as easily as it was
// given. It only dispatches the event; CookieDrop owns the UI and the state.
export default function CookieSettingsButton({ className, onActivate }: { className?: string; onActivate?: () => void }) {
  return (
    <button
      type="button"
      className={`${styles.link}${className ? " " + className : ""}`}
      onClick={() => { window.dispatchEvent(new Event("pc:manage-cookies")); onActivate?.(); }}
    >
      Cookie settings
    </button>
  );
}
