import type { Attestation } from "../types";
import type { TranslationKey } from "../i18n";
import { getEventStyle, truncateMiddle } from "../eventStyles";

interface AttestationPanelProps {
  data: Attestation[];
  isLoading: boolean;
  t: (key: TranslationKey) => string;
}

export function AttestationPanel({ data, isLoading, t }: AttestationPanelProps) {
  const attestations = data.slice(0, 8);

  return (
    <div className="rounded-md border border-white/[0.06] bg-term-card p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.15em] text-ink-muted">
          {t("onChain")}
        </h2>
        <span className="font-mono text-[10px] text-brand-amber">
          Solana Mainnet · {attestations.length}
        </span>
      </div>

      {isLoading && attestations.length === 0 && (
        <div className="py-6 text-center text-xs text-ink-muted">Loading…</div>
      )}

      {!isLoading && attestations.length === 0 && (
        <div className="py-6 text-center text-xs text-ink-muted">{t("watching")}</div>
      )}

      <ul className="flex flex-col gap-1.5">
        {attestations.map((a) => {
          const style = getEventStyle(a.eventType);
          return (
            <li
              key={a.txSig ?? `${a.fixtureId}-${a.detectedAt}`}
              className="flex items-center justify-between gap-2 rounded border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 font-mono text-[11px]"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold ${style.bg} ${style.text}`}>
                  [{style.shortLabel}]
                </span>
                <span className="truncate text-ink">{a.fixture}</span>
                <span className="shrink-0 text-ink-muted">conf:{a.confidence}</span>
              </div>
              {a.explorerUrl ? (
                <a
                  href={a.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-brand-blue transition-colors hover:text-brand-green"
                  title={a.txSig}
                >
                  {truncateMiddle(a.txSig ?? "", 4, 4)} ↗
                </a>
              ) : (
                <span className="shrink-0 text-ink-muted">pending</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
