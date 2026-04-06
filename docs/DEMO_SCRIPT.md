# Demo Script

Exact 90-second demo sequence for the hackathon video. Every state must be
pre-configured before recording — no improvisation.

---

## Pre-Demo Setup Checklist

- [ ] Contract deployed on Stellar Testnet with known CONTRACT_ADDRESS
- [ ] Owner account funded with XLM and USDC on testnet
- [ ] Agent account funded with XLM on testnet
- [ ] Contract initialized with owner, agent, USDC SAC
- [ ] Daily limit set to $5.00 (50_000_000 stroops)
- [ ] Max tx value set to $2.00 (20_000_000 stroops)
- [ ] One merchant whitelisted (the demo endpoint address)
- [ ] Contract funded with $50.00 USDC via top_up
- [ ] 10+ seed transactions already on testnet (mix of success + blocked)
- [ ] Backend running on localhost:3001
- [ ] Frontend running on localhost:3000
- [ ] Freighter wallet installed, configured for Testnet, owner account imported
- [ ] Browser open on the Onboarding page (wallet disconnected)
- [ ] Stripe CLI listening: `stripe listen --forward-to localhost:3001/webhooks/stripe`
- [ ] Screen recording tool ready (OBS or Loom)

---

## 90-Second Script

### 0:00–0:08 — Onboarding (Empty State)
- Show the Onboarding screen: "Ready to launch your governance fleet?"
- Highlight the two badges: "SOROBAN PROTECTED" and "X402 PROTOCOL"
- Click "Connect Freighter Wallet"
- Freighter popup appears → approve connection

### 0:08–0:18 — Liquidity Bridge (Deposit)
- Navigate to Liquidity page via sidebar
- Show current balance: $0.00 (or existing balance)
- Click "$50" preset or enter custom amount
- Click "Initialize Secure Deposit"
- Stripe Checkout opens (test card: 4242 4242 4242 4242, any expiry/CVC)
- Complete payment → webhook fires → balance updates to $50.00
- Point out "(Test Mode)" label on Stripe elements

### 0:18–0:32 — Agent Vault (Governance Setup)
- Navigate to Agent Vault via sidebar
- Show the Budget Control Panel
- Drag Daily Spending Limit slider to $5.00
  - Freighter popup → sign transaction → confirm on-chain
- Drag Max Transaction Value slider to $2.00
  - Freighter popup → sign → confirm
- Show Merchant Whitelist section
  - One merchant already whitelisted from setup
- Point out the Emergency Kill Switch card at the bottom
  - Read the honest disclaimer: "Transactions already submitted to the Stellar
    ledger are not affected by this action"

### 0:32–0:48 — Live x402 Payment (Success)
- Navigate to Dashboard
- Click "Run Demo Agent" button (or trigger via terminal)
- Show the Live Activity Feed updating in real-time:
  1. Request: GET /api/demo/protected-resource
  2. Response: HTTP 402 Payment Required ($0.01 USDC)
  3. Contract: authorize_payment validated ✓
  4. Settlement: 4.2s on Stellar Testnet
  5. Result: HTTP 200 OK — resource received
- Show the transaction appearing in the Live Payment Feed with green dot
- Click the TX Hash → opens Stellar Expert in new tab showing the real tx

### 0:48–0:58 — Blocked Payment (Over Limit)
- Show current spent_today in the metric card (e.g., $4.90 of $5.00)
- Trigger another agent payment for $0.50 (would exceed $5.00 limit)
- Show the BLOCKED result:
  - Red dot in Live Activity Feed
  - "BLOCKED" badge
  - Error: ExceedsDailyLimit
- Point out: "The contract rejected this — not the backend, not the agent.
  On-chain governance."

### 0:58–0:72 — Kill Switch (Emergency Pause)
- Navigate to Agent Vault
- Click "Revoke Soroban Auth" (Emergency Kill Switch button)
- Confirmation modal appears:
  - "This will immediately block ALL new payment authorizations"
  - Warning: "Transactions already submitted to the Stellar ledger are not affected"
- Click "Yes, Pause All Spending"
- Freighter popup → sign → confirm
- Global red banner appears: "EMERGENCY PAUSE ACTIVE — All new agent
  authorizations are blocked"
- Show Dashboard — "Guard Status" card shows "PAUSED"

### 0:72–0:85 — Audit Log (Transparency)
- Navigate to Audit Log
- Show the table with real transactions:
  - Green dots: successful payments with amounts, endpoints, tx hashes
  - Red dot: the blocked payment from earlier
  - TX hashes are clickable → Stellar Expert
- Show the System Metadata Stream (dark terminal) with live ledger data
- Point out metric cards: total transactions, settlement velocity, volume

### 0:85–0:90 — Closing
- Quick sidebar navigation showing all 4 screens work
- End on Dashboard with the PAUSED banner visible
- Overlay or voiceover: "Stellar 402 SpendGuard — the spending-policy contract
  that was missing for x402 agents on Stellar"

---

## Recovery Plan

If a step fails during recording:

| Failure | Recovery |
|---------|----------|
| Freighter popup doesn't appear | Refresh page, reconnect wallet, re-record from that point |
| Stripe Checkout fails | Use pre-seeded balance, skip deposit step |
| Agent payment times out | Re-run the agent command, continue from the result |
| Kill switch tx fails | Retry once, if still fails show the modal and explain |
| Audit Log is empty | Ensure seed transactions were created in pre-demo setup |
| Terminal shows error | Keep recording, acknowledge briefly, move to next step |

**General rule:** If something breaks, keep the camera rolling. Brief
acknowledgment + workaround is more authentic than a perfect take.

---

## Stellar Expert URL Format

Testnet transactions:
```
https://stellar.expert/explorer/testnet/tx/{TX_HASH}
```

Testnet contract:
```
https://stellar.expert/explorer/testnet/contract/{CONTRACT_ADDRESS}
```

Testnet account:
```
https://stellar.expert/explorer/testnet/account/{ACCOUNT_ADDRESS}
```
