import type { EventType } from "./types";

interface EventStyle {
  label: string;
  bg: string;
  text: string;
  dot: string;
}

const EVENT_STYLES: Record<EventType, EventStyle> = {
  GOAL: {
    label: "Goal",
    bg: "bg-sage-500/10",
    text: "text-sage-500",
    dot: "bg-sage-500",
  },
  RED_CARD: {
    label: "Red Card",
    bg: "bg-red-500/10",
    text: "text-red-600",
    dot: "bg-red-500",
  },
  PENALTY_AWARDED: {
    label: "Penalty",
    bg: "bg-amber-500/10",
    text: "text-amber-500",
    dot: "bg-amber-400",
  },
  ODDS_DRIFT: {
    label: "Drift",
    bg: "bg-ink-800/5",
    text: "text-ink-800/60",
    dot: "bg-ink-800/30",
  },
  UNKNOWN: {
    label: "Unknown",
    bg: "bg-ink-800/5",
    text: "text-ink-800/40",
    dot: "bg-ink-800/20",
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
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function truncateMiddle(s: string, headLen = 6, tailLen = 6): string {
  if (s.length <= headLen + tailLen + 3) return s;
  return `${s.slice(0, headLen)}...${s.slice(-tailLen)}`;
}
