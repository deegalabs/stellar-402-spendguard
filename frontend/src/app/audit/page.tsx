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
        <div className="flex items-center gap-3 text-text-muted">
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
      <div className="card border-error/30 text-error-fg">
        <p className="font-semibold">Connection Error</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  const totalPages = Math.ceil(transactions.length / PAGE_SIZE) || 1;
  const paginated = transactions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const settled = transactions.filter(t => t.status === "settled").length;

  return (
    <div className="space-y-6 lg:space-y-8 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-text-primary">Audit Log</h2>
          <p className="text-text-muted text-sm mt-1">
            Immutable record of agent settlements and policy enforcement.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary text-xs py-2">
            <span className="material-symbols-outlined text-[16px]">filter_list</span>
            Filter
          </button>
          <button className="btn-secondary text-xs py-2">
            <span className="material-symbols-outlined text-[16px]">download</span>
            Export
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
        <div className="card">
          <p className="stat-label mb-2">Total Transactions</p>
          <p className="stat-value">{transactions.length.toLocaleString()}</p>
        </div>
        <div className="card">
          <p className="stat-label mb-2">Unique Merchants</p>
          <p className="stat-value">
            {new Set(transactions.filter((t) => t.merchant).map((t) => t.merchant)).size || "—"}
          </p>
        </div>
        <div className="card">
          <p className="stat-label mb-2">Total Volume</p>
          <p className="stat-value">
            {transactions.length > 0
              ? `$${transactions.reduce((sum, t) => sum + Number(stroopsToUsdc(t.amount)), 0).toFixed(2)}`
              : "—"
            }
          </p>
        </div>
        <div className="card">
          <p className="stat-label mb-2">Success Rate</p>
          <p className="stat-value">
            {transactions.length > 0 ? `${((settled / transactions.length) * 100).toFixed(0)}%` : "—"}
          </p>
        </div>
      </div>

      {/* Transaction Table — Desktop */}
      <div className="card p-0 overflow-hidden hidden sm:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-text-muted text-[10px] font-mono uppercase tracking-widest border-b border-surface-border">
                <th className="px-4 lg:px-6 py-4">Status</th>
                <th className="px-4 lg:px-6 py-4">Date/Time</th>
                <th className="px-4 lg:px-6 py-4">Hash</th>
                <th className="px-4 lg:px-6 py-4 text-right">Amount</th>
                <th className="px-4 lg:px-6 py-4">Facilitator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border text-sm">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-text-muted">
                    No transactions yet. Run the agent demo to generate data.
                  </td>
                </tr>
              ) : (
                paginated.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          tx.status === "settled" ? "bg-success-400" :
                          tx.status === "blocked" ? "bg-error-400" : "bg-warning-400"
                        }`} />
                        <span className={`font-mono text-xs ${
                          tx.status === "settled" ? "text-success-fg" :
                          tx.status === "blocked" ? "text-error-fg" : "text-warning-fg"
                        }`}>
                          {tx.status === "settled" ? "SUCCESS" : tx.status === "blocked" ? "DENIED" : "PENDING"}
                        </span>
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-xs text-text-secondary">
                      {formatTimestamp(tx.timestamp)}
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <a
                        href={tx.stellar_expert_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-accent-fg hover:text-accent-fg transition-colors"
                      >
                        {tx.tx_hash.slice(0, 8)}...{tx.tx_hash.slice(-4)}
                      </a>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-right">
                      <span className="font-mono font-bold text-text-primary">
                        {Number(stroopsToUsdc(tx.amount)).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-text-muted ml-1 text-xs">USDC</span>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      {tx.merchant ? (
                        <span className="font-mono text-xs text-text-secondary">
                          {tx.merchant.slice(0, 6)}...{tx.merchant.slice(-4)}
                        </span>
                      ) : (
                        <span className="text-xs text-text-disabled">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 lg:px-6 py-4 border-t border-surface-border flex items-center justify-between">
            <p className="text-sm text-text-muted font-mono">
              {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, transactions.length)} of {transactions.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-surface-border rounded text-sm text-text-secondary hover:bg-dark-300 disabled:opacity-30"
              >
                Prev
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border border-surface-border rounded text-sm text-text-secondary hover:bg-dark-300 disabled:opacity-30"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Cards — Mobile */}
      <div className="sm:hidden space-y-2">
        {paginated.length === 0 ? (
          <div className="card text-center text-text-muted text-sm py-8">
            No transactions yet.
          </div>
        ) : (
          paginated.map((tx) => (
            <div key={tx.id} className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    tx.status === "settled" ? "bg-success-400" :
                    tx.status === "blocked" ? "bg-error-400" : "bg-warning-400"
                  }`} />
                  <span className={`font-mono text-xs font-bold ${
                    tx.status === "settled" ? "text-success-fg" :
                    tx.status === "blocked" ? "text-error-fg" : "text-warning-fg"
                  }`}>
                    {tx.status === "settled" ? "SUCCESS" : tx.status === "blocked" ? "DENIED" : "PENDING"}
                  </span>
                </span>
                <span className="text-xs text-text-muted">{formatTimestamp(tx.timestamp)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-text-primary">${stroopsToUsdc(tx.amount)} USDC</span>
                <a
                  href={tx.stellar_expert_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[10px] text-accent-fg"
                >
                  {tx.tx_hash.slice(0, 8)}...
                </a>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom: Log Stream */}
      <div className="terminal h-[280px] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <span className="text-text-secondary font-bold text-xs uppercase tracking-wider">System Log</span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-success-400 animate-pulse" />
            <span className="text-[10px] font-mono text-success-fg">LIVE</span>
          </span>
        </div>
        {transactions.slice(0, 10).map((tx) => (
          <div key={tx.id} className="mb-1">
            <span className="text-text-disabled">[{tx.timestamp}]</span>{" "}
            <span className={tx.status === "settled" ? "text-accent-fg" : "text-warning-fg"}>
              {tx.status === "settled" ? "INFO" : "WARN"}
            </span>:{" "}
            <span className="text-text-secondary">
              {tx.type === "payment_authorized"
                ? `Settlement ${tx.tx_hash.slice(0, 8)}... broadcast to Horizon`
                : `Payment rejected at policy boundary`
              }
            </span>
          </div>
        ))}
        {transactions.length === 0 && (
          <div className="text-text-disabled">Waiting for events...</div>
        )}
        <div className="animate-pulse text-primary-fg">_</div>
      </div>
    </div>
  );
}
