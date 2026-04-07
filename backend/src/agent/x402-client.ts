import type { X402Challenge, X402Accept } from "../types.js";

interface X402Response {
  status: number;
  challenge: X402Challenge | null;
  data: string | null;
}

export async function requestResource(
  url: string,
  paymentProof?: string
): Promise<X402Response> {
  const headers: Record<string, string> = {};
  if (paymentProof) {
    headers["X-Payment-Proof"] = paymentProof;
  }

  const response = await fetch(url, { headers });

  if (response.status === 402) {
    const body = await response.json();
    const challenge = parseChallenge(body);
    return { status: 402, challenge, data: null };
  }

  if (response.ok) {
    const data = await response.text();
    return { status: response.status, challenge: null, data };
  }

  return { status: response.status, challenge: null, data: null };
}

function parseChallenge(body: Record<string, unknown>): X402Challenge | null {
  if (
    typeof body.x402Version !== "number" ||
    !Array.isArray(body.accepts) ||
    body.accepts.length === 0
  ) {
    return null;
  }

  const accepts: X402Accept[] = body.accepts.map(
    (a: Record<string, unknown>) => ({
      scheme: String(a.scheme ?? ""),
      network: String(a.network ?? ""),
      price: String(a.price ?? "0"),
      payTo: String(a.payTo ?? ""),
      facilitator: String(a.facilitator ?? ""),
    })
  );

  return {
    x402Version: body.x402Version as number,
    accepts,
    description: String(body.description ?? ""),
  };
}

export function findStellarAccept(
  challenge: X402Challenge
): X402Accept | null {
  return (
    challenge.accepts.find((a) => a.network.startsWith("stellar:")) ?? null
  );
}
