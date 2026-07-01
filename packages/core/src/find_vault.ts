import { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

const TOKEN_MINT = new PublicKey("sLX1i9dfmsuyFBmJTWuGjjRmG4VPWYK6dRRKSM4BCSx");
const TREASURY_PDA = new PublicKey("2oerdMyJXg2CHZ9n2NDVhf3JjJNE8QVDsa7PFpABsAmD");

async function main() {
  const connection = new Connection(
    "https://mainnet.helius-rpc.com/?api-key=02597277-83e9-40a3-98b5-9b088f476f0b"
  );

  // Find all token accounts owned by the treasury PDA
  const accounts = await connection.getTokenAccountsByOwner(TREASURY_PDA, {
    mint: TOKEN_MINT,
    programId: TOKEN_2022_PROGRAM_ID,
  });

  console.log("Token accounts owned by treasury PDA:", accounts.value.length);
  for (const a of accounts.value) {
    console.log(" ", a.pubkey.toBase58());
  }

  // Also try standard token program
  const { TOKEN_PROGRAM_ID } = await import("@solana/spl-token");
  const accounts2 = await connection.getTokenAccountsByOwner(TREASURY_PDA, {
    mint: TOKEN_MINT,
    programId: TOKEN_PROGRAM_ID,
  });
  console.log("Token accounts (SPL):", accounts2.value.length);
  for (const a of accounts2.value) {
    console.log(" ", a.pubkey.toBase58());
  }
}
main().catch(console.error);
