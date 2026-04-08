"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Avoid SSR/hydration mismatch — render placeholder until mounted
  if (!mounted) {
    return (
      <button
        aria-label="Toggle theme"
        className="w-9 h-9 rounded-lg bg-surface-card border border-surface-border"
      />
    );
  }

  const current = theme === "system" ? resolvedTheme : theme;
  const isDark = current === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="w-9 h-9 rounded-lg bg-surface-card border border-surface-border flex items-center justify-center text-text-muted hover:text-text-primary hover:border-primary/30 transition-all"
    >
      <span className="material-symbols-outlined text-[18px]">
        {isDark ? "light_mode" : "dark_mode"}
      </span>
    </button>
  );
}
