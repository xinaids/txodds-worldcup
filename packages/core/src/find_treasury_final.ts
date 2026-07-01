import { Connection, PublicKey } from "@solana/web3.js";

const PROGRAM_ID = new PublicKey("9ExbZjAapQww1vfcisDmrngPinHTEfpjYRWMunJgcKaA");
const SUBSCRIBE_DISC = Buffer.from([254, 28, 191, 138, 156, 179, 183, 53]);

async function main() {
  const connection = new Connection(
    "https://mainnet.helius-rpc.com/?api-key=02597277-83e9-40a3-98b5-9b088f476f0b"
  );

  // Get ALL signatures for the program (not just transfers)
  const sigs = await connection.getSignaturesForAddress(PROGRAM_ID, { limit: 100 });
  console.log("Total signatures:", sigs.length);

  for (const sig of sigs) {
    try {
      const tx = await connection.getParsedTransaction(sig.signature, { maxSupportedTransactionVersion: 0 });
      if (!tx?.transaction) continue;

      const msg = tx.transaction.message;
      const instructions = "instructions" in msg ? msg.instructions : [];

      for (const ix of instructions) {
        if ("programId" in ix && ix.programId.equals(PROGRAM_ID)) {
          // This is our program instruction — check if it's subscribe
          if ("data" in ix && typeof ix.data === "string") {
            const data = Buffer.from(ix.data, "base64");
            if (data.slice(0, 8).equals(SUBSCRIBE_DISC)) {
              console.log("\n=== FOUND SUBSCRIBE TX ===");
              console.log("Signature:", sig.signature);
              console.log("Block time:", sig.blockTime ? new Date(sig.blockTime * 1000).toISOString() : "unknown");
              console.log("\nAll accounts in order:");
              const keys = "accountKeys" in msg ? msg.accountKeys : [];
              (ix as any).accounts?.forEach((idx: number, i: number) => {
                const key = keys[idx];
                console.log(`  [${i}] ${key.pubkey.toBase58()} ${key.signer ? "(signer)" : ""} ${key.writable ? "(writable)" : ""}`);
              });
              return;
            }
          }
        }
      }
    } catch (e) {
      // skip parse errors
    }
  }
  console.log("No subscribe tx found in last 100 signatures");
}
main().catch(console.error);
