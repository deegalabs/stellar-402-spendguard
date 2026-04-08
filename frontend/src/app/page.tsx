"use client";

import Link from "next/link";
import { useContractStatus } from "@/hooks/useContractStatus";
import { stroopsToUsdc, shortAddress } from "@/lib/format";
import SpendGuardLogo from "@/components/SpendGuardLogo";
import ThemeToggle from "@/components/ThemeToggle";

const FEATURES = [
  {
    icon: "shield",
    title: "On-Chain Guardrails",
    body: "Daily spending caps, per-transaction limits, and merchant allow-lists enforced by a Soroban contract — not by a server that can be bypassed.",
  },
  {
    icon: "bolt",
    title: "x402 Native",
    body: "Agents pay the HTTP-native x402 price signaled by the merchant. Settlement lands on Stellar through the OpenZeppelin Relayer facilitator.",
  },
  {
    icon: "lock",
    title: "Emergency Kill Switch",
    body: "Pause the contract from the dashboard and revoke all new authorizations instantly. In-flight transactions on the ledger remain final.",
  },
  {
    icon: "history_edu",
    title: "Immutable Audit Log",
    body: "Every settlement and every denial is derived directly from Horizon. No mutable backend store, no rewriteable history.",
  },
];

const FLOW_STEPS = [
  { label: "Agent requests resource", sub: "HTTP GET with no payment" },
  { label: "Merchant replies 402", sub: "Signals price + asset" },
  { label: "SpendGuard pre-checks policy", sub: "Budget, cap, whitelist, pause" },
  { label: "Soroban auth-entry signed", sub: "Facilitator broadcasts" },
  { label: "Merchant returns resource", sub: "Settlement final on Horizon" },
];

export default function Home() {
  const { status, balance } = useContractStatus();

  const network = status?.network ?? "testnet";
  const paused = status?.paused ?? false;
  const balanceUsdc = balance?.balance_usdc ?? "0.00";
  const dailyLimitUsdc = status ? stroopsToUsdc(status.daily_limit) : "0.00";
  const maxTxUsdc = status ? stroopsToUsdc(status.max_tx_value) : "0.00";
  const contractAddress = status?.contract_address;

  return (
    <div className="min-h-screen bg-dark text-text-primary flex flex-col">
      {/* Top Nav */}
      <header className="border-b border-surface-border bg-dark-50/60 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <SpendGuardLogo size={32} glow className="transition-transform group-hover:scale-105" />
            <span className="font-bold text-sm">SpendGuard</span>
            <span className="hidden sm:inline text-[10px] font-mono uppercase tracking-[0.15em] text-text-muted">
              AI Agent Governance
            </span>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link href="/docs" className="px-3 py-1.5 text-xs font-medium text-text-muted hover:text-text-primary transition-colors">
              Docs
            </Link>
            <Link href="/demo" className="px-3 py-1.5 text-xs font-medium text-text-muted hover:text-text-primary transition-colors">
              Demo
            </Link>
            <ThemeToggle />
            <Link href="/dashboard" className="btn-primary text-xs py-2">
              Open Dashboard
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8 pt-16 lg:pt-24 pb-12 lg:pb-16 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-16 items-center">
          <div className="lg:col-span-3 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary-500/20 bg-primary-glow text-[11px] font-mono uppercase tracking-widest text-primary-fg">
              <span className="w-1.5 h-1.5 rounded-full bg-success-400 animate-pulse" />
              Stellar Hacks · Agents Track
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
              Spending governance for{" "}
              <span className="gradient-text">autonomous AI agents</span> on Stellar.
            </h1>
            <p className="text-base lg:text-lg text-text-muted max-w-2xl leading-relaxed">
              SpendGuard is a Soroban policy contract that sits between your agent and the
              x402 payment flow. Set daily caps, whitelist merchants, pause on demand — and
              every decision is enforced on-chain, not in a server you have to trust.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href="/demo" className="btn-primary">
                <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                See Live Demo
              </Link>
              <Link href="/dashboard" className="btn-secondary">
                Open Dashboard
              </Link>
              <Link href="/docs" className="btn-secondary">
                Read the Docs
              </Link>
            </div>
          </div>

          {/* Live contract panel */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <span className="stat-label">Live Contract</span>
                <span className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${status ? "bg-success-400 animate-pulse" : "bg-warning-400"}`} />
                  <span className={`text-[10px] font-mono uppercase ${status ? "text-success-fg" : "text-warning-fg"}`}>
                    {status ? (paused ? "Paused" : "Active") : "Connecting…"}
                  </span>
                </span>
              </div>

              <div>
                <p className="stat-label mb-1">Vault Balance</p>
                <p className="text-3xl font-bold text-text-primary font-mono">
                  ${Number(balanceUsdc).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  <span className="text-sm font-normal text-text-muted ml-2">USDC</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-5 pt-5 border-t border-surface-border">
                <div>
                  <p className="stat-label mb-1">Daily Cap</p>
                  <p className="text-sm font-mono font-bold text-text-primary">
                    ${Number(dailyLimitUsdc).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="stat-label mb-1">Max / Tx</p>
                  <p className="text-sm font-mono font-bold text-text-primary">
                    ${Number(maxTxUsdc).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="stat-label mb-1">Network</p>
                  <p className="text-sm font-mono font-bold text-text-primary uppercase">
                    Stellar {network}
                  </p>
                </div>
                <div>
                  <p className="stat-label mb-1">Contract</p>
                  {contractAddress ? (
                    <a
                      href={`https://stellar.expert/explorer/${network}/contract/${contractAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-mono font-bold text-accent-fg hover:underline"
                    >
                      {shortAddress(contractAddress)}
                    </a>
                  ) : (
                    <p className="text-sm font-mono font-bold text-text-disabled">—</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8 py-12 lg:py-20 w-full">
        <div className="max-w-2xl mb-10">
          <p className="stat-label mb-3">What it does</p>
          <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">
            Four guardrails, all enforced on the ledger.
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="card hover:border-primary-500/30 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-primary-glow flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-primary-fg text-[20px]">
                  {f.icon}
                </span>
              </div>
              <h3 className="font-semibold text-text-primary mb-1.5">{f.title}</h3>
              <p className="text-sm text-text-muted leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Flow */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8 py-12 lg:py-20 w-full">
        <div className="max-w-2xl mb-10">
          <p className="stat-label mb-3">How a payment flows</p>
          <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">
            x402 → SpendGuard → Stellar.
          </h2>
        </div>
        <div className="card">
          <ol className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {FLOW_STEPS.map((step, i) => (
              <li key={step.label} className="relative">
                <div className="flex items-center gap-3 md:block">
                  <span className="text-[10px] font-mono font-bold text-primary-fg shrink-0">
                    0{i + 1}
                  </span>
                  <p className="text-sm font-semibold text-text-primary md:mt-2">{step.label}</p>
                </div>
                <p className="text-[11px] text-text-muted md:mt-1 ml-8 md:ml-0">{step.sub}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8 py-12 lg:py-20 w-full">
        <div className="card text-center py-12 lg:py-16 border-primary-500/20 bg-gradient-to-br from-primary-500/5 via-transparent to-accent-500/5">
          <h2 className="text-2xl lg:text-3xl font-bold tracking-tight mb-3">
            Ready to put your agent on a leash?
          </h2>
          <p className="text-text-muted max-w-xl mx-auto mb-6">
            Walk through a live end-to-end flow on Stellar testnet — no wallet required.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/demo" className="btn-primary">
              <span className="material-symbols-outlined text-[18px]">play_arrow</span>
              Run the Demo
            </Link>
            <Link href="/dashboard" className="btn-secondary">
              Open Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-surface-border bg-dark-50/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] font-mono uppercase tracking-widest text-text-disabled">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-text-muted">SpendGuard</span>
            <span className="opacity-40">·</span>
            <span>Stellar {network}</span>
            {contractAddress && (
              <>
                <span className="opacity-40 hidden sm:inline">·</span>
                <a
                  href={`https://stellar.expert/explorer/${network}/contract/${contractAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:inline text-accent-fg/60 hover:text-accent-fg transition-colors"
                >
                  {shortAddress(contractAddress)}
                </a>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span>Built by</span>
            <a
              href="https://www.deegalabs.com.br/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-muted hover:text-text-primary transition-colors"
            >
              DeegaLabs
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
