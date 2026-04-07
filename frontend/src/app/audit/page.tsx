"use client";

import { useEffect, useState } from "react";
import { getTransactions } from "@/lib/api";
import { stroopsToUsdc, shortAddress, formatTimestamp, statusColor } from "@/lib/format";
import type { TransactionEvent } from "@/lib/types";

export default function AuditLogPage() {
  const [transactions, setTransactions] = useState<TransactionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const result = await getTransactions(100);
        setTransactions(result.transactions);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  if (loading) return <div className="text-slate-500">Loading transactions...</div>;
  if (error) return <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Audit Log</h2>
        <span className="text-sm text-slate-400">{transactions.length} transactions</span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 font-medium text-slate-600">STATUS</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">DATE</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">TYPE</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">MERCHANT</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">AMOUNT</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">TX HASH</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  No transactions yet. Run the agent demo or seed transactions.
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.id} className={`border-b border-slate-100 hover:bg-slate-50 ${tx.status === "blocked" ? "bg-red-50/50" : ""}`}>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(tx.status)}`}>
                      {tx.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatTimestamp(tx.timestamp)}
                  </td>
                  <td className="px-4 py-3 text-slate-700 font-medium">
                    {tx.type.replace(/_/g, " ")}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-500">
                    {tx.merchant ? shortAddress(tx.merchant) : "-"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-medium text-slate-900">
                    ${stroopsToUsdc(tx.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={tx.stellar_expert_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {tx.tx_hash.slice(0, 10)}...
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* System Metadata Stream */}
      <div className="bg-slate-900 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-xs text-slate-400 font-mono">SYSTEM METADATA STREAM</span>
        </div>
        <div className="font-mono text-xs text-slate-400 space-y-1 max-h-40 overflow-auto">
          {transactions.slice(0, 10).map((tx) => (
            <div key={tx.id}>
              <span className="text-slate-500">[{tx.timestamp}]</span>{" "}
              <span className={tx.status === "blocked" ? "text-red-400" : "text-green-400"}>
                {tx.type}
              </span>{" "}
              <span className="text-blue-400">ledger={tx.ledger}</span>{" "}
              <span className="text-yellow-300">amt=${stroopsToUsdc(tx.amount)}</span>{" "}
              <span className="text-slate-500">tx={tx.tx_hash.slice(0, 16)}</span>
            </div>
          ))}
          {transactions.length === 0 && (
            <div className="text-slate-500">Waiting for events...</div>
          )}
        </div>
      </div>
    </div>
  );
}
