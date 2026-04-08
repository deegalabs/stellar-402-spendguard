"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { createElement } from "react";
import { getStatus, getBalance } from "@/lib/api";
import type { ContractStatus, BalanceInfo } from "@/lib/types";

interface ContractStatusValue {
  status: ContractStatus | null;
  balance: BalanceInfo | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const noop = async () => {};

const DEFAULT_VALUE: ContractStatusValue = {
  status: null,
  balance: null,
  loading: true,
  error: null,
  refresh: noop,
};

const ContractStatusContext = createContext<ContractStatusValue>(DEFAULT_VALUE);

interface ProviderProps {
  children: ReactNode;
  /** Polling interval in ms. Defaults to 30 000 (30 s). */
  pollInterval?: number;
}

/**
 * Single shared poller for `/api/status` + `/api/balance`.
 *
 * Previously every caller of `useContractStatus` instantiated its own
 * `setInterval`. On a dashboard route that meant AppShell + Sidebar +
 * Footer + Page all hit the backend independently → 4× traffic per tick.
 * The provider centralises state and polling so every consumer shares
 * the same fetch cycle.
 *
 * Polling is paused when the tab is hidden to avoid wasting quota on
 * background tabs.
 */
export function ContractStatusProvider({
  children,
  pollInterval = 30_000,
}: ProviderProps) {
  const [status, setStatus] = useState<ContractStatus | null>(null);
  const [balance, setBalance] = useState<BalanceInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const inflightRef = useRef(false);

  const refresh = useCallback(async () => {
    // Dedupe in-flight requests — if a fetch is already running, don't
    // start another. Prevents thundering-herd on mount or visibility
    // changes.
    if (inflightRef.current) return;
    inflightRef.current = true;
    try {
      const [s, b] = await Promise.all([getStatus(), getBalance()]);
      setStatus(s);
      setBalance(b);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch status");
    } finally {
      setLoading(false);
      inflightRef.current = false;
    }
  }, []);

  useEffect(() => {
    let id: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (id !== null) return;
      refresh();
      id = setInterval(refresh, pollInterval);
    };

    const stop = () => {
      if (id !== null) {
        clearInterval(id);
        id = null;
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        start();
      } else {
        stop();
      }
    };

    if (typeof document !== "undefined" && document.visibilityState === "hidden") {
      // Don't burn quota on a background tab — wait until it becomes visible.
      setLoading(false);
    } else {
      start();
    }

    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      stop();
    };
  }, [refresh, pollInterval]);

  const value: ContractStatusValue = {
    status,
    balance,
    loading,
    error,
    refresh,
  };

  return createElement(ContractStatusContext.Provider, { value }, children);
}

/**
 * Read the shared contract status. Must be called inside a
 * `<ContractStatusProvider>`. Falls back to a no-op value if called
 * outside the provider (useful during SSR of routes that opt out).
 *
 * NOTE: the legacy `pollInterval` argument is accepted for backwards
 * compatibility but is ignored — the interval is now controlled by the
 * provider at the root.
 */
export function useContractStatus(_legacyPollInterval?: number): ContractStatusValue {
  void _legacyPollInterval;
  return useContext(ContractStatusContext);
}
