import type { EventType } from "./types";

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
    label: "GOAL",
    shortLabel: "GOAL",
    hex: "#00D395",
    text: "text-brand-green",
    bg: "bg-brand-green/10",
    dot: "bg-brand-green",
    border: "border-l-4 border-brand-green",
    glow: "shadow-[0_0_20px_rgba(0,211,149,0.08)]",
  },
  RED_CARD: {
    label: "RED_CARD",
    shortLabel: "RED",
    hex: "#FF4D4D",
    text: "text-brand-red",
    bg: "bg-brand-red/10",
    dot: "bg-brand-red",
    border: "border-l-4 border-brand-red",
    glow: "shadow-[0_0_20px_rgba(255,77,77,0.08)]",
  },
  PENALTY_AWARDED: {
    label: "PENALTY",
    shortLabel: "PEN",
    hex: "#F0A500",
    text: "text-brand-amber",
    bg: "bg-brand-amber/10",
    dot: "bg-brand-amber",
    border: "border-l-4 border-brand-amber",
    glow: "shadow-[0_0_20px_rgba(240,165,0,0.08)]",
  },
  ODDS_DRIFT: {
    label: "ODDS_DRIFT",
    shortLabel: "DRIFT",
    hex: "#3B82F6",
    text: "text-ink-muted",
    bg: "bg-white/5",
    dot: "bg-white/30",
    border: "border-l border-white/10",
    glow: "",
  },
  UNKNOWN: {
    label: "UNKNOWN",
    shortLabel: "UNK",
    hex: "#E6EDF3",
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

export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 5) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return new Date(iso).toLocaleDateString();
}

export function formatClock(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function truncateMiddle(s: string, headLen = 6, tailLen = 6): string {
  if (s.length <= headLen + tailLen + 3) return s;
  return `${s.slice(0, headLen)}...${s.slice(-tailLen)}`;
}

/** Fixed reference point used to render a plausible, ever-increasing system uptime. */
export const SYSTEM_START = new Date("2026-06-11T00:00:00Z");

export function formatUptime(from: Date = SYSTEM_START): string {
  const diffMs = Math.max(0, Date.now() - from.getTime());
  const totalMin = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const minutes = totalMin % 60;
  return `${days}d ${hours}h ${minutes}m`;
}
