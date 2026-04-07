export default function IntroductionPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1>Introduction</h1>
      <p className="lead text-slate-300 text-lg">
        SpendGuard is a Soroban smart contract that governs how AI agents spend
        USDC via the x402 protocol on Stellar.
      </p>

      <h2>The Problem</h2>
      <p>
        AI agents that make autonomous HTTP payments (x402) need guardrails.
        Without on-chain spending policies, an agent with access to funds can:
      </p>
      <ul>
        <li>Overspend in a single day</li>
        <li>Pay unauthorized merchants</li>
        <li>Drain the entire balance on a single expensive call</li>
      </ul>
      <p>
        Current solutions rely on off-chain rate limiting, which can be bypassed
        if the agent process is compromised.
      </p>

      <h2>The Solution</h2>
      <p>
        SpendGuard enforces spending policies <strong>on-chain</strong>. The
        owner sets daily limits, per-transaction caps, and merchant whitelists.
        The agent can only spend within those boundaries — enforced by the
        Soroban contract, not by application code.
      </p>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mt-6">
        <h3 className="text-blue-400 mt-0">Key Capabilities</h3>
        <ul className="mb-0">
          <li><strong>Daily spending limit</strong> — caps total agent spend per 24h</li>
          <li><strong>Per-transaction cap</strong> — prevents large single payments</li>
          <li><strong>Merchant whitelist</strong> — only approved recipients</li>
          <li><strong>Emergency kill switch</strong> — pause all payments instantly</li>
          <li><strong>On-chain audit trail</strong> — every payment is verifiable</li>
        </ul>
      </div>

      <h2>Why Stellar</h2>
      <p>
        SpendGuard depends on <strong>Soroban Custom Accounts</strong> — the
        ability for a smart contract to hold funds and authorize transfers
        internally without exposing private keys to the agent process.
      </p>
      <p>
        On EVM chains, token transfers require an EOA signature or complex
        proxy/multisig patterns. On Stellar, the contract IS the account.
        The agent invokes <code>authorize_payment()</code>, the contract
        validates policies, and calls <code>token.transfer()</code> from its
        own address.
      </p>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mt-6">
        <h3 className="text-green-400 mt-0">Next Steps</h3>
        <p className="mb-0">
          Ready to get started? Head to the{" "}
          <a href="/docs/installation" className="text-blue-400 hover:text-blue-300">
            Installation
          </a>{" "}
          guide.
        </p>
      </div>
    </article>
  );
}
