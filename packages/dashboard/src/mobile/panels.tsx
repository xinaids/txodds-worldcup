import type { TelemetryEvent } from "../eventStyles";
import { formatHM } from "../eventStyles";

/* ── Eyebrow ─────────────────────────────────────────────── */
export function Eyebrow({
  icon,
  trailing,
  children,
}: {
  icon?: string;
  trailing?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center gap-2 font-mono text-[10.5px] font-bold uppercase tracking-[0.22em] text-white/[0.34]">
      {icon && <span className="text-lime leading-none">{icon}</span>}
      <span>{children}</span>
      <span className="h-px flex-1 bg-line" />
      {trailing && (
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-lime">{trailing}</span>
      )}
    </div>
  );
}

/* ── MetricPanel ─────────────────────────────────────────── */
interface MetricPanelProps {
  icon?: string;
  label: string;
  value: string | number;
  unit?: string;
  sub?: string;
  lime?: boolean;
  fill?: number;
  bars?: boolean;
}

export function MetricPanel({ icon, label, value, unit, sub, lime, fill, bars }: MetricPanelProps) {
  return (
    <div className="glass relative overflow-hidden rounded-[16px] border border-line px-3.5 py-3.5 transition-transform active:scale-[0.985]">
      {/* top hairline shimmer */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-lime/40 to-transparent opacity-50" />

      <div className="flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.15em] text-white/[0.34]">
        {icon && <span className="leading-none text-lime">{icon}</span>}
        {label}
      </div>

      <div
        className={`mt-[11px] font-mono text-[31px] font-extrabold leading-none tracking-[-0.01em] tabular-nums ${
          lime ? "text-lime" : "text-white"
        }`}
      >
        {value}
        {unit && <span className="ml-0.5 text-[14px] font-semibold text-ink-muted">{unit}</span>}
      </div>

      {sub && (
        <div className="mt-[5px] font-mono text-[10px] tracking-[0.03em] text-ink-muted">{sub}</div>
      )}

      {fill !== undefined && (
        <div className="mt-[10px] h-1 overflow-hidden rounded-full bg-white/[0.07]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-lime/50 to-lime shadow-[0_0_10px_rgba(215,255,0,0.5)]"
            style={{ width: `${Math.min(100, fill)}%`, transition: "width 1s cubic-bezier(.2,.7,.2,1)" }}
          />
        </div>
      )}

      {bars && (
        <div className="mt-2 flex h-[22px] items-end gap-[3px]">
          {[0.7, 1.0, 0.5, 0.85, 0.6, 0.9, 0.4].map((d, i) => (
            <div
              key={i}
              className="flex-1 animate-eq rounded-sm bg-lime/50"
              style={{ animationDelay: `${i * 0.14}s`, animationDuration: `${0.9 + d * 0.4}s` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── EventRow — igual ao HTML showcase ──────────────────── */
// left colored bar + icon box + title/sub + time/conf right-aligned
export function EventRow({ ev, isNew }: { ev: TelemetryEvent; isNew?: boolean }) {
  const time = formatHM(ev.detectedAt);
  const confLabel = ev.alert ? "alerta" : `conf ${ev.confidence}`;
  const confColor = ev.alert ? "text-brand-red" : "text-lime";

  return (
    <div
      className={`glass relative flex items-center gap-[13px] overflow-hidden rounded-[15px] border border-line px-3.5 py-[13px] transition-transform active:scale-[0.99] ${
        isNew ? "animate-slideInFromTop" : ""
      }`}
    >
      {/* left colored bar — lime or red */}
      <div
        className={`absolute bottom-0 left-0 top-0 w-[3px] rounded-l-[15px] ${
          ev.alert ? "bg-brand-red/85" : "bg-lime/85"
        }`}
      />

      {/* icon container */}
      <div
        className={`flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[11px] border text-[17px] ${
          ev.alert
            ? "border-brand-red/28 bg-brand-red/10"
            : "border-lime/22 bg-lime/10"
        }`}
      >
        {ev.icon}
      </div>

      {/* text body */}
      <div className="min-w-0 flex-1">
        <div className="font-display text-[14px] font-semibold leading-tight tracking-[0.01em]">
          {ev.title}
        </div>
        <div className="mt-[3px] truncate font-sans text-[11.5px] text-ink-muted">
          {ev.detail}
        </div>
      </div>

      {/* time + conf right */}
      <div className="flex-none text-right">
        <div className="font-mono text-[12px] font-bold tabular-nums text-white">{time}</div>
        <div className={`mt-0.5 font-mono text-[9.5px] tracking-[0.06em] ${confColor}`}>
          {confLabel}
        </div>
      </div>
    </div>
  );
}
