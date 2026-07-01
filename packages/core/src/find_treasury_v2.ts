import { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";

const PROGRAM_ID = new PublicKey("9ExbZjAapQww1vfcisDmrngPinHTEfpjYRWMunJgcKaA");
const TOKEN_MINT = new PublicKey("sLX1i9dfmsuyFBmJTWuGjjRmG4VPWYK6dRRKSM4BCSx");

// Common seeds Anchor uses for treasury PDAs
const seedCombos = [
  ["treasury"],
  ["token_treasury"],
  ["treasury_pda"],
  ["treasury_signer"],
  ["vault_authority"],
  ["token_vault_authority"],
  ["subscription_treasury"],
  ["subscription_vault"],
  ["subscription"],
  ["token"],
];

async function main() {
  const connection = new Connection(
    "https://mainnet.helius-rpc.com/?api-key=02597277-83e9-40a3-98b5-9b088f476f0b"
  );

  for (const seeds of seedCombos) {
    const [pda] = PublicKey.findProgramAddressSync(
      seeds.map(s => Buffer.from(s)),
      PROGRAM_ID
    );
    const info = await connection.getAccountInfo(pda);
    const owner = info?.owner.toBase58() || "N/A";
    const isSystem = owner === "11111111111111111111111111111111";
    
    if (info) {
      // Check if it has an associated token account
      const ata = getAssociatedTokenAddressSync(TOKEN_MINT, pda, true, TOKEN_PROGRAM_ID);
      const ataInfo = await connection.getAccountInfo(ata);
      
      console.log(`✓ seeds=[${seeds}] SYSTEM_OWNED=${isSystem}`);
      console.log(`  PDA: ${pda.toBase58()} owner=${owner}`);
      if (ataInfo) console.log(`  ATA: ${ata.toBase58()} EXISTS`);
      else console.log(`  ATA: ${ata.toBase58()} NOT FOUND`);
    }
  }
}
main().catch(console.error);
