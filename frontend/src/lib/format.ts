const ONE_USDC = 10_000_000;

export function stroopsToUsdc(stroops: string | number): string {
  const val = Number(stroops) / ONE_USDC;
  return val.toFixed(2);
}

export function usdcToStroops(usdc: number): number {
  return Math.round(usdc * ONE_USDC);
}

export function shortAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function statusColor(status: "settled" | "blocked" | "pending"): string {
  switch (status) {
    case "settled":
      return "text-green-600 bg-green-50";
    case "blocked":
      return "text-red-600 bg-red-50";
    case "pending":
      return "text-yellow-600 bg-yellow-50";
  }
}
