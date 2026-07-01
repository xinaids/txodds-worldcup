const DEDUP_WINDOW_MS = 5_000;
const seen = new Map<string, number>();

export function isDuplicate(
  fixtureId: number,
  market: string,
  marketLine: string,
  p1: number,
  p2: number
): boolean {
  const key = `${fixtureId}:${market}:${marketLine}:${p1.toFixed(2)}:${p2.toFixed(2)}`;
  const now = Date.now();
  const last = seen.get(key);
  if (last && now - last < DEDUP_WINDOW_MS) return true;
  seen.set(key, now);
  return false;
}

setInterval(() => {
  const cutoff = Date.now() - DEDUP_WINDOW_MS * 10;
  for (const [key, ts] of seen.entries()) {
    if (ts < cutoff) seen.delete(key);
  }
}, 60_000);
