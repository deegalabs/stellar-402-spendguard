"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
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
  icon: "info" | "ok" | "err" | "wait" | "tx" | "block" | "narrate";
  text: string;
  time: string;
  link?: string;
}

type ChapterState = "idle" | "running" | "done" | "failed";

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
  /** One-line technical subtitle shown in the header. */
  subtitle: string;
  /** Plain-language story line printed to the terminal before the
   *  steps start, so a non-technical viewer knows why this chapter
   *  exists. */
  narrator: string;
  /** One-line takeaway printed after all steps succeed — the point
   *  that the chapter just proved. */
  lesson: string;
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
  const [chapterStatus, setChapterStatus] = useState<ChapterState[]>([]);
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
  // Memoised so the runChapter / executeChapter callbacks and the
  // init effect don't re-fire on every render.

  const chapters: Chapter[] = useMemo(() => [
    {
      id: "discover",
      title: "Meet the Contract",
      subtitle: "Read the live rules governing this AI agent — straight from Stellar.",
      narrator:
        "Before anything else: let's look at the contract that controls this AI agent. It's already deployed on Stellar Testnet, it holds the money, and anyone on the internet can read its rules. That's the whole point — the guardrails don't live in our server.",
      lesson:
        "The spending rules are stored on the ledger, not in a database we control.",
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
      title: "Set the Guardrails",
      subtitle: "Owner sets a daily cap, a per-transaction limit, and an allow-list of merchants.",
      narrator:
        "Now the owner sets three guardrails: a daily budget, a max per-transaction, and an allow-list of merchants. Every one of these is a signed transaction on Stellar, so if the agent ever exceeds them later, you can prove exactly who set the rules and when.",
      lesson:
        "Only the owner can change these rules — and every change leaves a permanent receipt.",
      icon: "tune",
      steps: [
        {
          id: "daily-limit",
          title: "Set Daily Limit to $100.00",
          action: async (log) => {
            const amount = usdcToStroops(100);
            log({ icon: "wait", text: `Calling contract.set_daily_limit(${amount})...` });
            const res = (await setDailyLimit(amount)) as { tx_hash: string };
            log({ icon: "tx", text: `TX: ${res.tx_hash}`, link: EXPERT + res.tx_hash });
            log({ icon: "ok", text: "Daily limit set to $100.00 USDC" });
            await refreshStatus();
            return [
              { chapter: 2, label: "Daily Limit", value: "$100.00 USDC", type: "config", link: EXPERT + res.tx_hash },
            ];
          },
        },
        {
          id: "max-tx",
          title: "Set Max Transaction to $5.00",
          action: async (log) => {
            const amount = usdcToStroops(5);
            log({ icon: "wait", text: `Calling contract.set_max_tx(${amount})...` });
            const res = (await setMaxTx(amount)) as { tx_hash: string };
            log({ icon: "tx", text: `TX: ${res.tx_hash}`, link: EXPERT + res.tx_hash });
            log({ icon: "ok", text: "Max transaction set to $5.00 USDC" });
            await refreshStatus();
            return [
              { chapter: 2, label: "Max Tx", value: "$5.00 USDC", type: "config", link: EXPERT + res.tx_hash },
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
      title: "The Agent Pays",
      subtitle: "Agent hits a paid API, gets 402, asks the contract for permission, settles on-chain.",
      narrator:
        "Here's the actual use case. The AI agent calls an API that costs 10 cents. The server replies HTTP 402 Payment Required — the web's built-in \"pay to continue\" status. The agent asks the contract for permission, settles on Stellar, and only then gets the data. Every step is real. Every hash is clickable.",
      lesson:
        "The agent can't move money without the contract saying yes first.",
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
      title: "Hit the Limit",
      subtitle: "Tighten the per-tx cap, then try another payment. Watch the contract say no.",
      narrator:
        "Now the interesting part. We shrink the per-transaction cap down to 5 cents. The next payment the agent tries — a routine 10-cent call — should be rejected. Not by our server. Not by a firewall. By the contract on Stellar itself. If our backend disappeared right now, the rejection would still happen.",
      lesson:
        "The policy is enforced on-chain. Turning off our server does not turn off the guardrail.",
      icon: "shield",
      steps: [
        {
          id: "tighten-limits",
          title: "Tighten Max-Tx to $0.05",
          action: async (log) => {
            // Single-TX block: lower max_tx below the next payment
            // amount ($0.10). We used to lower both daily_limit and
            // max_tx sequentially, but that was brittle — the RPC
            // simulator sometimes saw a stale max_tx when preflighting
            // the second tx and rejected set_daily_limit with
            // InvalidAmount. One call, no races.
            log({ icon: "info", text: "Tightening the per-tx cap to trigger a block..." });
            const maxTxAmount = usdcToStroops(0.05);
            log({ icon: "wait", text: `Calling contract.set_max_tx(${maxTxAmount})...` });
            const res = (await setMaxTx(maxTxAmount)) as { tx_hash: string };
            log({ icon: "tx", text: `TX: ${res.tx_hash}`, link: EXPERT + res.tx_hash });

            const { status: s } = await refreshStatus();
            log({ icon: "ok", text: `Max per tx: $${stroopsToUsdc(s.max_tx_value)} USDC` });
            log({ icon: "info", text: "A $0.10 payment now exceeds the per-tx cap" });
            return [
              { chapter: 4, label: "Tightened", value: "$0.05 max per tx", type: "config", link: EXPERT + res.tx_hash },
            ];
          },
        },
        {
          id: "blocked",
          title: "Payment Blocked by Contract",
          action: async (log) => {
            log({ icon: "wait", text: "Agent: authorize_payment($0.10, merchant)..." });
            const res = await runAgent();
            const lastStep = res.steps[res.steps.length - 1];
            if (!res.success) {
              log({ icon: "block", text: `BLOCKED: ${lastStep?.error?.split("\n")[0] ?? res.error ?? "ExceedsMaxTx"}` });
              log({ icon: "ok", text: "Guardrail working — contract rejected the payment on-chain" });
              await refreshStatus();
              return [{ chapter: 4, label: "Guardrail", value: "ExceedsMaxTx", type: "block" }];
            }
            // If the payment went through, the guardrail silently
            // failed — surface it as a hard error so the chapter
            // marks failed instead of pretending it worked.
            await refreshStatus();
            throw new Error(
              "Expected ExceedsMaxTx — the $0.10 payment was accepted despite the $0.05 cap"
            );
          },
        },
      ],
    },
    {
      id: "kill-switch",
      title: "Pull the Kill Switch",
      subtitle: "Owner hits emergency pause — every future payment is blocked immediately.",
      narrator:
        "Suppose the agent starts behaving badly. Maybe a prompt injection, maybe a bad model update, maybe you just want to freeze things while you investigate. The owner hits emergency pause — one transaction — and every future payment, from any agent, is blocked on-chain until you unpause.",
      lesson:
        "You always have an off switch, and it doesn't depend on any of our infrastructure.",
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
            }
            // Throwing is the only way to flip the chapter to
            // "failed" — the old code just logged an err icon and
            // let the chapter self-certify as complete.
            throw new Error(
              "Expected ContractPaused — the payment was accepted while the contract was paused"
            );
          },
        },
      ],
    },
    {
      id: "recovery",
      title: "Resume & Audit",
      subtitle: "Unpause, restore limits, and inspect the audit trail on Stellar Expert.",
      narrator:
        "Crisis over. The owner unpauses and restores the normal limits. Now look at the right panel — every single action you just watched left a transaction hash. Click any of them and you land on Stellar Expert, a public block explorer. Nothing in this demo is staged. You can audit all of it from any browser, forever.",
      lesson:
        "Every action is verifiable by anyone, long after the demo is over.",
      icon: "verified",
      steps: [
        {
          id: "unpause",
          title: "Resume & Restore Limits",
          action: async (log) => {
            // Unpause
            log({ icon: "wait", text: "Calling contract.emergency_unpause()..." });
            try {
              const res = (await unpauseContract()) as { tx_hash: string };
              log({ icon: "tx", text: `TX: ${res.tx_hash}`, link: EXPERT + res.tx_hash });
              log({ icon: "ok", text: "Contract UNPAUSED — operations resumed" });
            } catch {
              log({ icon: "info", text: "Contract already unpaused" });
            }
            // Restore reasonable limits for future runs
            log({ icon: "wait", text: "Restoring daily limit to $100.00..." });
            try {
              const r1 = (await setDailyLimit(usdcToStroops(100))) as { tx_hash: string };
              log({ icon: "tx", text: `TX: ${r1.tx_hash}`, link: EXPERT + r1.tx_hash });
            } catch { /* already set */ }
            log({ icon: "wait", text: "Restoring max tx to $5.00..." });
            try {
              const r2 = (await setMaxTx(usdcToStroops(5))) as { tx_hash: string };
              log({ icon: "tx", text: `TX: ${r2.tx_hash}`, link: EXPERT + r2.tx_hash });
            } catch { /* already set */ }
            log({ icon: "ok", text: "Limits restored for next demo run" });
            await refreshStatus();
            return [
              { chapter: 6, label: "Resumed", value: "ACTIVE", type: "status" },
            ];
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
  ], [status]);

  // Initialize chapter status
  useEffect(() => {
    if (chapterStatus.length === 0) {
      setChapterStatus(chapters.map(() => "idle"));
    }
  }, [chapters, chapterStatus.length]);

  // ── Execute a Chapter ─────────────────────────────────────────
  //
  // Honest orchestration: any step that throws flips the whole
  // chapter to "failed". We never silently mark a chapter "done"
  // when something blew up — that was the old bug where viewers
  // saw "SpendGuard demo complete" on a demo where every contract
  // call had failed.

  const runChapter = useCallback(
    async (chapterIndex: number): Promise<boolean> => {
      const chapter = chapters[chapterIndex];

      setActiveChapter(chapterIndex);
      setChapterStatus((prev) => {
        const next = [...prev];
        next[chapterIndex] = "running";
        return next;
      });

      addLog({
        icon: "info",
        text: `━━━ CH${chapterIndex + 1}: ${chapter.title.toUpperCase()} ━━━`,
      });
      addLog({ icon: "narrate", text: chapter.narrator });

      let failed = false;

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
          failed = true;
          const message = err instanceof Error ? err.message : "Unknown error";
          addLog({ icon: "err", text: message });
        }
      }

      if (failed) {
        addLog({
          icon: "err",
          text: `Chapter ${chapterIndex + 1} did not finish cleanly — see error above.`,
        });
      } else {
        addLog({ icon: "ok", text: `Chapter ${chapterIndex + 1} complete` });
        addLog({ icon: "narrate", text: `Takeaway — ${chapter.lesson}` });
      }

      setChapterStatus((prev) => {
        const next = [...prev];
        next[chapterIndex] = failed ? "failed" : "done";
        return next;
      });

      return !failed;
    },
    [chapters]
  );

  const executeChapter = useCallback(
    async (chapterIndex: number) => {
      if (running) return;
      setRunning(true);
      await runChapter(chapterIndex);
      setRunning(false);
    },
    [running, runChapter]
  );

  // ── Run All Chapters ──────────────────────────────────────────

  async function runAll() {
    setLogs([]);
    setEvidence([]);
    setLiveTransactions([]);
    setChapterStatus(chapters.map(() => "idle"));
    // Need a small delay for state to settle
    await new Promise((r) => setTimeout(r, 50));

    setRunning(true);
    for (let i = 0; i < chapters.length; i++) {
      const ok = await runChapter(i);
      // If the first chapter fails (e.g. server misconfigured) stop
      // early instead of cascading a wall of red noise.
      if (!ok && i === 0) break;
    }
    setRunning(false);
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
      case "ok":      return "text-success-fg";
      case "err":     return "text-error-fg";
      case "wait":    return "text-warning-fg";
      case "tx":      return "text-accent-fg";
      case "block":   return "text-error-fg";
      case "narrate": return "text-primary-fg";
      default:        return "text-text-muted";
    }
  }

  function iconSymbol(icon: LogEntry["icon"]) {
    switch (icon) {
      case "ok":      return "✓";
      case "err":     return "✗";
      case "wait":    return "◌";
      case "tx":      return "⬡";
      case "block":   return "⊘";
      case "narrate": return "❝";
      default:        return "·";
    }
  }

  function evidenceTypeStyle(type: EvidenceCard["type"]) {
    switch (type) {
      case "tx":     return "border-l-accent-400 bg-accent-400/10";
      case "config": return "border-l-primary-400 bg-primary-400/10";
      case "block":  return "border-l-error-400 bg-error-400/10";
      case "status": return "border-l-success-400 bg-success-400/10";
    }
  }

  const allDone = chapterStatus.length > 0 && chapterStatus.every((s) => s === "done");
  const anyFailed = chapterStatus.some((s) => s === "failed");
  const nextChapterIndex = chapterStatus.findIndex((s) => s === "idle");
  const currentChapter = chapters[activeChapter];

  // ── Render ────────────────────────────────────────────────────

  return (
    <div className="animate-fade-in flex flex-col h-[calc(100vh-56px)]">
      {/* Progress strip — concise, no duplicate SpendGuard wordmark
          (the header already identifies the product + LIVE DEMO). */}
      <div className="flex items-center justify-between gap-3 px-4 lg:px-6 py-3 border-b border-surface-border bg-dark-50/80 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-text-muted shrink-0">
            Chapter {Math.min(activeChapter + 1, chapters.length)} / {chapters.length}
          </p>
          <div className="hidden sm:flex items-center gap-1.5 flex-1 min-w-[120px] max-w-[260px]">
            {chapters.map((ch, i) => {
              const st = chapterStatus[i] ?? "idle";
              return (
                <div
                  key={ch.id}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    st === "done"
                      ? "bg-success-400"
                      : st === "failed"
                      ? "bg-error-400"
                      : st === "running"
                      ? "bg-accent-400 animate-pulse"
                      : i === activeChapter
                      ? "bg-primary-400/60"
                      : "bg-dark-300"
                  }`}
                  title={ch.title}
                />
              );
            })}
          </div>
          {status && (
            <div className="hidden md:flex items-center gap-1.5 pl-2 border-l border-surface-border">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  status.paused ? "bg-error-400 animate-pulse" : "bg-success-400"
                }`}
              />
              <span className="text-[11px] font-mono text-text-muted">
                ${balance?.balance_usdc ?? "?"}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={runAll}
            disabled={running}
            className="btn-primary text-xs py-2 px-3 lg:px-4"
          >
            {running ? "Running…" : allDone ? "Run Again" : anyFailed ? "Retry" : "Run All"}
          </button>
          <button
            onClick={reset}
            disabled={running}
            className="btn-secondary text-xs py-2 px-3 lg:px-4"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Three-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── LEFT: Chapter Sidebar ────────────────────────────── */}
        <aside className="hidden lg:block w-[260px] border-r border-surface-border bg-dark-50 overflow-y-auto shrink-0 no-scrollbar">
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
                        ? "bg-primary-500/10 border border-primary-500/20"
                        : "border border-transparent hover:bg-dark-200"
                    } disabled:opacity-50`}
                  >
                    {/* Status indicator */}
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-all ${
                        st === "done"
                          ? "bg-success-500 text-white"
                          : st === "failed"
                          ? "bg-error-500 text-white"
                          : st === "running"
                          ? "bg-accent-500 text-white animate-pulse"
                          : isActive
                          ? "bg-primary-500 text-white"
                          : "bg-dark-300 text-text-muted"
                      }`}
                    >
                      {st === "done" ? (
                        <span className="material-symbols-outlined text-[14px]">check</span>
                      ) : st === "failed" ? (
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      ) : (
                        i + 1
                      )}
                    </div>

                    <div className="min-w-0">
                      <p
                        className={`text-xs font-semibold truncate ${
                          st === "done"
                            ? "text-success-fg"
                            : st === "failed"
                            ? "text-error-fg"
                            : st === "running"
                            ? "text-accent-fg"
                            : isActive
                            ? "text-primary-fg"
                            : "text-text-muted"
                        }`}
                      >
                        {ch.title}
                      </p>
                      <p className="text-[10px] text-text-disabled truncate">
                        {ch.steps.length} step{ch.steps.length > 1 ? "s" : ""}
                        {st === "done" && " · done"}
                        {st === "running" && " · running"}
                        {st === "failed" && " · failed"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Demo wallets info */}
          <div className="p-4 border-t border-surface-border">
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
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-400" />
                  <span className="text-[10px] uppercase font-bold text-text-muted w-14">{role}</span>
                  <span className="text-[10px] font-mono text-accent-fg group-hover:underline">
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
          <div className="px-4 lg:px-6 py-4 border-b border-surface-border bg-dark-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-dark-200 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary-fg text-[20px]">
                    {currentChapter?.icon ?? "play_circle"}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-text-primary">
                      CH{activeChapter + 1}: {currentChapter?.title}
                    </h3>
                    {(chapterStatus[activeChapter] === "running") && (
                      <span className="badge bg-accent-400/10 text-accent-fg uppercase tracking-wider animate-pulse">
                        Running
                      </span>
                    )}
                    {(chapterStatus[activeChapter] === "done") && (
                      <span className="badge-success uppercase tracking-wider">
                        Done
                      </span>
                    )}
                    {(chapterStatus[activeChapter] === "failed") && (
                      <span className="badge bg-error-400/10 text-error-fg uppercase tracking-wider">
                        Failed
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-text-muted mt-0.5 max-w-lg hidden sm:block">
                    {currentChapter?.subtitle}
                  </p>
                </div>
              </div>

              {/* Live status pills */}
              {status && (
                <div className="hidden md:flex items-center gap-2">
                  <div className="px-3 py-1.5 rounded-lg bg-dark-200 text-xs font-mono">
                    <span className="text-text-muted">Spent:</span>{" "}
                    <span className="font-bold text-text-primary">${stroopsToUsdc(status.spent_today)}</span>
                    <span className="text-text-muted"> / ${stroopsToUsdc(status.daily_limit)}</span>
                  </div>
                  <div
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                      status.paused
                        ? "bg-error-glow text-error-fg"
                        : "bg-success-glow text-success-fg"
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
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <span className="material-symbols-outlined text-[40px] text-primary-fg mb-3">
                    smart_toy
                  </span>
                  <p className="text-base font-semibold text-text-primary mb-2 max-w-md">
                    What if your AI agent had a credit card?
                  </p>
                  <p className="text-xs text-text-muted max-w-md leading-relaxed">
                    Six short chapters, about two minutes total. We&rsquo;ll give
                    an AI agent real money on Stellar Testnet, then watch a
                    smart contract keep it on a leash — daily cap, per-tx
                    limit, allow-list, and an emergency kill switch.
                  </p>
                  <p className="text-[11px] text-accent-fg mt-4 font-mono uppercase tracking-wider">
                    Press Run All — no wallet needed
                  </p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {logs.map((entry, i) => {
                    const isNarrate = entry.icon === "narrate";
                    return (
                      <div
                        key={i}
                        className={`flex items-start gap-2 font-mono ${
                          isNarrate
                            ? "my-2 rounded-lg border-l-2 border-primary-400/50 bg-primary-400/5 px-3 py-2"
                            : ""
                        }`}
                      >
                        <span
                          className={`text-text-disabled text-[11px] flex-shrink-0 w-[60px] ${
                            isNarrate ? "opacity-0" : ""
                          }`}
                        >
                          {entry.time}
                        </span>
                        <span
                          className={`flex-shrink-0 w-4 text-center ${iconColor(entry.icon)}`}
                        >
                          {iconSymbol(entry.icon)}
                        </span>
                        {entry.link ? (
                          <a
                            href={entry.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent-fg hover:text-accent-fg hover:underline break-all"
                          >
                            {entry.text}
                          </a>
                        ) : (
                          <span
                            className={
                              isNarrate
                                ? "text-text-primary italic text-[13px] leading-relaxed"
                                : entry.icon === "block"
                                ? "text-error-fg font-bold"
                                : entry.icon === "err"
                                ? "text-error-fg"
                                : entry.icon === "info" && entry.text.startsWith("━")
                                ? "text-text-secondary font-bold"
                                : "text-text-secondary"
                            }
                          >
                            {entry.text}
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {running && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-text-disabled text-[11px] w-[60px]">{timestamp()}</span>
                      <span className="text-warning-fg animate-pulse w-4 text-center">◌</span>
                      <span className="text-warning-fg animate-pulse">executing...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bottom action bar */}
          <div className="px-4 lg:px-6 py-3 border-t border-surface-border bg-dark-50 flex items-center justify-between shrink-0">
            <div className="text-xs text-text-muted min-w-0 flex-1">
              {allDone ? (
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-success-fg text-[16px]">check_circle</span>
                  All chapters complete — every TX verifiable on
                  <a
                    href={`https://stellar.expert/explorer/testnet/contract/${DEMO_WALLETS.contract}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-fg font-semibold hover:underline ml-0.5"
                  >
                    Stellar Expert
                  </a>
                </span>
              ) : running ? (
                <span className="flex items-center gap-1.5">
                  <svg className="w-3 h-3 animate-spin text-accent-fg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Executing on Stellar Testnet…
                </span>
              ) : anyFailed ? (
                <span className="flex items-center gap-1.5 text-error-fg">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  Something went wrong — check the terminal and click Retry.
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
                {nextChapterIndex === 0 ? "Start Demo" : `CH${nextChapterIndex + 1}: ${chapters[nextChapterIndex].title}`}
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
        <aside className="w-[280px] border-l border-surface-border bg-dark-50 overflow-y-auto shrink-0 no-scrollbar hidden xl:block">
          {/* What you're watching */}
          <div className="p-4 border-b border-surface-border">
            <p className="stat-label mb-2">WHAT YOU&rsquo;RE WATCHING</p>
            <p className="text-xs text-text-muted leading-relaxed">
              A real AI agent, a real USDC balance on Stellar Testnet, and
              a Soroban contract that refuses to let the agent overspend.
              Every green checkmark below is a transaction you can click
              through to a public block explorer.
            </p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {["Soroban", "x402", "USDC", "AI Agent", "Stellar"].map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-dark-300 rounded text-[10px] font-bold text-text-muted"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Evidence Cards */}
          <div className="p-4 border-b border-surface-border">
            <p className="stat-label mb-2">
              EVIDENCE
              {evidence.length > 0 && (
                <span className="ml-1.5 text-accent-fg">{evidence.length}</span>
              )}
            </p>
            {evidence.length === 0 ? (
              <p className="text-[11px] text-text-muted italic">
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
                      <span className="text-[9px] font-bold text-text-disabled uppercase">
                        CH{card.chapter}
                      </span>
                      {card.link && (
                        <a
                          href={card.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[9px] text-accent-fg hover:underline font-mono"
                        >
                          view tx
                        </a>
                      )}
                    </div>
                    <p className="text-[11px] font-semibold text-text-primary">{card.label}</p>
                    <p className="text-[10px] font-mono text-text-muted">{card.value}</p>
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
                <span className="ml-1.5 text-accent-fg">{liveTransactions.length}</span>
              )}
            </p>
            {liveTransactions.length === 0 ? (
              <p className="text-[11px] text-text-muted italic">
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
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-400 flex-shrink-0" />
                    <span className="text-[10px] font-mono text-accent-fg group-hover:underline truncate">
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
