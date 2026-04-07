import { authorizePayment } from "../stellar/contract.js";
import type { X402Accept } from "../types.js";

interface PaymentResult {
  tx_hash: string;
  settlement_time_ms: number;
}

export async function executePayment(
  accept: X402Accept
): Promise<PaymentResult> {
  const price = BigInt(accept.price);
  const merchant = accept.payTo;

  const start = Date.now();
  const result = await authorizePayment(price, merchant);
  const settlement_time_ms = Date.now() - start;

  return {
    tx_hash: result.hash,
    settlement_time_ms,
  };
}
