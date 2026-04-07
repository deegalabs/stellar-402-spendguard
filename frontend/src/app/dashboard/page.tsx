"use client";

import { useContractStatus } from "@/hooks/useContractStatus";
import { stroopsToUsdc } from "@/lib/format";
import { runAgent } from "@/lib/api";
import { useState } from "react";
import type { DemoStepResult } from "@/lib/types";

function MetricCard({
  label,
  value,
  sub,
  alert,
}: {
  label: string;
  value: string;
  sub?: string;
  alert?: boolean;
}) {
  return (
    <div className={`bg-white rounded-xl border p-5 ${alert ? "border-red-300 bg-red-50" : "border-slate-200"}`}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${alert ? "text-red-600" : "text-slate-900"}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { status, balance, loading, error } = useContractStatus();
  const [demoSteps, setDemoSteps] = useState<DemoStepResult[]>([]);
  const [demoRunning, setDemoRunning] = useState(false);

  async function handleRunDemo() {
    setDemoRunning(true);
    setDemoSteps([]);
    try {
      const result = await runAgent();
      setDemoSteps(result.steps);
    } catch (err) {
      setDemoSteps([
        { step: "error", status: "failed", error: err instanceof Error ? err.message : "Unknown" },
      ]);
    } finally {
      setDemoRunning(false);
    }
  }

  if (loading) {
    return <div className="text-slate-500">Loading contract status...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    );
  }

  const spentPct = status
    ? ((Number(status.spent_today) / Number(status.daily_limit)) * 100).toFixed(0)
    : "0";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
        <span className="text-xs text-slate-400 font-mono">{status?.network}</span>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Contract Balance"
          value={`$${balance?.balance_usdc ?? "0.00"}`}
          sub="USDC"
        />
        <MetricCard
          label="Spent Today"
          value={`$${status ? stroopsToUsdc(status.spent_today) : "0.00"}`}
          sub={`${spentPct}% of daily limit`}
          alert={Number(spentPct) > 80}
        />
        <MetricCard
          label="Daily Limit"
          value={`$${status ? stroopsToUsdc(status.daily_limit) : "0.00"}`}
          sub="USDC per day"
        />
        <MetricCard
          label="Max per Tx"
          value={`$${status ? stroopsToUsdc(status.max_tx_value) : "0.00"}`}
          sub="Single transaction cap"
        />
      </div>

      {/* Spend Velocity Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">Daily Spend Velocity</span>
          <span className="text-sm text-slate-500">
            ${status ? stroopsToUsdc(status.spent_today) : "0.00"} / ${status ? stroopsToUsdc(status.daily_limit) : "0.00"}
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${
              Number(spentPct) > 80 ? "bg-red-500" : Number(spentPct) > 50 ? "bg-yellow-500" : "bg-green-500"
            }`}
            style={{ width: `${Math.min(Number(spentPct), 100)}%` }}
          />
        </div>
      </div>

      {/* Demo Agent */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">x402 Agent Demo</h3>
          <button
            onClick={handleRunDemo}
            disabled={demoRunning || status?.paused}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {demoRunning ? "Running..." : "Run Payment Cycle"}
          </button>
        </div>

        {demoSteps.length > 0 && (
          <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm space-y-2">
            {demoSteps.map((step, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className={`${
                  step.status === "failed" || step.error ? "text-red-400" : "text-green-400"
                }`}>
                  {step.status === "failed" || step.error ? "x" : ">"}
                </span>
                <div className="text-slate-300">
                  <span className="text-blue-400">[{step.step}]</span>{" "}
                  {step.status !== undefined && <span>status={String(step.status)}</span>}
                  {step.price && <span className="text-yellow-300"> price=${stroopsToUsdc(step.price)}</span>}
                  {step.tx_hash && (
                    <span className="text-green-300"> tx={step.tx_hash.slice(0, 12)}...</span>
                  )}
                  {step.settlement_time_ms && (
                    <span className="text-purple-300"> {step.settlement_time_ms}ms</span>
                  )}
                  {step.data && <span className="text-white"> {step.data}</span>}
                  {step.error && <span className="text-red-400"> {step.error}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
