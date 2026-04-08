"use client";

import { useContractStatus } from "@/hooks/useContractStatus";
import { shortAddress } from "@/lib/format";

export default function Footer() {
  const { status } = useContractStatus();
  const contractAddress = status?.contract_address;
  const network = status?.network ?? "testnet";

  return (
    <footer className="shrink-0 border-t border-surface-border bg-dark-50/60 backdrop-blur-sm px-4 lg:px-6 py-2">
      <div className="flex items-center justify-between gap-3 text-[10px] font-mono uppercase tracking-widest text-text-disabled">
        <div className="flex items-center gap-3 min-w-0">
          <span className="truncate">
            <span className="text-text-muted">SpendGuard</span>
            <span className="mx-1.5 opacity-40">·</span>
            <span>Stellar {network}</span>
          </span>
          {contractAddress && (
            <>
              <span className="opacity-40 hidden sm:inline">·</span>
              <a
                href={`https://stellar.expert/explorer/${network}/contract/${contractAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline truncate text-accent-fg/60 hover:text-accent-fg transition-colors"
              >
                {shortAddress(contractAddress)}
              </a>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:inline">Built by</span>
          <a
            href="https://github.com/deegalabs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            Deega Labs
          </a>
        </div>
      </div>
    </footer>
  );
}
