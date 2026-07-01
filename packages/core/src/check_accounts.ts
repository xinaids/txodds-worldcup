import { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";

const PROGRAM_ID = new PublicKey("9ExbZjAapQww1vfcisDmrngPinHTEfpjYRWMunJgcKaA");
const TOKEN_MINT = new PublicKey("sLX1i9dfmsuyFBmJTWuGjjRmG4VPWYK6dRRKSM4BCSx");

const [PRICING_MATRIX_PDA] = PublicKey.findProgramAddressSync([Buffer.from("pricing_matrix")], PROGRAM_ID);
const [TOKEN_TREASURY_PDA] = PublicKey.findProgramAddressSync([Buffer.from("token_treasury_v2")], PROGRAM_ID);
const TOKEN_TREASURY_VAULT = getAssociatedTokenAddressSync(TOKEN_MINT, TOKEN_TREASURY_PDA, true, TOKEN_2022_PROGRAM_ID);

async function check(connection: Connection, label: string, pubkey: PublicKey) {
  const info = await connection.getAccountInfo(pubkey);
  console.log(`${label}: ${pubkey.toBase58()} → ${info ? "EXISTS ("+info.data.length+" bytes)" : "NOT FOUND"}`);
}

async function main() {
  const connection = new Connection(
    "https://mainnet.helius-rpc.com/?api-key=02597277-83e9-40a3-98b5-9b088f476f0b"
  );
  await check(connection, "PRICING_MATRIX_PDA ", PRICING_MATRIX_PDA);
  await check(connection, "TOKEN_TREASURY_PDA  ", TOKEN_TREASURY_PDA);
  await check(connection, "TOKEN_TREASURY_VAULT", TOKEN_TREASURY_VAULT);
}
main().catch(console.error);
