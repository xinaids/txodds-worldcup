import { useEffect, useRef, useState } from "react";
import type { ClusterDTO } from "../types";
import type { Locale, TranslationKey } from "../i18n";
import { formatUptime } from "../eventStyles";
import { LocaleSwitcher } from "./LocaleSwitcher";

const GITHUB_URL = "https://github.com/xinaids/txodds-worldcup";

export function useCountUp(target: number, durationMs = 800): number {
  const [value, setValue] = useState(0);
  const startValueRef = useRef(0);

  useEffect(() => {
    const startValue = startValueRef.current;
    const startTime = performance.now();
    let raf = 0;

    function tick(now: number) {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(startValue + (target - startValue) * eased));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        startValueRef.current = target;
      }
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);

  return value;
}

export function CountUp({ value }: { value: number }) {
  const animated = useCountUp(value);
  return <>{animated.toLocaleString()}</>;
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return <svg width="56" height="20" />;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const step = 56 / (values.length - 1);
  const points = values
    .map((v, i) => `${(i * step).toFixed(1)},${(20 - ((v - min) / range) * 18 - 1).toFixed(1)}`)
    .join(" ");

  return (
    <svg width="56" height="20" className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke="#00D395"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface HeroHeaderProps {
  totalSignals: number;
  attestationCount: number;
  isLive: boolean;
  clusters: ClusterDTO[];
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey) => string;
}

export function HeroHeader({
  totalSignals,
  attestationCount,
  isLive,
  clusters,
  locale,
  setLocale,
  t,
}: HeroHeaderProps) {
  const [uptime, setUptime] = useState(() => formatUptime());

  useEffect(() => {
    const id = window.setInterval(() => setUptime(formatUptime()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const sparklineValues = clusters
    .slice(0, 12)
    .map((c) => c.signalCount)
    .reverse();

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] px-5 py-4">
      <div>
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold tracking-tight text-ink">⬡ Dale</span>
          <span className="flex items-center gap-1.5 rounded bg-brand-green/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-brand-green">
            <span
              className={`h-1.5 w-1.5 rounded-full bg-brand-green ${isLive ? "animate-pulseGlow" : "opacity-30"}`}
            />
            {isLive ? t("liveIndicator") : t("apiOffline")}
          </span>
          <span className="font-mono text-xs text-ink-muted">{uptime}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-ink-muted">
          <span>{t("appTagline")}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <HeroTile
          label={t("totalSignals")}
          value={<CountUp value={totalSignals} />}
          accent="text-ink"
          extra={<Sparkline values={sparklineValues} />}
        />
        <HeroTile label={t("goalDetections")} value="100%" accent="text-brand-green" />
        <HeroTile
          label={t("onChainCount")}
          value={<>⬡ <CountUp value={attestationCount} /></>}
          accent="text-brand-amber"
        />

        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border border-white/10 px-3 py-2 text-xs font-medium text-ink-muted transition-colors hover:text-ink"
        >
          GitHub ↗
        </a>
        <LocaleSwitcher locale={locale} setLocale={setLocale} />
      </div>
    </header>
  );
}

function HeroTile({
  label,
  value,
  accent,
  extra,
}: {
  label: string;
  value: React.ReactNode;
  accent: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-white/[0.06] bg-term-card px-3 py-2">
      <div className="flex flex-col">
        <span className="text-[9px] uppercase tracking-[0.15em] text-ink-muted">{label}</span>
        <span className={`font-mono text-base font-bold tabular-nums ${accent}`}>{value}</span>
      </div>
      {extra}
    </div>
  );
}
