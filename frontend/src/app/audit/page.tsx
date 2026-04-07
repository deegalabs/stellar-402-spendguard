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
        <div className="flex items-center gap-3 text-neutral-500">
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
      <div className="card border-danger-200 bg-danger-50/30 text-danger-700">
        <p className="font-semibold">Connection Error</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  const totalPages = Math.ceil(transactions.length / PAGE_SIZE) || 1;
  const paginated = transactions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const settled = transactions.filter(t => t.status === "settled").length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-headline text-neutral-900">Audit Log</h2>
          <p className="text-sm text-neutral-500 mt-1">
            Institutional record of automated agent settlements and endpoint requests.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary text-xs">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
            </svg>
            Filter
          </button>
          <button className="btn-secondary text-xs">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card">
          <p className="stat-label">Total Transactions</p>
          <p className="stat-value mt-1">{transactions.length.toLocaleString()}</p>
        </div>
        <div className="card">
          <p className="stat-label">Settlement Velocity</p>
          <p className="stat-value mt-1">0.8s</p>
        </div>
        <div className="card">
          <p className="stat-label">Bridge Volume</p>
          <p className="stat-value mt-1">
            {transactions.length > 0
              ? `$${transactions.reduce((sum, t) => sum + Number(stroopsToUsdc(t.amount)), 0).toFixed(0)}`
              : "$0"
            }
          </p>
        </div>
        <div className="card">
          <p className="stat-label">Success Rate</p>
          <p className="stat-value mt-1 text-accent-600">
            {transactions.length > 0 ? `${((settled / transactions.length) * 100).toFixed(0)}%` : "---"}
          </p>
        </div>
      </div>

      {/* Transaction table */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50/50">
              <th className="text-left px-5 py-3 stat-label">Status</th>
              <th className="text-left px-5 py-3 stat-label">Date/Time</th>
              <th className="text-left px-5 py-3 stat-label">Requested Endpoint</th>
              <th className="text-left px-5 py-3 stat-label">Transaction Hash</th>
              <th className="text-right px-5 py-3 stat-label">Amount</th>
              <th className="text-left px-5 py-3 stat-label">Facilitator</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-neutral-400">
                  No transactions yet. Run the agent demo to generate data.
                </td>
              </tr>
            ) : (
              paginated.map((tx) => (
                <tr key={tx.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        tx.status === "settled" ? "bg-accent" :
                        tx.status === "blocked" ? "bg-danger" : "bg-warning"
                      }`} />
                      <span className="font-semibold text-xs uppercase text-neutral-700">
                        {tx.status === "settled" ? "Success" : tx.status === "blocked" ? "Denied" : "Pending"}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-neutral-600 text-xs">
                    {formatTimestamp(tx.timestamp)}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded ${
                      tx.status === "blocked"
                        ? "bg-danger-50 text-danger-600"
                        : "bg-secondary-50 text-secondary-600"
                    }`}>
                      {tx.status === "blocked" ? "HTTP 403" : "HTTP 402"}
                    </span>
                    <span className="ml-2 text-xs text-neutral-500 font-mono">
                      {tx.type === "payment_authorized" ? "/api/v1/settle" : "/auth/reject"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <a
                      href={tx.stellar_expert_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-secondary hover:underline"
                    >
                      {tx.tx_hash.slice(0, 6)}...{tx.tx_hash.slice(-4)}
                    </a>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="font-bold text-neutral-900">
                      {Number(stroopsToUsdc(tx.amount)).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-neutral-400 ml-1 text-xs">USDC</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-accent rounded-full" />
                      <span className="text-xs text-neutral-500">Service Vault</span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-neutral-100 bg-neutral-50/50">
            <span className="text-xs text-neutral-400">
              Showing {(page - 1) * PAGE_SIZE + 1} - {Math.min(page * PAGE_SIZE, transactions.length)} of {transactions.length} entries
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-xs text-neutral-600 hover:bg-neutral-200 rounded disabled:opacity-30"
              >
                &larr; Prev
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-7 h-7 text-xs rounded ${
                    page === i + 1
                      ? "bg-secondary text-white font-bold"
                      : "text-neutral-600 hover:bg-neutral-200"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              {totalPages > 5 && <span className="text-neutral-400 text-xs px-1">...</span>}
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-xs text-neutral-600 hover:bg-neutral-200 rounded disabled:opacity-30"
              >
                Next &rarr;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom row: System Metadata Stream + Integrations */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* System Metadata Stream */}
        <div className="lg:col-span-3 card p-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 bg-neutral-900">
            <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider">System Metadata Stream</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              <span className="text-xs text-accent font-semibold">Live</span>
            </div>
          </div>
          <div className="terminal rounded-none max-h-48 overflow-auto">
            {transactions.slice(0, 10).map((tx) => (
              <div key={tx.id} className="leading-relaxed">
                <span className="text-neutral-500">[{tx.timestamp}]</span>{" "}
                <span className={tx.status === "settled" ? "text-accent-400" : tx.status === "blocked" ? "text-danger-400" : "text-warning-300"}>
                  {tx.status === "settled" ? "INFO" : tx.status === "blocked" ? "WARN" : "SYNC"}:
                </span>{" "}
                {tx.type === "payment_authorized"
                  ? `Settlement initialized for Agent. Hash ${tx.tx_hash.slice(0, 8)}...${tx.tx_hash.slice(-4)} broadcast to Stellar Horizon.`
                  : `Payment rejected at policy boundary. Endpoint /auth/reject returned 403.`
                }
              </div>
            ))}
            {transactions.length === 0 && (
              <div className="text-neutral-500">Waiting for events...</div>
            )}
          </div>
        </div>

        {/* Integrations Monitor */}
        <div className="lg:col-span-2 card">
          <p className="stat-label mb-4">Integrations Monitor</p>
          <div className="space-y-4">
            {[
              { name: "OpenZeppelin Defender", desc: "Agent Logic Safeguards", online: true },
              { name: "Freighter Wallet", desc: "Signing Service Provider", online: true },
              { name: "Stellar Horizon", desc: "Testnet Gateway API", online: true },
            ].map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">{item.name}</p>
                    <p className="text-[10px] text-neutral-400">{item.desc}</p>
                  </div>
                </div>
                <span className={`badge text-[10px] ${item.online ? "bg-accent-50 text-accent-700" : "bg-danger-50 text-danger-700"}`}>
                  {item.online ? "Online" : "Offline"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
