import { Connection, PublicKey } from "@solana/web3.js";

const PROGRAM_ID = new PublicKey("9ExbZjAapQww1vfcisDmrngPinHTEfpjYRWMunJgcKaA");

// Test all combinations
const seeds = [
  "token_treasury_v2",
  "token_treasury_vault",
  "treasury_v2",
  "token-treasury-v2",
  "token_treasury_pda",
  "treasury_pda_v2",
];

async function main() {
  const connection = new Connection("https://mainnet.helius-rpc.com/?api-key=02597277-83e9-40a3-98b5-9b088f476f0b");

  for (const seed of seeds) {
    const [pda] = PublicKey.findProgramAddressSync([Buffer.from(seed)], PROGRAM_ID);
    const info = await connection.getAccountInfo(pda);
    const owner = info?.owner.toBase58() || "N/A";
    const isSystem = owner === "11111111111111111111111111111111";
    const dataLen = info?.data.length || 0;
    
    console.log(`seed="${seed}"`);
    console.log(`  PDA: ${pda.toBase58()}`);
    console.log(`  Exists: ${!!info}, Owner: ${owner}, DataLen: ${dataLen}, IsSystem: ${isSystem}`);
    if (isSystem) console.log(`  ✅ SYSTEM OWNED — THIS IS THE ONE!`);
    console.log();
  }
}
main().catch(console.error);
