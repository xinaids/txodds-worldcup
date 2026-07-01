import { Connection, PublicKey } from "@solana/web3.js";

const TOKEN_MINT = new PublicKey("sLX1i9dfmsuyFBmJTWuGjjRmG4VPWYK6dRRKSM4BCSx");

async function main() {
  const connection = new Connection(
    "https://mainnet.helius-rpc.com/?api-key=02597277-83e9-40a3-98b5-9b088f476f0b"
  );
  const info = await connection.getAccountInfo(TOKEN_MINT);
  console.log("Owner (program):", info?.owner.toBase58());
  
  // Token Program original = TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA
  // Token-2022 = TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb
}
main().catch(console.error);
