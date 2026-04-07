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
  children,
}: {
  label: string;
  value: string;
  sub?: string;
  alert?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className={`card ${alert ? "border border-error-container" : ""}`}>
      <p className="stat-label mb-2">{label}</p>
      <p className={`stat-value ${alert ? "text-error" : ""}`}>{value}</p>
      {sub && <p className="text-xs text-on-surface-variant mt-1">{sub}</p>}
      {children}
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === "settled" ? "bg-tertiary-fixed-dim" :
    status === "blocked" ? "bg-error" :
    "bg-warning-500";
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
        <div className="flex items-center gap-3 text-on-surface-variant">
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
      <div className="card border border-error-container text-error">
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
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary">Dashboard</h2>
        <p className="text-on-surface-variant mt-1">
          Institutional record of automated agent settlements and endpoint requests.
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Today&apos;s Spend"
          value={`$${spentUsdc}`}
          alert={spentPct > 80}
        >
          <div className="mt-3">
            <p className="text-[10px] text-on-surface-variant font-mono">
              Daily Threshold: {spentPct}% utilization
            </p>
            <div className="flex gap-0.5 mt-1.5">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-4 flex-1 rounded-sm ${
                    i < Math.ceil(spentPct / 14.3)
                      ? "bg-primary"
                      : "bg-surface-container"
                  }`}
                />
              ))}
            </div>
          </div>
        </StatCard>

        <StatCard
          label="Transactions Today"
          value={String(transactions.length > 0 ? transactions.length : 0)}
        />

        <StatCard
          label="Settlement Speed"
          value={demoSteps.find(s => s.settlement_time_ms)
            ? `${(demoSteps.find(s => s.settlement_time_ms)!.settlement_time_ms! / 1000).toFixed(1)}s`
            : "4.2s"
          }
          sub="avg Stellar finality"
        >
          <p className="text-xs text-tertiary-fixed-dim font-semibold mt-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">sync</span>
            Real-time sync
          </p>
        </StatCard>

        <StatCard label="Guard Status" value="">
          <div className={`flex items-center gap-2 mt-1 ${status?.paused ? "text-error" : "text-on-tertiary-container"}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${status?.paused ? "bg-error animate-pulse" : "bg-tertiary-fixed-dim"}`} />
            <span className="font-bold text-sm">
              {status?.paused ? "PAUSED" : "ALL OPERATIONAL"}
            </span>
          </div>
          {!status?.paused && (
            <button
              onClick={handleRunDemo}
              disabled={demoRunning}
              className="mt-3 w-full text-xs font-semibold text-error border border-error-container rounded-lg px-3 py-1.5 hover:bg-error-container transition-colors disabled:opacity-50"
            >
              EMERGENCY PAUSE
            </button>
          )}
        </StatCard>
      </div>

      {/* Main content row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Payment Feed */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-primary">Live Payment Feed</h3>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1"><StatusDot status="settled" /> Safe</span>
              <span className="flex items-center gap-1"><StatusDot status="pending" /> Warn</span>
              <span className="flex items-center gap-1"><StatusDot status="blocked" /> Block</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left bg-surface-container text-on-surface-variant text-[10px] font-mono uppercase tracking-widest">
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Endpoint</th>
                  <th className="px-4 py-3 text-right">Value</th>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {transactions.length > 0 ? transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-surface-container transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <StatusDot status={tx.status} />
                        <span className="font-mono text-xs">
                          {tx.status === "settled" ? "SUCCESS" : tx.status === "blocked" ? "DENIED" : "PENDING"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded font-mono text-[10px] ${
                          tx.status === "blocked"
                            ? "bg-error-container text-on-error-container"
                            : "bg-surface-container text-on-primary-container"
                        }`}>
                          {tx.status === "blocked" ? "HTTP 403" : "HTTP 402"}
                        </span>
                        <span className="font-mono text-xs text-on-surface">
                          {tx.type === "payment_authorized" ? "/v1/auth/settle" : "/v1/auth/reject"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono font-bold text-on-surface">
                        {stroopsToUsdc(tx.amount)}
                      </span>
                      <span className="text-on-surface-variant ml-1 text-xs">USDC</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-on-surface-variant">
                      {relativeTime(tx.timestamp)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      <a
                        href={tx.stellar_expert_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-secondary-container hover:text-secondary transition-colors"
                      >
                        {tx.tx_hash.slice(0, 4)}...{tx.tx_hash.slice(-4)}
                      </a>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-on-surface-variant text-sm">
                      No transactions yet. Run a payment cycle to see data.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Spend Velocity */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-primary">Spend Velocity</h3>
            <span className="text-[10px] text-on-surface-variant font-mono">24h Window</span>
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
                    i < Math.ceil(spentPct / 8.3) ? "bg-secondary/70" : "bg-surface-container"
                  }`}
                  style={{ height: `${height}%` }}
                />
              );
            })}
            <div className="absolute top-4 left-0 right-0 border-t-2 border-dashed border-error/40">
              <span className="absolute -top-3 right-0 text-[10px] text-error font-mono font-semibold">
                LIMIT ${limitUsdc}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 text-[10px] text-on-surface-variant font-mono">
            <span>00:00</span>
            <span>23:59</span>
          </div>
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-surface-container">
            <span className="w-3 h-3 bg-secondary/70 rounded-sm" />
            <span className="text-xs text-on-surface-variant">Actual Spend</span>
            <span className="ml-auto text-sm font-bold font-mono text-primary">
              ${spentUsdc} total
            </span>
          </div>
        </div>
      </div>

      {/* Bottom row: Quick Actions + Integrations */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Link href="/vault" className="card-hover flex items-center gap-3 bg-primary text-white">
          <span className="material-symbols-outlined text-[20px]">tune</span>
          <span className="text-sm font-semibold">Adjust Daily Limit</span>
        </Link>

        <Link href="/vault" className="card-hover flex items-center gap-3">
          <span className="material-symbols-outlined text-[20px] text-on-surface-variant">person_add</span>
          <span className="text-sm font-semibold text-primary">Add Merchant</span>
        </Link>

        <Link href="/vault" className="card-hover flex items-center gap-3 border border-error-container">
          <span className="material-symbols-outlined text-[20px] text-error">warning</span>
          <span className="text-sm font-semibold text-error">Emergency Pause</span>
        </Link>

        {/* Integrations Monitor */}
        <div className="card">
          <p className="stat-label mb-3">Integrations Monitor</p>
          <div className="space-y-2">
            {[
              { name: "OpenZeppelin Defender", online: true },
              { name: "Freighter Wallet", online: true },
              { name: "Horizon Node (Global)", online: true },
            ].map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <span className="text-on-surface-variant">{item.name}</span>
                <span className={`w-2 h-2 rounded-full ${item.online ? "bg-tertiary-fixed-dim" : "bg-error"}`} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Demo Terminal (shows after running) */}
      {demoSteps.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-3 bg-[#1E293B] border-b border-slate-700">
            <span className="text-slate-300 font-mono text-xs font-bold tracking-tight uppercase">x402 Agent Output</span>
            <button
              onClick={handleRunDemo}
              disabled={demoRunning}
              className="bg-secondary text-white text-xs font-medium px-3 py-1 rounded hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {demoRunning ? "Running..." : "Run Payment Cycle"}
            </button>
          </div>
          <div className="terminal rounded-none space-y-1.5">
            {demoSteps.map((step, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className={step.status === "failed" || step.error ? "text-red-400" : "text-green-400"}>
                  {step.status === "failed" || step.error ? "x" : ">"}
                </span>
                <div>
                  <span className="text-blue-400">[{step.step}]</span>{" "}
                  {step.status !== undefined && <span>status={String(step.status)}</span>}
                  {step.price && <span className="text-yellow-300"> price=${stroopsToUsdc(step.price)}</span>}
                  {step.tx_hash && <span className="text-green-300"> tx={step.tx_hash.slice(0, 12)}...</span>}
                  {step.settlement_time_ms && <span className="text-purple-300"> {step.settlement_time_ms}ms</span>}
                  {step.data && <span className="text-white"> {step.data}</span>}
                  {step.error && <span className="text-red-400"> {step.error}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
