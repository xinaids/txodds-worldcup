export interface RawOddsUpdate {
  FixtureId: number;
  MessageId: string;
  Ts: number;
  SuperOddsType: string;
  MarketParameters: string | null;
  PriceNames: string[];
  Prices: number[];
  InRunning: boolean;
}

import type { OddsUpdate } from "./types";

export function rawToOddsUpdate(raw: RawOddsUpdate): OddsUpdate | null {
  if (!raw.Prices || raw.Prices.length < 2) return null;
  // Prices are in implied format *1000 (e.g. 2000 = 2.000 decimal)
  const p1 = raw.Prices[0] / 1000;
  const p2 = raw.Prices[raw.Prices.length - 1] / 1000;
  const draw = raw.Prices.length === 3 ? raw.Prices[1] / 1000 : undefined;
  return {
    messageId: raw.MessageId,
    fixtureId: raw.FixtureId,
    timestamp: new Date(raw.Ts).toISOString(),
    market: raw.SuperOddsType,
    marketLine: raw.MarketParameters ?? "",
    participant1Odds: p1,
    participant2Odds: p2,
    drawOdds: draw,
  };
}

const BASE_URL = "https://txline.txodds.com";

const RECONNECT_BASE_MS = 2_000;
const RECONNECT_MAX_MS = 30_000;
const MAX_RECONNECT_ATTEMPTS = 20;

type StreamHandlers<T> = {
  onMessage: (event: { data: T; raw: string }) => void;
  onError?: (err: Error) => void;
  onReconnect?: (attempt: number) => void;
};

function openStream<T>(
  url: string,
  jwt: string,
  apiToken: string,
  handlers: StreamHandlers<T>,
  transform?: (raw: any) => T | null
): { stop: () => void } {
  let stopped = false;
  let attempt = 0;

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  const connect = async () => {
    if (stopped) return;
    attempt++;
    if (attempt > 1) {
      const backoff = Math.min(RECONNECT_BASE_MS * 2 ** (attempt - 2), RECONNECT_MAX_MS);
      handlers.onReconnect?.(attempt);
      await delay(backoff);
    }
    if (attempt > MAX_RECONNECT_ATTEMPTS) {
      handlers.onError?.(new Error(`Max reconnect attempts reached`));
      return;
    }

    try {
      const res = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${jwt}`,
          "X-Api-Token": apiToken,
          "Accept": "text/event-stream",
          "Cache-Control": "no-cache",
        },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (!res.body) throw new Error("No body");

      attempt = 0;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done || stopped) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          try {
            const rawObj = JSON.parse(line.substring(6));
            const data = transform ? transform(rawObj) : rawObj as T;
            if (data !== null) handlers.onMessage({ data, raw: line });
          } catch {}
        }
      }
      reader.releaseLock();
    } catch (err: any) {
      if (stopped) return;
      handlers.onError?.(err instanceof Error ? err : new Error(String(err)));
      connect();
    }
  };

  connect();
  return { stop: () => { stopped = true; } };
}

import type { ScoreUpdate } from "./types";

export function streamOdds(
  jwt: string,
  apiToken: string,
  handlers: StreamHandlers<OddsUpdate>
) {
  return openStream<OddsUpdate>(
    `${BASE_URL}/api/odds/stream`,
    jwt, apiToken, handlers,
    (raw: RawOddsUpdate) => rawToOddsUpdate(raw)
  );
}

export function streamScores(
  jwt: string,
  apiToken: string,
  handlers: StreamHandlers<ScoreUpdate>
) {
  return openStream<ScoreUpdate>(
    `${BASE_URL}/api/scores/stream`,
    jwt, apiToken, handlers
  );
}
