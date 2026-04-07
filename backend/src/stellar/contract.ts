import {
  callContractView,
  callContractMutate,
  getKeypair,
  nativeToScVal,
  Address,
  xdr,
  scValToNative,
} from "./client.js";
import { config } from "../config.js";
import type { ContractStatus } from "../types.js";

function addressToScVal(address: string): xdr.ScVal {
  return new Address(address).toScVal();
}

function i128ToScVal(value: bigint): xdr.ScVal {
  return nativeToScVal(value, { type: "i128" });
}

export async function getStatus(): Promise<ContractStatus> {
  const result = await callContractView("get_status");
  return {
    owner: result.owner,
    agent: result.agent,
    daily_limit: result.daily_limit.toString(),
    max_tx_value: result.max_tx_value.toString(),
    spent_today: result.spent_today.toString(),
    last_reset: Number(result.last_reset),
    paused: result.paused,
    balance: result.balance.toString(),
    network: config.stellarNetwork,
  };
}

export async function setDailyLimit(amount: bigint) {
  const signer = getKeypair(config.ownerSecretKey);
  return callContractMutate(
    "set_daily_limit",
    signer,
    i128ToScVal(amount)
  );
}

export async function setMaxTx(amount: bigint) {
  const signer = getKeypair(config.ownerSecretKey);
  return callContractMutate("set_max_tx", signer, i128ToScVal(amount));
}

export async function whitelistMerchant(merchantAddress: string) {
  const signer = getKeypair(config.ownerSecretKey);
  return callContractMutate(
    "whitelist_merchant",
    signer,
    addressToScVal(merchantAddress)
  );
}

export async function removeMerchant(merchantAddress: string) {
  const signer = getKeypair(config.ownerSecretKey);
  return callContractMutate(
    "remove_merchant",
    signer,
    addressToScVal(merchantAddress)
  );
}

export async function emergencyPause() {
  const signer = getKeypair(config.ownerSecretKey);
  return callContractMutate("emergency_pause", signer);
}

export async function emergencyUnpause() {
  const signer = getKeypair(config.ownerSecretKey);
  return callContractMutate("emergency_unpause", signer);
}

export async function topUp(amount: bigint) {
  const signer = getKeypair(config.ownerSecretKey);
  return callContractMutate(
    "top_up",
    signer,
    addressToScVal(config.ownerPublicKey),
    i128ToScVal(amount)
  );
}

export async function authorizePayment(price: bigint, merchant: string) {
  const signer = getKeypair(config.agentSecretKey);
  return callContractMutate(
    "authorize_payment",
    signer,
    i128ToScVal(price),
    addressToScVal(merchant)
  );
}
