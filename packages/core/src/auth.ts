import axios from "axios";
import nacl from "tweetnacl";
import * as anchor from "@coral-xyz/anchor";
import {
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import type { GuestAuthResponse, ActivationResponse } from "./types";

const BASE_URL = "https://txline.txodds.com";

const PROGRAM_ID = new PublicKey("9ExbZjAapQww1vfcisDmrngPinHTEfpjYRWMunJgcKaA");
const TOKEN_MINT = new PublicKey("sLX1i9dfmsuyFBmJTWuGjjRmG4VPWYK6dRRKSM4BCSx");

export const PRICING_MATRIX_PDA = PublicKey.findProgramAddressSync(
  [Buffer.from("pricing_matrix")], PROGRAM_ID)[0];

export const TOKEN_TREASURY_PDA = PublicKey.findProgramAddressSync(
  [Buffer.from("token_treasury_v2")], PROGRAM_ID)[0];

export const TOKEN_TREASURY_VAULT = getAssociatedTokenAddressSync(
  TOKEN_MINT, TOKEN_TREASURY_PDA, true, TOKEN_2022_PROGRAM_ID);

export async function getGuestJwt(): Promise<string> {
  const res = await axios.post<GuestAuthResponse>(`${BASE_URL}/auth/guest/start`);
  return res.data.token;
}

export async function subscribeFree(
  provider: anchor.AnchorProvider,
  idl: anchor.Idl,
  serviceLevelId: 1 | 12 = 12,
  durationWeeks: number = 4
): Promise<string> {
  const program = new anchor.Program(idl, provider);
  const userTokenAccount = getAssociatedTokenAddressSync(
    TOKEN_MINT, provider.wallet.publicKey, false, TOKEN_2022_PROGRAM_ID);

  return await (program.methods as any)
    .subscribe(serviceLevelId, durationWeeks)
    .accounts({
      user: provider.wallet.publicKey,
      pricingMatrix: PRICING_MATRIX_PDA,
      tokenMint: TOKEN_MINT,
      userTokenAccount,
      tokenTreasuryVault: TOKEN_TREASURY_VAULT,
      tokenTreasuryPda: TOKEN_TREASURY_PDA,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
}

export async function activateApiToken(
  provider: anchor.AnchorProvider,
  txSig: string,
  jwt: string,
  leagues: number[] = []
): Promise<string> {
  const messageString = `${txSig}:${leagues.join(",")}:${jwt}`;
  const message = new TextEncoder().encode(messageString);
  const keypair = (provider.wallet as any).payer as anchor.web3.Keypair;
  const signatureBytes = nacl.sign.detached(message, keypair.secretKey);
  const walletSignature = Buffer.from(signatureBytes).toString("base64");

  const res = await axios.post<ActivationResponse>(
    `${BASE_URL}/api/token/activate`,
    { txSig, walletSignature, leagues },
    { headers: { Authorization: `Bearer ${jwt}` } }
  );
  return res.data.token;
}
