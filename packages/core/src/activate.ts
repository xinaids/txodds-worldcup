import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { Keypair, Connection } from "@solana/web3.js";
import axios from "axios";
import nacl from "tweetnacl";
import { logger } from "./logger";

const BASE_URL = "https://txline.txodds.com";

async function main() {
  const keypairPath = process.env.WALLET_KEYPAIR_PATH ?? path.join(process.env.HOME ?? "~", ".config/solana/id.json");
  const keypair = Keypair.fromSecretKey(Buffer.from(JSON.parse(fs.readFileSync(keypairPath, "utf-8"))));

  // Get fresh JWT
  logger.info("Getting fresh JWT...");
  const authRes = await axios.post(`${BASE_URL}/auth/guest/start`);
  const jwt: string = authRes.data.token;
  logger.info("JWT obtained");

  const txSig = process.env.TX_SIG!;
  const leagues: number[] = [];

  // Correct message format: txSig:leagues:jwt
  const messageString = `${txSig}:${leagues.join(",")}:${jwt}`;
  logger.info("Signing message", { messageString: messageString.slice(0, 50) + "..." });
  
  const message = new TextEncoder().encode(messageString);
  const signatureBytes = nacl.sign.detached(message, keypair.secretKey);
  const walletSignature = Buffer.from(signatureBytes).toString("base64");

  logger.info("Activating API token...");
  const activationRes = await axios.post(
    `${BASE_URL}/api/token/activate`,
    { txSig, walletSignature, leagues },
    { headers: { Authorization: `Bearer ${jwt}` } }
  );
  const apiToken: string = activationRes.data.token ?? activationRes.data;
  logger.info("New API token activated", { token: apiToken.slice(0, 30) + "..." });

  // Update .env
  const envPath = path.join(__dirname, "../../../.env");
  const env = fs.readFileSync(envPath, "utf-8");
  const updated = env.replace(/TXLINE_API_TOKEN=.*/, `TXLINE_API_TOKEN=${apiToken}`);
  fs.writeFileSync(envPath, updated);
  logger.info(".env updated with new token");
}

main().catch((err) => {
  logger.error("Activation failed", { error: String(err), data: err?.response?.data });
  process.exit(1);
});
