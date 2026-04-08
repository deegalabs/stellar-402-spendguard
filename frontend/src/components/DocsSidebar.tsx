"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/docs/introduction", label: "Introduction", icon: "rocket_launch" },
  { href: "/docs/installation", label: "Installation", icon: "download" },
  { href: "/docs/configuration", label: "Configuration", icon: "settings_input_component" },
  { href: "/docs/first-agent", label: "Guides", icon: "menu_book" },
  { href: "/docs/api-reference", label: "Reference", icon: "terminal" },
];

const BOTTOM_LINKS: NavItem[] = [
  { href: "/docs/contract-spec", label: "Support", icon: "contact_support" },
  { href: "/docs/architecture", label: "API Status", icon: "analytics" },
];

export default function DocsSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 flex flex-col p-4 bg-dark-50 border-r border-surface-border">
      <div className="mb-8 px-4">
        <h2 className="text-lg font-black text-text-primary uppercase tracking-tighter">Stellar 402</h2>
        <p className="text-[10px] font-mono text-text-secondary uppercase tracking-widest mt-1">Technical Docs v1.2</p>
      </div>

      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
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
              <span className="material-symbols-outlined text-sm">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-1 pt-4 border-t border-surface-border">
        <button className="w-full mb-4 bg-accent-500 text-white py-2 rounded-xl text-xs font-mono uppercase tracking-widest hover:opacity-90 transition-opacity">
          Export PDF
        </button>
        {BOTTOM_LINKS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-4 py-2 text-text-secondary font-mono text-[10px] uppercase tracking-widest hover:text-text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-sm">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </aside>
  );
}
