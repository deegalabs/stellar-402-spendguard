# Backend API Specification

Every HTTP endpoint the backend exposes. The backend is an Express.js server
(TypeScript) that mediates between the frontend dashboard and the Soroban
contract, processes Stripe webhooks, and serves dashboard data.

Base URL: `http://localhost:3001/api`

---

## Admin Endpoints

All admin endpoints require owner authentication via Freighter-signed requests.

### POST /api/admin/top-up

Initiates a USDC deposit into the contract after Stripe payment confirmation.

**Auth:** Owner Freighter signature  
**Request:**
```json
{
  "amount": 50000000,
  "stripe_payment_intent_id": "pi_1234..."
}
```
**Response 200:**
```json
{
  "tx_hash": "abc123...",
  "new_balance": "100000000",
  "amount_deposited": "50000000"
}
```
**Response 400:** `{ "error": "Invalid amount", "code": "INVALID_AMOUNT" }`  
**Response 401:** `{ "error": "Unauthorized", "code": "UNAUTHORIZED" }`  
**Side effect:** Calls `contract.top_up()` on Stellar Testnet

---

### POST /api/admin/set-limit

**Auth:** Owner Freighter signature  
**Request:** `{ "daily_limit": 100000000 }`  
**Response 200:** `{ "tx_hash": "...", "new_limit": "100000000" }`  
**Response 400:** `{ "error": "Invalid amount", "code": "INVALID_AMOUNT" }`  
**Side effect:** Calls `contract.set_daily_limit()`

---

### POST /api/admin/set-max-tx

**Auth:** Owner Freighter signature  
**Request:** `{ "max_tx_value": 50000000 }`  
**Response 200:** `{ "tx_hash": "...", "new_max_tx": "50000000" }`  
**Response 400:** `{ "error": "Invalid amount", "code": "INVALID_AMOUNT" }`  
**Side effect:** Calls `contract.set_max_tx()`

---

### POST /api/admin/whitelist

**Auth:** Owner Freighter signature  
**Request:** `{ "merchant": "G...MERCHANT_ADDRESS" }`  
**Response 200:** `{ "tx_hash": "...", "merchant": "G..." }`  
**Response 400:** `{ "error": "Invalid address", "code": "INVALID_ADDRESS" }`  
**Side effect:** Calls `contract.whitelist_merchant()`

---

### POST /api/admin/remove-merchant

**Auth:** Owner Freighter signature  
**Request:** `{ "merchant": "G...MERCHANT_ADDRESS" }`  
**Response 200:** `{ "tx_hash": "...", "merchant": "G..." }`  
**Side effect:** Calls `contract.remove_merchant()`

---

### POST /api/admin/pause

**Auth:** Owner Freighter signature  
**Request:** `{}` (empty body)  
**Response 200:** `{ "tx_hash": "...", "paused": true }`  
**Response 409:** `{ "error": "Already paused", "code": "ALREADY_PAUSED" }`  
**Side effect:** Calls `contract.emergency_pause()`

---

### POST /api/admin/unpause

**Auth:** Owner Freighter signature  
**Request:** `{}` (empty body)  
**Response 200:** `{ "tx_hash": "...", "paused": false }`  
**Response 409:** `{ "error": "Not paused", "code": "NOT_PAUSED" }`  
**Side effect:** Calls `contract.emergency_unpause()`

---

## Dashboard Endpoints

Read-only endpoints for the frontend. No authentication required for testnet.

### GET /api/status

Returns current contract state.

**Response 200:**
```json
{
  "owner": "G...OWNER",
  "agent": "G...AGENT",
  "daily_limit": "100000000",
  "max_tx_value": "50000000",
  "spent_today": "23000000",
  "last_reset": 1744200000,
  "paused": false,
  "balance": "450000000",
  "network": "testnet"
}
```
**Side effect:** Calls `contract.get_status()`

---

### GET /api/transactions

Returns contract events formatted for the Audit Log.

**Query params:**
- `limit` (default: 50, max: 200)
- `cursor` (pagination cursor from Horizon)
- `type` (optional: "payment", "topup", "pause", "all")

**Response 200:**
```json
{
  "transactions": [
    {
      "id": "evt_001",
      "type": "payment_authorized",
      "timestamp": "2026-04-10T14:22:01Z",
      "merchant": "G...MERCHANT",
      "amount": "1000000",
      "spent_today": "23000000",
      "tx_hash": "abc123...",
      "ledger": 40229122,
      "status": "settled",
      "stellar_expert_url": "https://stellar.expert/explorer/testnet/tx/abc123..."
    }
  ],
  "cursor": "next_cursor_value",
  "total_count": 47
}
```
**Side effect:** Reads events from Horizon API

---

### GET /api/balance

Returns current USDC balance of the contract.

**Response 200:**
```json
{
  "balance": "450000000",
  "balance_usdc": "45.00",
  "last_updated": "2026-04-10T14:22:05Z"
}
```

---

## Stripe Webhook

### POST /webhooks/stripe

Receives Stripe payment confirmation and triggers contract top-up.

**Auth:** Stripe webhook signature verification  
**Headers:** `stripe-signature: t=...,v1=...`  
**Request body:** Stripe Event object (type: `payment_intent.succeeded`)

**Response 200:** `{ "received": true }`  
**Response 400:** `{ "error": "Invalid signature" }`

**Side effect:**
1. Verifies Stripe webhook signature
2. Extracts amount from PaymentIntent
3. Calls `contract.top_up(owner, amount_in_stroops)`
4. Logs the transaction

---

## Demo Endpoint

### POST /api/demo/run-agent

Triggers one complete x402 payment cycle for demonstration purposes.

**Request:**
```json
{
  "target_url": "http://localhost:3001/api/demo/protected-resource",
  "max_retries": 1
}
```
**Response 200:**
```json
{
  "success": true,
  "steps": [
    { "step": "request", "status": 402, "price": "1000000" },
    { "step": "authorize", "tx_hash": "...", "status": "approved" },
    { "step": "settle", "settlement_time_ms": 4200 },
    { "step": "receive", "status": 200, "data": "Weather: sunny, 25C" }
  ]
}
```

### GET /api/demo/protected-resource

A sample x402-protected endpoint used for demonstration.

**Without payment:** Returns HTTP 402 with x402 headers  
**With valid payment:** Returns HTTP 200 with sample data

---

## Error Codes

| Code | HTTP Status | Description |
|------|------------|-------------|
| `INVALID_AMOUNT` | 400 | Amount is zero, negative, or invalid |
| `INVALID_ADDRESS` | 400 | Stellar address format is invalid |
| `UNAUTHORIZED` | 401 | Missing or invalid owner authentication |
| `CONTRACT_PAUSED` | 409 | Contract is paused, cannot execute |
| `ALREADY_PAUSED` | 409 | Contract is already paused |
| `NOT_PAUSED` | 409 | Contract is not paused |
| `EXCEEDS_LIMIT` | 422 | Amount exceeds daily limit or max tx |
| `INSUFFICIENT_BALANCE` | 422 | Contract balance too low |
| `STRIPE_ERROR` | 502 | Stripe API returned an error |
| `STELLAR_ERROR` | 502 | Stellar network returned an error |
