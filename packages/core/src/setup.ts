import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import {
  Connection, Keypair, PublicKey, SystemProgram,
  Transaction, TransactionInstruction, sendAndConfirmTransaction
} from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync, createAssociatedTokenAccountIdempotentInstruction
} from "@solana/spl-token";
import axios from "axios";
import nacl from "tweetnacl";
import { logger } from "./logger";

const BASE_URL = "https://txline.txodds.com";
const PROGRAM_ID = new PublicKey("9ExbZjAapQww1vfcisDmrngPinHTEfpjYRWMunJgcKaA");
const SUBSCRIPTION_TOKEN_MINT = new PublicKey("Zhw9TVKp68a1QrftncMSd6ELXKDtpVMNuMGr1jNwdeL");

const [PRICING_MATRIX_PDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("pricing_matrix")], PROGRAM_ID
);
const [TOKEN_TREASURY_PDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("token_treasury_v2")], PROGRAM_ID
);
const TOKEN_TREASURY_VAULT = getAssociatedTokenAddressSync(
  SUBSCRIPTION_TOKEN_MINT, TOKEN_TREASURY_PDA, true, TOKEN_2022_PROGRAM_ID
);

const SUBSCRIBE_DISC = Buffer.from([254, 28, 191, 138, 156, 179, 183, 53]);

function encodeSubscribeArgs(serviceLevelId: number, weeks: number): Buffer {
  const buf = Buffer.alloc(11);
  SUBSCRIBE_DISC.copy(buf, 0);
  buf.writeUInt16LE(serviceLevelId, 8);
  buf.writeUInt8(weeks, 10);
  return buf;
}

async function main() {
  logger.info("Setting up TxLINE credentials (free tier, real-time)...");

  const keypairPath = process.env.WALLET_KEYPAIR_PATH ?? path.join(process.env.HOME ?? "~", ".config/solana/id.json");
  const keypair = Keypair.fromSecretKey(Buffer.from(JSON.parse(fs.readFileSync(keypairPath, "utf-8"))));
  const rpcUrl = process.env.RPC_URL ?? "https://api.mainnet-beta.solana.com";
  const connection = new Connection(rpcUrl, "confirmed");

  logger.info("Fetching guest JWT...");
  const authRes = await axios.post(`${BASE_URL}/auth/guest/start`);
  const jwt: string = authRes.data.token;
  logger.info("JWT obtained");

  const userTokenAccount = getAssociatedTokenAddressSync(
    SUBSCRIPTION_TOKEN_MINT, keypair.publicKey, false, TOKEN_2022_PROGRAM_ID
  );

  logger.info("Addresses", {
    pricingMatrix: PRICING_MATRIX_PDA.toBase58(),
    treasuryPda: TOKEN_TREASURY_PDA.toBase58(),
    treasuryVault: TOKEN_TREASURY_VAULT.toBase58(),
    userAta: userTokenAccount.toBase58(),
  });

  const pdaInfo = await connection.getAccountInfo(TOKEN_TREASURY_PDA);
  const vaultInfo = await connection.getAccountInfo(TOKEN_TREASURY_VAULT);
  logger.info("Treasury status", { pdaExists: !!pdaInfo, vaultExists: !!vaultInfo, pdaOwner: pdaInfo?.owner.toBase58() });

  // If vault exists, treasury is already initialized — just subscribe
  if (!vaultInfo) {
    logger.error("Treasury vault does not exist — cannot subscribe without initialization");
    process.exit(1);
  }

  logger.info("Vault exists — skipping init, going straight to subscribe");

  const instructions: TransactionInstruction[] = [];

  // 1. Create user ATA
  instructions.push(createAssociatedTokenAccountIdempotentInstruction(
    keypair.publicKey, userTokenAccount, keypair.publicKey,
    SUBSCRIPTION_TOKEN_MINT, TOKEN_2022_PROGRAM_ID
  ));

  // 2. Subscribe only
  instructions.push(new TransactionInstruction({
    programId: PROGRAM_ID,
    data: encodeSubscribeArgs(12, 4),
    keys: [
      { pubkey: keypair.publicKey,       isSigner: true,  isWritable: true  },
      { pubkey: PRICING_MATRIX_PDA,      isSigner: false, isWritable: false },
      { pubkey: SUBSCRIPTION_TOKEN_MINT, isSigner: false, isWritable: false },
      { pubkey: userTokenAccount,        isSigner: false, isWritable: true  },
      { pubkey: TOKEN_TREASURY_VAULT,    isSigner: false, isWritable: true  },
      { pubkey: TOKEN_TREASURY_PDA,      isSigner: false, isWritable: false },
      { pubkey: TOKEN_2022_PROGRAM_ID,   isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId,           isSigner: false, isWritable: false },
      { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID,       isSigner: false, isWritable: false },
    ],
  }));

  const { blockhash } = await connection.getLatestBlockhash();
  const tx = new Transaction({ recentBlockhash: blockhash, feePayer: keypair.publicKey });
  tx.add(...instructions);
  tx.sign(keypair);

  logger.info("Simulating...");
  const sim = await connection.simulateTransaction(tx);
  logger.info("Simulation", { err: sim.value.err, logs: sim.value.logs?.slice(-20), units: sim.value.unitsConsumed });

  if (sim.value.err) {
    logger.error("Simulation failed — stopping");
    process.exit(1);
  }

  logger.info("Sending...");
  const txSig = await sendAndConfirmTransaction(connection, tx, [keypair], {
    commitment: "confirmed", skipPreflight: true,
  });
  logger.info("Confirmed", { txSig });

  const messageString = `${txSig}::${jwt}`;
  const message = new TextEncoder().encode(messageString);
  const signatureBytes = nacl.sign.detached(message, keypair.secretKey);
  const walletSignature = Buffer.from(signatureBytes).toString("base64");

  logger.info("Activating API token...");
  const activationRes = await axios.post(
    `${BASE_URL}/api/token/activate`,
    { txSig, walletSignature, leagues: [] },
    { headers: { Authorization: `Bearer ${jwt}` } }
  );
  const apiToken: string = activationRes.data.token ?? activationRes.data;
  logger.info("API token activated");

  const envPath = path.join(__dirname, "../../../.env");
  fs.writeFileSync(envPath, [
    `TXLINE_JWT=${jwt}`,
    `TXLINE_API_TOKEN=${apiToken}`,
    `WALLET_KEYPAIR_PATH=${keypairPath}`,
    `RPC_URL=${rpcUrl}`,
    `LOG_LEVEL=info`,
  ].join("\n"));
  logger.info("Setup complete!", { envPath });
}

main().catch((err) => {
  logger.error("Setup failed", { error: String(err), data: err?.response?.data });
  process.exit(1);
});
