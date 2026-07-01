import { Connection, PublicKey } from "@solana/web3.js";

const PROGRAM_ID = new PublicKey("9ExbZjAapQww1vfcisDmrngPinHTEfpjYRWMunJgcKaA");

async function main() {
  const connection = new Connection("https://api.mainnet-beta.solana.com");
  const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
    dataSlice: { offset: 0, length: 8 }
  });
  console.log("Total contas:", accounts.length);
  for (const a of accounts) {
    const disc = Array.from(a.account.data);
    console.log(a.pubkey.toBase58(), disc);
  }
}
main().catch(console.error);
