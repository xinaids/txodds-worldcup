import { Connection, PublicKey } from "@solana/web3.js";

const PROGRAM_ID = new PublicKey("9ExbZjAapQww1vfcisDmrngPinHTEfpjYRWMunJgcKaA");

async function main() {
  const connection = new Connection(
    "https://mainnet.helius-rpc.com/?api-key=02597277-83e9-40a3-98b5-9b088f476f0b"
  );

  // Get ALL program accounts (no discriminator filter)
  const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
    dataSlice: { offset: 0, length: 8 }
  });

  console.log("Total accounts:", accounts.length);

  // Group by owner
  const byOwner: Record<string, string[]> = {};
  for (const a of accounts) {
    const info = await connection.getAccountInfo(a.pubkey);
    const owner = info?.owner.toBase58() || "unknown";
    if (!byOwner[owner]) byOwner[owner] = [];
    byOwner[owner].push(a.pubkey.toBase58());
  }

  console.log("\nAccounts by owner:");
  for (const [owner, pubs] of Object.entries(byOwner)) {
    const isSystem = owner === "11111111111111111111111111111111";
    console.log(`\n${isSystem ? "✅ SYSTEM" : "❌ " + owner}:`);
    pubs.forEach(p => console.log(`  - ${p}`));
    if (isSystem && pubs.length > 0) {
      console.log("  ^^^ ESSAS são as PDAs que o programa usa como signer!");
    }
  }
}
main().catch(console.error);
