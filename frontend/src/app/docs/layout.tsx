import DocsSidebar from "@/components/DocsSidebar";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-950">
      <DocsSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-12">
          {children}
        </div>
      </main>
    </div>
  );
}
