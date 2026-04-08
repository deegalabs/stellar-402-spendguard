"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useContractStatus } from "@/hooks/useContractStatus";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { status } = useContractStatus();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Docs pages use their own layout
  if (pathname.startsWith("/docs")) {
    return <>{children}</>;
  }

  const isDemo = pathname === "/demo";

  return (
    <div className="flex h-screen overflow-hidden bg-dark">
      <Sidebar mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          paused={status?.paused}
          onMenuClick={() => setMobileMenuOpen(true)}
        />
        {isDemo ? (
          <div className="flex-1 overflow-hidden">{children}</div>
        ) : (
          <main className="flex-1 overflow-y-auto p-4 lg:p-8 animate-fade-in">
            {children}
          </main>
        )}
      </div>
    </div>
  );
}
