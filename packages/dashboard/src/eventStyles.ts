import type { ClusterDTO, EventType } from "./types";

export interface EventStyle {
  label: string;
  shortLabel: string;
  hex: string;
  text: string;
  bg: string;
  dot: string;
  border: string;
  glow: string;
}

const EVENT_STYLES: Record<EventType, EventStyle> = {
  GOAL: {
    label: "GOL",
    shortLabel: "GOL",
    hex: "#D7FF00",
    text: "text-lime",
    bg: "bg-lime/10",
    dot: "bg-lime",
    border: "border-l-4 border-lime",
    glow: "shadow-[0_0_20px_rgba(215,255,0,0.12)]",
  },
  RED_CARD: {
    label: "CARTÃO",
    shortLabel: "CAR",
    hex: "#FF5A3C",
    text: "text-brand-red",
    bg: "bg-brand-red/10",
    dot: "bg-brand-red",
    border: "border-l-4 border-brand-red",
    glow: "shadow-[0_0_20px_rgba(255,90,60,0.10)]",
  },
  PENALTY_AWARDED: {
    label: "PÊNALTI",
    shortLabel: "PEN",
    hex: "#E8FF5A",
    text: "text-lime-2",
    bg: "bg-lime/10",
    dot: "bg-lime-2",
    border: "border-l-4 border-lime-2",
    glow: "shadow-[0_0_20px_rgba(215,255,0,0.10)]",
  },
  ODDS_DRIFT: {
    label: "DRIFT",
    shortLabel: "DRIFT",
    hex: "#FFFFFF",
    text: "text-ink-muted",
    bg: "bg-white/5",
    dot: "bg-white/30",
    border: "border-l border-white/10",
    glow: "",
  },
  UNKNOWN: {
    label: "SINAL",
    shortLabel: "SIN",
    hex: "#FFFFFF",
    text: "text-ink-muted",
    bg: "bg-white/5",
    dot: "bg-white/20",
    border: "border-l border-white/10",
    glow: "",
  },
};

export function getEventStyle(eventType?: EventType | string): EventStyle {
  if (eventType && eventType in EVENT_STYLES) {
    return EVENT_STYLES[eventType as EventType];
  }
  return EVENT_STYLES.UNKNOWN;
}

export interface TelemetryEvent {
  icon: string;
  title: string;
  detail: string;
  alert: boolean;
  confidence: number;
  detectedAt: string;
  fixture: string;
}

export function describeCluster(c: ClusterDTO): TelemetryEvent {
  const base = { confidence: c.confidence, detectedAt: c.detectedAt, fixture: c.fixture };
  if (c.eventType === "GOAL")
    return { ...base, icon: "◍", title: "Movimento pré-gol", detail: `${c.signalCount} ticks em ${c.marketsAgreeing} mercados`, alert: false };
  if (c.eventType === "RED_CARD")
    return { ...base, icon: "⚑", title: "Reversão brusca", detail: "Direção do mercado invertida", alert: true };
  if (c.eventType === "PENALTY_AWARDED")
    return { ...base, icon: "↯", title: "Aceleração de odds", detail: "Derivada acima do limiar", alert: false };
  if (c.maxShift >= 40)
    return { ...base, icon: "📈", title: "Pico de volatilidade", detail: `Shift de ${c.maxShift.toFixed(1)}% detectado`, alert: false };
  if (c.marketsAgreeing > 1)
    return { ...base, icon: "🔥", title: "Pressão aumentando", detail: `${c.marketsAgreeing} mercados em concordância`, alert: false };
  return { ...base, icon: "⚡", title: "Movimento detectado", detail: `Deslocamento de ${c.maxShift.toFixed(1)}%`, alert: false };
}

export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 5) return "agora";
  if (diffSec < 60) return `${diffSec}s atrás`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m atrás`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h atrás`;
  return new Date(iso).toLocaleDateString();
}

export function formatClock(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}

export function formatHM(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function truncateMiddle(s: string, headLen = 6, tailLen = 6): string {
  if (s.length <= headLen + tailLen + 3) return s;
  return `${s.slice(0, headLen)}...${s.slice(-tailLen)}`;
}

export const SYSTEM_START = new Date("2026-06-11T00:00:00Z");

export function formatUptime(from: Date = SYSTEM_START): string {
  const diffMs = Math.max(0, Date.now() - from.getTime());
  const totalMin = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const minutes = totalMin % 60;
  return `${days}d ${hours}h ${minutes}m`;
}
