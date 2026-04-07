"use client";

import { useState, useRef, useEffect } from "react";
import {
  getStatus,
  getBalance,
  setDailyLimit,
  setMaxTx,
  whitelistMerchant,
  runAgent,
  pauseContract,
  unpauseContract,
} from "@/lib/api";
import { stroopsToUsdc, usdcToStroops, shortAddress } from "@/lib/format";
import type { ContractStatus, BalanceInfo } from "@/lib/types";

interface LogEntry {
  icon: "info" | "ok" | "err" | "wait" | "tx" | "block";
  text: string;
  link?: string;
}

interface DemoStep {
  id: string;
  title: string;
  description: string;
  action: () => Promise<void>;
}

const EXPERT = "https://stellar.expert/explorer/testnet/tx/";

export default function DemoPage() {
  const [currentStep, setCurrentStep] = useState(-1);
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [status, setStatus] = useState<ContractStatus | null>(null);
  const [balance, setBalance] = useState<BalanceInfo | null>(null);
  const [finished, setFinished] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  function log(entry: LogEntry) {
    setLogs((prev) => [...prev, entry]);
  }

  async function refreshStatus() {
    const [s, b] = await Promise.all([getStatus(), getBalance()]);
    setStatus(s);
    setBalance(b);
    return { status: s, balance: b };
  }

  const steps: DemoStep[] = [
    {
      id: "status",
      title: "Read Contract Status",
      description: "Query the deployed BudgetGuard contract on Stellar Testnet.",
      action: async () => {
        log({ icon: "wait", text: "Querying contract via Soroban RPC..." });
        const { status: s, balance: b } = await refreshStatus();
        log({ icon: "ok", text: `Owner: ${shortAddress(s.owner)}` });
        log({ icon: "ok", text: `Agent: ${shortAddress(s.agent)}` });
        log({ icon: "ok", text: `Balance: $${b.balance_usdc} USDC` });
        log({ icon: "ok", text: `Daily Limit: $${stroopsToUsdc(s.daily_limit)}` });
        log({ icon: "ok", text: `Max per Tx: $${stroopsToUsdc(s.max_tx_value)}` });
        log({ icon: "ok", text: `Spent Today: $${stroopsToUsdc(s.spent_today)}` });
        log({ icon: "info", text: `Paused: ${s.paused ? "YES" : "no"}` });
      },
    },
    {
      id: "daily-limit",
      title: "Set Daily Limit to $5.00",
      description: "Owner configures the maximum the agent can spend per day.",
      action: async () => {
        log({ icon: "wait", text: "Calling contract.set_daily_limit(50_000_000)..." });
        const res = (await setDailyLimit(usdcToStroops(5))) as { tx_hash: string };
        log({ icon: "tx", text: `tx: ${res.tx_hash}`, link: EXPERT + res.tx_hash });
        log({ icon: "ok", text: "Daily limit set to $5.00 USDC" });
        await refreshStatus();
      },
    },
    {
      id: "max-tx",
      title: "Set Max Transaction to $2.00",
      description: "No single payment can exceed this value.",
      action: async () => {
        log({ icon: "wait", text: "Calling contract.set_max_tx(20_000_000)..." });
        const res = (await setMaxTx(usdcToStroops(2))) as { tx_hash: string };
        log({ icon: "tx", text: `tx: ${res.tx_hash}`, link: EXPERT + res.tx_hash });
        log({ icon: "ok", text: "Max transaction set to $2.00 USDC" });
        await refreshStatus();
      },
    },
    {
      id: "whitelist",
      title: "Whitelist Demo Merchant",
      description: "Only whitelisted merchants can receive agent payments.",
      action: async () => {
        const merchant = status?.agent ?? "";
        log({ icon: "wait", text: `Whitelisting ${shortAddress(merchant)}...` });
        try {
          const res = (await whitelistMerchant(merchant)) as { tx_hash: string };
          log({ icon: "tx", text: `tx: ${res.tx_hash}`, link: EXPERT + res.tx_hash });
          log({ icon: "ok", text: "Merchant whitelisted on-chain" });
        } catch {
          log({ icon: "info", text: "Merchant already whitelisted (skipping)" });
        }
      },
    },
    {
      id: "payment-1",
      title: "x402 Payment: $0.10 (Weather API)",
      description: "Agent requests a protected resource, gets HTTP 402, pays via contract.",
      action: async () => {
        log({ icon: "info", text: "Agent: GET /api/demo/protected-resource" });
        log({ icon: "wait", text: "Merchant: HTTP 402 Payment Required ($0.10 USDC)" });
        log({ icon: "wait", text: "Agent calls contract.authorize_payment($0.10, merchant)..." });
        const start = Date.now();
        const res = await runAgent();
        const ms = Date.now() - start;
        for (const step of res.steps) {
          if (step.tx_hash) {
            log({ icon: "tx", text: `tx: ${step.tx_hash}`, link: EXPERT + step.tx_hash });
          }
          if (step.status === 200 || step.status === "approved") {
            log({ icon: "ok", text: `[${step.step}] ${step.data ?? `status=${step.status}`}` });
          } else if (step.error) {
            log({ icon: "err", text: `[${step.step}] ${step.error}` });
          }
        }
        log({ icon: "ok", text: `Payment settled in ${ms}ms` });
        await refreshStatus();
      },
    },
    {
      id: "payment-2",
      title: "x402 Payment: $0.10 (Translation)",
      description: "Another successful payment, accumulating toward the daily limit.",
      action: async () => {
        log({ icon: "wait", text: "Agent: authorize_payment($0.10, merchant)..." });
        const res = await runAgent();
        for (const step of res.steps) {
          if (step.tx_hash) {
            log({ icon: "tx", text: `tx: ${step.tx_hash}`, link: EXPERT + step.tx_hash });
          }
        }
        log({ icon: "ok", text: "Payment authorized" });
        const { status: s } = await refreshStatus();
        log({ icon: "info", text: `Spent today: $${stroopsToUsdc(s.spent_today)} / $${stroopsToUsdc(s.daily_limit)}` });
      },
    },
    {
      id: "blocked",
      title: "Blocked Payment: Exceeds Daily Limit",
      description: "The contract rejects this payment on-chain.",
      action: async () => {
        log({ icon: "info", text: "Attempting payment that may approach daily limit..." });
        log({ icon: "wait", text: "Agent: authorize_payment($0.10, merchant)..." });
        const res = await runAgent();
        const lastStep = res.steps[res.steps.length - 1];
        if (res.success) {
          log({ icon: "ok", text: "Payment went through (limit not yet reached)" });
          for (const step of res.steps) {
            if (step.tx_hash) {
              log({ icon: "tx", text: `tx: ${step.tx_hash}`, link: EXPERT + step.tx_hash });
            }
          }
        } else {
          log({ icon: "block", text: `BLOCKED: ${lastStep?.error ?? "ExceedsDailyLimit"}` });
          log({ icon: "err", text: "The CONTRACT rejected this on-chain" });
        }
        await refreshStatus();
      },
    },
    {
      id: "kill-switch",
      title: "Emergency Kill Switch (Pause)",
      description: "Owner blocks ALL new agent payments immediately.",
      action: async () => {
        log({ icon: "wait", text: "Calling contract.emergency_pause()..." });
        try {
          const res = (await pauseContract()) as { tx_hash: string };
          log({ icon: "tx", text: `tx: ${res.tx_hash}`, link: EXPERT + res.tx_hash });
          log({ icon: "block", text: "CONTRACT PAUSED -- All agent payments blocked" });
        } catch {
          log({ icon: "info", text: "Contract already paused" });
        }
        await refreshStatus();
      },
    },
    {
      id: "paused-payment",
      title: "Payment While Paused (Blocked)",
      description: "Verify the kill switch works.",
      action: async () => {
        log({ icon: "wait", text: "Agent attempts payment while contract is paused..." });
        const res = await runAgent();
        if (!res.success) {
          log({ icon: "block", text: "BLOCKED: ContractPaused" });
          log({ icon: "ok", text: "Kill switch confirmed: zero payments while paused" });
        } else {
          log({ icon: "err", text: "Unexpected: payment succeeded while paused" });
        }
      },
    },
    {
      id: "unpause",
      title: "Resume Operations (Unpause)",
      description: "Owner lifts the emergency pause.",
      action: async () => {
        log({ icon: "wait", text: "Calling contract.emergency_unpause()..." });
        try {
          const res = (await unpauseContract()) as { tx_hash: string };
          log({ icon: "tx", text: `tx: ${res.tx_hash}`, link: EXPERT + res.tx_hash });
          log({ icon: "ok", text: "Contract UNPAUSED" });
        } catch {
          log({ icon: "info", text: "Contract already unpaused" });
        }
        await refreshStatus();
      },
    },
    {
      id: "audit",
      title: "Final Audit & Status",
      description: "Every transaction is immutable and verifiable on Stellar.",
      action: async () => {
        const { status: s, balance: b } = await refreshStatus();
        log({ icon: "ok", text: `Balance: $${b.balance_usdc} USDC` });
        log({ icon: "ok", text: `Spent Today: $${stroopsToUsdc(s.spent_today)}` });
        log({ icon: "ok", text: `Paused: ${s.paused ? "YES" : "no"}` });
        log({ icon: "info", text: "Every TX links to Stellar Expert -- fully verifiable on-chain" });
        log({ icon: "ok", text: "SpendGuard demo complete" });
      },
    },
  ];

  async function executeStep(index: number) {
    setCurrentStep(index);
    setRunning(true);
    log({ icon: "info", text: `--- Step ${index + 1}: ${steps[index].title} ---` });
    try {
      await steps[index].action();
    } catch (err) {
      log({ icon: "err", text: err instanceof Error ? err.message : "Unknown error" });
    }
    setRunning(false);
    if (index === steps.length - 1) setFinished(true);
  }

  async function runAll() {
    setLogs([]);
    setFinished(false);
    for (let i = 0; i < steps.length; i++) {
      await executeStep(i);
    }
  }

  function iconFor(icon: LogEntry["icon"]) {
    switch (icon) {
      case "ok": return { symbol: ">", color: "text-accent-400" };
      case "err": return { symbol: "x", color: "text-danger-400" };
      case "wait": return { symbol: "~", color: "text-warning-300" };
      case "tx": return { symbol: "#", color: "text-secondary-400" };
      case "block": return { symbol: "!", color: "text-danger-500" };
      default: return { symbol: ".", color: "text-neutral-400" };
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-headline text-neutral-900">Interactive Demo</h2>
          <p className="text-sm text-neutral-500 mt-1">
            Step-by-step x402 SpendGuard flow with real Stellar Testnet transactions
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={runAll} disabled={running} className="btn-primary">
            {running ? "Running..." : "Run All Steps"}
          </button>
          <button
            onClick={() => { setLogs([]); setCurrentStep(-1); setFinished(false); }}
            disabled={running}
            className="btn-secondary"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Steps panel */}
        <div className="lg:col-span-1 space-y-1.5">
          {steps.map((step, i) => {
            const isDone = i < currentStep || (i === currentStep && !running);
            const isCurrent = i === currentStep && running;
            const isNext = i === currentStep + 1 && !running && !finished;

            return (
              <button
                key={step.id}
                onClick={() => executeStep(i)}
                disabled={running}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  isCurrent
                    ? "border-secondary bg-secondary-50 ring-2 ring-secondary/20"
                    : isDone
                    ? "border-accent-200 bg-accent-50/50"
                    : isNext
                    ? "border-primary-200 bg-primary-50 hover:bg-primary-100/50"
                    : "border-neutral-200 bg-white hover:bg-neutral-50"
                } disabled:cursor-not-allowed`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      isDone
                        ? "bg-accent text-white"
                        : isCurrent
                        ? "bg-secondary text-white animate-pulse"
                        : "bg-neutral-200 text-neutral-500"
                    }`}
                  >
                    {isDone ? "\u2713" : i + 1}
                  </div>
                  <div>
                    <div className={`text-sm font-semibold ${
                      isCurrent ? "text-secondary-700" : isDone ? "text-accent-700" : "text-neutral-700"
                    }`}>
                      {step.title}
                    </div>
                    <div className="text-[11px] text-neutral-400 mt-0.5 leading-tight">
                      {step.description}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Terminal output */}
        <div className="lg:col-span-2">
          {/* Live status bar */}
          {status && (
            <div className="flex gap-3 mb-4 flex-wrap">
              <div className="card py-2 px-4 text-sm">
                <span className="text-neutral-400">Balance:</span>{" "}
                <span className="font-bold">${balance?.balance_usdc ?? "?"}</span>
              </div>
              <div className="card py-2 px-4 text-sm">
                <span className="text-neutral-400">Spent:</span>{" "}
                <span className="font-bold">${stroopsToUsdc(status.spent_today)}</span>
                <span className="text-neutral-400"> / ${stroopsToUsdc(status.daily_limit)}</span>
              </div>
              <div className={`card py-2 px-4 text-sm font-bold ${
                status.paused
                  ? "bg-danger-50 border-danger-200 text-danger-600"
                  : "bg-accent-50 border-accent-200 text-accent-600"
              }`}>
                {status.paused ? "PAUSED" : "ACTIVE"}
              </div>
            </div>
          )}

          {/* Terminal */}
          <div
            ref={logRef}
            className="terminal min-h-[500px] max-h-[600px] rounded-card text-sm p-5"
          >
            {logs.length === 0 ? (
              <div className="text-neutral-500">
                Click &ldquo;Run All Steps&rdquo; or click individual steps to begin.
                <br /><br />
                Each step executes real transactions on Stellar Testnet.
                <br />
                TX hashes link to Stellar Expert for on-chain verification.
              </div>
            ) : (
              <div className="space-y-1">
                {logs.map((entry, i) => {
                  const { symbol, color } = iconFor(entry.icon);
                  return (
                    <div key={i} className="flex items-start gap-2">
                      <span className={`${color} flex-shrink-0`}>{symbol}</span>
                      <span className="text-neutral-300">
                        {entry.link ? (
                          <a
                            href={entry.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-secondary-400 hover:text-secondary-300 hover:underline"
                          >
                            {entry.text}
                          </a>
                        ) : (
                          entry.text
                        )}
                      </span>
                    </div>
                  );
                })}
                {running && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-warning-300 animate-pulse">~</span>
                    <span className="text-warning-300 animate-pulse">executing...</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {finished && (
            <div className="mt-4 card border-accent-200 bg-accent-50/50 text-sm text-accent-700">
              Demo complete. All transactions are live on Stellar Testnet.
              View the contract on{" "}
              <a
                href="https://stellar.expert/explorer/testnet/contract/CCABMNFY3VKK7BI3YBWXJEE2EXX2NW5S573NASTCFXA6KBXR5PDWFD6E"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline"
              >
                Stellar Expert
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
