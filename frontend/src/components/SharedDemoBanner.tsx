"use client";

import { useEffect, useState } from "react";

/**
 * Public-shared-demo disclosure banner.
 *
 * The hackathon instance is a *single* Soroban contract on testnet —
 * every visitor reads and writes the same state (owner, agent, limits,
 * spent_today, paused flag). Without a visible label this looks like a
 * per-user product, which (a) makes the "Pause" button read as a
 * missing-auth vuln and (b) makes cross-visitor collisions look like
 * bugs. Rendered globally in layout.tsx so every route inherits it.
 *
 * Dismissable for the session so it doesn't steal pixels from the demo
 * video itself (stored in sessionStorage, not localStorage — judges
 * opening a fresh tab see it again).
 */
const STORAGE_KEY = "spendguard.shared-demo-banner.dismissed";

export default function SharedDemoBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissed = window.sessionStorage.getItem(STORAGE_KEY) === "1";
    setVisible(!dismissed);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full bg-warning-glow border-b border-warning/30 text-warning-fg text-[12px] sm:text-[13px] px-4 py-2 flex items-center justify-center gap-3"
    >
      <span
        translate="no"
        aria-hidden="true"
        className="material-symbols-outlined text-[16px] shrink-0"
      >
        public
      </span>
      <span className="text-center leading-snug">
        <strong className="font-semibold">Public shared demo.</strong>{" "}
        All visitors operate on one Stellar testnet contract — state is
        global. Runs are serialized and self-heal between visitors. Not
        for real funds.
      </span>
      <button
        type="button"
        onClick={() => {
          window.sessionStorage.setItem(STORAGE_KEY, "1");
          setVisible(false);
        }}
        className="shrink-0 rounded-md p-1 hover:bg-white/10 transition-colors"
        aria-label="Dismiss banner"
      >
        <span
          translate="no"
          aria-hidden="true"
          className="material-symbols-outlined text-[16px]"
        >
          close
        </span>
      </button>
    </div>
  );
}
