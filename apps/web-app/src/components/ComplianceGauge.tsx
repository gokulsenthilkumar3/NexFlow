'use client';

/**
 * ComplianceGauge — a radial SVG gauge showing SLA compliance %.
 * Displays ( total - breached ) / total * 100 as a coloured arc.
 */
export function ComplianceGauge({
  total,
  breached,
}: {
  total: number;
  breached: number;
}) {
  const compliance = total > 0 ? Math.max(0, ((total - breached) / total) * 100) : 100;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  // We use 75% of the circle for the arc (270°), starting at 225°
  const arcLength = circumference * 0.75;
  const filled = arcLength * (compliance / 100);
  const offset = arcLength - filled;

  const color =
    compliance >= 90 ? '#22c55e'   // green
    : compliance >= 70 ? '#f59e0b' // amber
    : '#ef4444';                   // red

  return (
    <div className="rounded-2xl p-5 border border-slate-800 bg-slate-900/60 flex flex-col items-center">
      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-3">
        SLA Compliance
      </p>
      <div className="relative w-36 h-36">
        <svg viewBox="0 0 128 128" className="w-full h-full -rotate-[135deg]">
          {/* Track */}
          <circle
            cx="64"
            cy="64"
            r={radius}
            fill="none"
            stroke="#1e293b"
            strokeWidth="12"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />
          {/* Fill */}
          <circle
            cx="64"
            cy="64"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeDasharray={`${filled} ${circumference}`}
            strokeDashoffset={0}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.8s ease, stroke 0.4s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-white">{compliance.toFixed(1)}%</span>
          <span className="text-[10px] text-slate-500">compliance</span>
        </div>
      </div>
      <p className="text-[11px] text-slate-500 mt-2">
        {breached} breach{breached !== 1 ? 'es' : ''} / {total} total
      </p>
    </div>
  );
}
