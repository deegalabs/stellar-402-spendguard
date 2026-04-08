"use client";

import { usePathname } from "next/navigation";
import { useFreighter } from "@/hooks/useFreighter";
import { shortAddress } from "@/lib/format";

// Fixed demo wallet (Owner account on Testnet)
const DEMO_WALLET = "GBF5LCVZQ5VQ5DOE57DXY4PDDWS2BGACEJBGJUJYAJSGJKOWHZ5TTLOY";

interface HeaderProps {
  paused?: boolean;
}

export default function Header({ paused }: HeaderProps) {
  const pathname = usePathname();
  const isDemo = pathname === "/demo";
  const { connected, publicKey, loading, connect, error } = useFreighter();

  const showWallet = isDemo || (connected && publicKey);
  const walletAddress = isDemo ? DEMO_WALLET : publicKey;

  return (
    <header className="h-[56px] w-full bg-white sticky top-0 z-50 border-b border-outline-variant flex items-center justify-between px-6 shrink-0">
      {/* Left: Title + Status */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-bold text-primary flex items-center gap-2">
          Deega Labs — SpendGuard
        </span>

        {paused && (
          <div className="flex items-center gap-1.5 bg-error-container text-on-error-container text-[10px] font-bold px-3 py-1 rounded animate-pulse">
            <span className="w-1.5 h-1.5 bg-error rounded-full" />
            CONTRACT PAUSED
          </div>
        )}

        {isDemo && (
          <div className="flex items-center gap-1.5 bg-secondary/10 text-secondary text-[10px] font-bold px-3 py-1 rounded">
            <span className="material-symbols-outlined text-[14px]">play_circle</span>
            LIVE DEMO MODE
          </div>
        )}
      </div>

      {/* Right: Notification + Wallet */}
      <div className="flex items-center gap-4">
        {!isDemo && error && (
          <span className="text-xs text-error">{error}</span>
        )}

        {/* Notification bell */}
        <button className="material-symbols-outlined text-outline hover:bg-surface-container-low p-2 rounded-full transition-colors">
          notifications
        </button>

        {/* Wallet display */}
        {showWallet ? (
          <div className="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-lg border border-outline-variant">
            <span className={`w-2 h-2 rounded-full ${isDemo ? "bg-secondary" : "bg-tertiary-fixed-dim"}`} />
            <span className="text-sm font-mono text-on-surface-variant">
              {shortAddress(walletAddress!)}
            </span>
            {isDemo && (
              <span className="text-[9px] font-bold text-secondary uppercase">Demo</span>
            )}
            <div className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant bg-surface-container flex items-center justify-center ml-1">
              <span className="material-symbols-outlined text-primary text-[18px]">
                {isDemo ? "smart_toy" : "person"}
              </span>
            </div>
          </div>
        ) : (
          <button
            onClick={connect}
            disabled={loading}
            className="bg-primary text-white px-4 py-1.5 rounded text-[13px] font-medium hover:bg-primary-container transition-colors disabled:opacity-50"
          >
            {loading ? "Connecting..." : "Connect Freighter Wallet"}
          </button>
        )}
      </div>
    </header>
  );
}
