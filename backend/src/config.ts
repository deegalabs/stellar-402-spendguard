import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const config = {
  // Stellar
  stellarNetwork: optional("STELLAR_NETWORK", "testnet"),
  rpcUrl: optional("STELLAR_RPC_URL", "https://soroban-testnet.stellar.org"),
  horizonUrl: optional("HORIZON_URL", "https://horizon-testnet.stellar.org"),
  networkPassphrase: optional(
    "NETWORK_PASSPHRASE",
    "Test SDF Network ; September 2015"
  ),

  // Contract
  contractAddress: optional("CONTRACT_ADDRESS", ""),
  usdcSacAddress: optional("USDC_SAC_ADDRESS", ""),

  // Accounts
  ownerPublicKey: optional("OWNER_PUBLIC_KEY", ""),
  ownerSecretKey: optional("OWNER_SECRET_KEY", ""),
  agentPublicKey: optional("AGENT_PUBLIC_KEY", ""),
  agentSecretKey: optional("AGENT_SECRET_KEY", ""),

  // Stripe (test mode)
  stripeSecretKey: optional("STRIPE_SECRET_KEY", ""),
  stripeWebhookSecret: optional("STRIPE_WEBHOOK_SECRET", ""),

  // Application
  port: parseInt(process.env.PORT ?? optional("BACKEND_PORT", "3001"), 10),
  frontendUrl: optional("FRONTEND_URL", "http://localhost:3000"),
} as const;
