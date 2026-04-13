"use client";

import { useState } from "react";
import Link from "next/link";
import DocsSidebar from "./DocsSidebar";
import ThemeToggle from "./ThemeToggle";
import SpendGuardLogo from "./SpendGuardLogo";

/**
 * Client shell for the docs section.
 *
 * Owns the mobile nav drawer state so `DocsSidebar` can render as a
 * fixed desktop rail and as an overlaid drawer on small screens. The
 * parent route layout stays a server component.
 */
export default function DocsShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-dark text-text-primary">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 z-50 w-full flex justify-between items-center px-4 sm:px-6 h-16 bg-dark-50/80 backdrop-blur-xl border-b border-surface-border">
        <div className="flex items-center gap-3 lg:gap-8 min-w-0">
          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="lg:hidden text-text-muted hover:text-text-primary p-1 -ml-1 shrink-0"
            aria-label="Open documentation navigation"
          >
            <span translate="no" className="material-symbols-outlined text-[24px]">menu</span>
          </button>

          <Link href="/" className="flex items-center gap-2 sm:gap-3 group min-w-0">
            <SpendGuardLogo
              size={32}
              glow
              className="shrink-0 transition-transform group-hover:scale-105"
            />
            <span className="text-base sm:text-lg font-bold tracking-tight gradient-text truncate">
              SpendGuard
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm tracking-tight">
            <Link
              href="/dashboard"
              className="text-text-muted font-medium hover:text-accent-fg transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/audit"
              className="text-text-muted font-medium hover:text-accent-fg transition-colors"
            >
              Analytics
            </Link>
            <span className="text-accent-fg border-b-2 border-accent-fg pb-1 font-medium">
              Documentation
            </span>
            <Link
              href="/vault"
              className="text-text-muted font-medium hover:text-accent-fg transition-colors"
            >
              Settings
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 shrink-0">
          <div className="hidden xl:flex items-center gap-2 px-3 py-1 bg-surface-card border border-surface-border rounded-full">
            <span className="w-2 h-2 rounded-full bg-success-fg animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-text-muted">
              Stellar Testnet: Active
            </span>
          </div>
          <ThemeToggle />
          <button translate="no" className="hidden sm:inline-flex material-symbols-outlined text-text-muted hover:text-text-primary text-[20px] p-2 rounded-lg hover:bg-surface-bright transition-colors">
            help
          </button>
          <button translate="no" className="hidden sm:inline-flex material-symbols-outlined text-text-muted hover:text-text-primary text-[20px] p-2 rounded-lg hover:bg-surface-bright transition-colors">
            notifications
          </button>
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 overflow-hidden ml-1 flex items-center justify-center shrink-0">
            <span translate="no" className="material-symbols-outlined text-white text-[16px]">person</span>
          </div>
        </div>
      </header>

      {/* Sidebar (fixed on desktop, drawer on mobile) */}
      <DocsSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Main Content — sidebar has 256px on desktop, no offset on mobile */}
      <main className="lg:ml-64 mt-16 p-4 sm:p-6 lg:p-12 max-w-6xl">
        {children}
      </main>
    </div>
  );
}
