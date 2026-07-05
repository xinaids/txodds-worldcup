import type { ClusterDTO } from "../types";
import type { TranslationKey } from "../i18n";
import { getEventStyle } from "../eventStyles";

const TICKER_SIZE = 30;

interface TickerTapeProps {
  clusters: ClusterDTO[];
  t: (key: TranslationKey) => string;
  compact?: boolean;
}

export function TickerTape({ clusters, t, compact }: TickerTapeProps) {
  const items = clusters.slice(0, TICKER_SIZE);

  if (items.length === 0) {
    return (
      <div className="h-8 border-y border-white/[0.06] bg-term-card/60 px-4 py-1.5 font-mono text-xs text-ink-muted">
        {t("watching")}
      </div>
    );
  }

  return (
    <div className="relative h-8 overflow-hidden border-y border-white/[0.06] bg-term-card/60">
      <div className="absolute inset-y-0 flex w-max animate-marquee items-center whitespace-nowrap py-1.5">
        <TickerItems clusters={items} t={t} compact={compact} />
        <TickerItems clusters={items} t={t} compact={compact} hidden />
      </div>
    </div>
  );
}

function TickerItems({
  clusters,
  t,
  compact,
  hidden,
}: {
  clusters: ClusterDTO[];
  t: (key: TranslationKey) => string;
  compact?: boolean;
  hidden?: boolean;
}) {
  return (
    <div className="flex items-center" aria-hidden={hidden || undefined}>
      {clusters.map((c, idx) => {
        const style = getEventStyle(c.eventType);
        return (
          <span
            key={`${c.fixtureId}-${c.detectedAt}-${idx}`}
            className={`flex items-center gap-2 px-3 font-mono ${compact ? "text-[11px]" : "text-xs"}`}
          >
            <span className={`font-bold ${style.text}`}>{style.label}</span>
            <span className="text-ink">{c.fixture}</span>
            <span className={style.text}>↑{c.maxShift.toFixed(1)}%</span>
            <span className="text-ink-muted">
              {t("conf")}:{c.confidence}
            </span>
            <span className="text-ink-muted/50">·</span>
          </span>
        );
      })}
    </div>
  );
}
