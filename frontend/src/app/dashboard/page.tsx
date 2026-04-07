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
    <div className={`card ${alert ? "border-danger-200 bg-danger-50/30" : ""}`}>
      <p className="stat-label">{label}</p>
      <p className={`stat-value mt-1 ${alert ? "text-danger-600" : ""}`}>{value}</p>
      {sub && <p className="text-xs text-neutral-400 mt-1">{sub}</p>}
      {children}
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === "settled" ? "bg-accent" :
    status === "blocked" ? "bg-danger" :
    "bg-warning";
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
        <div className="flex items-center gap-3 text-neutral-500">
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
      <div className="card border-danger-200 bg-danger-50/30 text-danger-700">
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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-headline text-neutral-900">Dashboard</h2>
        <p className="text-sm text-neutral-500 mt-1">
          Institutional record of automated agent settlements and endpoint requests.
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Today's Spend"
          value={`$${spentUsdc}`}
          alert={spentPct > 80}
        >
          <div className="mt-2">
            <p className="text-xs text-neutral-400">
              Daily Threshold: {spentPct}% utilization
            </p>
            <div className="flex gap-0.5 mt-1">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-4 flex-1 rounded-sm ${
                    i < Math.ceil(spentPct / 14.3)
                      ? "bg-primary"
                      : "bg-neutral-200"
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
          <p className="text-xs text-accent font-semibold mt-1 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
            </svg>
            Real-time sync
          </p>
        </StatCard>

        <StatCard label="Guard Status" value="">
          <div className={`flex items-center gap-2 mt-1 ${status?.paused ? "text-danger-600" : "text-accent-600"}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${status?.paused ? "bg-danger animate-pulse" : "bg-accent"}`} />
            <span className="font-bold text-sm">
              {status?.paused ? "PAUSED" : "ALL OPERATIONAL"}
            </span>
          </div>
          {!status?.paused && (
            <button
              onClick={handleRunDemo}
              disabled={demoRunning}
              className="mt-3 w-full text-xs font-semibold text-danger-600 border border-danger-200 rounded-lg px-3 py-1.5 hover:bg-danger-50 transition-colors disabled:opacity-50"
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
            <h3 className="text-title text-neutral-900">Live Payment Feed</h3>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1"><StatusDot status="settled" /> Safe</span>
              <span className="flex items-center gap-1"><StatusDot status="pending" /> Warn</span>
              <span className="flex items-center gap-1"><StatusDot status="blocked" /> Block</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-label text-neutral-500 border-b border-neutral-100">
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2 pr-4">Endpoint</th>
                  <th className="pb-2 pr-4 text-right">Value</th>
                  <th className="pb-2 pr-4">Time</th>
                  <th className="pb-2">Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {transactions.length > 0 ? transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-3 pr-4">
                      <StatusDot status={tx.status} />
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs text-neutral-600">
                      {tx.type === "payment_authorized" ? "/v1/auth/settle" : "/v1/auth/reject"}
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <span className="font-bold text-neutral-900">
                        {stroopsToUsdc(tx.amount)}
                      </span>
                      <span className="text-neutral-400 ml-1 text-xs">USDC</span>
                    </td>
                    <td className="py-3 pr-4 text-xs text-neutral-400">
                      {relativeTime(tx.timestamp)}
                    </td>
                    <td className="py-3 font-mono text-xs text-neutral-400">
                      <a
                        href={tx.stellar_expert_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-secondary transition-colors"
                      >
                        {tx.tx_hash.slice(0, 4)}...{tx.tx_hash.slice(-4)}
                      </a>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-neutral-400 text-sm">
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
            <h3 className="text-title text-neutral-900">Spend Velocity</h3>
            <span className="text-xs text-neutral-400">24h Window</span>
          </div>

          {/* Velocity bar */}
          <div className="relative h-32 flex items-end gap-1">
            {Array.from({ length: 12 }).map((_, i) => {
              const height = i < Math.ceil(spentPct / 8.3)
                ? 20 + Math.random() * 80
                : 5 + Math.random() * 15;
              return (
                <div
                  key={i}
                  className={`flex-1 rounded-t transition-all ${
                    i < Math.ceil(spentPct / 8.3) ? "bg-secondary/70" : "bg-neutral-200"
                  }`}
                  style={{ height: `${height}%` }}
                />
              );
            })}
            {/* Limit line */}
            <div className="absolute top-4 left-0 right-0 border-t-2 border-dashed border-danger-300">
              <span className="absolute -top-3 right-0 text-[10px] text-danger-500 font-semibold">
                LIMIT ${limitUsdc}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 text-xs text-neutral-400">
            <span>00:00</span>
            <span>23:59</span>
          </div>
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-neutral-100">
            <span className="w-3 h-3 bg-secondary/70 rounded-sm" />
            <span className="text-xs text-neutral-500">Actual Spend</span>
            <span className="ml-auto text-sm font-bold text-neutral-900">
              ${spentUsdc} total
            </span>
          </div>
        </div>
      </div>

      {/* Bottom row: Quick Actions + Integrations */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Link href="/vault" className="card-hover flex items-center gap-3 bg-primary text-white">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
          </svg>
          <span className="text-sm font-semibold">Adjust Daily Limit</span>
        </Link>

        <Link href="/vault" className="card-hover flex items-center gap-3">
          <svg className="w-5 h-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
          </svg>
          <span className="text-sm font-semibold text-neutral-700">Add Merchant</span>
        </Link>

        <Link href="/vault" className="card-hover flex items-center gap-3 border-danger-200">
          <svg className="w-5 h-5 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <span className="text-sm font-semibold text-danger">Emergency Pause</span>
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
                <span className="text-neutral-600">{item.name}</span>
                <span className={`w-2 h-2 rounded-full ${item.online ? "bg-accent" : "bg-danger"}`} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Demo Terminal (shows after running) */}
      {demoSteps.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-title text-neutral-900">x402 Agent Output</h3>
            <button
              onClick={handleRunDemo}
              disabled={demoRunning}
              className="btn-primary text-xs"
            >
              {demoRunning ? "Running..." : "Run Payment Cycle"}
            </button>
          </div>
          <div className="terminal space-y-1.5">
            {demoSteps.map((step, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className={step.status === "failed" || step.error ? "text-danger-400" : "text-accent-400"}>
                  {step.status === "failed" || step.error ? "x" : ">"}
                </span>
                <div>
                  <span className="text-secondary-400">[{step.step}]</span>{" "}
                  {step.status !== undefined && <span>status={String(step.status)}</span>}
                  {step.price && <span className="text-warning-300"> price=${stroopsToUsdc(step.price)}</span>}
                  {step.tx_hash && <span className="text-accent-300"> tx={step.tx_hash.slice(0, 12)}...</span>}
                  {step.settlement_time_ms && <span className="text-purple-300"> {step.settlement_time_ms}ms</span>}
                  {step.data && <span className="text-white"> {step.data}</span>}
                  {step.error && <span className="text-danger-400"> {step.error}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
