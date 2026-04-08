"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useContractStatus } from "@/hooks/useContractStatus";
import { shortAddress } from "@/lib/format";
import SpendGuardLogo from "./SpendGuardLogo";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/vault", label: "Agent Vault", icon: "lock" },
  { href: "/liquidity", label: "Liquidity", icon: "account_balance_wallet" },
  { href: "/audit", label: "Audit Log", icon: "history_edu" },
  { href: "/demo", label: "Live Demo", icon: "play_arrow" },
  { href: "/docs", label: "Docs", icon: "menu_book" },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { status } = useContractStatus();
  const contractAddress = status?.contract_address;
  const network = status?.network ?? "testnet";

  const content = (
    <>
      {/* Brand */}
      <Link
        href="/"
        onClick={onClose}
        className="px-5 mb-6 flex items-center gap-2.5 group"
      >
        <SpendGuardLogo size={32} glow className="shrink-0 transition-transform group-hover:scale-105" />
        <div>
          <span className="text-[14px] font-bold text-text-primary">SpendGuard</span>
          <p className="text-[9px] uppercase tracking-[0.15em] text-text-muted font-bold leading-none">
            AI Agent Governance
          </p>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium rounded-lg transition-all duration-200 ${
                active
                  ? "bg-primary-500/10 text-primary-fg border border-primary-500/20"
                  : "text-text-muted hover:text-text-secondary hover:bg-white/5 border border-transparent"
              }`}
            >
              <span
                className={`material-symbols-outlined text-[20px] ${active ? "text-primary-fg" : ""}`}
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
      <div className="mt-auto px-4 space-y-2 border-t border-surface-border pt-4 mx-3">
        {contractAddress ? (
          <a
            href={`https://stellar.expert/explorer/${network}/contract/${contractAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-text-muted hover:text-text-primary px-1 py-1 text-[11px] font-mono transition-colors"
            title={contractAddress}
          >
            <span className="material-symbols-outlined text-[16px]">account_tree</span>
            <span>{shortAddress(contractAddress)}</span>
          </a>
        ) : (
          <div className="flex items-center gap-3 text-text-muted px-1 py-1 text-[11px] font-mono">
            <span className="material-symbols-outlined text-[16px]">account_tree</span>
            <span>—</span>
          </div>
        )}
        <div className="flex items-center gap-3 px-1 py-1 text-[11px] font-mono">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              status ? "bg-success-400 animate-pulse" : "bg-warning-400"
            }`}
          />
          <span className={status ? "text-success-fg" : "text-warning-fg"}>
            Stellar {network}
          </span>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-[220px] h-screen sticky left-0 bg-dark-50 border-r border-surface-border flex-col py-5 shrink-0">
        {content}
      </aside>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 animate-fade-in">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <aside className="absolute left-0 top-0 bottom-0 w-[260px] bg-dark-50 border-r border-surface-border flex flex-col py-5 animate-slide-up">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary p-1"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
