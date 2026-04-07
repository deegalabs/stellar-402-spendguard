"use client";

import { useState } from "react";
import { useContractStatus } from "@/hooks/useContractStatus";
import { stroopsToUsdc, usdcToStroops, shortAddress } from "@/lib/format";
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

  if (loading) return <div className="text-slate-500">Loading...</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-2xl font-bold text-slate-900">Agent Vault</h2>

      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.type === "ok" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      {/* Current Config */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
        <h3 className="font-semibold text-slate-900">Current Configuration</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-500">Owner:</span>{" "}
            <span className="font-mono">{shortAddress(status?.owner ?? "")}</span>
          </div>
          <div>
            <span className="text-slate-500">Agent:</span>{" "}
            <span className="font-mono">{shortAddress(status?.agent ?? "")}</span>
          </div>
          <div>
            <span className="text-slate-500">Daily Limit:</span>{" "}
            <span className="font-semibold">${status ? stroopsToUsdc(status.daily_limit) : "0.00"}</span>
          </div>
          <div>
            <span className="text-slate-500">Max per Tx:</span>{" "}
            <span className="font-semibold">${status ? stroopsToUsdc(status.max_tx_value) : "0.00"}</span>
          </div>
        </div>
      </div>

      {/* Daily Limit */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-900 mb-3">Set Daily Limit</h3>
        <div className="flex gap-3">
          <input
            type="number"
            placeholder="Amount in USDC (e.g. 100)"
            value={dailyInput}
            onChange={(e) => setDailyInput(e.target.value)}
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            disabled={busy || !dailyInput}
            onClick={() => exec("Set daily limit", () => setDailyLimit(usdcToStroops(Number(dailyInput))))}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Update
          </button>
        </div>
      </div>

      {/* Max Tx */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-900 mb-3">Set Max Transaction</h3>
        <div className="flex gap-3">
          <input
            type="number"
            placeholder="Max per tx in USDC (e.g. 50)"
            value={maxTxInput}
            onChange={(e) => setMaxTxInput(e.target.value)}
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            disabled={busy || !maxTxInput}
            onClick={() => exec("Set max tx", () => setMaxTx(usdcToStroops(Number(maxTxInput))))}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Update
          </button>
        </div>
      </div>

      {/* Merchant Whitelist */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-900 mb-3">Merchant Whitelist</h3>
        <div className="flex gap-3 mb-3">
          <input
            type="text"
            placeholder="Stellar address (G...)"
            value={merchantInput}
            onChange={(e) => setMerchantInput(e.target.value)}
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            disabled={busy || !merchantInput}
            onClick={() => {
              exec("Whitelist merchant", () => whitelistMerchant(merchantInput));
              setMerchantInput("");
            }}
            className="bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            Add
          </button>
          <button
            disabled={busy || !merchantInput}
            onClick={() => {
              exec("Remove merchant", () => removeMerchant(merchantInput));
              setMerchantInput("");
            }}
            className="bg-red-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            Remove
          </button>
        </div>
      </div>

      {/* Kill Switch */}
      <div className="bg-white rounded-xl border-2 border-red-200 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-red-700">Emergency Kill Switch</h3>
            <p className="text-sm text-slate-500 mt-1">
              {status?.paused
                ? "Contract is PAUSED. No new payments will be authorized."
                : "Immediately stop all agent payments. In-flight transactions are final."}
            </p>
          </div>
          <button
            onClick={() => {
              if (status?.paused) {
                exec("Unpause", unpauseContract);
              } else {
                setShowKillModal(true);
              }
            }}
            disabled={busy}
            className={`text-sm px-6 py-2.5 rounded-lg font-semibold transition-colors ${
              status?.paused
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-red-600 text-white hover:bg-red-700"
            } disabled:opacity-50`}
          >
            {status?.paused ? "Unpause Contract" : "PAUSE CONTRACT"}
          </button>
        </div>
      </div>

      {/* Kill Switch Confirmation Modal */}
      {showKillModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-red-700 mb-2">Confirm Emergency Pause</h3>
            <p className="text-sm text-slate-600 mb-4">
              This will immediately block all new payment authorizations.
              In-flight transactions already on the ledger are final and cannot be reversed.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowKillModal(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowKillModal(false);
                  exec("Emergency pause", pauseContract);
                }}
                className="bg-red-600 text-white text-sm px-6 py-2 rounded-lg hover:bg-red-700 font-semibold"
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
