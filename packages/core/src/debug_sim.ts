import { Connection, Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";
import * as fs from "fs";
import * as path from "path";

const PROGRAM_ID = new PublicKey("9ExbZjAapQww1vfcisDmrngPinHTEfpjYRWMunJgcKaA");
const TOKEN_MINT  = new PublicKey("sLX1i9dfmsuyFBmJTWuGjjRmG4VPWYK6dRRKSM4BCSx");
const [PRICING_MATRIX_PDA] = PublicKey.findProgramAddressSync([Buffer.from("pricing_matrix")], PROGRAM_ID);
const [TOKEN_TREASURY_PDA]  = PublicKey.findProgramAddressSync([Buffer.from("token_treasury")], PROGRAM_ID);
const SUBSCRIBE_DISC = Buffer.from([254, 28, 191, 138, 156, 179, 183, 53]);

async function main() {
  const keypairPath = path.join(process.env.HOME ?? "~", ".config/solana/id.json");
  const keypair = Keypair.fromSecretKey(Buffer.from(JSON.parse(fs.readFileSync(keypairPath, "utf-8"))));
  const connection = new Connection("https://mainnet.helius-rpc.com/?api-key=02597277-83e9-40a3-98b5-9b088f476f0b", "confirmed");

  const userAta = getAssociatedTokenAddressSync(TOKEN_MINT, keypair.publicKey, false, TOKEN_2022_PROGRAM_ID);

  // Check each account individually
  const accounts = {
    user: keypair.publicKey,
    pricingMatrix: PRICING_MATRIX_PDA,
    tokenMint: TOKEN_MINT,
    userAta,
    treasuryVault: TOKEN_TREASURY_PDA,
    treasuryPda: TOKEN_TREASURY_PDA,
    token2022: TOKEN_2022_PROGRAM_ID,
    system: SystemProgram.programId,
    ata: ASSOCIATED_TOKEN_PROGRAM_ID,
  };

  console.log("Checking each account:");
  for (const [name, pubkey] of Object.entries(accounts)) {
    const info = await connection.getAccountInfo(pubkey);
    console.log(`  ${name}: ${info ? "EXISTS" : "NOT FOUND"} — ${pubkey.toBase58()}`);
  }
}
main().catch(console.error);
