"use client";

import { usePathname } from "next/navigation";
import { useFreighter } from "@/hooks/useFreighter";
import { shortAddress } from "@/lib/format";

const DEMO_WALLET = "GBF5LCVZQ5VQ5DOE57DXY4PDDWS2BGACEJBGJUJYAJSGJKOWHZ5TTLOY";

interface HeaderProps {
  paused?: boolean;
  onMenuClick?: () => void;
}

export default function Header({ paused, onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const isDemo = pathname === "/demo";
  const { connected, publicKey, loading, connect } = useFreighter();

  const showWallet = isDemo || (connected && publicKey);
  const walletAddress = isDemo ? DEMO_WALLET : publicKey;

  return (
    <header className="h-[56px] w-full bg-dark-50/80 backdrop-blur-xl sticky top-0 z-40 border-b border-surface-border flex items-center justify-between px-4 lg:px-6 shrink-0">
      {/* Left */}
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          onClick={onMenuClick}
          className="lg:hidden text-text-muted hover:text-text-primary p-1.5 rounded-lg hover:bg-white/5 transition-colors"
        >
          <span className="material-symbols-outlined text-[22px]">menu</span>
        </button>

        <span className="text-sm font-bold text-text-primary hidden sm:flex items-center gap-2">
          Deega Labs
          <span className="text-text-muted font-normal">-</span>
          <span className="gradient-text">SpendGuard</span>
        </span>

        {paused && (
          <div className="flex items-center gap-1.5 bg-error-glow border border-error/30 text-error-400 text-[10px] font-bold px-3 py-1 rounded-full animate-pulse">
            <span className="w-1.5 h-1.5 bg-error-400 rounded-full" />
            PAUSED
          </div>
        )}

        {isDemo && (
          <div className="flex items-center gap-1.5 bg-accent-glow border border-accent/30 text-accent-400 text-[10px] font-bold px-3 py-1 rounded-full">
            <span className="material-symbols-outlined text-[12px]">play_circle</span>
            LIVE DEMO
          </div>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <button className="material-symbols-outlined text-text-muted hover:text-text-primary text-[20px] p-2 rounded-lg hover:bg-white/5 transition-colors">
          notifications
        </button>

        {/* Wallet */}
        {showWallet ? (
          <div className="flex items-center gap-2 bg-surface-card border border-surface-border px-3 py-1.5 rounded-lg">
            <span className={`w-2 h-2 rounded-full ${isDemo ? "bg-accent-400" : "bg-success-400"} animate-pulse`} />
            <span className="text-xs font-mono text-text-secondary hidden sm:inline">
              {shortAddress(walletAddress!)}
            </span>
            {isDemo && (
              <span className="text-[9px] font-bold text-accent-400 uppercase">Demo</span>
            )}
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center ml-1">
              <span className="material-symbols-outlined text-white text-[14px]">
                {isDemo ? "smart_toy" : "person"}
              </span>
            </div>
          </div>
        ) : (
          <button
            onClick={connect}
            disabled={loading}
            className="btn-primary text-xs py-1.5 px-4"
          >
            {loading ? "Connecting..." : "Connect Wallet"}
          </button>
        )}
      </div>
    </header>
  );
}
