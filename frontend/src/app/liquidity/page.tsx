"use client";

import { useState } from "react";
import { useContractStatus } from "@/hooks/useContractStatus";
import { simulatePayment } from "@/lib/api";

const PRESETS = [10, 25, 50, 100];

export default function LiquidityPage() {
  const { balance, refresh } = useContractStatus();
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleTopUp() {
    const usd = Number(amount);
    if (!usd || usd <= 0) return;

    setBusy(true);
    setResult(null);
    try {
      await simulatePayment(usd);
      setResult({ ok: true, text: `$${usd.toFixed(2)} deposited successfully (Test Mode)` });
      setAmount("");
      refresh();
    } catch (err) {
      setResult({ ok: false, text: err instanceof Error ? err.message : "Failed" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-2xl font-bold text-slate-900">Liquidity</h2>

      {/* Current Balance */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <p className="text-sm text-slate-500">Contract USDC Balance</p>
        <p className="text-4xl font-bold text-slate-900 mt-1">
          ${balance?.balance_usdc ?? "0.00"}
        </p>
        <p className="text-xs text-slate-400 mt-1 font-mono">
          {balance?.balance ?? "0"} stroops
        </p>
      </div>

      {/* Top Up Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">Deposit USDC</h3>
          <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-1 rounded">
            (Test Mode)
          </span>
        </div>

        <p className="text-sm text-slate-500 mb-4">
          Simulated Stripe payment. No real charge will occur.
          Funds are minted on Stellar Testnet.
        </p>

        {/* Preset Amounts */}
        <div className="flex gap-2 mb-4">
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => setAmount(String(p))}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                amount === String(p)
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-slate-600 border-slate-300 hover:border-blue-400"
              }`}
            >
              ${p}
            </button>
          ))}
        </div>

        {/* Custom Amount */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
            <input
              type="number"
              placeholder="Custom amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border border-slate-300 rounded-lg pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleTopUp}
            disabled={busy || !amount || Number(amount) <= 0}
            className="bg-blue-600 text-white text-sm px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
          >
            {busy ? "Processing..." : "Deposit (Test Mode)"}
          </button>
        </div>

        {result && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${
            result.ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
          }`}>
            {result.text}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 text-sm text-slate-500">
        <p className="font-medium text-slate-700 mb-2">How deposits work</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>You initiate a Stripe payment (test mode)</li>
          <li>Stripe webhook confirms the payment</li>
          <li>Backend calls <code className="bg-slate-200 px-1 rounded">contract.top_up()</code> on Stellar</li>
          <li>USDC is transferred to the contract on-chain</li>
        </ol>
      </div>
    </div>
  );
}
