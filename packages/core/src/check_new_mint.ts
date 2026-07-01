import { Connection, PublicKey } from "@solana/web3.js";

async function main() {
  const connection = new Connection("https://mainnet.helius-rpc.com/?api-key=02597277-83e9-40a3-98b5-9b088f476f0b");
  const mint = new PublicKey("Zhw9TVKp68a1QrftncMSd6ELXKDtpVMNuMGr1jNwdeL");
  const info = await connection.getAccountInfo(mint);
  console.log("New mint owner:", info?.owner.toBase58());
  console.log("Is Token-2022:", info?.owner.toBase58() === "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
}
main().catch(console.error);
