import { config } from "../config.js";

const HORIZON_BASE = config.horizonUrl;

interface HorizonEffect {
  id: string;
  type: string;
  created_at: string;
  paging_token: string;
  account: string;
  amount?: string;
  asset_type?: string;
  asset_code?: string;
}

/**
 * Polls Horizon for new effects on the contract account.
 * Returns the effects and the latest cursor for pagination.
 */
export async function pollContractEffects(
  cursor?: string
): Promise<{ effects: HorizonEffect[]; cursor: string }> {
  if (!config.contractAddress) {
    return { effects: [], cursor: "" };
  }

  const params = new URLSearchParams({
    limit: "20",
    order: "desc",
  });
  if (cursor) {
    params.set("cursor", cursor);
  }

  const url = `${HORIZON_BASE}/accounts/${config.contractAddress}/effects?${params}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return { effects: [], cursor: "" };
    }

    const data = await response.json();
    const records: HorizonEffect[] = data._embedded?.records ?? [];

    const lastToken =
      records.length > 0 ? records[records.length - 1].paging_token : cursor ?? "";

    return { effects: records, cursor: lastToken };
  } catch {
    return { effects: [], cursor: "" };
  }
}

/**
 * SSE endpoint handler for streaming contract events to the frontend.
 * Polls Horizon every 5 seconds and pushes new effects to the client.
 */
export function createEventStreamHandler() {
  return async (req: { on: (event: string, cb: () => void) => void }, res: {
    setHeader: (k: string, v: string) => void;
    write: (data: string) => void;
    end: () => void;
    flushHeaders: () => void;
  }) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    let cursor: string | undefined;
    let closed = false;

    req.on("close", () => {
      closed = true;
    });

    // Initial fetch
    const initial = await pollContractEffects();
    cursor = initial.cursor;
    res.write(`data: ${JSON.stringify({ type: "init", effects: initial.effects })}\n\n`);

    // Poll every 5 seconds
    const interval = setInterval(async () => {
      if (closed) {
        clearInterval(interval);
        return;
      }

      try {
        const result = await pollContractEffects(cursor);
        if (result.effects.length > 0) {
          cursor = result.cursor;
          res.write(`data: ${JSON.stringify({ type: "update", effects: result.effects })}\n\n`);
        }
      } catch {
        // Silently continue polling on error
      }
    }, 5000);

    req.on("close", () => {
      clearInterval(interval);
      res.end();
    });
  };
}
