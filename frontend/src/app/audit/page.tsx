"use client";

import { useEffect, useState } from "react";
import { getTransactions } from "@/lib/api";
import { stroopsToUsdc, formatTimestamp } from "@/lib/format";
import type { TransactionEvent } from "@/lib/types";

const PAGE_SIZE = 50;

export default function AuditLogPage() {
  const [transactions, setTransactions] = useState<TransactionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function load() {
      try {
        const result = await getTransactions(200);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-on-surface-variant">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading transactions...
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

  const totalPages = Math.ceil(transactions.length / PAGE_SIZE) || 1;
  const paginated = transactions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const settled = transactions.filter(t => t.status === "settled").length;

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Audit Log</h2>
          <p className="text-on-surface-variant mt-1">
            Institutional record of automated agent settlements and endpoint requests.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            FILTER
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-[18px]">download</span>
            EXPORT CSV
          </button>
        </div>
      </div>

      {/* Metrics Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <p className="stat-label mb-2">Total Transactions</p>
          <p className="stat-value">{transactions.length.toLocaleString()}</p>
        </div>
        <div className="card">
          <p className="stat-label mb-2">Settlement Velocity</p>
          <p className="stat-value">0.8s</p>
        </div>
        <div className="card">
          <p className="stat-label mb-2">Bridge Volume</p>
          <p className="stat-value">
            {transactions.length > 0
              ? `$${transactions.reduce((sum, t) => sum + Number(stroopsToUsdc(t.amount)), 0).toFixed(0)}`
              : "$0"
            }
          </p>
        </div>
        <div className="card">
          <p className="stat-label mb-2">Active Agents</p>
          <p className="stat-value">
            {transactions.length > 0 ? `${((settled / transactions.length) * 100).toFixed(0)}%` : "---"}
          </p>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container text-on-surface-variant text-[10px] font-mono uppercase tracking-widest">
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date/Time</th>
                <th className="px-6 py-4">Requested Endpoint</th>
                <th className="px-6 py-4">Transaction Hash</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Facilitator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container text-sm">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-on-surface-variant">
                    No transactions yet. Run the agent demo to generate data.
                  </td>
                </tr>
              ) : (
                paginated.map((tx) => (
                  <tr key={tx.id} className="hover:bg-surface-container transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center">
                        <span className={`w-2 h-2 rounded-full mr-2 ${
                          tx.status === "settled" ? "bg-tertiary-fixed-dim" :
                          tx.status === "blocked" ? "bg-error" : "bg-warning-500"
                        }`} />
                        <span className="font-mono text-xs">
                          {tx.status === "settled" ? "SUCCESS" : tx.status === "blocked" ? "DENIED" : "PENDING"}
                        </span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-on-surface text-xs">{formatTimestamp(tx.timestamp)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded font-mono text-[10px] ${
                          tx.status === "blocked"
                            ? "bg-error-container text-on-error-container"
                            : "bg-surface-container text-on-primary-container"
                        }`}>
                          {tx.status === "blocked" ? "HTTP 403" : "HTTP 402"}
                        </span>
                        <span className="font-mono text-xs text-on-surface">
                          {tx.type === "payment_authorized" ? "/api/v1/settle" : "/auth/reject"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <a
                        href={tx.stellar_expert_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-secondary-container hover:text-secondary transition-colors"
                      >
                        {tx.tx_hash.slice(0, 6)}...{tx.tx_hash.slice(-4)}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-on-surface">
                        {Number(stroopsToUsdc(tx.amount)).toLocaleString("en-US", { minimumFractionDigits: 2 })} USDC
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-surface-container-high flex items-center justify-center">
                          <span className="material-symbols-outlined text-primary text-[12px]">hub</span>
                        </div>
                        <span className="font-medium text-xs">Service Vault</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-surface-container flex items-center justify-between">
            <p className="text-sm text-on-surface-variant font-mono">
              Showing {(page - 1) * PAGE_SIZE + 1} - {Math.min(page * PAGE_SIZE, transactions.length)} of {transactions.length} entries
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-outline-variant rounded text-sm hover:bg-surface-container disabled:opacity-30"
              >
                &larr; Prev
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`px-3 py-1 rounded text-sm ${
                    page === i + 1
                      ? "bg-primary text-white"
                      : "border border-outline-variant hover:bg-surface-container"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              {totalPages > 5 && <span className="px-2 text-on-surface-variant">...</span>}
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border border-outline-variant rounded text-sm hover:bg-surface-container disabled:opacity-30"
              >
                Next &rarr;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* System Metadata Stream */}
        <div className="bg-[#0F172A] rounded-xl flex flex-col overflow-hidden h-[320px]">
          <div className="px-4 py-3 border-b border-slate-700 flex justify-between items-center bg-[#1E293B]">
            <span className="text-slate-300 font-mono text-xs font-bold tracking-tight uppercase">System Metadata Stream</span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim animate-pulse" />
              <span className="text-[10px] font-mono text-tertiary-fixed-dim">LIVE STREAM</span>
            </span>
          </div>
          <div className="flex-1 p-4 font-mono text-[12px] text-green-400/80 overflow-y-auto space-y-1">
            {transactions.slice(0, 10).map((tx) => (
              <div key={tx.id}>
                <span className="text-slate-500">[{tx.timestamp}]</span>{" "}
                <span className={tx.status === "settled" ? "text-blue-400" : tx.status === "blocked" ? "text-yellow-400" : "text-green-400"}>
                  {tx.status === "settled" ? "INFO" : tx.status === "blocked" ? "WARN" : "SYNC"}
                </span>:{" "}
                {tx.type === "payment_authorized"
                  ? `Settlement initialized for Agent. Hash ${tx.tx_hash.slice(0, 8)}...${tx.tx_hash.slice(-4)} broadcast to Stellar Horizon.`
                  : `Payment rejected at policy boundary. Endpoint /auth/reject returned 403.`
                }
              </div>
            ))}
            {transactions.length === 0 && (
              <div className="text-slate-500">Waiting for events...</div>
            )}
            <div className="animate-pulse">_</div>
          </div>
        </div>

        {/* Integrations Monitor */}
        <div className="card flex flex-col overflow-hidden h-[320px]">
          <div className="pb-4 border-b border-surface-container">
            <span className="text-primary font-bold text-xs uppercase tracking-widest">Integrations Monitor</span>
          </div>
          <div className="flex-1 divide-y divide-surface-container overflow-y-auto">
            {[
              { name: "OpenZeppelin Defender", desc: "Agent Logic Safeguards", icon: "security" },
              { name: "Freighter Wallet", desc: "Signing Service Provider", icon: "account_balance_wallet" },
              { name: "Stellar Horizon", desc: "Testnet Gateway API", icon: "hub" },
            ].map((item) => (
              <div key={item.name} className="px-2 py-4 flex items-center justify-between hover:bg-surface">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-surface-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-[18px]">{item.icon}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{item.name}</p>
                    <p className="text-[10px] text-on-surface-variant font-mono">{item.desc}</p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-tertiary-fixed-dim/20 text-on-tertiary-container rounded text-[10px] font-mono font-bold">ONLINE</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
