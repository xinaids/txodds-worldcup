import { api } from "../api";
import { usePolling } from "../usePolling";
import { formatRelativeTime, getEventStyle, truncateMiddle } from "../eventStyles";

const POLL_INTERVAL_MS = 8_000;

export function AttestationPanel() {
  const { data, isLoading } = usePolling(() => api.attestations(), POLL_INTERVAL_MS);
  const attestations = data?.data ?? [];

  return (
    <div className="rounded-2xl border border-cream-300 bg-white/70 p-5">
      <div className="mb-1 flex items-center gap-2">
        <h2 className="text-sm font-semibold text-ink-900">On-Chain Attestations</h2>
        <span className="rounded-full bg-coral-500/10 px-2 py-0.5 text-[11px] font-semibold text-coral-600">
          Solana mainnet
        </span>
      </div>
      <p className="mb-4 text-xs leading-relaxed text-ink-800/50">
        High-confidence detections (≥90) are hashed and written on-chain via the Memo
        program — a timestamp and commitment independent of our own server.
      </p>

      {isLoading && attestations.length === 0 && (
        <div className="py-6 text-center text-xs text-ink-800/30">Loading…</div>
      )}

      {!isLoading && attestations.length === 0 && (
        <div className="py-6 text-center text-xs text-ink-800/30">
          No attestations yet — waiting for a confidence ≥ 90 event.
        </div>
      )}

      <ul className="flex flex-col gap-2">
        {attestations.slice(0, 8).map((a) => {
          const style = getEventStyle(a.eventType);
          return (
            <li
              key={a.txSig ?? `${a.fixtureId}-${a.detectedAt}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-cream-300 bg-cream-50 px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${style.bg} ${style.text}`}>
                    {style.label}
                  </span>
                  <span className="truncate text-xs font-medium text-ink-900">
                    {a.fixture}
                  </span>
                </div>
                <div className="mt-0.5 font-mono text-[11px] text-ink-800/40">
                  conf {a.confidence} · {formatRelativeTime(a.detectedAt)}
                </div>
              </div>
              {a.explorerUrl ? (
                <a
                  href={a.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 rounded-md border border-coral-500/30 px-2 py-1 font-mono text-[10px] font-medium text-coral-600 transition-colors hover:bg-coral-500/10"
                  title={a.txSig}
                >
                  {truncateMiddle(a.txSig ?? "", 4, 4)} ↗
                </a>
              ) : (
                <span className="text-[10px] text-ink-800/30">pending</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
