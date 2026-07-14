interface AtlasCoreLogoProps {
  className?: string;
}

export default function AtlasCoreLogo({
  className = "h-8 w-8",
}: AtlasCoreLogoProps) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center ${className}`}
    >
      <svg
        className="h-full w-full"
        fill="none"
        viewBox="0 0 40 40"
      >
        <defs>
          <linearGradient id="atlascore-logo-stroke" x1="10" y1="30" x2="30" y2="9" gradientUnits="userSpaceOnUse">
            <stop stopColor="#60a5fa" />
            <stop offset="1" stopColor="#f8fafc" />
          </linearGradient>
        </defs>
        <rect
          x="3.5"
          y="3.5"
          width="33"
          height="33"
          rx="9"
          fill="#09090b"
          stroke="#27272a"
        />
        <path
          d="M11 29 20 10.5 29 29"
          stroke="url(#atlascore-logo-stroke)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
        />
        <path
          d="M15.5 22.5h9"
          stroke="#f8fafc"
          strokeLinecap="round"
          strokeWidth="2.5"
        />
        <circle
          cx="20"
          cy="22.5"
          r="2.4"
          fill="#3b82f6"
        />
      </svg>
    </span>
  );
}
