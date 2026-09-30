import { useMemo } from "react";

const colorByRisk = {
  Green: "#22c55e",
  Yellow: "#facc15",
  Orange: "#fb923c",
  Red: "#ef4444"
};

export default function RiskBadge({ riskLevel, riskScore }) {
  const normalizedLevel = typeof riskLevel === "string" ? riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1).toLowerCase() : "Green";
  const score = Math.max(0, Math.min(100, Number.isFinite(Number(riskScore)) ? Number(riskScore) : 0));
  const strokeColor = colorByRisk[normalizedLevel] ?? colorByRisk.Green;

  const { circumference, dashOffset, radius, strokeWidth } = useMemo(() => {
    const size = 132;
    const nextStrokeWidth = 12;
    const nextRadius = (size - nextStrokeWidth) / 2;
    const nextCircumference = 2 * Math.PI * nextRadius;
    return {
      circumference: nextCircumference,
      dashOffset: nextCircumference * (1 - score / 100),
      radius: nextRadius,
      strokeWidth: nextStrokeWidth
    };
  }, [score]);

  return (
    <div className={`risk-badge risk-${normalizedLevel.toLowerCase()}`} role="img" aria-label={`${normalizedLevel} risk score ${score} out of 100`}>
      <div className="risk-gauge">
        <svg viewBox="0 0 132 132" aria-hidden="true">
          <circle className="risk-gauge-track" cx="66" cy="66" r={radius} fill="none" strokeWidth={strokeWidth} />
          <circle
            className="risk-gauge-progress"
            cx="66"
            cy="66"
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ "--dash-offset": dashOffset }}
          />
        </svg>
        <div className="risk-gauge-center">
          <div>
            <div className="risk-gauge-score">{score}</div>
            <div className="risk-gauge-label">{normalizedLevel} Risk</div>
          </div>
        </div>
      </div>
    </div>
  );
}
