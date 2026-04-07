"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useContractStatus } from "@/hooks/useContractStatus";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { status } = useContractStatus();

  // Docs pages use their own layout (DocsSidebar)
  if (pathname.startsWith("/docs")) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header paused={status?.paused} />
        <main className="flex-1 overflow-y-auto p-8 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
