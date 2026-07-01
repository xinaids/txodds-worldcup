import { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";

const PROGRAM_ID = new PublicKey("9ExbZjAapQww1vfcisDmrngPinHTEfpjYRWMunJgcKaA");
const TOKEN_MINT = new PublicKey("sLX1i9dfmsuyFBmJTWuGjjRmG4VPWYK6dRRKSM4BCSx");

async function main() {
  // Try common PDA seed patterns for treasury
  const seeds = [
    ["token_treasury_pda"],
    ["treasury_pda"],
    ["treasury"],
    ["token_treasury"],
    ["vault_authority"],
  ];

  for (const s of seeds) {
    const [pda] = PublicKey.findProgramAddressSync(
      s.map(x => Buffer.from(x)),
      PROGRAM_ID
    );
    const vault = getAssociatedTokenAddressSync(TOKEN_MINT, pda, true, TOKEN_2022_PROGRAM_ID);
    console.log(`Seeds [${s}]:`);
    console.log(`  PDA:   ${pda.toBase58()}`);
    console.log(`  Vault: ${vault.toBase58()}`);
  }
}
main().catch(console.error);
