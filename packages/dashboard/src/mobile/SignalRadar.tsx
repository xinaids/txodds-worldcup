interface SignalRadarProps {
  size?: number;
  active?: boolean;
}

export function SignalRadar({ size = 82, active = true }: SignalRadarProps) {
  return (
    <div style={{ width: size, height: size, flex: "none" }} aria-hidden>
      <svg viewBox="0 0 82 82" width="100%" height="100%" style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="radar-sweep" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="rgba(215,255,0,0)" />
            <stop offset="1" stopColor="rgba(215,255,0,0.35)" />
          </linearGradient>
        </defs>

        <circle cx="41" cy="41" r="40" fill="none" stroke="rgba(215,255,0,0.20)" strokeWidth="1" />
        <circle cx="41" cy="41" r="27" fill="none" stroke="rgba(215,255,0,0.20)" strokeWidth="1" />
        <circle cx="41" cy="41" r="14" fill="none" stroke="rgba(215,255,0,0.20)" strokeWidth="1" />
        <line x1="41" y1="1" x2="41" y2="81" stroke="rgba(215,255,0,0.14)" strokeWidth="1" />
        <line x1="1" y1="41" x2="81" y2="41" stroke="rgba(215,255,0,0.14)" strokeWidth="1" />

        {active && (
          <g className="animate-radarSpin" style={{ transformOrigin: "41px 41px" }}>
            <path d="M41 41 L41 1 A40 40 0 0 1 79 47 Z" fill="url(#radar-sweep)" />
            <line x1="41" y1="41" x2="41" y2="1" stroke="#D7FF00" strokeWidth="1.5" />
          </g>
        )}

        {active && (
          <circle
            className="animate-radarPing"
            cx="58"
            cy="30"
            fill="none"
            stroke="#D7FF00"
            strokeWidth="1.4"
          />
        )}
        <circle cx="58" cy="30" r="3" fill="#D7FF00" style={{ filter: "drop-shadow(0 0 6px #D7FF00)" }} />
      </svg>
    </div>
  );
}
