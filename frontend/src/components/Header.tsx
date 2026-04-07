"use client";

import { useFreighter } from "@/hooks/useFreighter";
import { shortAddress } from "@/lib/format";

interface HeaderProps {
  paused?: boolean;
}

export default function Header({ paused }: HeaderProps) {
  const { connected, publicKey, loading, connect, error } = useFreighter();

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        {paused && (
          <div className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
            CONTRACT PAUSED
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {error && (
          <span className="text-xs text-red-500">{error}</span>
        )}

        {connected && publicKey ? (
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-sm font-mono text-slate-700">
              {shortAddress(publicKey)}
            </span>
          </div>
        ) : (
          <button
            onClick={connect}
            disabled={loading}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Connecting..." : "Connect Freighter"}
          </button>
        )}
      </div>
    </header>
  );
}
