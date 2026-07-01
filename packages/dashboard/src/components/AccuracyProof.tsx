import { api } from "../api";
import { usePolling } from "../usePolling";

const POLL_INTERVAL_MS = 30_000;

export function AccuracyProof() {
  const { data, isLoading } = usePolling(() => api.accuracy(), POLL_INTERVAL_MS);

  if (isLoading && !data) {
    return (
      <div className="rounded-2xl border border-cream-300 bg-white/70 p-5">
        <div className="h-24 animate-pulse rounded-lg bg-cream-200" />
      </div>
    );
  }
  if (!data) return null;

  const { verifiedMatch, keyFinding } = data;

  return (
    <div className="overflow-hidden rounded-2xl border border-sage-500/20 bg-gradient-to-br from-sage-500/[0.04] to-white/70 p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink-900">Verified Accuracy</h2>
        <span className="rounded-full bg-sage-500/15 px-2.5 py-0.5 text-xs font-bold text-sage-500">
          {verifiedMatch.detectionRate} detection rate
        </span>
      </div>

      <p className="mb-4 text-xs leading-relaxed text-ink-800/60">{keyFinding}</p>

      <div className="overflow-hidden rounded-lg border border-cream-300">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-cream-200/70 text-[10px] uppercase tracking-wide text-ink-800/50">
              <th className="px-3 py-2 font-medium">Goal Time</th>
              <th className="px-3 py-2 font-medium">Signals</th>
              <th className="px-3 py-2 font-medium">Max Conf.</th>
              <th className="px-3 py-2 font-medium">Max Shift</th>
              <th className="px-3 py-2 font-medium">Detected Before Goal</th>
            </tr>
          </thead>
          <tbody>
            {verifiedMatch.results.map((r, idx) => (
              <tr
                key={r.goalTime}
                className={idx % 2 === 0 ? "bg-white/60" : "bg-cream-50/60"}
              >
                <td className="px-3 py-2 font-mono text-ink-900">{r.goalTime}</td>
                <td className="px-3 py-2 font-mono text-ink-800/60">{r.signalsNear}</td>
                <td className="px-3 py-2 font-mono font-semibold text-sage-500">
                  {r.maxConfidence}
                </td>
                <td className="px-3 py-2 font-mono text-ink-800/60">{r.maxShift}</td>
                <td className="px-3 py-2 font-mono font-semibold text-coral-600">
                  {r.firstSignalBeforeGoal}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-[11px] text-ink-800/40">
        {verifiedMatch.fixture} · {verifiedMatch.date} · {verifiedMatch.goalsDetected}/
        {verifiedMatch.totalGoals} goals detected
      </div>
    </div>
  );
}
