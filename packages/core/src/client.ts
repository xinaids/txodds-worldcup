import axios, { AxiosInstance } from "axios";
import type { Fixture, OddsSnapshot, ScoreSnapshot, ScoreUpdate, OddsUpdate } from "./types";

const BASE_URL = "https://txline.txodds.com";

export function createHttpClient(jwt: string, apiToken: string): AxiosInstance {
  return axios.create({
    baseURL: BASE_URL,
    timeout: 30_000,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${jwt}`,
      "X-Api-Token": apiToken,
    },
  });
}

export const WORLD_CUP_COMPETITION_ID = 72;

export async function getFixtures(client: AxiosInstance, competitionId?: number): Promise<Fixture[]> {
  const res = await client.get<Fixture[]>("/api/fixtures/snapshot", {
    params: competitionId ? { competitionId } : undefined,
  });
  return res.data;
}

export async function getOddsSnapshot(client: AxiosInstance, fixtureId: number): Promise<OddsSnapshot[]> {
  const res = await client.get<OddsSnapshot[]>(`/api/odds/snapshot/${fixtureId}`);
  return res.data;
}

export async function getScoresSnapshot(client: AxiosInstance, fixtureId: number): Promise<ScoreSnapshot[]> {
  const res = await client.get<ScoreSnapshot[]>(`/api/scores/snapshot/${fixtureId}`);
  return res.data;
}

/** Full score event log for a completed fixture — used by the backtester */
export async function getScoreUpdates(client: AxiosInstance, fixtureId: number): Promise<ScoreUpdate[]> {
  const res = await client.get<ScoreUpdate[]>(`/api/scores/updates/${fixtureId}`);
  return res.data;
}
