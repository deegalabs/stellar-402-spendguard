import Link from "next/link";
import DocsSidebar from "@/components/DocsSidebar";
import ThemeToggle from "@/components/ThemeToggle";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-dark text-text-primary">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 z-50 w-full flex justify-between items-center px-6 h-16 bg-dark-50/80 backdrop-blur-xl border-b border-surface-border">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
              <span
                className="material-symbols-outlined text-white text-[18px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                security
              </span>
            </div>
            <span className="text-lg font-bold tracking-tight gradient-text">SpendGuard</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm tracking-tight">
            <Link href="/dashboard" className="text-text-muted font-medium hover:text-accent-fg transition-colors">
              Dashboard
            </Link>
            <Link href="/audit" className="text-text-muted font-medium hover:text-accent-fg transition-colors">
              Analytics
            </Link>
            <span className="text-accent-fg border-b-2 border-accent-fg pb-1 font-medium">
              Documentation
            </span>
            <Link href="/vault" className="text-text-muted font-medium hover:text-accent-fg transition-colors">
              Settings
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2 lg:gap-3">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-surface-card border border-surface-border rounded-full">
            <span className="w-2 h-2 rounded-full bg-success-fg animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-text-muted">
              Stellar Testnet: Active
            </span>
          </div>
          <ThemeToggle />
          <button className="material-symbols-outlined text-text-muted hover:text-text-primary text-[20px] p-2 rounded-lg hover:bg-surface-bright transition-colors">
            help
          </button>
          <button className="material-symbols-outlined text-text-muted hover:text-text-primary text-[20px] p-2 rounded-lg hover:bg-surface-bright transition-colors">
            notifications
          </button>
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 overflow-hidden ml-1 flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-[16px]">person</span>
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
