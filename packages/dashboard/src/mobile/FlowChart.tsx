import { useMemo } from "react";

interface FlowChartProps {
  series?: number[];
  height?: number;
  showTag?: boolean;
  labels?: [string, string, string];
}

const W = 340;
const PAD = 8;

export function FlowChart({ series, height = 150, showTag = true, labels }: FlowChartProps) {
  const { linePath, areaPath, peak, changes, gridLines } = useMemo(() => {
    const H = height;
    const raw =
      series && series.length >= 4
        ? series.slice(-24)
        : Array.from({ length: 24 }, (_, i) => {
            let b = i / 23;
            b += Math.sin(i * 0.9 + 1.2) * 0.12 + Math.cos(i * 0.5) * 0.07;
            if (i > 20) b += (i - 20) * 0.16;
            return b;
          });

    const min = Math.min(...raw);
    const max = Math.max(...raw);
    const range = max - min || 1;
    const pts = raw.map((v, i) => {
      const x = PAD + (i / (raw.length - 1)) * (W - PAD * 2);
      const y = H - 14 - ((v - min) / range) * (H - 34);
      return [x, Math.max(12, Math.min(H - 12, y))] as const;
    });

    const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
    const area = `${line} L${W - PAD} ${H} L${PAD} ${H} Z`;
    const grid = [1, 2, 3].map((i) => (i * H) / 4);
    const idx = pts.length;
    const chg = [pts[Math.floor(idx * 0.28)], pts[Math.floor(idx * 0.55)], pts[Math.floor(idx * 0.76)]];

    return { linePath: line, areaPath: area, peak: pts[pts.length - 1], changes: chg, gridLines: grid };
  }, [series, height]);

  const [l0, l1, l2] = labels ?? ["20:10", "20:20", "20:30"];

  return (
    <svg viewBox={`0 0 ${W} ${height}`} width="100%" height={height} preserveAspectRatio="none">
      <defs>
        <linearGradient id="flow-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgba(215,255,0,0.35)" />
          <stop offset="1" stopColor="rgba(215,255,0,0)" />
        </linearGradient>
      </defs>

      {gridLines.map((y, i) => (
        <line key={i} x1="0" y1={y} x2={W} y2={y} stroke="rgba(255,255,255,0.05)" />
      ))}

      <path d={areaPath} fill="url(#flow-area)" style={{ opacity: 0.5 }} />
      <path
        d={linePath}
        fill="none"
        stroke="#D7FF00"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          filter: "drop-shadow(0 2px 10px rgba(215,255,0,0.35))",
          strokeDasharray: 1400,
          strokeDashoffset: 1400,
          animation: "drawLine 1.8s .2s ease forwards",
        }}
      />

      {changes.map((c, i) => (
        <circle key={i} cx={c[0].toFixed(1)} cy={c[1].toFixed(1)} r="3.2" fill="#050505" stroke="#D7FF00" strokeWidth="2" />
      ))}

      <circle cx={peak[0].toFixed(1)} cy={peak[1].toFixed(1)} r="4.5" fill="#D7FF00" style={{ filter: "drop-shadow(0 0 8px #D7FF00)" }} />

      {showTag && (
        <g transform={`translate(${(peak[0] - 42).toFixed(1)},${(peak[1] - 26).toFixed(1)})`}>
          <rect x="0" y="0" width="40" height="15" rx="4" fill="#D7FF00" />
          <text x="20" y="10.5" textAnchor="middle" fontFamily="'JetBrains Mono',monospace" fontWeight="800" fontSize="9" fill="#050505" letterSpacing="0.08em">
            SINAL
          </text>
        </g>
      )}

      <text x="8" y={height - 3} fontFamily="'JetBrains Mono',monospace" fontSize="9" fill="rgba(255,255,255,0.34)">{l0}</text>
      <text x={W / 2} y={height - 3} textAnchor="middle" fontFamily="'JetBrains Mono',monospace" fontSize="9" fill="rgba(255,255,255,0.34)">{l1}</text>
      <text x={W - 8} y={height - 3} textAnchor="end" fontFamily="'JetBrains Mono',monospace" fontSize="9" fill="rgba(255,255,255,0.34)">{l2}</text>
    </svg>
  );
}
