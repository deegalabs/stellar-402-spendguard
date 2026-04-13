"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";
import Footer from "./Footer";
import SharedDemoBanner from "./SharedDemoBanner";
import { useContractStatus } from "@/hooks/useContractStatus";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { status } = useContractStatus();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Docs pages use their own layout
  if (pathname.startsWith("/docs")) {
    return <>{children}</>;
  }

  // Landing page (root) uses its own full-bleed layout with a footer
  if (pathname === "/") {
    return <>{children}</>;
  }

  const isDemo = pathname === "/demo";

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-dark">
      <SharedDemoBanner />
      <div className="flex flex-1 min-h-0">
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
        {!isDemo && <Footer />}
      </div>
      </div>
    </div>
  );
}
