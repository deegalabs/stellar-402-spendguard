import swaggerUi from "swagger-ui-express";
import type { Express } from "express";

const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "SpendGuard API",
    version: "0.1.0",
    description:
      "Stellar x402 Spending Policy Engine — governs how AI agents spend USDC via on-chain policies.",
    license: { name: "Apache 2.0", url: "https://www.apache.org/licenses/LICENSE-2.0" },
    contact: { name: "DeegaLabs", url: "https://github.com/deegalabs/stellar-402-spendguard" },
  },
  servers: [
    { url: "http://localhost:3001", description: "Local development" },
  ],
  tags: [
    { name: "Dashboard", description: "Read-only contract state and transaction history" },
    { name: "Admin", description: "Owner operations — requires Freighter signature" },
    { name: "Demo", description: "x402 agent demonstration endpoints" },
    { name: "Stripe", description: "Stripe checkout simulation (Test Mode)" },
    { name: "System", description: "Health check and event stream" },
  ],
  paths: {
    "/api/status": {
      get: {
        tags: ["Dashboard"],
        summary: "Get contract status",
        description: "Returns current BudgetGuard contract state: owner, agent, limits, balance, pause status.",
        responses: {
          "200": {
            description: "Contract status",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ContractStatus" },
              },
            },
          },
        },
      },
    },
    "/api/transactions": {
      get: {
        tags: ["Dashboard"],
        summary: "Get transaction history",
        description: "Returns contract events formatted for the Audit Log.",
        parameters: [
          { name: "limit", in: "query", schema: { type: "integer", default: 50, maximum: 200 } },
          { name: "cursor", in: "query", schema: { type: "string" }, description: "Pagination cursor from Horizon" },
        ],
        responses: {
          "200": {
            description: "Transaction list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    transactions: { type: "array", items: { $ref: "#/components/schemas/TransactionEvent" } },
                    cursor: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/balance": {
      get: {
        tags: ["Dashboard"],
        summary: "Get contract USDC balance",
        description: "Returns current USDC balance of the contract via Soroban RPC.",
        responses: {
          "200": {
            description: "Balance",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    balance: { type: "string", example: "450000000" },
                    balance_usdc: { type: "string", example: "45.00" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/admin/set-limit": {
      post: {
        tags: ["Admin"],
        summary: "Set daily spending limit",
        description: "Updates the maximum USDC the agent can spend per 24h period.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["daily_limit"],
                properties: {
                  daily_limit: { type: "integer", example: 100000000, description: "New daily limit in USDC stroops" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Limit updated", content: { "application/json": { schema: { $ref: "#/components/schemas/TxResult" } } } },
          "400": { description: "Invalid amount", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
    },
    "/api/admin/set-max-tx": {
      post: {
        tags: ["Admin"],
        summary: "Set max per-transaction value",
        description: "Updates the maximum USDC allowed in a single transaction. Must be <= daily_limit.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["max_tx_value"],
                properties: {
                  max_tx_value: { type: "integer", example: 50000000, description: "New max tx in USDC stroops" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Max tx updated", content: { "application/json": { schema: { $ref: "#/components/schemas/TxResult" } } } },
          "400": { description: "Invalid amount", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
    },
    "/api/admin/whitelist": {
      post: {
        tags: ["Admin"],
        summary: "Whitelist a merchant",
        description: "Adds a merchant Stellar address to the approved list.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["merchant"],
                properties: {
                  merchant: { type: "string", example: "GAURBKKJ56HQSPEB54ON32EWK2K7OHCG65ULNJ6CKIOXAETCQSRCUOY2" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Merchant whitelisted", content: { "application/json": { schema: { $ref: "#/components/schemas/TxResult" } } } },
          "400": { description: "Invalid address", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
    },
    "/api/admin/remove-merchant": {
      post: {
        tags: ["Admin"],
        summary: "Remove a merchant from whitelist",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["merchant"],
                properties: {
                  merchant: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Merchant removed", content: { "application/json": { schema: { $ref: "#/components/schemas/TxResult" } } } },
        },
      },
    },
    "/api/admin/pause": {
      post: {
        tags: ["Admin"],
        summary: "Emergency pause",
        description: "Halts all new payments immediately. Does NOT cancel in-flight transactions (blockchain finality).",
        responses: {
          "200": { description: "Paused", content: { "application/json": { schema: { $ref: "#/components/schemas/TxResult" } } } },
          "409": { description: "Already paused", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
    },
    "/api/admin/unpause": {
      post: {
        tags: ["Admin"],
        summary: "Resume payment processing",
        responses: {
          "200": { description: "Unpaused", content: { "application/json": { schema: { $ref: "#/components/schemas/TxResult" } } } },
          "409": { description: "Not paused", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
    },
    "/api/admin/top-up": {
      post: {
        tags: ["Admin"],
        summary: "Deposit USDC into contract",
        description: "Initiates a USDC deposit after Stripe payment confirmation.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["amount"],
                properties: {
                  amount: { type: "integer", example: 50000000, description: "Amount in USDC stroops" },
                  stripe_payment_intent_id: { type: "string", example: "pi_1234" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Top-up complete", content: { "application/json": { schema: { $ref: "#/components/schemas/TxResult" } } } },
        },
      },
    },
    "/api/demo/protected-resource": {
      get: {
        tags: ["Demo"],
        summary: "x402-protected resource",
        description: "Sample endpoint that returns HTTP 402 without payment, HTTP 200 with valid payment proof.",
        responses: {
          "402": {
            description: "Payment Required — x402 challenge",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/X402Challenge" },
              },
            },
          },
          "200": { description: "Resource data (with valid payment)" },
        },
      },
    },
    "/api/demo/run-agent": {
      post: {
        tags: ["Demo"],
        summary: "Run one x402 payment cycle",
        description: "Triggers a complete x402 flow: request → 402 → authorize_payment → settle → 200.",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  target_url: { type: "string", example: "http://localhost:3001/api/demo/protected-resource" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Agent cycle result",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    steps: { type: "array", items: { $ref: "#/components/schemas/DemoStep" } },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/stripe/create-checkout": {
      post: {
        tags: ["Stripe"],
        summary: "Create Stripe checkout session (Test Mode)",
        description: "Creates a simulated Stripe checkout session for USDC deposit.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["amount_usdc"],
                properties: {
                  amount_usdc: { type: "number", example: 10.0 },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Checkout session",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    session_id: { type: "string" },
                    url: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/events": {
      get: {
        tags: ["System"],
        summary: "SSE event stream",
        description: "Server-Sent Events stream of real-time contract events from Horizon.",
        responses: {
          "200": {
            description: "SSE stream",
            content: { "text/event-stream": { schema: { type: "string" } } },
          },
        },
      },
    },
    "/health": {
      get: {
        tags: ["System"],
        summary: "Health check",
        responses: {
          "200": {
            description: "Server status",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    network: { type: "string", example: "testnet" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      ContractStatus: {
        type: "object",
        properties: {
          owner: { type: "string", example: "GBF5LCVZQ5VQ5DOE57DXY4PDDWS2BGACEJBGJUJYAJSGJKOWHZ5TTLOY" },
          agent: { type: "string", example: "GCBQOCJCSRYWNXSD7EODT4VMJALZSNUOYTGPX2S6FS6NBF7EBNRCXMFB" },
          daily_limit: { type: "string", example: "100000000" },
          max_tx_value: { type: "string", example: "50000000" },
          spent_today: { type: "string", example: "23000000" },
          last_reset: { type: "integer", example: 1744200000 },
          paused: { type: "boolean", example: false },
          balance: { type: "string", example: "450000000" },
          network: { type: "string", example: "testnet" },
        },
      },
      TransactionEvent: {
        type: "object",
        properties: {
          id: { type: "string" },
          type: { type: "string", enum: ["payment_authorized", "payment_rejected"] },
          timestamp: { type: "string", format: "date-time" },
          merchant: { type: "string" },
          amount: { type: "string" },
          spent_today: { type: "string" },
          tx_hash: { type: "string" },
          ledger: { type: "integer" },
          status: { type: "string", enum: ["settled", "blocked", "pending"] },
          stellar_expert_url: { type: "string", format: "uri" },
        },
      },
      X402Challenge: {
        type: "object",
        properties: {
          x402Version: { type: "integer", example: 1 },
          accepts: {
            type: "array",
            items: {
              type: "object",
              properties: {
                scheme: { type: "string", example: "exact" },
                network: { type: "string", example: "stellar:testnet" },
                price: { type: "string", example: "1000000" },
                payTo: { type: "string" },
                facilitator: { type: "string", format: "uri" },
              },
            },
          },
          description: { type: "string" },
        },
      },
      DemoStep: {
        type: "object",
        properties: {
          step: { type: "string", enum: ["request", "authorize", "settle", "receive"] },
          status: { type: "integer" },
          price: { type: "string" },
          tx_hash: { type: "string" },
          settlement_time_ms: { type: "integer" },
          data: { type: "string" },
        },
      },
      TxResult: {
        type: "object",
        properties: {
          tx_hash: { type: "string" },
          success: { type: "boolean" },
        },
      },
      ApiError: {
        type: "object",
        properties: {
          error: { type: "string" },
          code: { type: "string" },
        },
      },
    },
  },
};

export function setupSwagger(app: Express): void {
  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(openApiSpec, {
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "SpendGuard API Docs",
    })
  );

  app.get("/api/openapi.json", (_req, res) => {
    res.json(openApiSpec);
  });
}
