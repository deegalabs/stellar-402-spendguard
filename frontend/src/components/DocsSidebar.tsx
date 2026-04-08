"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Getting Started",
    items: [
      { href: "/docs/introduction", label: "Introduction", icon: "rocket_launch" },
      { href: "/docs/installation", label: "Installation", icon: "download" },
      { href: "/docs/configuration", label: "Configuration", icon: "settings_input_component" },
    ],
  },
  {
    title: "Guides",
    items: [
      { href: "/docs/first-agent", label: "Your First Agent", icon: "smart_toy" },
      { href: "/docs/agent-config", label: "Agent Config", icon: "tune" },
      { href: "/docs/x402-middleware", label: "x402 Middleware", icon: "shield_lock" },
      { href: "/docs/mcp-integration", label: "MCP Integration", icon: "extension" },
    ],
  },
  {
    title: "Reference",
    items: [
      { href: "/docs/sdk", label: "TypeScript SDK", icon: "code_blocks" },
      { href: "/docs/api-reference", label: "REST API", icon: "api" },
      { href: "/docs/contract-spec", label: "Contract Spec", icon: "description" },
      { href: "/docs/architecture", label: "Architecture", icon: "account_tree" },
    ],
  },
];

export default function DocsSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 flex flex-col p-4 bg-dark-50 border-r border-surface-border overflow-y-auto">
      <div className="mb-6 px-4">
        <h2 className="text-lg font-black text-text-primary uppercase tracking-tighter">
          Stellar 402
        </h2>
        <p className="text-[10px] font-mono text-text-secondary uppercase tracking-widest mt-1">
          Technical Docs v1.2
        </p>
      </div>

      <nav className="flex-1 space-y-6">
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <h3 className="px-4 mb-2 text-[10px] font-mono font-bold text-text-muted uppercase tracking-widest">
              {group.title}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg font-mono text-xs uppercase tracking-widest transition-all ${
                      active
                        ? "text-accent-fg font-bold bg-surface-card shadow-sm"
                        : "text-text-secondary hover:bg-dark-200"
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-6 pt-4 border-t border-surface-border">
        <a
          href="https://github.com/deegalabs/stellar-402-spendguard"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-2 text-text-secondary font-mono text-[10px] uppercase tracking-widest hover:text-text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-sm">code</span>
          <span>GitHub</span>
        </a>
        <a
          href="https://stellar.expert/explorer/testnet/contract/CCABMNFY3VKK7BI3YBWXJEE2EXX2NW5S573NASTCFXA6KBXR5PDWFD6E"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-2 text-text-secondary font-mono text-[10px] uppercase tracking-widest hover:text-text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-sm">open_in_new</span>
          <span>Live Contract</span>
        </a>
      </div>
    </aside>
  );
}
