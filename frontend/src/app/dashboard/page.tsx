"use client";

import { useContractStatus } from "@/hooks/useContractStatus";
import { stroopsToUsdc, relativeTime } from "@/lib/format";
import { getTransactions, runAgent } from "@/lib/api";
import { useState, useEffect } from "react";
import type { DemoStepResult, TransactionEvent } from "@/lib/types";
import Link from "next/link";

function StatCard({
  label,
  value,
  sub,
  alert,
  icon,
  children,
}: {
  label: string;
  value: string;
  sub?: string;
  alert?: boolean;
  icon?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`card ${alert ? "border-error/30 shadow-glow-error" : ""}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="stat-label">{label}</p>
        {icon && (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${alert ? "bg-error-glow" : "bg-primary-glow"}`}>
            <span className={`material-symbols-outlined text-[18px] ${alert ? "text-error-fg" : "text-primary-fg"}`}>{icon}</span>
          </div>
        )}
      </div>
      <p className={`stat-value ${alert ? "text-error-fg" : ""}`}>{value}</p>
      {sub && <p className="text-xs text-text-muted mt-1">{sub}</p>}
      {children}
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === "settled" ? "bg-success-400" :
    status === "blocked" ? "bg-error-400" :
    "bg-warning-400";
  return <span className={`w-2 h-2 rounded-full ${color}`} />;
}

export default function DashboardPage() {
  const { status, loading, error, refresh } = useContractStatus();
  const [transactions, setTransactions] = useState<TransactionEvent[]>([]);
  const [demoSteps, setDemoSteps] = useState<DemoStepResult[]>([]);
  const [demoRunning, setDemoRunning] = useState(false);

  useEffect(() => {
    getTransactions(5).then((r) => setTransactions(r.transactions)).catch(() => {});
    const interval = setInterval(() => {
      getTransactions(5).then((r) => setTransactions(r.transactions)).catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  async function handleRunDemo() {
    setDemoRunning(true);
    setDemoSteps([]);
    try {
      const result = await runAgent();
      setDemoSteps(result.steps);
      refresh();
    } catch (err) {
      setDemoSteps([
        { step: "error", status: "failed", error: err instanceof Error ? err.message : "Unknown" },
      ]);
    } finally {
      setDemoRunning(false);
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
          Loading contract status...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card border-error/30 text-error-fg">
        <p className="font-semibold">Connection Error</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  const spentPct = status
    ? Math.round((Number(status.spent_today) / Math.max(Number(status.daily_limit), 1)) * 100)
    : 0;

  const spentUsdc = status ? stroopsToUsdc(status.spent_today) : "0.00";
  const limitUsdc = status ? stroopsToUsdc(status.daily_limit) : "0.00";

  return (
    <div className="space-y-6 lg:space-y-8 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-text-primary">Dashboard</h2>
        <p className="text-text-muted text-sm mt-1">
          Real-time monitoring of automated agent settlements on Stellar.
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
        <StatCard
          label="Today&apos;s Spend"
          value={`$${spentUsdc}`}
          alert={spentPct > 80}
          icon="payments"
        >
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] text-text-muted font-mono">{spentPct}% of limit</p>
              <p className="text-[10px] text-text-muted font-mono">${limitUsdc}</p>
            </div>
            <div className="w-full h-1.5 bg-dark-300 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  spentPct > 80 ? "bg-error-400" : spentPct > 50 ? "bg-warning-400" : "bg-primary-400"
                }`}
                style={{ width: `${Math.min(spentPct, 100)}%` }}
              />
            </div>
          </div>
        </StatCard>

        <StatCard
          label="Transactions"
          value={String(transactions.length > 0 ? transactions.length : 0)}
          sub="today"
          icon="receipt_long"
        />

        <StatCard
          label="Settlement"
          value={demoSteps.find(s => s.settlement_time_ms)
            ? `${(demoSteps.find(s => s.settlement_time_ms)!.settlement_time_ms! / 1000).toFixed(1)}s`
            : "4.2s"
          }
          sub="avg finality"
          icon="speed"
        />

        <StatCard label="Guard Status" value="" icon="verified_user">
          <div className={`flex items-center gap-2 ${status?.paused ? "text-error-fg" : "text-success-fg"}`}>
            <span className={`w-2 h-2 rounded-full ${status?.paused ? "bg-error-400 animate-pulse" : "bg-success-400"}`} />
            <span className="font-bold text-sm">
              {status?.paused ? "PAUSED" : "ACTIVE"}
            </span>
          </div>
        </StatCard>
      </div>

      {/* Main content row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Live Payment Feed */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-fg text-[18px]">monitoring</span>
              Live Payment Feed
            </h3>
            <div className="hidden sm:flex items-center gap-3 text-xs text-text-muted">
              <span className="flex items-center gap-1"><StatusDot status="settled" /> OK</span>
              <span className="flex items-center gap-1"><StatusDot status="blocked" /> Block</span>
            </div>
          </div>

          {/* Mobile: card layout / Desktop: table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-text-muted text-[10px] font-mono uppercase tracking-widest border-b border-surface-border">
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Endpoint</th>
                  <th className="px-3 py-3 text-right">Value</th>
                  <th className="px-3 py-3">Time</th>
                  <th className="px-3 py-3">Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {transactions.length > 0 ? transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <StatusDot status={tx.status} />
                        <span className="font-mono text-xs text-text-secondary">
                          {tx.status === "settled" ? "OK" : tx.status === "blocked" ? "DENIED" : "PENDING"}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-0.5 rounded font-mono text-[10px] ${
                        tx.status === "blocked"
                          ? "bg-error-glow text-error-fg border border-error/20"
                          : "bg-primary-glow text-primary-fg border border-primary/20"
                      }`}>
                        {tx.status === "blocked" ? "403" : "402"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className="font-mono font-bold text-text-primary">
                        {stroopsToUsdc(tx.amount)}
                      </span>
                      <span className="text-text-muted ml-1 text-xs">USDC</span>
                    </td>
                    <td className="px-3 py-3 text-xs text-text-muted">
                      {relativeTime(tx.timestamp)}
                    </td>
                    <td className="px-3 py-3 font-mono text-xs">
                      <a
                        href={tx.stellar_expert_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent-fg hover:text-accent-fg transition-colors"
                      >
                        {tx.tx_hash.slice(0, 4)}...{tx.tx_hash.slice(-4)}
                      </a>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-text-muted text-sm">
                      No transactions yet. Run a payment cycle to see data.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile: card layout */}
          <div className="sm:hidden space-y-2">
            {transactions.length > 0 ? transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 bg-dark-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <StatusDot status={tx.status} />
                  <div>
                    <span className="text-xs font-mono text-text-primary font-bold">${stroopsToUsdc(tx.amount)}</span>
                    <span className="text-[10px] text-text-muted ml-1">{relativeTime(tx.timestamp)}</span>
                  </div>
                </div>
                <a
                  href={tx.stellar_expert_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-fg text-[10px] font-mono"
                >
                  {tx.tx_hash.slice(0, 6)}...
                </a>
              </div>
            )) : (
              <p className="py-6 text-center text-text-muted text-sm">No transactions yet.</p>
            )}
          </div>
        </div>

        {/* Spend Velocity */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-text-primary">Spend Velocity</h3>
            <span className="text-[10px] text-text-muted font-mono">24h Window</span>
          </div>

          <div className="relative h-32 flex items-end gap-1">
            {Array.from({ length: 12 }).map((_, i) => {
              const height = i < Math.ceil(spentPct / 8.3)
                ? 20 + Math.random() * 80
                : 5 + Math.random() * 15;
              return (
                <div
                  key={i}
                  className={`flex-1 rounded-t transition-all ${
                    i < Math.ceil(spentPct / 8.3) ? "bg-primary-500/60" : "bg-dark-400"
                  }`}
                  style={{ height: `${height}%` }}
                />
              );
            })}
            <div className="absolute top-4 left-0 right-0 border-t-2 border-dashed border-error-400/40">
              <span className="absolute -top-3 right-0 text-[10px] text-error-fg font-mono font-semibold">
                LIMIT ${limitUsdc}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 text-[10px] text-text-muted font-mono">
            <span>00:00</span>
            <span>23:59</span>
          </div>
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-surface-border">
            <span className="w-3 h-3 bg-primary-500/60 rounded-sm" />
            <span className="text-xs text-text-muted">Actual Spend</span>
            <span className="ml-auto text-sm font-bold font-mono text-text-primary">
              ${spentUsdc}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Link href="/vault" className="card-hover flex items-center gap-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white border-0">
          <span className="material-symbols-outlined text-[20px]">tune</span>
          <span className="text-sm font-semibold">Adjust Daily Limit</span>
        </Link>

        <Link href="/vault" className="card-hover flex items-center gap-3">
          <span className="material-symbols-outlined text-[20px] text-text-muted">person_add</span>
          <span className="text-sm font-semibold text-text-primary">Add Merchant</span>
        </Link>

        <Link href="/vault" className="card-hover flex items-center gap-3 border-error/30">
          <span className="material-symbols-outlined text-[20px] text-error-fg">warning</span>
          <span className="text-sm font-semibold text-error-fg">Emergency Pause</span>
        </Link>

        <div className="card">
          <p className="stat-label mb-2">Integrations</p>
          <div className="space-y-1.5">
            {["Soroban RPC", "Freighter", "Horizon"].map((name) => (
              <div key={name} className="flex items-center justify-between text-xs">
                <span className="text-text-muted">{name}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-success-400" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Demo Terminal */}
      {demoSteps.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 lg:px-6 py-3 bg-dark-200 border-b border-surface-border">
            <span className="text-text-secondary font-mono text-xs font-bold tracking-tight uppercase">x402 Agent Output</span>
            <button
              onClick={handleRunDemo}
              disabled={demoRunning}
              className="btn-accent text-xs px-3 py-1"
            >
              {demoRunning ? "Running..." : "Run Cycle"}
            </button>
          </div>
          <div className="terminal rounded-none border-0 space-y-1.5">
            {demoSteps.map((step, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className={step.status === "failed" || step.error ? "text-error-fg" : "text-success-fg"}>
                  {step.status === "failed" || step.error ? "x" : ">"}
                </span>
                <div>
                  <span className="text-accent-fg">[{step.step}]</span>{" "}
                  {step.status !== undefined && <span className="text-text-secondary">status={String(step.status)}</span>}
                  {step.price && <span className="text-warning-fg"> price=${stroopsToUsdc(step.price)}</span>}
                  {step.tx_hash && <span className="text-success-fg"> tx={step.tx_hash.slice(0, 12)}...</span>}
                  {step.settlement_time_ms && <span className="text-primary-fg"> {step.settlement_time_ms}ms</span>}
                  {step.data && <span className="text-text-primary"> {step.data}</span>}
                  {step.error && <span className="text-error-fg"> {step.error}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
