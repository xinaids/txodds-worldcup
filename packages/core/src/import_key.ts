import { Keypair } from "@solana/web3.js";
import fs from "fs";

const bs58alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function decode(str: string): Buffer {
  const base = bs58alphabet.length;
  const bytes = [0];
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (!bs58alphabet.includes(c)) continue;
    let carry = bs58alphabet.indexOf(c);
    for (let j = 0; j < bytes.length; j++) {
      carry += bytes[j] * base;
      bytes[j] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  for (let i = 0; i < str.length && str[i] === "1"; i++) {
    bytes.push(0);
  }
  return Buffer.from(bytes.reverse());
}

const base58Key = fs.readFileSync("/tmp/phantom_key.txt", "utf-8").trim();
const secretKey = decode(base58Key);
const keypair = Keypair.fromSecretKey(secretKey);

fs.writeFileSync(
  process.env.HOME + "/.config/solana/id.json",
  JSON.stringify(Array.from(secretKey))
);

console.log("Address:", keypair.publicKey.toBase58());
console.log("Done - agora verifica:");
console.log("solana balance --keypair ~/.config/solana/id.json --url mainnet-beta");
