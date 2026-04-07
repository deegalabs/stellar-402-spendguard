"use client";

import Link from "next/link";

export default function OnboardingPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center animate-fade-in -mt-8">
      {/* Empty State Container */}
      <div className="max-w-2xl w-full text-center flex flex-col items-center">
        {/* Central Visual Anchor */}
        <div className="relative mb-8">
          <div className="w-[140px] h-[140px] bg-white rounded-xl shadow-hero flex flex-col items-center justify-center border border-white">
            <span
              className="material-symbols-outlined text-[64px] text-secondary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              credit_card
            </span>
          </div>
          {/* Badges */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-2 w-full justify-center">
            <span className="bg-tertiary-fixed text-on-tertiary-container text-[10px] font-bold px-2 py-1 rounded shadow-sm whitespace-nowrap border border-white/50">
              SOROBAN PROTECTED
            </span>
            <span className="bg-secondary text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm whitespace-nowrap border border-white/50">
              x402 Active
            </span>
          </div>
        </div>

        {/* Textual Content */}
        <h1 className="text-[28px] font-bold text-primary tracking-tight mb-4">
          Ready to launch your governance fleet?
        </h1>
        <p className="text-[#64748B] text-[15px] leading-relaxed max-w-lg mb-10">
          No agents funded yet. Add funds via Stripe to get started. Secure your computational resources and initiate the x402 governance protocol.
        </p>

        {/* Actions */}
        <div className="flex items-center gap-3 mb-16">
          <Link
            href="/liquidity"
            className="bg-primary text-white h-11 px-6 rounded-lg font-semibold flex items-center gap-2 hover:bg-primary-container transition-all active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[18px]">bolt</span>
            Top Up with Stripe
          </Link>
          <Link
            href="/docs"
            className="bg-white text-primary border border-outline-variant h-11 px-6 rounded-lg font-semibold hover:bg-surface-container-low transition-all flex items-center"
          >
            Read Docs
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full text-left">
          <div className="bg-white p-6 rounded-xl shadow-bento flex gap-4">
            <div className="shrink-0 w-10 h-10 bg-surface-container flex items-center justify-center rounded-lg">
              <span className="material-symbols-outlined text-primary text-[20px]">verified_user</span>
            </div>
            <div>
              <h3 className="text-primary font-bold text-[14px] uppercase tracking-wide mb-1">Soroban Protection</h3>
              <p className="text-[#64748B] text-[13px] leading-snug">
                Hardened smart contract logic ensures your assets remain under institutional governance at all times.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-bento flex gap-4">
            <div className="shrink-0 w-10 h-10 bg-surface-container flex items-center justify-center rounded-lg">
              <span className="material-symbols-outlined text-primary text-[20px]">account_balance</span>
            </div>
            <div>
              <h3 className="text-primary font-bold text-[14px] uppercase tracking-wide mb-1">x402 Protocol</h3>
              <p className="text-[#64748B] text-[13px] leading-snug">
                The industry standard for automated treasury disbursement and multi-sig agent delegation on Stellar.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Global Footer */}
      <footer className="mt-16 text-center">
        <p className="text-[11px] font-bold text-[#64748B] tracking-[0.1em] uppercase">
          Powered by Stellar Network &amp; Stripe Connect &copy; 2026 SpendGuard
        </p>
      </footer>
    </div>
  );
}
