import {
  Keypair,
  Contract,
  TransactionBuilder,
  Networks,
  xdr,
  nativeToScVal,
  Address,
  scValToNative,
} from "@stellar/stellar-sdk";
import { Server } from "@stellar/stellar-sdk/rpc";
import { config } from "../config.js";

const server = new Server(config.rpcUrl);

export function getServer(): Server {
  return server;
}

export function getNetworkPassphrase(): string {
  return config.stellarNetwork === "testnet"
    ? Networks.TESTNET
    : Networks.PUBLIC;
}

/**
 * Build a Keypair from a secret key. Throws a `ConfigError` (with a
 * clear message) when the secret is missing or malformed, instead of
 * the opaque "invalid encoded string" that Keypair.fromSecret throws.
 */
export class ConfigError extends Error {
  readonly code = "CONFIG_ERROR";
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

export function getKeypair(secretKey: string, label = "secret key"): Keypair {
  if (!secretKey) {
    throw new ConfigError(
      `Server is missing a required ${label}. Set OWNER_SECRET_KEY and AGENT_SECRET_KEY in the backend environment.`
    );
  }
  try {
    return Keypair.fromSecret(secretKey);
  } catch {
    throw new ConfigError(
      `The configured ${label} is not a valid Stellar secret (expected a "S…" strkey).`
    );
  }
}

export async function getAccount(publicKey: string) {
  return server.getAccount(publicKey);
}

export function getContract(): Contract {
  if (!config.contractAddress) {
    throw new Error("CONTRACT_ADDRESS not configured");
  }
  return new Contract(config.contractAddress);
}

export async function submitTransaction(
  tx: TransactionBuilder,
  signer: Keypair
) {
  const built = tx.setTimeout(30).build();

  // Soroban flow: build → prepare (simulate) → sign → send
  const prepared = await server.prepareTransaction(built);
  if ("sign" in prepared) {
    prepared.sign(signer);
  }

  const response = await server.sendTransaction(prepared);

  if (response.status === "PENDING") {
    let result = await server.getTransaction(response.hash);
    const maxAttempts = 30; // 30 seconds timeout
    let attempts = 0;
    while (result.status === "NOT_FOUND") {
      if (++attempts >= maxAttempts) {
        throw new Error(`Transaction ${response.hash} not confirmed after ${maxAttempts}s`);
      }
      await new Promise((r) => setTimeout(r, 1000));
      result = await server.getTransaction(response.hash);
    }
    return { hash: response.hash, result };
  }

  return { hash: response.hash, result: response };
}

export async function callContractView(
  functionName: string,
  ...args: xdr.ScVal[]
) {
  const contract = getContract();
  const account = await getAccount(config.ownerPublicKey);
  const tx = new TransactionBuilder(account, {
    fee: "100",
    networkPassphrase: getNetworkPassphrase(),
  })
    .addOperation(contract.call(functionName, ...args))
    .setTimeout(30)
    .build();

  const response = await server.simulateTransaction(tx);
  if ("result" in response && response.result) {
    return scValToNative(response.result.retval);
  }
  throw new Error(`Contract view call failed: ${functionName}`);
}

export async function callContractMutate(
  functionName: string,
  signer: Keypair,
  ...args: xdr.ScVal[]
) {
  const contract = getContract();
  const account = await getAccount(signer.publicKey());
  const tx = new TransactionBuilder(account, {
    fee: "100",
    networkPassphrase: getNetworkPassphrase(),
  }).addOperation(contract.call(functionName, ...args));

  return submitTransaction(tx, signer);
}

export { nativeToScVal, Address, xdr, TransactionBuilder, Contract, scValToNative };
