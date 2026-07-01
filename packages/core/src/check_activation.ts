import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { Keypair } from "@solana/web3.js";
import axios from "axios";
import nacl from "tweetnacl";
import { logger } from "./logger";

const BASE_URL = "https://txline.txodds.com";

async function main() {
  const keypairPath = process.env.WALLET_KEYPAIR_PATH ?? path.join(process.env.HOME ?? "~", ".config/solana/id.json");
  const keypair = Keypair.fromSecretKey(Buffer.from(JSON.parse(fs.readFileSync(keypairPath, "utf-8"))));

  // Get fresh JWT
  const authRes = await axios.post(`${BASE_URL}/auth/guest/start`);
  const jwt: string = authRes.data.token;
  logger.info("JWT obtained");

  // Try to check token status
  const apiToken = process.env.TXLINE_API_TOKEN!;
  logger.info("Checking token validity...");
  
  try {
    const checkRes = await axios.get(`${BASE_URL}/api/token/status`, {
      headers: { Authorization: `Bearer ${apiToken}` }
    });
    logger.info("Token status response", { status: checkRes.status, data: checkRes.data });
  } catch (e: any) {
    logger.info("Status check failed", { status: e.response?.status, data: e.response?.data });
  }

  // Try to use JWT directly (guest access)
  logger.info("Trying guest access with JWT...");
  try {
    const fixturesRes = await axios.get(`${BASE_URL}/api/fixtures?limit=1`, {
      headers: { Authorization: `Bearer ${jwt}` }
    });
    logger.info("Guest fixtures OK", { data: JSON.stringify(fixturesRes.data).slice(0, 200) });
  } catch (e: any) {
    logger.info("Guest fixtures failed", { status: e.response?.status });
  }
}

main().catch(console.error);
