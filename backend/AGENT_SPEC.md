# Agent Specification

The x402 agent is a Node.js process — NOT an AI model. It is a deterministic
program that autonomously makes HTTP requests to x402-protected endpoints,
handles 402 Payment Required responses, and executes payments through the
BudgetGuard contract.

---

## What the Agent Does

1. Sends HTTP requests to merchant API endpoints
2. Detects HTTP 402 Payment Required responses
3. Parses the x402 challenge (price, payTo, facilitator)
4. Builds a Soroban transaction invoking `BudgetGuard.authorize_payment()`
5. Signs the transaction with the agent's own keypair
6. Submits the signed transaction to the Built on Stellar Facilitator
7. Retries the original request with payment proof
8. Receives the resource (HTTP 200)

---

## The x402 Flow — Step by Step

### Step 1: Initial Request
```
Agent → GET https://merchant.example/api/weather
Agent ← HTTP 402 Payment Required
```

### Step 2: Parse 402 Challenge
The 402 response contains payment details in headers or body:
```json
{
  "x402Version": 1,
  "accepts": [{
    "scheme": "exact",
    "network": "stellar:testnet",
    "price": "1000000",
    "payTo": "G...MERCHANT",
    "facilitator": "https://facilitator.stellar.org"
  }],
  "description": "Weather data for location"
}
```

The agent extracts:
- `price` — amount in USDC stroops (i128)
- `payTo` — merchant's Stellar address
- `network` — must match configured network (stellar:testnet)
- `facilitator` — URL of the Built on Stellar Facilitator

### Step 3: Build Soroban Transaction
```typescript
const tx = new TransactionBuilder(agentAccount, { fee: "100" })
  .addOperation(
    contract.call(
      "authorize_payment",
      xdr.ScVal.fromI128(price),
      new Address(payTo).toScVal()
    )
  )
  .setTimeout(30)
  .build();
```

### Step 4: Sign with Agent Keypair
```typescript
const signedTx = await tx.sign(agentKeypair);
```

**Critical:** The agent signs with its OWN keypair. This authorizes the contract
invocation, not the USDC transfer directly. The contract executes the USDC
transfer internally via the SAC.

### Step 5: Submit to Facilitator
```typescript
const response = await fetch(facilitatorUrl, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    transaction: signedTx.toXDR(),
    network: "stellar:testnet"
  })
});
```

The facilitator:
1. Verifies the transaction
2. Broadcasts to the Stellar network
3. Waits for ledger confirmation (< 5 seconds)
4. Returns the transaction hash

### Step 6: Retry with Payment Proof
```
Agent → GET https://merchant.example/api/weather
        Header: X-Payment-Proof: <tx_hash>
Agent ← HTTP 200 OK { data: "Weather: sunny, 25°C" }
```

---

## Error Handling

| Contract Error | Agent Behavior |
|---------------|---------------|
| `ContractPaused` | Log error, stop retrying, alert owner via webhook |
| `ExceedsDailyLimit` | Log error, stop retrying until next day reset |
| `ExceedsMaxTx` | Log error, this endpoint is too expensive for current config |
| `MerchantNotWhitelisted` | Log error, skip this endpoint, alert owner |
| `InsufficientBalance` | Log error, alert owner to top up |
| `ArithmeticOverflow` | Log error, this should never happen — indicates a bug |
| HTTP 5xx from facilitator | Retry once after 2 seconds, then fail |
| Network timeout | Retry once after 5 seconds, then fail |

---

## Agent Configuration

```typescript
interface AgentConfig {
  // Stellar
  agentKeypair: Keypair;        // Agent's own keypair (NOT owner's)
  contractAddress: string;       // BudgetGuard contract address
  networkPassphrase: string;     // "Test SDF Network ; September 2015"
  horizonUrl: string;            // "https://horizon-testnet.stellar.org"

  // Behavior
  pollIntervalMs: number;        // How often to check endpoints (default: 10000)
  maxRetriesPerEndpoint: number; // Max payment retries (default: 1)
  endpoints: string[];           // List of x402 endpoints to poll

  // Logging
  logLevel: "debug" | "info" | "warn" | "error";
  webhookUrl?: string;           // Optional webhook for alerts
}
```

---

## Demo Mode

For the hackathon demo, the agent runs in a simplified mode:

1. Targets a single local endpoint: `http://localhost:3001/api/demo/protected-resource`
2. Executes exactly one payment cycle
3. Returns a structured result object with all steps visible
4. Triggered via `POST /api/demo/run-agent` (not running in a loop)

This makes the demo reproducible and predictable. The agent is not running
autonomously during the recording — it is triggered on-demand to show the
complete flow.

---

## File Structure

```
backend/src/agent/
├── index.ts              # Agent entry point and main loop
├── x402-client.ts        # HTTP client that detects and parses 402 responses
├── payment-handler.ts    # Builds Soroban transactions, signs, submits
├── config.ts             # Agent configuration loader
└── types.ts              # TypeScript interfaces for x402 challenge/response
```

---

## Security Constraints

1. The agent's keypair is stored in `.env` — never committed to the repo
2. The agent can ONLY call `authorize_payment` on the contract — it cannot
   call admin functions, cannot pause, cannot change limits
3. The agent does not know or need the owner's keypair
4. If the agent process is compromised, exposure is limited to `daily_limit`
   per day (enforced on-chain, not in the agent code)
5. The agent does not cache or store payment proofs beyond the current request
