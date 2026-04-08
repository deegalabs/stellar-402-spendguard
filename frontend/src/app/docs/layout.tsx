import Link from "next/link";
import DocsSidebar from "@/components/DocsSidebar";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface text-on-background">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 z-50 w-full flex justify-between items-center px-6 h-16 bg-slate-50 shadow-sm border-b border-surface-container">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-container rounded flex items-center justify-center">
              <span
                className="material-symbols-outlined text-white"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                security
              </span>
            </div>
            <span className="text-xl font-bold tracking-tighter text-primary">SpendGuard</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm tracking-tight">
            <Link href="/dashboard" className="text-slate-500 font-medium hover:text-secondary transition-colors">
              Dashboard
            </Link>
            <Link href="/audit" className="text-slate-500 font-medium hover:text-secondary transition-colors">
              Analytics
            </Link>
            <span className="text-secondary border-b-2 border-secondary pb-1 font-medium">
              Documentation
            </span>
            <Link href="/vault" className="text-slate-500 font-medium hover:text-secondary transition-colors">
              Settings
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-surface-container rounded-full">
            <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim" />
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-on-surface-variant">
              Stellar Testnet: Active
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-500 hover:text-primary transition-colors cursor-pointer">
              help
            </span>
            <span className="material-symbols-outlined text-slate-500 hover:text-primary transition-colors cursor-pointer">
              notifications
            </span>
            <div className="h-8 w-8 rounded-full bg-surface-container overflow-hidden ml-2 border border-outline-variant flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-[16px]">person</span>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <DocsSidebar />

      {/* Main Content */}
      <main className="ml-64 mt-16 p-8 lg:p-12 max-w-6xl">
        {children}
      </main>
    </div>
  );
}
