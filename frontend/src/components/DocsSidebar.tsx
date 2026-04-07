"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface NavSection {
  title: string;
  items: { href: string; label: string }[];
}

const SECTIONS: NavSection[] = [
  {
    title: "Getting Started",
    items: [
      { href: "/docs/introduction", label: "Introduction" },
      { href: "/docs/installation", label: "Installation" },
      { href: "/docs/configuration", label: "Configuration" },
    ],
  },
  {
    title: "Guides",
    items: [
      { href: "/docs/first-agent", label: "Your First Agent" },
      { href: "/docs/x402-middleware", label: "x402 Middleware" },
      { href: "/docs/mcp-integration", label: "MCP Integration" },
    ],
  },
  {
    title: "Reference",
    items: [
      { href: "/docs/api-reference", label: "API Reference" },
      { href: "/docs/contract-spec", label: "Contract Spec" },
      { href: "/docs/architecture", label: "Architecture" },
    ],
  },
];

export default function DocsSidebar() {
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    Object.fromEntries(SECTIONS.map((s) => [s.title, true]))
  );

  const toggle = (title: string) => {
    setOpenSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <aside className="w-64 border-r border-slate-700 bg-slate-900 text-white flex flex-col min-h-screen overflow-y-auto">
      <div className="p-6 border-b border-slate-700">
        <Link href="/docs/introduction" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight">SpendGuard</span>
        </Link>
        <p className="text-xs text-slate-400 mt-1">Documentation</p>
      </div>

      <nav className="flex-1 p-4 space-y-4">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <button
              onClick={() => toggle(section.title)}
              className="flex items-center justify-between w-full text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-200 mb-1 px-2"
            >
              {section.title}
              <svg
                className={`w-3 h-3 transition-transform ${openSections[section.title] ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {openSections[section.title] && (
              <div className="space-y-0.5 ml-1">
                {section.items.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`block px-3 py-1.5 rounded text-sm transition-colors ${
                        active
                          ? "bg-blue-600 text-white font-medium"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </Link>
      </div>
    </aside>
  );
}
