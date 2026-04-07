"use client";

import { useState } from "react";
import { useContractStatus } from "@/hooks/useContractStatus";
import { stroopsToUsdc, usdcToStroops, shortAddress, spendPercentColor } from "@/lib/format";
import {
  setDailyLimit,
  setMaxTx,
  whitelistMerchant,
  removeMerchant,
  pauseContract,
  unpauseContract,
} from "@/lib/api";

export default function VaultPage() {
  const { status, loading, refresh } = useContractStatus();

  const [dailyInput, setDailyInput] = useState("");
  const [maxTxInput, setMaxTxInput] = useState("");
  const [merchantInput, setMerchantInput] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "ok" | "err" } | null>(null);
  const [showKillModal, setShowKillModal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [autonomousMode, setAutonomousMode] = useState(true);

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
        <div className="flex items-center gap-3 text-neutral-500">
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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-headline text-neutral-900">Agent Vault</h2>
        <p className="text-sm text-neutral-500 mt-1">
          Precision governance for your Soroban-powered autonomous agent.
        </p>
      </div>

      {/* Notification */}
      {message && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm animate-slide-up ${
          message.type === "ok"
            ? "bg-accent-50 text-accent-700 border border-accent-200"
            : "bg-danger-50 text-danger-700 border border-danger-200"
        }`}>
          <span className={`w-2 h-2 rounded-full ${message.type === "ok" ? "bg-accent" : "bg-danger"}`} />
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
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-neutral-900">Sentinel Alpha-1</h3>
                  <span className="badge-success">Active</span>
                </div>
                <p className="text-xs font-mono text-neutral-400">
                  ID: {shortAddress(status?.agent ?? "")}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between py-3 border-t border-neutral-100">
              <span className="text-sm font-semibold text-neutral-700">Autonomous Mode</span>
              <button
                onClick={() => setAutonomousMode(!autonomousMode)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  autonomousMode ? "bg-secondary" : "bg-neutral-300"
                }`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  autonomousMode ? "left-[26px]" : "left-0.5"
                }`} />
              </button>
            </div>
          </div>

          {/* Security Guardrails */}
          <div className="card">
            <h3 className="text-title text-neutral-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              Security Guardrails
            </h3>

            <div className="space-y-3">
              <p className="stat-label">Merchant Whitelist</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <input type="checkbox" checked readOnly className="w-4 h-4 text-primary rounded" />
                  <span className="font-mono text-xs">stellar-dex.protocol.io</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <input type="checkbox" checked readOnly className="w-4 h-4 text-primary rounded" />
                  <span className="font-mono text-xs">amm-liquidity.stellar.com</span>
                </div>
              </div>

              {/* Add merchant */}
              <div className="flex gap-2 mt-3">
                <input
                  type="text"
                  placeholder="G... Stellar address"
                  value={merchantInput}
                  onChange={(e) => setMerchantInput(e.target.value)}
                  className="input-field font-mono text-xs flex-1"
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
              <button className="text-xs text-secondary font-semibold mt-2 hover:underline">
                + Add New Merchant Endpoint
              </button>
            </div>
          </div>

          {/* Emergency Kill Switch */}
          <div className="card border-2 border-danger-200 bg-danger-50/20">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <h3 className="font-bold text-danger-700 uppercase text-sm tracking-wide">Emergency Kill Switch</h3>
            </div>
            <p className="text-xs text-neutral-600 mb-4">
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
              className={`w-full font-bold text-sm py-2.5 rounded-lg transition-colors ${
                status?.paused
                  ? "btn-accent"
                  : "btn-danger"
              } disabled:opacity-50`}
            >
              {status?.paused ? "Resume Operations" : "Revoke Soroban Auth"}
            </button>
          </div>
        </div>

        {/* Right: Budget Control Panel */}
        <div className="lg:col-span-3 card">
          <h3 className="text-title text-neutral-900 mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
            </svg>
            Budget Control Panel
          </h3>

          {/* Daily Spending Limit */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <p className="stat-label">Daily Spending Limit</p>
              <span className="text-xs text-neutral-400">
                Used today: ${spentUsdc} ({spentPct}%)
              </span>
            </div>
            <p className="text-3xl font-bold text-neutral-900 mb-3">
              {Number(dailyLimitUsdc).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              <span className="text-sm font-normal text-neutral-400 ml-2">USDC</span>
            </p>
            <div className="w-full bg-neutral-200 rounded-full h-2.5 mb-2">
              <div
                className={`h-2.5 rounded-full transition-all ${spendPercentColor(spentPct)}`}
                style={{ width: `${Math.min(spentPct, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-neutral-400">
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
            <p className="text-3xl font-bold text-neutral-900 mb-3">
              {Number(maxTxUsdc).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              <span className="text-sm font-normal text-neutral-400 ml-2">USDC</span>
            </p>
            <div className="w-full bg-neutral-200 rounded-full h-2.5 mb-2">
              <div className="h-2.5 rounded-full bg-secondary" style={{ width: "50%" }} />
            </div>
            <div className="flex justify-between text-[10px] text-neutral-400">
              <span>0 USDC</span>
              <span>{Number(dailyLimitUsdc).toLocaleString()} USDC</span>
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
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-neutral-100">
            <div>
              <p className="stat-label">Policy Version</p>
              <p className="text-sm font-bold text-neutral-900 mt-1 flex items-center gap-1">
                <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                v0.1.0-STABLE
              </p>
            </div>
            <div>
              <p className="stat-label">Last Sync</p>
              <p className="text-sm font-bold text-neutral-900 mt-1 flex items-center gap-1">
                <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                </svg>
                2m ago
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Kill Switch Confirmation Modal */}
      {showKillModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-card p-6 max-w-md w-full mx-4 shadow-panel animate-slide-up">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 bg-danger-50 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-danger-700">Confirm Emergency Pause</h3>
            </div>
            <p className="text-sm text-neutral-600 mb-6">
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
