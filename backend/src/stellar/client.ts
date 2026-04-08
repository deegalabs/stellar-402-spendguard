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

/**
 * Walk an ScVal looking for a contract error code. The RPC puts
 * failed-contract-call errors in diagnostic events as an `ScError`
 * of type `sceContract`, sometimes wrapped inside a vec/map.
 */
function findContractErrorInScVal(scv: xdr.ScVal): number | null {
  try {
    const tag = scv.switch().name;
    if (tag === "scvError") {
      const err = scv.error();
      if (err.switch().name === "sceContract") {
        return err.contractCode();
      }
    }
    if (tag === "scvVec") {
      for (const item of scv.vec() ?? []) {
        const code = findContractErrorInScVal(item);
        if (code !== null) return code;
      }
    }
    if (tag === "scvMap") {
      for (const entry of scv.map() ?? []) {
        const code = findContractErrorInScVal(entry.val());
        if (code !== null) return code;
      }
    }
  } catch {
    /* ignore malformed XDR */
  }
  return null;
}

/**
 * Pull the first contract error code out of a failed transaction's
 * diagnostic events, so the admin API's error mapper can name it
 * (ExceedsDailyLimit, ContractPaused, …) instead of surfacing a
 * generic "transaction failed".
 */
function extractContractError(
  events: xdr.DiagnosticEvent[] | undefined
): number | null {
  if (!events) return null;
  for (const ev of events) {
    try {
      const bodyValue = ev.event().body().value() as {
        topics?: () => xdr.ScVal[];
        data?: () => xdr.ScVal;
      };
      const topics = typeof bodyValue.topics === "function" ? bodyValue.topics() : [];
      const data = typeof bodyValue.data === "function" ? [bodyValue.data()] : [];
      for (const scv of [...topics, ...data]) {
        const code = findContractErrorInScVal(scv);
        if (code !== null) return code;
      }
    } catch {
      /* ignore malformed events */
    }
  }
  return null;
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

  if (response.status !== "PENDING") {
    // sendTransaction already rejected the tx (ERROR, DUPLICATE,
    // TRY_AGAIN_LATER). Don't pretend the submit was successful.
    throw new Error(
      `sendTransaction returned ${response.status} for ${response.hash ?? "(no hash)"}`
    );
  }

  let result = await server.getTransaction(response.hash);
  const maxAttempts = 30; // 30 seconds timeout
  let attempts = 0;
  while (result.status === "NOT_FOUND") {
    if (++attempts >= maxAttempts) {
      throw new Error(
        `Transaction ${response.hash} not confirmed after ${maxAttempts}s`
      );
    }
    await new Promise((r) => setTimeout(r, 1000));
    result = await server.getTransaction(response.hash);
  }

  if (result.status !== "SUCCESS") {
    // The tx was accepted by the mempool but reverted on-chain. The
    // old code returned the hash here anyway, so callers happily
    // reported success for a reverted tx. Throw instead, and include
    // the contract error code so the HTTP layer can name it.
    const code = extractContractError(result.diagnosticEventsXdr);
    const suffix = code !== null ? ` Error(Contract, #${code})` : "";
    throw new Error(
      `Transaction ${response.hash} reverted on-chain (status=${result.status}).${suffix}`
    );
  }

  return { hash: response.hash, result };
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
