import { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";

const PROGRAM_ID = new PublicKey("9ExbZjAapQww1vfcisDmrngPinHTEfpjYRWMunJgcKaA");
const TOKEN_MINT = new PublicKey("sLX1i9dfmsuyFBmJTWuGjjRmG4VPWYK6dRRKSM4BCSx");

const seeds = [
  "token_treasury_v2",
  "token_treasury",
  "treasury_v2",
  "treasury",
  "vault",
  "token_vault",
  "txl_treasury",
  "subscription_treasury",
];

async function main() {
  const connection = new Connection(
    "https://mainnet.helius-rpc.com/?api-key=02597277-83e9-40a3-98b5-9b088f476f0b"
  );

  for (const seed of seeds) {
    const [pda] = PublicKey.findProgramAddressSync([Buffer.from(seed)], PROGRAM_ID);
    const vault = getAssociatedTokenAddressSync(TOKEN_MINT, pda, true, TOKEN_2022_PROGRAM_ID);
    const pdaInfo = await connection.getAccountInfo(pda);
    const vaultInfo = await connection.getAccountInfo(vault);
    if (pdaInfo || vaultInfo) {
      console.log(`✓ FOUND seed="${seed}"`);
      console.log(`  PDA:   ${pda.toBase58()} → ${pdaInfo ? "EXISTS" : "not found"}`);
      console.log(`  Vault: ${vault.toBase58()} → ${vaultInfo ? "EXISTS" : "not found"}`);
    } else {
      console.log(`✗ seed="${seed}" — neither exists`);
    }
  }
}
main().catch(console.error);
