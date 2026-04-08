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
  return `G...${address.slice(-4)}`;
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

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function statusColor(status: "settled" | "blocked" | "pending"): string {
  switch (status) {
    case "settled":
      return "text-success-400 bg-success-glow";
    case "blocked":
      return "text-error-400 bg-error-glow";
    case "pending":
      return "text-warning-400 bg-warning-400/10";
  }
}

export function spendPercentColor(pct: number): string {
  if (pct > 80) return "bg-error-400";
  if (pct > 50) return "bg-warning-400";
  return "bg-primary-400";
}
