"use client";

import { useState, useEffect, useCallback } from "react";
import { getStatus, getBalance } from "@/lib/api";
import type { ContractStatus, BalanceInfo } from "@/lib/types";

export function useContractStatus(pollInterval = 10000) {
  const [status, setStatus] = useState<ContractStatus | null>(null);
  const [balance, setBalance] = useState<BalanceInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [s, b] = await Promise.all([getStatus(), getBalance()]);
      setStatus(s);
      setBalance(b);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, pollInterval);
    return () => clearInterval(id);
  }, [refresh, pollInterval]);

  return { status, balance, loading, error, refresh };
}
