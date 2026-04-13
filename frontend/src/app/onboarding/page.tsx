"use client";

import Link from "next/link";

export default function OnboardingPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center animate-fade-in -mt-8 px-4">
      <div className="max-w-2xl w-full text-center flex flex-col items-center">
        {/* Visual Anchor */}
        <div className="relative mb-8">
          <div className="w-[120px] h-[120px] lg:w-[140px] lg:h-[140px] bg-gradient-to-br from-primary-500/20 to-accent-500/20 rounded-2xl flex items-center justify-center border border-primary/20 shadow-glow-primary">
            <span
              translate="no"
              className="material-symbols-outlined text-[56px] lg:text-[64px] text-primary-fg"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              credit_card
            </span>
          </div>
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-2 w-full justify-center">
            <span className="badge-success whitespace-nowrap">SOROBAN PROTECTED</span>
            <span className="badge-info whitespace-nowrap">x402 Active</span>
          </div>
        </div>

        <h1 className="text-2xl lg:text-[28px] font-bold text-text-primary tracking-tight mb-4 mt-4">
          Ready to launch your governance fleet?
        </h1>
        <p className="text-text-muted text-sm lg:text-[15px] leading-relaxed max-w-lg mb-10">
          No agents funded yet. Add funds via Stripe to get started with x402 governance on Stellar.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 mb-16">
          <Link href="/liquidity" className="btn-primary">
            <span translate="no" className="material-symbols-outlined text-[18px]">bolt</span>
            Top Up with Stripe
          </Link>
          <Link href="/docs" className="btn-secondary">
            Read Docs
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full text-left">
          <div className="card flex gap-4">
            <div className="shrink-0 w-10 h-10 bg-primary-glow flex items-center justify-center rounded-lg">
              <span translate="no" className="material-symbols-outlined text-primary-fg text-[20px]">verified_user</span>
            </div>
            <div>
              <h3 className="text-text-primary font-bold text-[14px] uppercase tracking-wide mb-1">Soroban Protection</h3>
              <p className="text-text-muted text-[13px] leading-snug">
                Smart contract governance ensures assets remain under institutional control at all times.
              </p>
            </div>
          </div>

          <div className="card flex gap-4">
            <div className="shrink-0 w-10 h-10 bg-accent-glow flex items-center justify-center rounded-lg">
              <span translate="no" className="material-symbols-outlined text-accent-fg text-[20px]">account_balance</span>
            </div>
            <div>
              <h3 className="text-text-primary font-bold text-[14px] uppercase tracking-wide mb-1">x402 Protocol</h3>
              <p className="text-text-muted text-[13px] leading-snug">
                Automated treasury disbursement and multi-sig agent delegation on Stellar.
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer className="mt-16 text-center">
        <p className="text-[11px] font-bold text-text-disabled tracking-[0.1em] uppercase">
          Powered by Stellar Network &amp; Stripe Connect
        </p>
      </footer>
    </div>
  );
}
