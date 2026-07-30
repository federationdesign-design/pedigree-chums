"use client";

// The "Designed & Printed in Britain" popup, opened by tapping the Union Jack.
// Lifted verbatim out of PackPit so the main pit and the mini pit share one
// copy and can never drift apart. Markup and styling are unchanged; only the
// dismiss action is passed in, because each pit clears its own flag its own way.
export default function BritainMessage({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
      <div style={{ position: "relative", pointerEvents: "auto", maxWidth: "clamp(320px,45vw,680px)", width: "90%", padding: "clamp(24px,3vw,48px) clamp(28px,4vw,56px) clamp(36px,5vw,64px)", borderRadius: "24px", background: "rgba(255,255,255,0.12)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", border: "2px solid rgba(255,255,255,0.35)", boxShadow: "0 16px 48px rgba(10,58,87,0.28)", textAlign: "center" }}>
        <p style={{ fontFamily: "var(--font-display,'Luckiest Guy',system-ui)", fontSize: "clamp(20px,3.4vw,44px)", color: "#ffffff", margin: "0 0 clamp(12px,2vw,24px)", textShadow: "0 3px 0 rgba(10,58,87,0.5), 0 0 20px rgba(255,255,255,0.15)", letterSpacing: "0.02em" }}>Designed &amp; Printed in Britain</p>
        <p style={{ fontFamily: "Montserrat,sans-serif", fontSize: "clamp(13px,1.6vw,20px)", fontWeight: 600, color: "#ffffff", margin: "0 0 clamp(8px,1.2vw,16px)", lineHeight: 1.6, opacity: 0.92 }}>Every card in the Pedigree Chums&trade; deck is printed right here in Britain, using sustainable inks on premium card stock.</p>
        <p style={{ fontFamily: "Montserrat,sans-serif", fontSize: "clamp(13px,1.6vw,20px)", fontWeight: 600, color: "#ffffff", margin: "0", lineHeight: 1.6, opacity: 0.92 }}>Conceived, illustrated and crafted by a British creative team with a passion for dogs.</p>
        <button
          onClick={onDismiss}
          style={{ position: "absolute", bottom: 0, left: "50%", transform: "translate(-50%, 50%)", width: "clamp(52px,6vw,72px)", height: "clamp(52px,6vw,72px)", borderRadius: "50%", border: "4px solid rgba(255,255,255,0.5)", background: "radial-gradient(circle at 38% 35%, #6ee86e, #22b422 55%, #157a15)", boxShadow: "0 4px 16px rgba(10,58,87,0.35), inset 0 2px 4px rgba(255,255,255,0.4)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "clamp(22px,3vw,36px)", lineHeight: 1 }}
          aria-label="Got it"
        >
          &#10003;
        </button>
      </div>
    </div>
  );
}
