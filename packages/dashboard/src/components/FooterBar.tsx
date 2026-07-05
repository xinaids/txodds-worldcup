import type { TranslationKey } from "../i18n";
import { formatUptime } from "../eventStyles";

interface FooterBarProps {
  totalSignals: number;
  matchesCovered: number;
  goalsDetected: number;
  attestationCount: number;
  isLive: boolean;
  t: (key: TranslationKey) => string;
}

export function FooterBar({
  totalSignals,
  matchesCovered,
  goalsDetected,
  attestationCount,
  isLive,
  t,
}: FooterBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-white/[0.06] bg-term-card/95 px-4 py-2 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] text-ink-muted">
        <span className="font-bold text-ink">⬡ Dale · {t("appTagline")}</span>
        <span>│</span>
        <span className="uppercase">
          <span className="font-bold text-ink">{totalSignals.toLocaleString()}</span>{" "}
          {t("totalSignals")}
        </span>
        <span>│</span>
        <span className="uppercase">
          <span className="font-bold text-ink">{matchesCovered}</span> {t("matchesCovered")}
        </span>
        <span>│</span>
        <span className="uppercase">
          <span className="font-bold text-brand-green">{goalsDetected.toLocaleString()}</span>{" "}
          {t("goalDetections")}
        </span>
        <span>│</span>
        <span className="uppercase">
          <span className="font-bold text-brand-amber">{attestationCount}</span>{" "}
          {t("onChainCount")}
        </span>
        <span>│</span>
        <span className="flex items-center gap-1 uppercase">
          <span
            className={`h-1.5 w-1.5 rounded-full ${isLive ? "bg-brand-green animate-pulseGlow" : "bg-white/20"}`}
          />
          {t("uptime")}: {formatUptime()}
        </span>
        <span>│</span>
        <span>{t("poweredBy")}</span>
      </div>
    </div>
  );
}
