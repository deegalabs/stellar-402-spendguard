"use client";

import { useFreighter } from "@/hooks/useFreighter";
import { shortAddress } from "@/lib/format";

interface HeaderProps {
  paused?: boolean;
}

export default function Header({ paused }: HeaderProps) {
  const { connected, publicKey, loading, connect, error } = useFreighter();

  return (
    <header className="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-6">
      {/* Left: Title + Status */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-neutral-600">
          Deega Labs — <span className="text-neutral-900 font-semibold">SpendGuard</span>
        </span>

        {paused && (
          <div className="flex items-center gap-1.5 bg-danger-50 text-danger-700 text-xs font-bold px-3 py-1 rounded-full animate-pulse">
            <span className="w-1.5 h-1.5 bg-danger rounded-full" />
            CONTRACT PAUSED
          </div>
        )}
      </div>

      {/* Right: Notification + Wallet */}
      <div className="flex items-center gap-3">
        {error && (
          <span className="text-xs text-danger-500">{error}</span>
        )}

        {/* Notification bell */}
        <button className="relative p-2 text-neutral-400 hover:text-neutral-600 transition-colors rounded-lg hover:bg-neutral-100">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
        </button>

        {/* Wallet connection */}
        {connected && publicKey ? (
          <div className="flex items-center gap-2 bg-neutral-100 px-3 py-1.5 rounded-lg border border-neutral-200">
            <span className="w-2 h-2 bg-accent rounded-full" />
            <span className="text-sm font-mono text-neutral-700">
              {shortAddress(publicKey)}
            </span>
            {/* Avatar placeholder */}
            <div className="w-6 h-6 bg-secondary-100 rounded-full flex items-center justify-center ml-1">
              <svg className="w-3.5 h-3.5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
          </div>
        ) : (
          <button
            onClick={connect}
            disabled={loading}
            className="btn-primary text-sm"
          >
            {loading ? "Connecting..." : "Connect Freighter Wallet"}
          </button>
        )}
      </div>
    </header>
  );
}
