const ONE_USDC = 10_000_000;

/** Convert stroops (smallest unit) to USDC string */
export function stroopsToUsdc(stroops: string | number): string {
  return (Number(stroops) / ONE_USDC).toFixed(2);
}

/** Convert USDC amount to stroops integer */
export function usdcToStroops(usdc: number): number {
  return Math.round(usdc * ONE_USDC);
}

/** Shorten a Stellar address: G...XXXX */
export function shortAddress(address: string): string {
  if (address.length <= 12) return address;
  return `G...${address.slice(-4)}`;
}
