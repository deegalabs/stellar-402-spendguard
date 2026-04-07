# Environment Configuration

Every environment variable, external endpoint, and configuration value
required to run the project. Private keys go in `.env.local` — never committed.

---

## Stellar Network

### STELLAR_NETWORK
**Value:** `testnet`  
**Used by:** backend, frontend  
**Description:** Target Stellar network. Always testnet for hackathon.

### STELLAR_RPC_URL
**Value (Testnet):** `https://soroban-testnet.stellar.org`  
**Used by:** backend (contract calls)  
**Description:** Soroban RPC endpoint for submitting transactions.

### HORIZON_URL
**Value (Testnet):** `https://horizon-testnet.stellar.org`  
**Used by:** backend (event reading), frontend (balance queries)  
**Description:** Horizon API endpoint for ledger data and events.

### NETWORK_PASSPHRASE
**Value (Testnet):** `Test SDF Network ; September 2015`  
**Used by:** backend  
**Description:** Network passphrase for transaction signing.

---

## Contract

### CONTRACT_ADDRESS
**Value (Testnet):** `CCABMNFY3VKK7BI3YBWXJEE2EXX2NW5S573NASTCFXA6KBXR5PDWFD6E`  
**Used by:** backend, frontend  
**Description:** Deployed BudgetGuard contract address on Stellar Testnet.

### USDC_SAC_ADDRESS
**Value (Testnet):** `CADUVDKFGHZQD2MN7S47WUDSGJPWTKLC3DG5KX7QZBJZKOKEAMDL27SN`  
**Used by:** backend, contract initialization  
**Description:** Address of the USDC Stellar Asset Contract on testnet.

---

## Accounts

### OWNER_PUBLIC_KEY
**Value:** `G...` _(set after creating owner account)_  
**Used by:** backend, frontend  
**Description:** Owner's Stellar public key. Used for admin operations.

### OWNER_SECRET_KEY
**Value:** `S...` _(NEVER commit — .env.local only)_  
**Used by:** backend (Stripe webhook → top_up)  
**Description:** Owner's Stellar secret key for backend-initiated transactions.

### AGENT_PUBLIC_KEY
**Value:** `G...` _(set after creating agent account)_  
**Used by:** backend  
**Description:** Agent's Stellar public key. Separate from owner.

### AGENT_SECRET_KEY
**Value:** `S...` _(NEVER commit — .env.local only)_  
**Used by:** backend (agent process)  
**Description:** Agent's Stellar secret key for signing authorize_payment calls.

---

## Stripe (Test Mode)

### STRIPE_PUBLISHABLE_KEY
**Value:** `pk_test_...`  
**Used by:** frontend  
**Description:** Stripe publishable key in test mode.

### STRIPE_SECRET_KEY
**Value:** `sk_test_...` _(NEVER commit — .env.local only)_  
**Used by:** backend  
**Description:** Stripe secret key in test mode.

### STRIPE_WEBHOOK_SECRET
**Value:** `whsec_...` _(NEVER commit — .env.local only)_  
**Used by:** backend  
**Description:** Stripe webhook signing secret for verification.

---

## Facilitator

### FACILITATOR_URL
**Value (Testnet):** _(Built on Stellar Facilitator endpoint — confirm availability)_  
**Used by:** backend (agent)  
**Description:** URL of the x402 facilitator for payment relay.

---

## Application

### BACKEND_PORT
**Value:** `3001`  
**Used by:** backend  
**Description:** Express server port.

### FRONTEND_URL
**Value:** `http://localhost:3000`  
**Used by:** backend (CORS)  
**Description:** Next.js frontend URL.

### BACKEND_URL
**Value:** `http://localhost:3001`  
**Used by:** frontend  
**Description:** Backend API URL.

---

## .env.example Template

```env
# Stellar Network
STELLAR_NETWORK=testnet
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
HORIZON_URL=https://horizon-testnet.stellar.org
NETWORK_PASSPHRASE="Test SDF Network ; September 2015"

# Contract (set after deploy)
CONTRACT_ADDRESS=
USDC_SAC_ADDRESS=

# Owner Account
OWNER_PUBLIC_KEY=
OWNER_SECRET_KEY=

# Agent Account (separate from owner)
AGENT_PUBLIC_KEY=
AGENT_SECRET_KEY=

# Stripe Test Mode
STRIPE_PUBLISHABLE_KEY=pk_test_
STRIPE_SECRET_KEY=sk_test_
STRIPE_WEBHOOK_SECRET=whsec_

# Facilitator
FACILITATOR_URL=

# Application
BACKEND_PORT=3001
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3001
```
