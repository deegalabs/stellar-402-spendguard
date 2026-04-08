"use client";

import { useState, useEffect, useMemo } from "react";
import { useContractStatus } from "@/hooks/useContractStatus";
import { useFreighter } from "@/hooks/useFreighter";
import { stroopsToUsdc, usdcToStroops, shortAddress, relativeTime } from "@/lib/format";
import {
  setDailyLimit,
  setMaxTx,
  whitelistMerchant,
  removeMerchant,
  pauseContract,
  unpauseContract,
  setAuthAddress,
  getTransactions,
} from "@/lib/api";
import type { TransactionEvent } from "@/lib/types";

function spendBarColor(pct: number): string {
  if (pct >= 90) return "bg-error-500";
  if (pct >= 70) return "bg-warning-400";
  return "bg-primary-500";
}

export default function VaultPage() {
  const { status, loading, refresh } = useContractStatus();
  const { publicKey } = useFreighter();

  // Set connected wallet as auth for admin endpoints
  useEffect(() => {
    if (publicKey) setAuthAddress(publicKey);
    return () => setAuthAddress(null);
  }, [publicKey]);

  const [dailyInput, setDailyInput] = useState("");
  const [maxTxInput, setMaxTxInput] = useState("");
  const [merchantInput, setMerchantInput] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "ok" | "err" } | null>(null);
  const [showKillModal, setShowKillModal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [autonomousMode, setAutonomousMode] = useState(true);
  const [recentTxs, setRecentTxs] = useState<TransactionEvent[]>([]);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);

  // Load recent merchant activity from the on-chain audit log.
  useEffect(() => {
    let active = true;
    const load = () =>
      getTransactions(50)
        .then((r) => {
          if (!active) return;
          setRecentTxs(r.transactions);
          setLastSyncAt(new Date().toISOString());
        })
        .catch(() => {});
    load();
    const id = setInterval(load, 15000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  // Distinct merchants the agent has recently paid — real data from Horizon.
  const recentMerchants = useMemo(() => {
    const seen = new Map<string, string>();
    for (const tx of recentTxs) {
      if (tx.status === "settled" && tx.merchant && !seen.has(tx.merchant)) {
        seen.set(tx.merchant, tx.timestamp);
      }
    }
    return Array.from(seen.entries()).slice(0, 5);
  }, [recentTxs]);

  async function exec(label: string, fn: () => Promise<unknown>) {
    setBusy(true);
    setMessage(null);
    try {
      await fn();
      setMessage({ text: `${label} succeeded`, type: "ok" });
      refresh();
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : "Failed", type: "err" });
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-text-muted">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading...
        </div>
      </div>
    );
  }

  const spentPct = status
    ? Math.round((Number(status.spent_today) / Math.max(Number(status.daily_limit), 1)) * 100)
    : 0;
  const dailyLimitUsdc = status ? stroopsToUsdc(status.daily_limit) : "0.00";
  const maxTxUsdc = status ? stroopsToUsdc(status.max_tx_value) : "0.00";
  const spentUsdc = status ? stroopsToUsdc(status.spent_today) : "0.00";

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-text-primary">Agent Vault</h2>
        <p className="text-text-muted mt-1">
          Precision governance for your Soroban-powered autonomous agent.
        </p>
      </div>

      {/* Notification */}
      {message && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm animate-slide-up ${
          message.type === "ok"
            ? "bg-success-glow text-success-fg"
            : "bg-error-glow text-error-fg"
        }`}>
          <span className={`w-2 h-2 rounded-full ${message.type === "ok" ? "bg-success-400" : "bg-error-500"}`} />
          {message.text}
        </div>
      )}

      {/* Top row: Agent Info + Budget Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Agent Identity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Agent Card */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-[20px]">smart_toy</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-text-primary">Sentinel Alpha-1</h3>
                  <span className="badge-success uppercase tracking-wider text-[9px]">Active</span>
                </div>
                <p className="text-xs font-mono text-text-muted">
                  ID: {shortAddress(status?.agent ?? "")}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between py-3 border-t border-surface-border">
              <span className="text-sm font-semibold text-text-primary">Autonomous Mode</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autonomousMode}
                  onChange={() => setAutonomousMode(!autonomousMode)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-dark-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-dark-100 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500" />
              </label>
            </div>
          </div>

          {/* Security Guardrails */}
          <div className="card">
            <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">verified_user</span>
              Security Guardrails
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="stat-label">Recent Merchants</p>
                <span className="text-[9px] font-mono uppercase tracking-wider text-text-disabled">
                  On-Chain
                </span>
              </div>
              {recentMerchants.length > 0 ? (
                <div className="space-y-1.5">
                  {recentMerchants.map(([addr, ts]) => (
                    <div
                      key={addr}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-success-400 shrink-0" />
                        <span className="font-mono text-xs text-text-secondary truncate">
                          {shortAddress(addr)}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-text-muted shrink-0">
                        {relativeTime(ts)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-text-muted italic">
                  No settled payments yet. Whitelisted merchants will appear here after the first transaction.
                </p>
              )}

              {/* Add merchant */}
              <div className="flex gap-2 mt-3">
                <input
                  type="text"
                  placeholder="G... Stellar address"
                  value={merchantInput}
                  onChange={(e) => setMerchantInput(e.target.value)}
                  className="input-field text-xs flex-1"
                />
                <button
                  disabled={busy || !merchantInput}
                  onClick={() => {
                    exec("Whitelist merchant", () => whitelistMerchant(merchantInput));
                    setMerchantInput("");
                  }}
                  className="btn-accent text-xs px-3"
                >
                  Add
                </button>
                <button
                  disabled={busy || !merchantInput}
                  onClick={() => {
                    exec("Remove merchant", () => removeMerchant(merchantInput));
                    setMerchantInput("");
                  }}
                  className="btn-danger text-xs px-3"
                >
                  Remove
                </button>
              </div>
              <p className="text-[10px] text-text-disabled italic mt-2">
                Whitelist is enforced on-chain. Use Add / Remove above to update the contract directly.
              </p>
            </div>
          </div>

          {/* Emergency Kill Switch */}
          <div className="card border-2 border-error/30 bg-error-glow">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-error-fg text-[20px]">warning</span>
              <h3 className="font-bold text-error-fg uppercase text-sm tracking-wide">Emergency Kill Switch</h3>
            </div>
            <p className="text-xs text-text-muted mb-4">
              {status?.paused
                ? "Contract is PAUSED. No new payments will be authorized."
                : "Instantly revoke all Soroban authorization for this agent. This action cannot be undone without manual contract deployment."}
            </p>
            <button
              onClick={() => {
                if (status?.paused) {
                  exec("Unpause", unpauseContract);
                } else {
                  setShowKillModal(true);
                }
              }}
              disabled={busy}
              className={`w-full font-bold text-sm py-2.5 rounded-lg transition-colors disabled:opacity-50 ${
                status?.paused
                  ? "btn-accent"
                  : "btn-danger"
              }`}
            >
              {status?.paused ? "Resume Operations" : "Revoke Soroban Auth"}
            </button>
          </div>
        </div>

        {/* Right: Budget Control Panel */}
        <div className="lg:col-span-3 card">
          <h3 className="font-semibold text-text-primary mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">account_balance</span>
            Budget Control Panel
          </h3>

          {/* Daily Spending Limit */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <p className="stat-label">Daily Spending Limit</p>
              <span className="text-xs text-text-muted font-mono">
                Used today: ${spentUsdc} ({spentPct}%)
              </span>
            </div>
            <p className="text-3xl font-bold text-text-primary font-mono mb-3">
              {Number(dailyLimitUsdc).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              <span className="text-sm font-normal text-text-muted ml-2">USDC</span>
            </p>
            <div className="w-full bg-dark-300 rounded-full h-2.5 mb-2">
              <div
                className={`h-2.5 rounded-full transition-all ${spendBarColor(spentPct)}`}
                style={{ width: `${Math.min(spentPct, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-text-muted font-mono">
              <span>0 USDC</span>
              <span>{Number(dailyLimitUsdc).toLocaleString()} USDC</span>
            </div>
            <div className="flex gap-3 mt-4">
              <input
                type="number"
                placeholder="New limit in USDC"
                value={dailyInput}
                onChange={(e) => setDailyInput(e.target.value)}
                className="input-field flex-1"
              />
              <button
                disabled={busy || !dailyInput}
                onClick={() => exec("Set daily limit", () => setDailyLimit(usdcToStroops(Number(dailyInput))))}
                className="btn-primary"
              >
                Update
              </button>
            </div>
          </div>

          {/* Max Transaction Value */}
          <div className="mb-8">
            <p className="stat-label mb-2">Max Transaction Value</p>
            <p className="text-3xl font-bold text-text-primary font-mono mb-3">
              {Number(maxTxUsdc).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              <span className="text-sm font-normal text-text-muted ml-2">USDC</span>
            </p>
            <div className="w-full bg-dark-300 rounded-full h-2.5 mb-2">
              <div
                className="h-2.5 rounded-full bg-primary-500 transition-all"
                style={{
                  width: `${
                    Number(dailyLimitUsdc) > 0
                      ? Math.min(
                          (Number(maxTxUsdc) / Number(dailyLimitUsdc)) * 100,
                          100,
                        )
                      : 0
                  }%`,
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-text-muted font-mono">
              <span>0 USDC</span>
              <span>{Number(dailyLimitUsdc).toLocaleString()} USDC (daily cap)</span>
            </div>
            <div className="flex gap-3 mt-4">
              <input
                type="number"
                placeholder="New max per tx in USDC"
                value={maxTxInput}
                onChange={(e) => setMaxTxInput(e.target.value)}
                className="input-field flex-1"
              />
              <button
                disabled={busy || !maxTxInput}
                onClick={() => exec("Set max tx", () => setMaxTx(usdcToStroops(Number(maxTxInput))))}
                className="btn-primary"
              >
                Update
              </button>
            </div>
          </div>

          {/* Footer stats */}
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-surface-border">
            <div>
              <p className="stat-label">Network</p>
              <p className="text-sm font-bold text-text-primary mt-1 flex items-center gap-1 uppercase font-mono">
                <span className="material-symbols-outlined text-text-muted text-[16px]">lan</span>
                Stellar {status?.network ?? "—"}
              </p>
            </div>
            <div>
              <p className="stat-label">Last Sync</p>
              <p className="text-sm font-bold text-text-primary mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-success-fg text-[16px]">sync</span>
                {lastSyncAt ? relativeTime(lastSyncAt) : "—"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Kill Switch Confirmation Modal */}
      {showKillModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-dark-100 rounded-xl p-6 max-w-md w-full mx-4 shadow-panel animate-slide-up">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 bg-error-glow rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-error-fg text-[20px]">warning</span>
              </div>
              <h3 className="text-lg font-bold text-error-fg">Confirm Emergency Pause</h3>
            </div>
            <p className="text-sm text-text-muted mb-6">
              This will immediately block all new payment authorizations.
              In-flight transactions already on the ledger are final and cannot be reversed.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowKillModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowKillModal(false);
                  exec("Emergency pause", pauseContract);
                }}
                className="btn-danger"
              >
                Yes, Pause Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
