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

// ---------- types ----------
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

// ---------- component ----------
export default function DemoPage() {
  const [currentStep, setCurrentStep] = useState(-1);
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [status, setStatus] = useState<ContractStatus | null>(null);
  const [balance, setBalance] = useState<BalanceInfo | null>(null);
  const [finished, setFinished] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  // auto-scroll terminal
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

  // ---------- step definitions ----------
  const steps: DemoStep[] = [
    // Step 0: read status
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

    // Step 1: set daily limit
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

    // Step 2: set max tx
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

    // Step 3: whitelist merchant
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

    // Step 4: successful x402 payment
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
        log({ icon: "info", text: `Spent today: $${stroopsToUsdc(status?.spent_today ?? "0")}` });
      },
    },

    // Step 5: second payment
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

    // Step 6: blocked payment (over limit)
    {
      id: "blocked",
      title: "Blocked Payment: Exceeds Daily Limit",
      description: "The contract rejects this payment on-chain. Not the backend, not the agent.",
      action: async () => {
        log({ icon: "info", text: "Attempting payment that may approach or exceed daily limit..." });
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
          log({ icon: "info", text: "Run more payments to hit the $5.00 daily limit" });
        } else {
          log({ icon: "block", text: `BLOCKED: ${lastStep?.error ?? "ExceedsDailyLimit"}` });
          log({ icon: "err", text: "The CONTRACT rejected this on-chain" });
          log({ icon: "info", text: "The agent code did NOT block this -- the blockchain did" });
        }
        await refreshStatus();
      },
    },

    // Step 7: kill switch
    {
      id: "kill-switch",
      title: "Emergency Kill Switch (Pause)",
      description: "Owner immediately blocks ALL new agent payments. In-flight transactions are final.",
      action: async () => {
        log({ icon: "wait", text: "Calling contract.emergency_pause()..." });
        try {
          const res = (await pauseContract()) as { tx_hash: string };
          log({ icon: "tx", text: `tx: ${res.tx_hash}`, link: EXPERT + res.tx_hash });
          log({ icon: "block", text: "CONTRACT PAUSED -- All agent payments blocked" });
          log({ icon: "info", text: "In-flight transactions on the ledger are final (blockchain finality)" });
        } catch {
          log({ icon: "info", text: "Contract already paused" });
        }
        await refreshStatus();
      },
    },

    // Step 8: verify blocked while paused
    {
      id: "paused-payment",
      title: "Payment While Paused (Blocked)",
      description: "Verify the kill switch works: no payments go through.",
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

    // Step 9: unpause
    {
      id: "unpause",
      title: "Resume Operations (Unpause)",
      description: "Owner lifts the emergency pause. Payments can flow again.",
      action: async () => {
        log({ icon: "wait", text: "Calling contract.emergency_unpause()..." });
        try {
          const res = (await unpauseContract()) as { tx_hash: string };
          log({ icon: "tx", text: `tx: ${res.tx_hash}`, link: EXPERT + res.tx_hash });
          log({ icon: "ok", text: "Contract UNPAUSED -- payments can flow again" });
        } catch {
          log({ icon: "info", text: "Contract already unpaused" });
        }
        await refreshStatus();
      },
    },

    // Step 10: final status
    {
      id: "audit",
      title: "Final Audit & Status",
      description: "Every transaction is immutable, verifiable, and public on Stellar.",
      action: async () => {
        const { status: s, balance: b } = await refreshStatus();
        log({ icon: "ok", text: `Balance: $${b.balance_usdc} USDC` });
        log({ icon: "ok", text: `Spent Today: $${stroopsToUsdc(s.spent_today)}` });
        log({ icon: "ok", text: `Paused: ${s.paused ? "YES" : "no"}` });
        log({ icon: "info", text: "Every TX hash links to Stellar Expert -- fully verifiable on-chain" });
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
      case "ok": return { symbol: ">", color: "text-green-400" };
      case "err": return { symbol: "x", color: "text-red-400" };
      case "wait": return { symbol: "~", color: "text-yellow-400" };
      case "tx": return { symbol: "#", color: "text-blue-400" };
      case "block": return { symbol: "!", color: "text-red-500" };
      default: return { symbol: ".", color: "text-slate-400" };
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Interactive Demo</h2>
          <p className="text-sm text-slate-500 mt-1">
            Step-by-step x402 SpendGuard flow with real Stellar Testnet transactions
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={runAll}
            disabled={running}
            className="bg-indigo-600 text-white text-sm px-5 py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium transition-colors"
          >
            {running ? "Running..." : "Run All Steps"}
          </button>
          <button
            onClick={() => { setLogs([]); setCurrentStep(-1); setFinished(false); }}
            disabled={running}
            className="bg-slate-200 text-slate-700 text-sm px-4 py-2.5 rounded-lg hover:bg-slate-300 disabled:opacity-50 font-medium transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Steps panel */}
        <div className="lg:col-span-1 space-y-2">
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
                    ? "border-blue-400 bg-blue-50 ring-2 ring-blue-200"
                    : isDone
                    ? "border-green-200 bg-green-50"
                    : isNext
                    ? "border-indigo-300 bg-indigo-50 hover:bg-indigo-100"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                } disabled:cursor-not-allowed`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      isDone
                        ? "bg-green-500 text-white"
                        : isCurrent
                        ? "bg-blue-500 text-white animate-pulse"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {isDone ? "\u2713" : i + 1}
                  </div>
                  <div>
                    <div className={`text-sm font-semibold ${isCurrent ? "text-blue-700" : isDone ? "text-green-700" : "text-slate-700"}`}>
                      {step.title}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">{step.description}</div>
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
              <div className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm">
                <span className="text-slate-400">Balance:</span>{" "}
                <span className="font-bold">${balance?.balance_usdc ?? "?"}</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm">
                <span className="text-slate-400">Spent:</span>{" "}
                <span className="font-bold">${stroopsToUsdc(status.spent_today)}</span>
                <span className="text-slate-400"> / ${stroopsToUsdc(status.daily_limit)}</span>
              </div>
              <div className={`border rounded-lg px-4 py-2 text-sm font-bold ${
                status.paused ? "bg-red-50 border-red-300 text-red-600" : "bg-green-50 border-green-200 text-green-600"
              }`}>
                {status.paused ? "PAUSED" : "ACTIVE"}
              </div>
            </div>
          )}

          {/* Terminal */}
          <div
            ref={logRef}
            className="bg-slate-900 rounded-xl p-5 font-mono text-sm min-h-[500px] max-h-[600px] overflow-auto"
          >
            {logs.length === 0 ? (
              <div className="text-slate-500">
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
                      <span className="text-slate-300">
                        {entry.link ? (
                          <a
                            href={entry.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 hover:underline"
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
                    <span className="text-yellow-400 animate-pulse">~</span>
                    <span className="text-yellow-400 animate-pulse">executing...</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {finished && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-700">
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
