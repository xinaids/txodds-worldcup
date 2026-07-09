import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "./api";
import { usePolling } from "./usePolling";
import { useLocale } from "./useLocale";
import type { Locale } from "./i18n";
import { SignalRadar } from "./mobile/SignalRadar";
import { FlowChart } from "./mobile/FlowChart";
import { MetricPanel, EventRow, Eyebrow } from "./mobile/panels";
import { describeCluster, formatRelativeTime, getEventStyle } from "./eventStyles";
import type { ClusterDTO } from "./types";

const CLUSTERS_POLL_MS = 3_000;
const FIXTURES_POLL_MS = 5_000;
const HEALTH_POLL_MS = 5_000;
const STATS_POLL_MS = 15_000;
const ACCURACY_POLL_MS = 60_000;

type Tab = "signal" | "flow" | "events" | "matches";

function useCountUp(target: number, ms = 1100) {
  const [v, setV] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / ms);
      const e = 1 - Math.pow(1 - p, 3);
      setV(Math.round(a + (target - a) * e));
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

function useLeadCountdown(seconds = 118) {
  const [s, setS] = useState(seconds);
  useEffect(() => {
    const id = setInterval(() => setS((x) => (x <= 0 ? seconds : x - 1)), 1000);
    return () => clearInterval(id);
  }, [seconds]);
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function pickHero(clusters: ClusterDTO[]): ClusterDTO | null {
  const significant = clusters.filter((c) => c.eventType !== "ODDS_DRIFT" && c.eventType !== "UNKNOWN");
  const pool = significant.length ? significant : clusters;
  if (!pool.length) return null;
  return [...pool].sort((a, b) => b.confidence - a.confidence || b.maxShift - a.maxShift)[0];
}

/** Parse "Brasil vs Norway" → ["Brasil", "Norway"] */
function parseFixture(fixture: string): [string, string] | null {
  const sep = fixture.match(/ vs | × | x /i);
  if (!sep) return null;
  const [home, away] = fixture.split(sep[0]);
  return [home.trim(), away.trim()];
}

/** Two-letter abbreviation for flag box */
function abbr(name: string) {
  return name.slice(0, 2).toUpperCase();
}

/* ── MatchStrip ─────────────────────────────────────────── */
function MatchStrip({ fixture, when }: { fixture: string; when?: string }) {
  const teams = parseFixture(fixture);
  if (!teams) {
    return (
      <div className="mt-4 rounded-2xl border border-line bg-black/25 px-3 py-3">
        <span className="font-display text-[15px] font-semibold">{fixture}</span>
        {when && <div className="mt-0.5 font-mono text-[10.5px] tracking-[0.05em] text-ink-muted">{when}</div>}
      </div>
    );
  }
  const [home, away] = teams;
  return (
    <>
      <div className="mt-4 flex items-center gap-3 rounded-[15px] border border-line bg-black/28 px-3 py-3">
        {/* home */}
        <div className="flex flex-1 items-center gap-[9px]">
          <span className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-lg border border-line-2 bg-white/[0.06] font-mono text-[11px] font-bold text-white/60">
            {abbr(home)}
          </span>
          <span className="font-display text-[15px] font-semibold tracking-[0.01em]">{home}</span>
        </div>
        {/* vs */}
        <span className="font-mono text-[11px] font-semibold text-white/34">VS</span>
        {/* away */}
        <div className="flex flex-1 items-center justify-end gap-[9px]">
          <span className="font-display text-[15px] font-semibold tracking-[0.01em]">{away}</span>
          <span className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-lg border border-line-2 bg-white/[0.06] font-mono text-[11px] font-bold text-white/60">
            {abbr(away)}
          </span>
        </div>
      </div>
      {when && (
        <div className="mt-1 text-center font-mono text-[10.5px] tracking-[0.05em] text-ink-muted">{when}</div>
      )}
    </>
  );
}

export default function MobileApp() {
  const { locale, setLocale, t } = useLocale();
  const [tab, setTab] = useState<Tab>("signal");

  const clusters = usePolling(() => api.clusters({ limit: 50 }), CLUSTERS_POLL_MS);
  const fixtures = usePolling(() => api.fixturesLive(), FIXTURES_POLL_MS);
  const health = usePolling(() => api.health(), HEALTH_POLL_MS);
  const stats = usePolling(() => api.stats(), STATS_POLL_MS);
  const accuracy = usePolling(() => api.accuracy(), ACCURACY_POLL_MS);

  const isLive = health.error === null && health.data !== null;
  const clusterList = clusters.data?.data ?? [];
  const fixtureList = fixtures.data?.fixtures ?? [];

  const hero = useMemo(() => pickHero(clusterList), [clusterList]);
  const events = useMemo(() => clusterList.slice(0, 14).map(describeCluster), [clusterList]);
  const flowSeries = useMemo(
    () => clusterList.slice(0, 24).map((c) => c.maxShift).reverse(),
    [clusterList]
  );

  const heroConf = hero?.confidence ?? 92;
  const confAnim = useCountUp(heroConf);
  const lead = useLeadCountdown();

  const heroFixture = hero?.fixture ?? "Aguardando movimento";
  const heroIntensity = hero?.maxShift ?? 0;
  const heroVolume = hero?.signalCount ?? 0;
  const heroMarkets = hero?.marketsAgreeing ?? 0;
  const heroWhen = hero ? formatRelativeTime(hero.detectedAt) : undefined;

  return (
    <div className="relative mx-auto min-h-screen max-w-[430px] pb-28 text-white">
      {/* TOP BAR */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between border-b border-line px-5 py-3.5 backdrop-blur-xl"
        style={{ background: "linear-gradient(180deg,rgba(5,5,5,.92) 40%,rgba(5,5,5,.55))" }}
      >
        <div className="flex items-baseline font-display text-[23px] font-bold leading-none tracking-[-0.02em]">
          <span>Dale</span>
          <span className="relative ml-px text-lime">
            !
            <span className="absolute -bottom-px left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-lime shadow-[0_0_10px_#D7FF00]" />
          </span>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-lime/30 bg-lime/[0.07] py-1.5 pl-2 pr-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-lime">
          <span className={`h-1.5 w-1.5 rounded-full bg-lime ${isLive ? "animate-pulseGlow" : "opacity-30"}`} />
          {isLive ? t("liveIndicator") : t("apiOffline")}
        </span>

        <div className="flex items-center gap-2">
          <LocaleCycle locale={locale} setLocale={setLocale} />
          <button
            className="relative grid h-[38px] w-[38px] place-items-center rounded-xl border border-line-2 bg-white/[0.035] transition-transform active:scale-90"
            aria-label="Notificações"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M18 8A6 6 0 1 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.7 21a2 2 0 0 1-3.4 0" />
            </svg>
            <span className="absolute right-2 top-2 h-[7px] w-[7px] rounded-full bg-lime shadow-[0_0_8px_#D7FF00] animate-pulseGlow" />
          </button>
        </div>
      </header>

      {/* ================= SIGNAL ================= */}
      {tab === "signal" && (
        <main className="animate-fadeUp px-4 pt-[18px]">
          <Eyebrow icon="◍" trailing={t("live")}>{t("signalDetected")}</Eyebrow>

          {/* HERO CARD */}
          <div
            className="relative mb-3.5 overflow-hidden rounded-3xl border border-lime/20 p-[18px]"
            style={{
              background:
                "radial-gradient(120% 90% at 88% 0%, rgba(215,255,0,.10), transparent 55%), linear-gradient(180deg, rgba(255,255,255,.055), rgba(255,255,255,.018))",
              backdropFilter: "blur(14px)",
              boxShadow: "0 24px 60px -30px rgba(215,255,0,.18), inset 0 1px 0 rgba(255,255,255,.06)",
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-lime">
                  <span>⚡</span> {t("movementIntensity")}
                </div>
                <h1 className="mt-2.5 max-w-[15ch] font-display text-[29px] font-bold leading-[1.02] tracking-[-0.015em]">
                  {t("unusualMovement").split(" ").slice(0, -1).join(" ")}{" "}
                  <span className="text-lime">{t("unusualMovement").split(" ").slice(-1)}</span>
                </h1>
              </div>
              <SignalRadar active={isLive} />
            </div>

            {/* match strip — parsed into team layout */}
            <MatchStrip fixture={heroFixture} when={heroWhen} />

            {/* confidence */}
            <div className="mt-4 flex items-end justify-between gap-3.5">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-muted">{t("aiConfidence")}</div>
                <div
                  className="font-mono text-[52px] font-extrabold leading-[0.9] tracking-[-0.02em] text-lime tabular-nums"
                  style={{ textShadow: "0 0 30px rgba(215,255,0,.35)" }}
                >
                  {confAnim}
                  <span className="ml-0.5 text-[22px] font-bold">%</span>
                </div>
              </div>
              <FlowChart series={flowSeries} height={42} showTag={false} labels={["", "", ""]} />
            </div>
          </div>

          {/* METRIC PANELS */}
          <div className="grid grid-cols-2 gap-3">
            <MetricPanel lime icon="◎" label={t("signalConfidence")} value={heroConf} unit="%" fill={heroConf} />
            <MetricPanel icon="↯" label={t("movementIntensity")} value={heroIntensity.toFixed(1)} unit="%" bars />
            <MetricPanel lime icon="◷" label={t("leadTime")} value={lead} sub={t("beforeScore")} />
            <MetricPanel icon="≋" label={t("detectedVolume")} value={heroVolume} sub={`ticks · ${heroMarkets} ${t("markets").toLowerCase()}`} />
          </div>

          <section className="mt-6">
            <Eyebrow icon="/">{t("gameFlow")}</Eyebrow>
            <div className="card glass rounded-[18px] border border-line px-3 py-3.5">
              <FlowChart series={flowSeries} height={150} />
              {/* legend */}
              <div className="mt-2 flex flex-wrap gap-4">
                <LegendDot color="#D7FF00" label="Movimento detectado" />
                <LegendDot color="rgba(255,255,255,.4)" label="Pontos de mudança" />
              </div>
            </div>
          </section>

          <section className="mt-6">
            <Eyebrow icon="≡">{t("detectedEvents")}</Eyebrow>
            <div className="flex flex-col gap-[9px]">
              {events.slice(0, 3).map((ev, i) => (
                <EventRow key={`${ev.fixture}-${ev.detectedAt}-${i}`} ev={ev} isNew={i === 0} />
              ))}
              {events.length === 0 && <EmptyState label={t("watching")} />}
            </div>
          </section>
        </main>
      )}

      {/* ================= FLOW ================= */}
      {tab === "flow" && (
        <main className="animate-fadeUp px-4 pt-[18px]">
          <Eyebrow icon="/" trailing={hero?.fixture}>{t("gameFlow")}</Eyebrow>
          <div className="glass rounded-[18px] border border-line p-4">
            <div className="mb-1.5 flex items-center justify-between px-0.5">
              <span className="font-display text-[15px] font-semibold">Probabilidade implícita</span>
              <span className="font-mono text-[10px] tracking-[0.05em] text-ink-muted">últimos 30 min</span>
            </div>
            <FlowChart series={flowSeries} height={160} />
            <div className="mt-2 flex flex-wrap gap-4">
              <LegendDot color="#D7FF00" label="Consenso do mercado" />
              <LegendDot color="rgba(255,255,255,.4)" label="Ponto de mudança" />
              <LegendDot color="#D7FF00" glow label="Sinal disparado" />
            </div>
          </div>

          <section className="mt-[22px]">
            <Eyebrow icon="▦">{t("telemetry")}</Eyebrow>
            <div className="grid grid-cols-2 gap-3">
              <MetricPanel lime icon="◈" label={t("maxShift")} value={(stats.data?.maxShiftPct ?? heroIntensity).toFixed(1)} unit="%" sub={stats.data?.maxShiftSignal ? `${stats.data.maxShiftSignal.home}` : undefined} />
              <MetricPanel icon="⇄" label={t("markets")} value={heroMarkets || 9} unit="/9" sub={t("marketsAgree")} />
              <MetricPanel icon="◷" label={t("latency")} value={111} unit="s" sub={t("aheadOfFeed")} />
              <MetricPanel icon="≋" label={t("ticksMin")} value="1.4" unit="k" sub="taxa de amostragem" />
            </div>
          </section>
        </main>
      )}

      {/* ================= EVENTS ================= */}
      {tab === "events" && (
        <main className="animate-fadeUp px-4 pt-[18px]">
          <Eyebrow icon="≡" trailing={t("live")}>{t("detectedEvents")}</Eyebrow>
          {/* stats strip — 3 cols like HTML */}
          <div className="mb-3.5 grid grid-cols-3 gap-[10px]">
            <StatBox value={(stats.data?.totalSignals ?? 0).toLocaleString("pt-BR")} label={t("totalSignals")} />
            <StatBox value="100%" label="Gols" lime />
            <StatBox value={String(stats.data?.matchesCovered ?? 0)} label={t("matchesCovered")} />
          </div>
          <div className="flex flex-col gap-[9px]">
            {events.map((ev, i) => (
              <EventRow key={`${ev.fixture}-${ev.detectedAt}-${i}`} ev={ev} isNew={i === 0} />
            ))}
            {events.length === 0 && <EmptyState label={t("watching")} />}
          </div>
        </main>
      )}

      {/* ================= MATCHES ================= */}
      {tab === "matches" && (
        <main className="animate-fadeUp px-4 pt-[18px]">
          <Eyebrow icon="◫" trailing={String(fixtureList.length)}>{t("activePositions")}</Eyebrow>
          <MatchList fixtures={fixtureList} t={t} />

          {accuracy.data && (
            <div
              className="mt-3.5 rounded-[16px] border border-lime/20 p-[15px]"
              style={{ background: "linear-gradient(180deg,rgba(215,255,0,.06),transparent)" }}
            >
              <div className="flex items-center gap-2 font-display text-[14px] font-semibold">✓ {t("verifiedProof")}</div>
              <div className="mt-3 flex items-center gap-[10px]">
                <div
                  className="font-mono text-[34px] font-extrabold leading-none tracking-[-0.02em] text-lime"
                  style={{ textShadow: "0 0 24px rgba(215,255,0,.3)" }}
                >
                  {accuracy.data.verifiedMatch.goalsDetected}/{accuracy.data.verifiedMatch.totalGoals}
                </div>
                <div className="font-sans text-[11.5px] leading-[1.5] text-ink-muted">
                  {t("goalsDetected")} em <span className="text-white">{accuracy.data.verifiedMatch.fixture}</span>
                  <br />
                  {accuracy.data.verifiedMatch.date} · {t("detectionRate")} {accuracy.data.verifiedMatch.detectionRate}
                </div>
              </div>
              <div className="mt-3 font-mono text-[10px] tracking-[0.03em] text-white/[0.34]">
                Sinais precederam o feed oficial em <span className="text-lime">111–120s</span> · {t("immutableRecord")}
              </div>
            </div>
          )}
        </main>
      )}

      {/* BOTTOM NAV */}
      <nav
        className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-[430px] gap-1 border-t border-line px-3.5 pt-2 pb-[calc(0.55rem+env(safe-area-inset-bottom))] backdrop-blur-xl"
        style={{ background: "linear-gradient(0deg,rgba(5,5,5,.96) 55%,rgba(5,5,5,.4))" }}
      >
        <NavTab id="signal" active={tab} set={setTab} label={t("navSignal")} icon={<><circle cx="12" cy="12" r="3" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2" /><circle cx="12" cy="12" r="8" opacity=".4" /></>} />
        <NavTab id="flow" active={tab} set={setTab} label={t("navFlow")} icon={<path d="M3 17l5-6 4 3 5-8 4 5" />} />
        <NavTab id="events" active={tab} set={setTab} label={t("navEvents")} icon={<path d="M13 2L4 14h7l-1 8 9-12h-7z" />} />
        <NavTab id="matches" active={tab} set={setTab} label={t("navMatches")} icon={<><circle cx="12" cy="12" r="9" /><path d="M12 3v18M3 12h18M6 6l12 12M18 6L6 18" opacity=".45" /></>} />
      </nav>
    </div>
  );
}

/* ── helpers ── */
const LOCALE_ORDER: Locale[] = ["pt", "en", "es"];
function LocaleCycle({ locale, setLocale }: { locale: Locale; setLocale: (l: Locale) => void }) {
  const next = () => setLocale(LOCALE_ORDER[(LOCALE_ORDER.indexOf(locale) + 1) % LOCALE_ORDER.length]);
  return (
    <button
      onClick={next}
      aria-label="Idioma"
      className="grid h-[38px] w-[38px] place-items-center rounded-xl border border-line-2 bg-white/[0.035] font-mono text-[11px] font-bold uppercase tracking-[0.05em] text-ink-muted transition-transform active:scale-90"
    >
      {locale}
    </button>
  );
}

function NavTab({ id, active, set, label, icon }: { id: Tab; active: Tab; set: (t: Tab) => void; label: string; icon: React.ReactNode }) {
  const on = active === id;
  return (
    <button
      onClick={() => set(id)}
      className={`relative flex flex-1 flex-col items-center gap-1.5 rounded-xl py-2 font-mono text-[9px] font-bold uppercase tracking-[0.1em] transition-transform active:scale-90 ${on ? "text-lime" : "text-ink-muted"}`}
    >
      {on && <span className="absolute top-0.5 h-[5px] w-[5px] rounded-full bg-lime shadow-[0_0_8px_#D7FF00]" />}
      <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.7">{icon}</svg>
      {label}
    </button>
  );
}

function StatBox({ value, label, lime }: { value: string; label: string; lime?: boolean }) {
  return (
    <div className="glass rounded-[14px] border border-line px-[10px] py-3 text-center">
      <div className={`font-mono text-[19px] font-extrabold tabular-nums ${lime ? "text-lime" : "text-white"}`}>{value}</div>
      <div className="mt-1 font-mono text-[8.5px] uppercase tracking-[0.12em] text-white/[0.34]">{label}</div>
    </div>
  );
}

function LegendDot({ color, label, glow }: { color: string; label: string; glow?: boolean }) {
  return (
    <span className="flex items-center gap-1.5 font-mono text-[9.5px] text-ink-muted">
      <i
        className="inline-block h-2 w-2 flex-none rounded-sm"
        style={{ background: color, boxShadow: glow ? `0 0 8px ${color}` : undefined }}
      />
      {label}
    </span>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex h-40 items-center justify-center rounded-[15px] border border-line bg-white/[0.02] px-6 text-center text-sm text-ink-muted">
      {label}
    </div>
  );
}

function MatchList({ fixtures, t }: { fixtures: import("./types").LiveFixture[]; t: (k: import("./i18n").TranslationKey) => string }) {
  const sorted = [...fixtures].sort((a, b) => b.signalCount - a.signalCount).slice(0, 12);
  const max = Math.max(1, ...sorted.map((f) => f.signalCount));
  if (sorted.length === 0) return <EmptyState label={t("watching")} />;
  return (
    <div className="flex flex-col">
      {sorted.map((f, i) => {
        const style = getEventStyle(f.latestEvent.eventType);
        return (
          <div
            key={f.fixtureId}
            className="glass mb-[9px] flex items-center gap-3 rounded-[15px] border border-line px-3.5 py-[13px] transition-transform active:scale-[0.99]"
          >
            <span className="w-[22px] flex-none font-mono text-[12px] font-extrabold text-white/[0.34]">#{i + 1}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-display text-[14.5px] font-semibold tracking-[0.01em]">{f.fixture}</div>
              <div className="mt-[3px] font-mono text-[10px] tracking-[0.04em] text-ink-muted">
                {f.signalCount.toLocaleString("pt-BR")} {t("signals")} · {formatRelativeTime(f.latestEvent.detectedAt)}
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.07]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-lime/50 to-lime"
                  style={{ width: `${Math.min(100, (f.signalCount / max) * 100)}%` }}
                />
              </div>
            </div>
            <span className={`flex-none rounded-lg px-2 py-[5px] font-mono text-[9px] font-bold uppercase tracking-[0.08em] ${style.bg} ${style.text}`}
              style={{ border: `1px solid ${style.hex}40` }}>
              {style.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
