import { Connection, PublicKey } from "@solana/web3.js";

async function main() {
  const connection = new Connection("https://mainnet.helius-rpc.com/?api-key=02597277-83e9-40a3-98b5-9b088f476f0b");
  
  const mint = new PublicKey("sLX1i9dfmsuyFBmJTWuGjjRmG4VPWYK6dRRKSM4BCSx");
  const info = await connection.getAccountInfo(mint);
  
  console.log("Mint owner:", info?.owner.toBase58());
  console.log("Is Tokenkeg (SPL):", info?.owner.toBase58() === "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
  console.log("Is Tokenz (Token-2022):", info?.owner.toBase58() === "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
}
main().catch(console.error);
