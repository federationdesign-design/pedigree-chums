"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import BreedTree from "../BreedTree/BreedTree";
import type { LineageNode } from "../../data/lineage";

type Props = {
  name: string;
  image: string;
  character?: string;
  fact?: string;
  lineage: LineageNode;
  onClose: () => void;
};

export default function LineageModal({ name, image, character, lineage, onClose }: Props) {
  const [treeActive, setTreeActive] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    document.body.classList.add("pc-modal-open");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      document.body.classList.remove("pc-modal-open");
    };
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={name}
      style={{
        position: "fixed", inset: 0, zIndex: 900,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.55)", padding: "16px",
      }}
    >
      {/* Modal card -- the one and only container */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: "min(1344px, 96vw)",
          height: "min(90vh, 880px)",
          background: "linear-gradient(to top right, #00e2ff, #008eff)",
          borderRadius: 28,
          boxShadow: "0 24px 80px rgba(0,0,0,0.4)",
          overflow: "hidden",
        }}
      >
        {/* BreedTree fills the full modal -- no inner wrapper */}
        <BreedTree root={lineage} rootImage={image} onActiveChange={setTreeActive} onClose={onClose} />

        {/* Title + description -- absolute top right, above the tree */}
        <div
          style={{
            position: "absolute",
            top: 28,
            right: 80,
            zIndex: 10,
            textAlign: "right",
            maxWidth: 280,
            opacity: treeActive ? 0.08 : 1,
            transition: "opacity 0.35s ease",
            pointerEvents: treeActive ? "none" : "auto",
          }}
        >
          <h3 style={{
            fontFamily: "var(--font-display,'Luckiest Guy',system-ui)",
            fontSize: "clamp(2.4rem, 6vw, 4rem)",
            color: "#ffffff",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            margin: "0 0 8px",
            lineHeight: 1.1,
          }}>{name}</h3>
          {character && (
            <p style={{
              fontFamily: "var(--font-body,'Montserrat',system-ui)",
              fontSize: "0.9rem",
              fontWeight: 500,
              color: "rgba(255,255,255,0.9)",
              margin: 0,
              lineHeight: 1.5,
            }}>{character}</p>
          )}
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute", top: 20, right: 24, zIndex: 20,
            appearance: "none", border: 0, background: "transparent",
            color: "#ffffff", width: 56, height: 56,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 0, cursor: "pointer",
          }}
        >
          <svg viewBox="0 0 32 32" aria-hidden="true" style={{ width: 32, height: 32 }}>
            <line x1="7" y1="7" x2="25" y2="25" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            <line x1="25" y1="7" x2="7" y2="25" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>,
    document.body,
  );
}
