interface StatTileProps {
  label: string;
  value: string;
  accent?: "coral" | "sage" | "amber" | "default";
  sublabel?: string;
}

function StatTile({ label, value, accent = "default", sublabel }: StatTileProps) {
  const accentColor =
    accent === "coral"
      ? "text-coral-500"
      : accent === "sage"
        ? "text-sage-500"
        : accent === "amber"
          ? "text-amber-500"
          : "text-ink-900";

  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-cream-300 bg-white/60 px-5 py-4 shadow-sm">
      <span className="text-xs font-medium uppercase tracking-wide text-ink-800/50">
        {label}
      </span>
      <span className={`font-mono text-2xl font-semibold tabular-nums ${accentColor}`}>
        {value}
      </span>
      {sublabel && (
        <span className="text-xs text-ink-800/40">{sublabel}</span>
      )}
    </div>
  );
}

interface StatsHeaderProps {
  totalSignals: number;
  matchesCovered: number;
  goalDetectionRate: string;
  attestationCount: number;
  isLive: boolean;
}

export function StatsHeader({
  totalSignals,
  matchesCovered,
  goalDetectionRate,
  attestationCount,
  isLive,
}: StatsHeaderProps) {
  return (
    <header className="mb-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-1.5 flex items-center gap-2.5">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                isLive ? "animate-pulse-soft bg-sage-500" : "bg-ink-800/20"
              }`}
            />
            <span className="text-xs font-medium uppercase tracking-widest text-ink-800/50">
              {isLive ? "Live · TxLINE Mainnet Stream" : "Connecting…"}
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-ink-900">
            Sharp Movement Detector
          </h1>
          <p className="mt-1 text-sm text-ink-800/60">
            Autonomous odds-shift agent for FIFA World Cup 2026 — TxODDS Hackathon, Track 2
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          label="Signals Collected"
          value={totalSignals.toLocaleString()}
          accent="default"
        />
        <StatTile
          label="Matches Covered"
          value={String(matchesCovered)}
          accent="default"
        />
        <StatTile
          label="Goal Detection Rate"
          value={goalDetectionRate}
          accent="sage"
          sublabel="verified · Norway v France"
        />
        <StatTile
          label="On-Chain Attestations"
          value={String(attestationCount)}
          accent="coral"
          sublabel="Solana mainnet"
        />
      </div>
    </header>
  );
}
