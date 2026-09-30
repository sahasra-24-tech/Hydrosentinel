export default function HydrosentinelLogo({ size = 30, className = "" }) {
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="HydroSentinel logo"
    >
      <defs>
        <linearGradient id="hydroShieldStroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="50%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
        <linearGradient id="hydroDropFill" x1="0%" y1="0%" x2="100%" y2="90%">
          <stop offset="0%" stopColor="#8be9ff" stopOpacity="0.95" />
          <stop offset="45%" stopColor="#60a5fa" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id="hydroDropInner" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#dff7ff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0.7" />
        </linearGradient>
      </defs>

      <path
        d="M60 12 L88 28 V56 C88 76 76 95 60 104 C44 95 32 76 32 56 V28 L60 12 Z"
        fill="none"
        stroke="url(#hydroShieldStroke)"
        strokeWidth="6"
        strokeLinejoin="round"
      />

      <path
        d="M60 28 C76 40 78 58 64 73 C59 78 56 86 60 98 C64 86 61 78 56 73 C42 58 44 40 60 28 Z"
        fill="url(#hydroDropFill)"
      />

      <path
        d="M60 38 C71 48 72 62 61 74 C58 77 56 82 60 89 C64 82 62 77 59 74 C48 62 49 48 60 38 Z"
        fill="url(#hydroDropInner)"
      />

      <path
        d="M40 52 C46 42 53 37 60 34 C68 37 74 42 80 52"
        fill="none"
        stroke="rgba(191, 219, 254, 0.6)"
        strokeWidth="4"
        strokeLinecap="round"
      />

      <path
        d="M26 50 A 34 34 0 0 1 94 50"
        fill="none"
        stroke="rgba(125, 211, 252, 0.4)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M18 63 A 42 42 0 0 1 102 63"
        fill="none"
        stroke="rgba(34, 211, 238, 0.24)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
