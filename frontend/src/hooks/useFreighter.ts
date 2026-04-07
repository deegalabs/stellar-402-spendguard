"use client";

import { useState, useEffect, useCallback } from "react";
import {
  isConnected,
  getAddress,
  isAllowed,
  setAllowed,
} from "@stellar/freighter-api";

interface FreighterState {
  connected: boolean;
  publicKey: string | null;
  loading: boolean;
  error: string | null;
}

export function useFreighter() {
  const [state, setState] = useState<FreighterState>({
    connected: false,
    publicKey: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    async function checkConnection() {
      try {
        const { isConnected: conn } = await isConnected();
        if (!conn) {
          setState({ connected: false, publicKey: null, loading: false, error: null });
          return;
        }

        const { isAllowed: allowed } = await isAllowed();
        if (allowed) {
          const { address } = await getAddress();
          setState({ connected: true, publicKey: address, loading: false, error: null });
        } else {
          setState({ connected: false, publicKey: null, loading: false, error: null });
        }
      } catch {
        setState({ connected: false, publicKey: null, loading: false, error: "Freighter not detected" });
      }
    }

    checkConnection();
  }, []);

  const connect = useCallback(async () => {
    try {
      setState((s) => ({ ...s, loading: true, error: null }));

      const { isConnected: conn } = await isConnected();
      if (!conn) {
        setState((s) => ({
          ...s,
          loading: false,
          error: "Install Freighter wallet extension",
        }));
        return;
      }

      await setAllowed();
      const { address } = await getAddress();
      setState({ connected: true, publicKey: address, loading: false, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Connection failed";
      setState((s) => ({ ...s, loading: false, error: message }));
    }
  }, []);

  return { ...state, connect };
}
