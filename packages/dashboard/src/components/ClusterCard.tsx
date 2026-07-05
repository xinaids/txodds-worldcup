import type { ClusterDTO, EventType } from "../types";
import type { TranslationKey } from "../i18n";
import { formatClock, getEventStyle } from "../eventStyles";

const MAX_OBSERVED_SHIFT = 83.3;

interface ClusterCardProps {
  cluster: ClusterDTO;
  isNew?: boolean;
  dimmed?: boolean;
  compact?: boolean;
  t: (key: TranslationKey) => string;
}

function isMuted(eventType: EventType): boolean {
  return eventType === "ODDS_DRIFT" || eventType === "UNKNOWN";
}

function getCardClass(eventType: EventType): string {
  switch (eventType) {
    case "GOAL":
      return "border-l-4 border-brand-green bg-brand-green/5 py-3";
    case "RED_CARD":
      return "border-l-4 border-brand-red bg-brand-red/5 py-3";
    case "PENALTY_AWARDED":
      return "border-l-4 border-brand-amber bg-brand-amber/5 py-3";
    default:
      return "border-l-4 border-transparent bg-transparent opacity-60 py-2";
  }
}

function getShiftColor(eventType: EventType, maxShift: number): string {
  if (eventType === "RED_CARD") return "text-brand-red";
  if (eventType === "PENALTY_AWARDED") return "text-brand-amber";
  if (eventType === "GOAL" || maxShift >= 30) return "text-brand-green";
  return "text-ink-muted";
}

export function ClusterCard({ cluster, isNew, dimmed, compact, t }: ClusterCardProps) {
  const style = getEventStyle(cluster.eventType);
  const muted = isMuted(cluster.eventType);
  const isOddsDrift = cluster.eventType === "ODDS_DRIFT";
  const intensity = Math.min(100, (cluster.maxShift / MAX_OBSERVED_SHIFT) * 100);

  return (
    <div
      className={`relative min-h-fit rounded-md ${getCardClass(cluster.eventType)} ${
        muted ? "" : style.glow
      } flex flex-col gap-1.5 ${compact ? "px-3 py-2.5" : "px-4"} mb-1.5 ${
        isNew ? "animate-slideInFromTop" : ""
      } ${dimmed ? "scale-[0.98] opacity-50" : ""}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`} />
          <span
            className={`shrink-0 whitespace-nowrap font-bold uppercase tracking-[0.1em] ${
              compact ? "text-[10px]" : "text-xs"
            } ${style.text}`}
          >
            {style.label}
          </span>
          {cluster.marketsAgreeing > 1 && (
            <span className="shrink-0 whitespace-nowrap rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px] text-ink-muted">
              {cluster.marketsAgreeing} {t("marketsAgree")}
            </span>
          )}
        </div>
        <span className="shrink-0 font-mono text-[11px] text-white/30" title={cluster.detectedAt}>
          {formatClock(cluster.detectedAt)}
        </span>
      </div>

      <div className="block w-full break-words text-sm font-medium text-white">{cluster.fixture}</div>

      {!isOddsDrift && (
        <>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span
              className={`font-mono font-bold ${compact ? "text-lg" : "text-xl"} ${getShiftColor(
                cluster.eventType,
                cluster.maxShift
              )}`}
            >
              ↑ {cluster.maxShift.toFixed(1)}%
            </span>
            <span className="font-mono text-xs text-white/40">
              {t("conf")}:{cluster.confidence}
              {!compact && ` · ${cluster.signalCount} ${t("signals")}`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/5">
              <div
                className={`h-full rounded-full ${style.dot} transition-[width] duration-[400ms] ease-out`}
                style={{ width: `${intensity}%` }}
              />
            </div>
            <span className="w-20 shrink-0 text-right font-mono text-[10px] text-ink-muted">
              {intensity.toFixed(0)}% {t("intensity")}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
