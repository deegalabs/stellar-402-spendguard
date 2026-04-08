"use client";

import { useId } from "react";

interface SpendGuardLogoProps {
  /** Rendered pixel size (width = height). Defaults to 32. */
  size?: number;
  /** Extra classes applied to the <svg> element. */
  className?: string;
  /** Draw a soft drop-shadow in the primary color. */
  glow?: boolean;
}

/**
 * SpendGuard brand mark.
 *
 * Concept: a rounded shield (protection) contains a 270° gauge arc
 * (budget meter) wrapped around a sealed center dot (on-chain core).
 * The three elements map directly to SpendGuard's three ideas:
 * guard, spend tracker, on-chain seal.
 *
 * Colors follow the brand gradient: primary (indigo #6366F1) →
 * accent (cyan #06B6D4).
 */
export default function SpendGuardLogo({
  size = 32,
  className = "",
  glow = false,
}: SpendGuardLogoProps) {
  // React's useId() uses ":" which breaks inside SVG url(#...) references.
  const rawId = useId();
  const gradId = `sg-grad-${rawId.replace(/:/g, "")}`;
  const ringGradId = `sg-ring-${rawId.replace(/:/g, "")}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} ${glow ? "drop-shadow-[0_0_12px_rgba(99,102,241,0.45)]" : ""}`.trim()}
      role="img"
      aria-label="SpendGuard"
    >
      {/* Shield silhouette — rounded top, pointed bottom */}
      <path
        d="M16 2.5 L27 6 V16.5 C27 22 22.5 27 16 29.5 C9.5 27 5 22 5 16.5 V6 Z"
        fill={`url(#${gradId})`}
      />

      {/* Subtle inner highlight to add depth */}
      <path
        d="M16 2.5 L27 6 V16.5 C27 22 22.5 27 16 29.5 C9.5 27 5 22 5 16.5 V6 Z"
        fill="none"
        stroke="white"
        strokeOpacity="0.14"
        strokeWidth="0.8"
      />

      {/* 270° gauge arc — represents the budget meter.
          Circumference = 2π·6.5 ≈ 40.84 units.
          Dash 30.6 / gap 10.24 → 75% filled sweep. */}
      <circle
        cx="16"
        cy="15.8"
        r="6.5"
        fill="none"
        stroke={`url(#${ringGradId})`}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeDasharray="30.6 10.24"
        transform="rotate(135 16 15.8)"
      />

      {/* Sealed center dot — the on-chain core */}
      <circle cx="16" cy="15.8" r="1.8" fill="white" />

      <defs>
        <linearGradient
          id={gradId}
          x1="4"
          y1="2"
          x2="28"
          y2="30"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#6366F1" />
          <stop offset="1" stopColor="#06B6D4" />
        </linearGradient>
        <linearGradient
          id={ringGradId}
          x1="9"
          y1="9"
          x2="23"
          y2="23"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.98" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0.72" />
        </linearGradient>
      </defs>
    </svg>
  );
}
