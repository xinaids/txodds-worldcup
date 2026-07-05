import type { AccuracyResponse } from "../types";
import type { TranslationKey } from "../i18n";

interface AccuracyProofProps {
  data: AccuracyResponse | null;
  isLoading: boolean;
  t: (key: TranslationKey) => string;
}

export function AccuracyProof({ data, isLoading, t }: AccuracyProofProps) {
  if (isLoading && !data) {
    return (
      <div className="rounded-md border border-white/[0.06] bg-term-card p-4">
        <div className="h-24 animate-pulse rounded bg-white/5" />
      </div>
    );
  }
  if (!data) return null;

  const { verifiedMatch, keyFinding } = data;
  const rate = verifiedMatch.totalGoals > 0
    ? (verifiedMatch.goalsDetected / verifiedMatch.totalGoals) * 100
    : 0;

  return (
    <div className="rounded-md border border-brand-green/20 bg-term-card p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.15em] text-ink-muted">
          {t("verifiedProof")}
        </h2>
        <span className="font-mono text-[10px] text-ink-muted">
          {verifiedMatch.fixture} · {verifiedMatch.date}
        </span>
      </div>

      <div className="mb-3 flex items-center gap-2 font-mono text-xs">
        <span className="text-ink-muted">
          {verifiedMatch.goalsDetected}/{verifiedMatch.totalGoals} {t("goalsDetected")}
        </span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full bg-brand-green transition-[width] duration-[400ms] ease-out"
            style={{ width: `${rate}%` }}
          />
        </div>
        <span className="font-bold text-brand-green">{verifiedMatch.detectionRate}</span>
      </div>

      <div className="overflow-hidden rounded border border-white/[0.06]">
        <table className="w-full text-left font-mono text-[11px]">
          <thead>
            <tr className="bg-white/[0.03] text-[9px] uppercase tracking-wide text-ink-muted">
              <th className="px-2 py-1.5 font-medium">Time</th>
              <th className="px-2 py-1.5 font-medium">{t("signals")}</th>
              <th className="px-2 py-1.5 font-medium">{t("conf")}.</th>
              <th className="px-2 py-1.5 font-medium">Shift</th>
              <th className="px-2 py-1.5 font-medium">{t("signalsBefore")}</th>
            </tr>
          </thead>
          <tbody>
            {verifiedMatch.results.map((r, idx) => (
              <tr key={r.goalTime} className={idx % 2 === 0 ? "bg-white/[0.015]" : ""}>
                <td className="px-2 py-1.5 text-ink">{r.goalTime}</td>
                <td className="px-2 py-1.5 text-ink-muted">{r.signalsNear}</td>
                <td className="px-2 py-1.5 font-bold text-brand-green">{r.maxConfidence}</td>
                <td className="px-2 py-1.5 text-ink-muted">{r.maxShift}</td>
                <td className="px-2 py-1.5 font-bold text-brand-amber">
                  {r.firstSignalBeforeGoal} ⚡
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-2 text-[10px] leading-relaxed text-ink-muted">⚡ {keyFinding}</div>
    </div>
  );
}
