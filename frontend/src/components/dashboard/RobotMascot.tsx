"use client";

interface RobotMascotProps {
  width?: number;
  height?: number;
  darkBackground?: boolean;
  className?: string;
}

export default function RobotMascot({
  width = 126,
  height = 88,
  darkBackground = true,
  className = "",
}: RobotMascotProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${className}`}
      style={{ width: `${width}px`, height: `${height}px` }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 126 88"
        width={width}
        height={height}
        role="presentation"
        className="block"
        style={{ verticalAlign: "top" }}
      >
        <defs>
          <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={darkBackground ? "#0b1226" : "#1f2a44"} />
            <stop offset="100%" stopColor={darkBackground ? "#0f2345" : "#283354"} />
          </linearGradient>
          <linearGradient id="headGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f3f7ff" />
            <stop offset="100%" stopColor="#cfd8ea" />
          </linearGradient>
          <linearGradient id="bodyGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#d7dfef" />
            <stop offset="100%" stopColor="#b8c4dc" />
          </linearGradient>
          <radialGradient id="eyeGlow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#7de9ff" />
            <stop offset="100%" stopColor="#2cb8ff" />
          </radialGradient>
          <filter id="softShadow" x="-40%" y="-40%" width="180%" height="200%">
            <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#031125" floodOpacity="0.35" />
          </filter>
        </defs>

        <rect x="0" y="0" width="126" height="88" rx="16" fill="url(#bgGrad)" />

        <ellipse cx="63" cy="72" rx="24" ry="8" fill="#040916" opacity="0.35" />

        <g filter="url(#softShadow)">
          <rect x="42" y="10" width="42" height="36" rx="12" fill="url(#headGrad)" />
          <rect x="47" y="15" width="32" height="22" rx="8" fill="#0e1b33" />

          <circle cx="57" cy="26" r="4.2" fill="url(#eyeGlow)">
            <animate attributeName="r" values="4.2;4.2;1.2;4.2;4.2" dur="4.8s" repeatCount="indefinite" />
          </circle>
          <circle cx="69" cy="26" r="4.2" fill="url(#eyeGlow)">
            <animate attributeName="r" values="4.2;4.2;1.2;4.2;4.2" dur="4.8s" repeatCount="indefinite" />
          </circle>

          <path d="M58 33 C60 35 66 35 68 33" stroke="#78d8ff" strokeWidth="2" strokeLinecap="round" fill="none" />

          <rect x="46" y="44" width="34" height="20" rx="9" fill="url(#bodyGrad)" />

          <rect x="40" y="48" width="7" height="11" rx="3.5" fill="#c5d1e6" />
          <rect x="79" y="48" width="7" height="11" rx="3.5" fill="#c5d1e6" />

          <rect x="52" y="63" width="7" height="8" rx="2.5" fill="#9eacc6" />
          <rect x="67" y="63" width="7" height="8" rx="2.5" fill="#9eacc6" />

          <rect x="60" y="6" width="6" height="6" rx="3" fill="#9cc7ff" />
        </g>
      </svg>
    </div>
  );
}
