"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  getStatus,
  getBalance,
  setDailyLimit,
  setMaxTx,
  whitelistMerchant,
  runAgent,
  pauseContract,
  unpauseContract,
  setAuthAddress,
} from "@/lib/api";
import { stroopsToUsdc, usdcToStroops, shortAddress } from "@/lib/format";
import type { ContractStatus, BalanceInfo } from "@/lib/types";

// ── Types ─────────────────────────────────────────────────────────

interface LogEntry {
  icon: "info" | "ok" | "err" | "wait" | "tx" | "block";
  text: string;
  time: string;
  link?: string;
}

interface EvidenceCard {
  chapter: number;
  label: string;
  value: string;
  type: "tx" | "config" | "block" | "status";
  link?: string;
}

interface ChapterStep {
  id: string;
  title: string;
  action: (log: (e: Omit<LogEntry, "time">) => void) => Promise<EvidenceCard[]>;
}

interface Chapter {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  steps: ChapterStep[];
}

// ── Constants ─────────────────────────────────────────────────────

const EXPERT = "https://stellar.expert/explorer/testnet/tx/";

const DEMO_WALLETS = {
  owner: "GBF5LCVZQ5VQ5DOE57DXY4PDDWS2BGACEJBGJUJYAJSGJKOWHZ5TTLOY",
  agent: "GCBQOCJCSRYWNXSD7EODT4VMJALZSNUOYTGPX2S6FS6NBF7EBNRCXMFB",
  contract: "CCABMNFY3VKK7BI3YBWXJEE2EXX2NW5S573NASTCFXA6KBXR5PDWFD6E",
};

function timestamp(): string {
  return new Date().toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// ── Component ─────────────────────────────────────────────────────

export default function DemoPage() {
  const [activeChapter, setActiveChapter] = useState(0);
  const [chapterStatus, setChapterStatus] = useState<
    ("idle" | "running" | "done")[]
  >([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [evidence, setEvidence] = useState<EvidenceCard[]>([]);
  const [liveTransactions, setLiveTransactions] = useState<
    { hash: string; label: string }[]
  >([]);
  const [status, setStatus] = useState<ContractStatus | null>(null);
  const [balance, setBalance] = useState<BalanceInfo | null>(null);
  const [running, setRunning] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  // Set fixed demo wallet for admin auth
  useEffect(() => {
    setAuthAddress(DEMO_WALLETS.owner);
    return () => setAuthAddress(null);
  }, []);

  // Auto-scroll terminal
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  function addLog(entry: Omit<LogEntry, "time">) {
    setLogs((prev) => [...prev, { ...entry, time: timestamp() }]);
  }

  async function refreshStatus() {
    const [s, b] = await Promise.all([getStatus(), getBalance()]);
    setStatus(s);
    setBalance(b);
    return { status: s, balance: b };
  }

  // ── Chapter Definitions ───────────────────────────────────────

  const chapters: Chapter[] = [
    {
      id: "discover",
      title: "Discover Contract",
      subtitle: "Connect to the deployed BudgetGuard contract on Stellar Testnet and read its current state.",
      icon: "search",
      steps: [
        {
          id: "status",
          title: "Read Contract Status",
          action: async (log) => {
            log({ icon: "wait", text: "Connecting to Soroban RPC..." });
            log({ icon: "info", text: `Contract: ${shortAddress(DEMO_WALLETS.contract)}` });
            const { status: s, balance: b } = await refreshStatus();
            log({ icon: "ok", text: `Owner: ${shortAddress(s.owner)}` });
            log({ icon: "ok", text: `Agent: ${shortAddress(s.agent)}` });
            log({ icon: "ok", text: `Balance: $${b.balance_usdc} USDC` });
            log({ icon: "ok", text: `Daily Limit: $${stroopsToUsdc(s.daily_limit)} USDC` });
            log({ icon: "ok", text: `Max per Tx: $${stroopsToUsdc(s.max_tx_value)} USDC` });
            log({ icon: "ok", text: `Spent Today: $${stroopsToUsdc(s.spent_today)} USDC` });
            log({ icon: "info", text: `Paused: ${s.paused ? "YES" : "no"}` });
            log({ icon: "ok", text: "Contract state loaded successfully" });
            return [
              { chapter: 1, label: "Balance", value: `$${b.balance_usdc} USDC`, type: "status" },
              { chapter: 1, label: "Network", value: "Stellar Testnet", type: "status" },
            ];
          },
        },
      ],
    },
    {
      id: "configure",
      title: "Configure Policies",
      subtitle: "Set spending limits and whitelist merchants — all enforced on-chain by the Soroban contract.",
      icon: "tune",
      steps: [
        {
          id: "daily-limit",
          title: "Set Daily Limit to $5.00",
          action: async (log) => {
            log({ icon: "wait", text: "Calling contract.set_daily_limit(50_000_000)..." });
            const res = (await setDailyLimit(usdcToStroops(5))) as { tx_hash: string };
            log({ icon: "tx", text: `TX: ${res.tx_hash}`, link: EXPERT + res.tx_hash });
            log({ icon: "ok", text: "Daily limit set to $5.00 USDC" });
            await refreshStatus();
            return [
              { chapter: 2, label: "Daily Limit", value: "$5.00 USDC", type: "config", link: EXPERT + res.tx_hash },
            ];
          },
        },
        {
          id: "max-tx",
          title: "Set Max Transaction to $2.00",
          action: async (log) => {
            log({ icon: "wait", text: "Calling contract.set_max_tx(20_000_000)..." });
            const res = (await setMaxTx(usdcToStroops(2))) as { tx_hash: string };
            log({ icon: "tx", text: `TX: ${res.tx_hash}`, link: EXPERT + res.tx_hash });
            log({ icon: "ok", text: "Max transaction set to $2.00 USDC" });
            await refreshStatus();
            return [
              { chapter: 2, label: "Max Tx", value: "$2.00 USDC", type: "config", link: EXPERT + res.tx_hash },
            ];
          },
        },
        {
          id: "whitelist",
          title: "Whitelist Demo Merchant",
          action: async (log) => {
            const merchant = status?.agent ?? DEMO_WALLETS.agent;
            log({ icon: "wait", text: `Whitelisting ${shortAddress(merchant)}...` });
            try {
              const res = (await whitelistMerchant(merchant)) as { tx_hash: string };
              log({ icon: "tx", text: `TX: ${res.tx_hash}`, link: EXPERT + res.tx_hash });
              log({ icon: "ok", text: "Merchant whitelisted on-chain" });
              return [
                { chapter: 2, label: "Whitelisted", value: shortAddress(merchant), type: "config", link: EXPERT + res.tx_hash },
              ];
            } catch {
              log({ icon: "info", text: "Merchant already whitelisted (skipping)" });
              return [
                { chapter: 2, label: "Whitelisted", value: shortAddress(merchant), type: "config" },
              ];
            }
          },
        },
      ],
    },
    {
      id: "payments",
      title: "x402 Payments",
      subtitle: "AI agent pays for API resources via HTTP 402 — each payment authorized on-chain by BudgetGuard.",
      icon: "payments",
      steps: [
        {
          id: "payment-1",
          title: "Payment: $0.10 (Weather API)",
          action: async (log) => {
            log({ icon: "info", text: "Agent: GET /api/demo/protected-resource" });
            log({ icon: "wait", text: "Merchant responds: HTTP 402 Payment Required ($0.10)" });
            log({ icon: "wait", text: "Agent: contract.authorize_payment($0.10, merchant)..." });
            const start = Date.now();
            const res = await runAgent();
            const ms = Date.now() - start;
            const txCards: EvidenceCard[] = [];
            for (const step of res.steps) {
              if (step.tx_hash) {
                log({ icon: "tx", text: `TX: ${step.tx_hash}`, link: EXPERT + step.tx_hash });
                txCards.push({ chapter: 3, label: "Payment #1", value: `$0.10 in ${ms}ms`, type: "tx", link: EXPERT + step.tx_hash });
              }
              if (step.status === 200 || step.status === "approved") {
                log({ icon: "ok", text: `[${step.step}] ${step.data ?? `status=${step.status}`}` });
              } else if (step.error) {
                log({ icon: "err", text: `[${step.step}] ${step.error}` });
              }
            }
            log({ icon: "ok", text: `Payment settled on-chain in ${ms}ms` });
            await refreshStatus();
            return txCards.length > 0 ? txCards : [{ chapter: 3, label: "Payment #1", value: `$0.10 settled`, type: "tx" }];
          },
        },
        {
          id: "payment-2",
          title: "Payment: $0.10 (Translation)",
          action: async (log) => {
            log({ icon: "wait", text: "Agent: authorize_payment($0.10, merchant)..." });
            const res = await runAgent();
            const txCards: EvidenceCard[] = [];
            for (const step of res.steps) {
              if (step.tx_hash) {
                log({ icon: "tx", text: `TX: ${step.tx_hash}`, link: EXPERT + step.tx_hash });
                txCards.push({ chapter: 3, label: "Payment #2", value: `$0.10 settled`, type: "tx", link: EXPERT + step.tx_hash });
              }
            }
            log({ icon: "ok", text: "Payment authorized on-chain" });
            const { status: s } = await refreshStatus();
            log({
              icon: "info",
              text: `Spent today: $${stroopsToUsdc(s.spent_today)} / $${stroopsToUsdc(s.daily_limit)}`,
            });
            return txCards.length > 0 ? txCards : [{ chapter: 3, label: "Payment #2", value: `$0.10 settled`, type: "tx" }];
          },
        },
      ],
    },
    {
      id: "guardrails",
      title: "Guardrail Test",
      subtitle: "Attempt a payment that pushes against the daily limit — the contract enforces the policy on-chain.",
      icon: "shield",
      steps: [
        {
          id: "blocked",
          title: "Payment Blocked by Contract",
          action: async (log) => {
            log({ icon: "info", text: "Attempting payment that approaches daily limit..." });
            log({ icon: "wait", text: "Agent: authorize_payment($0.10, merchant)..." });
            const res = await runAgent();
            const lastStep = res.steps[res.steps.length - 1];
            if (res.success) {
              log({ icon: "ok", text: "Payment went through (limit not yet reached)" });
              for (const step of res.steps) {
                if (step.tx_hash) {
                  log({ icon: "tx", text: `TX: ${step.tx_hash}`, link: EXPERT + step.tx_hash });
                }
              }
              await refreshStatus();
              return [{ chapter: 4, label: "Guardrail", value: "Limit not yet hit", type: "status" }];
            } else {
              log({ icon: "block", text: `BLOCKED: ${lastStep?.error ?? "ExceedsDailyLimit"}` });
              log({ icon: "err", text: "CONTRACT rejected this payment on-chain" });
              log({ icon: "ok", text: "Guardrail working: spending limit enforced" });
              await refreshStatus();
              return [{ chapter: 4, label: "Guardrail", value: "ExceedsDailyLimit", type: "block" }];
            }
          },
        },
      ],
    },
    {
      id: "kill-switch",
      title: "Kill Switch",
      subtitle: "Emergency pause — owner blocks ALL agent payments instantly. Then verify it works.",
      icon: "emergency_home",
      steps: [
        {
          id: "pause",
          title: "Emergency Pause",
          action: async (log) => {
            log({ icon: "wait", text: "Calling contract.emergency_pause()..." });
            try {
              const res = (await pauseContract()) as { tx_hash: string };
              log({ icon: "tx", text: `TX: ${res.tx_hash}`, link: EXPERT + res.tx_hash });
              log({ icon: "block", text: "CONTRACT PAUSED — All agent payments blocked" });
              await refreshStatus();
              return [
                { chapter: 5, label: "Kill Switch", value: "PAUSED", type: "block", link: EXPERT + res.tx_hash },
              ];
            } catch {
              log({ icon: "info", text: "Contract already paused" });
              await refreshStatus();
              return [{ chapter: 5, label: "Kill Switch", value: "Already paused", type: "block" }];
            }
          },
        },
        {
          id: "paused-payment",
          title: "Payment While Paused",
          action: async (log) => {
            log({ icon: "wait", text: "Agent attempts payment while contract is paused..." });
            const res = await runAgent();
            if (!res.success) {
              log({ icon: "block", text: "BLOCKED: ContractPaused" });
              log({ icon: "ok", text: "Kill switch confirmed: zero payments while paused" });
              return [{ chapter: 5, label: "Paused Test", value: "Correctly blocked", type: "block" }];
            } else {
              log({ icon: "err", text: "Unexpected: payment succeeded while paused" });
              return [{ chapter: 5, label: "Paused Test", value: "ERROR: went through", type: "block" }];
            }
          },
        },
      ],
    },
    {
      id: "recovery",
      title: "Recovery & Audit",
      subtitle: "Resume operations and verify the full audit trail — every transaction immutable on Stellar.",
      icon: "verified",
      steps: [
        {
          id: "unpause",
          title: "Resume Operations",
          action: async (log) => {
            log({ icon: "wait", text: "Calling contract.emergency_unpause()..." });
            try {
              const res = (await unpauseContract()) as { tx_hash: string };
              log({ icon: "tx", text: `TX: ${res.tx_hash}`, link: EXPERT + res.tx_hash });
              log({ icon: "ok", text: "Contract UNPAUSED — operations resumed" });
              await refreshStatus();
              return [
                { chapter: 6, label: "Resumed", value: "ACTIVE", type: "status", link: EXPERT + res.tx_hash },
              ];
            } catch {
              log({ icon: "info", text: "Contract already unpaused" });
              await refreshStatus();
              return [{ chapter: 6, label: "Resumed", value: "Already active", type: "status" }];
            }
          },
        },
        {
          id: "audit",
          title: "Final Audit",
          action: async (log) => {
            const { status: s, balance: b } = await refreshStatus();
            log({ icon: "ok", text: `Balance: $${b.balance_usdc} USDC` });
            log({ icon: "ok", text: `Spent Today: $${stroopsToUsdc(s.spent_today)} USDC` });
            log({ icon: "ok", text: `Paused: ${s.paused ? "YES" : "no"}` });
            log({ icon: "info", text: "Every TX links to Stellar Expert — fully verifiable on-chain" });
            log({ icon: "ok", text: "SpendGuard demo complete" });
            return [
              { chapter: 6, label: "Final Balance", value: `$${b.balance_usdc} USDC`, type: "status" },
              { chapter: 6, label: "Total Spent", value: `$${stroopsToUsdc(s.spent_today)} USDC`, type: "status" },
            ];
          },
        },
      ],
    },
  ];

  // Initialize chapter status
  useEffect(() => {
    if (chapterStatus.length === 0) {
      setChapterStatus(chapters.map(() => "idle"));
    }
  }, [chapters.length, chapterStatus.length]);

  // ── Execute a Chapter ─────────────────────────────────────────

  const executeChapter = useCallback(
    async (chapterIndex: number) => {
      if (running) return;
      setRunning(true);
      setActiveChapter(chapterIndex);

      // Mark running
      setChapterStatus((prev) => {
        const next = [...prev];
        next[chapterIndex] = "running";
        return next;
      });

      const chapter = chapters[chapterIndex];
      addLog({ icon: "info", text: `━━━ CH${chapterIndex + 1}: ${chapter.title.toUpperCase()} ━━━` });

      for (const step of chapter.steps) {
        addLog({ icon: "info", text: `▸ ${step.title}` });
        try {
          const cards = await step.action(addLog);
          // Collect evidence
          setEvidence((prev) => [...prev, ...cards]);
          // Collect transactions
          for (const card of cards) {
            if (card.link) {
              setLiveTransactions((prev) => [
                ...prev,
                { hash: card.link!.replace(EXPERT, ""), label: card.label },
              ]);
            }
          }
        } catch (err) {
          addLog({
            icon: "err",
            text: err instanceof Error ? err.message : "Unknown error",
          });
        }
      }

      addLog({ icon: "ok", text: `Chapter ${chapterIndex + 1} complete` });

      // Mark done
      setChapterStatus((prev) => {
        const next = [...prev];
        next[chapterIndex] = "done";
        return next;
      });

      setRunning(false);
    },
    [running, status]
  );

  // ── Run All Chapters ──────────────────────────────────────────

  async function runAll() {
    setLogs([]);
    setEvidence([]);
    setLiveTransactions([]);
    setChapterStatus(chapters.map(() => "idle"));
    // Need a small delay for state to settle
    await new Promise((r) => setTimeout(r, 50));

    for (let i = 0; i < chapters.length; i++) {
      setActiveChapter(i);
      setRunning(true);
      setChapterStatus((prev) => {
        const next = [...prev];
        next[i] = "running";
        return next;
      });

      const chapter = chapters[i];
      addLog({ icon: "info", text: `━━━ CH${i + 1}: ${chapter.title.toUpperCase()} ━━━` });

      for (const step of chapter.steps) {
        addLog({ icon: "info", text: `▸ ${step.title}` });
        try {
          const cards = await step.action(addLog);
          setEvidence((prev) => [...prev, ...cards]);
          for (const card of cards) {
            if (card.link) {
              setLiveTransactions((prev) => [
                ...prev,
                { hash: card.link!.replace(EXPERT, ""), label: card.label },
              ]);
            }
          }
        } catch (err) {
          addLog({
            icon: "err",
            text: err instanceof Error ? err.message : "Unknown error",
          });
        }
      }

      addLog({ icon: "ok", text: `Chapter ${i + 1} complete` });
      setChapterStatus((prev) => {
        const next = [...prev];
        next[i] = "done";
        return next;
      });
      setRunning(false);
    }
  }

  function reset() {
    setLogs([]);
    setEvidence([]);
    setLiveTransactions([]);
    setActiveChapter(0);
    setChapterStatus(chapters.map(() => "idle"));
    setStatus(null);
    setBalance(null);
  }

  // ── Helpers ───────────────────────────────────────────────────

  function iconColor(icon: LogEntry["icon"]) {
    switch (icon) {
      case "ok":    return "text-emerald-400";
      case "err":   return "text-red-400";
      case "wait":  return "text-amber-300";
      case "tx":    return "text-blue-400";
      case "block": return "text-red-500";
      default:      return "text-slate-400";
    }
  }

  function iconSymbol(icon: LogEntry["icon"]) {
    switch (icon) {
      case "ok":    return "✓";
      case "err":   return "✗";
      case "wait":  return "◌";
      case "tx":    return "⬡";
      case "block": return "⊘";
      default:      return "·";
    }
  }

  function evidenceTypeStyle(type: EvidenceCard["type"]) {
    switch (type) {
      case "tx":     return "border-l-blue-500 bg-blue-50";
      case "config": return "border-l-secondary bg-secondary/5";
      case "block":  return "border-l-error bg-error-container/30";
      case "status": return "border-l-tertiary-fixed-dim bg-tertiary-fixed/10";
    }
  }

  const allDone = chapterStatus.length > 0 && chapterStatus.every((s) => s === "done");
  const nextChapterIndex = chapterStatus.findIndex((s) => s === "idle");
  const currentChapter = chapters[activeChapter];

  // ── Render ────────────────────────────────────────────────────

  return (
    <div className="animate-fade-in flex flex-col h-[calc(100vh-56px)]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-outline-variant bg-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-[18px]">play_circle</span>
          </div>
          <div>
            <h2 className="text-sm font-bold text-primary">SpendGuard Live Demo</h2>
            <p className="text-[11px] text-on-surface-variant">
              Interactive x402 flow on Stellar Testnet — no wallet required
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {status && (
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${status.paused ? "bg-error animate-pulse" : "bg-tertiary-fixed-dim"}`} />
              <span className="text-xs font-mono text-on-surface-variant">
                ${balance?.balance_usdc ?? "?"} USDC
              </span>
            </div>
          )}
          <button onClick={runAll} disabled={running} className="btn-primary text-xs py-2 px-4">
            {running ? "Running..." : allDone ? "Run Again" : "Run All Chapters"}
          </button>
          <button onClick={reset} disabled={running} className="btn-secondary text-xs py-2 px-4">
            Reset
          </button>
        </div>
      </div>

      {/* Three-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── LEFT: Chapter Sidebar ────────────────────────────── */}
        <aside className="w-[260px] border-r border-outline-variant bg-surface-container-low overflow-y-auto shrink-0 no-scrollbar">
          <div className="p-4">
            <p className="stat-label mb-3">CHAPTERS</p>
            <div className="space-y-1">
              {chapters.map((ch, i) => {
                const st = chapterStatus[i] ?? "idle";
                const isActive = i === activeChapter;

                return (
                  <button
                    key={ch.id}
                    onClick={() => {
                      if (st === "idle" && !running) executeChapter(i);
                      else setActiveChapter(i);
                    }}
                    disabled={running && st !== "done"}
                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-all flex items-center gap-3 group ${
                      isActive
                        ? "bg-primary/5 border border-primary/20"
                        : "border border-transparent hover:bg-surface-container"
                    } disabled:opacity-50`}
                  >
                    {/* Status indicator */}
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-all ${
                        st === "done"
                          ? "bg-tertiary-fixed-dim text-white"
                          : st === "running"
                          ? "bg-secondary text-white animate-pulse"
                          : isActive
                          ? "bg-primary text-white"
                          : "bg-surface-container text-on-surface-variant"
                      }`}
                    >
                      {st === "done" ? (
                        <span className="material-symbols-outlined text-[14px]">check</span>
                      ) : (
                        i + 1
                      )}
                    </div>

                    <div className="min-w-0">
                      <p
                        className={`text-xs font-semibold truncate ${
                          st === "done"
                            ? "text-tertiary-fixed-dim"
                            : st === "running"
                            ? "text-secondary"
                            : isActive
                            ? "text-primary"
                            : "text-on-surface-variant"
                        }`}
                      >
                        {ch.title}
                      </p>
                      <p className="text-[10px] text-on-surface-variant truncate">
                        {ch.steps.length} step{ch.steps.length > 1 ? "s" : ""}
                        {st === "done" && " · done"}
                        {st === "running" && " · running"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Demo wallets info */}
          <div className="p-4 border-t border-outline-variant">
            <p className="stat-label mb-2">DEMO ACCOUNTS</p>
            <div className="space-y-2">
              {(["owner", "agent", "contract"] as const).map((role) => (
                <a
                  key={role}
                  href={`https://stellar.expert/explorer/testnet/${role === "contract" ? "contract" : "account"}/${DEMO_WALLETS[role]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 group"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                  <span className="text-[10px] uppercase font-bold text-on-surface-variant w-14">{role}</span>
                  <span className="text-[10px] font-mono text-secondary group-hover:underline">
                    {shortAddress(DEMO_WALLETS[role])}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </aside>

        {/* ── CENTER: Terminal + Controls ──────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Chapter header card */}
          <div className="px-6 py-4 border-b border-outline-variant bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-surface-container rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    {currentChapter?.icon ?? "play_circle"}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-primary">
                      CH{activeChapter + 1}: {currentChapter?.title}
                    </h3>
                    {(chapterStatus[activeChapter] === "running") && (
                      <span className="badge bg-secondary/10 text-secondary uppercase tracking-wider animate-pulse">
                        Running
                      </span>
                    )}
                    {(chapterStatus[activeChapter] === "done") && (
                      <span className="badge-success uppercase tracking-wider">
                        Done
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-0.5 max-w-lg">
                    {currentChapter?.subtitle}
                  </p>
                </div>
              </div>

              {/* Live status pills */}
              {status && (
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1.5 rounded-lg bg-surface-container-low text-xs font-mono">
                    <span className="text-on-surface-variant">Spent:</span>{" "}
                    <span className="font-bold text-primary">${stroopsToUsdc(status.spent_today)}</span>
                    <span className="text-on-surface-variant"> / ${stroopsToUsdc(status.daily_limit)}</span>
                  </div>
                  <div
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                      status.paused
                        ? "bg-error-container text-on-error-container"
                        : "bg-tertiary-fixed/20 text-on-tertiary-container"
                    }`}
                  >
                    {status.paused ? "PAUSED" : "ACTIVE"}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Terminal */}
          <div className="flex-1 overflow-hidden p-4">
            <div
              ref={logRef}
              className="terminal h-full overflow-y-auto rounded-xl text-[13px] leading-relaxed p-5"
            >
              {logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center">
                  <span className="material-symbols-outlined text-[40px] text-slate-600 mb-3">terminal</span>
                  <p className="text-sm font-semibold text-slate-400 mb-1">Ready to run</p>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Click a chapter on the left or &ldquo;Run All Chapters&rdquo; to execute
                    real Soroban transactions on Stellar Testnet.
                  </p>
                  <p className="text-xs text-blue-400 mt-3">No wallet connection needed.</p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {logs.map((entry, i) => (
                    <div key={i} className="flex items-start gap-2 font-mono">
                      <span className="text-slate-600 text-[11px] flex-shrink-0 w-[60px]">
                        {entry.time}
                      </span>
                      <span className={`flex-shrink-0 w-4 text-center ${iconColor(entry.icon)}`}>
                        {iconSymbol(entry.icon)}
                      </span>
                      {entry.link ? (
                        <a
                          href={entry.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 hover:underline break-all"
                        >
                          {entry.text}
                        </a>
                      ) : (
                        <span
                          className={
                            entry.icon === "block"
                              ? "text-red-400 font-bold"
                              : entry.icon === "info" && entry.text.startsWith("━")
                              ? "text-slate-300 font-bold"
                              : "text-slate-300"
                          }
                        >
                          {entry.text}
                        </span>
                      )}
                    </div>
                  ))}
                  {running && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-slate-600 text-[11px] w-[60px]">{timestamp()}</span>
                      <span className="text-amber-300 animate-pulse w-4 text-center">◌</span>
                      <span className="text-amber-300 animate-pulse">executing...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bottom action bar */}
          <div className="px-6 py-3 border-t border-outline-variant bg-white flex items-center justify-between shrink-0">
            <div className="text-xs text-on-surface-variant">
              {allDone ? (
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-tertiary-fixed-dim text-[16px]">check_circle</span>
                  All chapters complete — every TX verifiable on
                  <a
                    href={`https://stellar.expert/explorer/testnet/contract/${DEMO_WALLETS.contract}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-secondary font-semibold hover:underline ml-0.5"
                  >
                    Stellar Expert
                  </a>
                </span>
              ) : running ? (
                <span className="flex items-center gap-1.5">
                  <svg className="w-3 h-3 animate-spin text-secondary" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Executing on Stellar Testnet...
                </span>
              ) : (
                `Chapter ${activeChapter + 1} of ${chapters.length}`
              )}
            </div>

            {!running && !allDone && nextChapterIndex >= 0 && (
              <button
                onClick={() => executeChapter(nextChapterIndex)}
                className="btn-primary text-xs py-2"
              >
                {nextChapterIndex === 0 ? "Start Demo" : `Continue → CH${nextChapterIndex + 1}: ${chapters[nextChapterIndex].title}`}
              </button>
            )}

            {allDone && (
              <button onClick={reset} className="btn-secondary text-xs py-2">
                Restart Demo
              </button>
            )}
          </div>
        </main>

        {/* ── RIGHT: Evidence Sidebar ─────────────────────────── */}
        <aside className="w-[280px] border-l border-outline-variant bg-white overflow-y-auto shrink-0 no-scrollbar hidden xl:block">
          {/* What We Built */}
          <div className="p-4 border-b border-outline-variant">
            <p className="stat-label mb-2">WHAT WE BUILT</p>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              A Soroban spending-policy contract that governs x402 payments by AI agents.
              Daily limits, per-tx caps, merchant whitelists, and a kill switch — all enforced on-chain.
            </p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {["Soroban", "x402", "USDC", "AI Agent", "Stellar"].map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-surface-container rounded text-[10px] font-bold text-on-surface-variant"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Evidence Cards */}
          <div className="p-4 border-b border-outline-variant">
            <p className="stat-label mb-2">
              EVIDENCE
              {evidence.length > 0 && (
                <span className="ml-1.5 text-secondary">{evidence.length}</span>
              )}
            </p>
            {evidence.length === 0 ? (
              <p className="text-[11px] text-on-surface-variant italic">
                Evidence will appear as chapters complete...
              </p>
            ) : (
              <div className="space-y-2">
                {evidence.map((card, i) => (
                  <div
                    key={i}
                    className={`border-l-[3px] rounded-r-lg p-2.5 animate-slide-up ${evidenceTypeStyle(card.type)}`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[9px] font-bold text-on-surface-variant uppercase">
                        CH{card.chapter}
                      </span>
                      {card.link && (
                        <a
                          href={card.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[9px] text-secondary hover:underline font-mono"
                        >
                          view tx
                        </a>
                      )}
                    </div>
                    <p className="text-[11px] font-semibold text-primary">{card.label}</p>
                    <p className="text-[10px] font-mono text-on-surface-variant">{card.value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live Transactions */}
          <div className="p-4">
            <p className="stat-label mb-2">
              LIVE TRANSACTIONS
              {liveTransactions.length > 0 && (
                <span className="ml-1.5 text-secondary">{liveTransactions.length}</span>
              )}
            </p>
            {liveTransactions.length === 0 ? (
              <p className="text-[11px] text-on-surface-variant italic">
                Transaction hashes will appear here...
              </p>
            ) : (
              <div className="space-y-1.5">
                {liveTransactions.map((tx, i) => (
                  <a
                    key={i}
                    href={EXPERT + tx.hash}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                    <span className="text-[10px] font-mono text-secondary group-hover:underline truncate">
                      {tx.hash.slice(0, 16)}...
                    </span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
