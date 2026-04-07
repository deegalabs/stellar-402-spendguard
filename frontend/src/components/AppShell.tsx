"use client";

import Sidebar from "./Sidebar";
import Header from "./Header";
import { useContractStatus } from "@/hooks/useContractStatus";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { status } = useContractStatus();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header paused={status?.paused} />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
