// One-off test: call set_daily_limit($100) locally against testnet
// to see if auth works end-to-end (separates Railway env drift from
// code bugs in auth signing).
import { setDailyLimit, getStatus } from "../src/stellar/contract.js";

async function main() {
  const status = await getStatus();
  console.log("Contract owner:", status.owner);

  try {
    const result = await setDailyLimit(BigInt(1000000000));
    console.log("SUCCESS tx:", result.hash);
  } catch (e) {
    console.error("FAILED:", e.message);
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
