"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/vault", label: "Agent Vault", icon: "lock" },
  { href: "/liquidity", label: "Liquidity", icon: "account_balance_wallet" },
  { href: "/audit", label: "Audit Log", icon: "history_edu" },
  { href: "/demo", label: "Live Demo", icon: "play_arrow" },
  { href: "/docs", label: "Docs", icon: "menu_book" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[220px] h-screen sticky left-0 bg-white border-r border-outline-variant flex flex-col py-4 shrink-0">
      {/* Brand */}
      <div className="px-6 mb-8">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
            <span
              className="material-symbols-outlined text-white text-[16px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              shield
            </span>
          </div>
          <span className="text-[14px] font-bold text-primary">SpendGuard</span>
        </div>
        <p className="text-[10px] uppercase tracking-wider text-outline font-bold">
          Institutional Precision
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 text-[14px] font-medium transition-all ${
                active
                  ? "bg-[#EEF2FF] text-primary border-l-[3px] border-primary"
                  : "text-[#64748B] hover:bg-surface-container-low"
              }`}
            >
              <span
                className="material-symbols-outlined text-[20px]"
                style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto px-4 space-y-2 border-t border-outline-variant pt-6">
        <div className="flex items-center gap-3 text-[#64748B] px-2 py-1 text-[12px] font-mono">
          <span className="material-symbols-outlined text-[18px]">account_tree</span>
          <span>G...4F2A</span>
        </div>
        <div className="flex items-center gap-3 text-[#64748B] px-2 py-1 text-[12px] font-mono">
          <span className="material-symbols-outlined text-[18px]">sensors</span>
          <span>Stellar Testnet</span>
        </div>
      </div>
    </aside>
  );
}
