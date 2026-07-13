interface AtlasCoreLogoProps {
  className?: string;
}

export default function AtlasCoreLogo({
  className = "h-6 w-7",
}: AtlasCoreLogoProps) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center text-[#3b82f6] ${className}`}
    >
      <svg
        className="h-full w-full"
        fill="none"
        viewBox="0 0 40 36"
      >
        <path
          d="M3.5 29.5 13.5 6.5l10 23M7.5 20.5h12"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeWidth="2.25"
        />
        <path
          d="M36 9.5 31.5 6h-5L22 10.5v15l4.5 4.5h5l4.5-3.5"
          stroke="currentColor"
          strokeLinecap="square"
          strokeLinejoin="miter"
          strokeWidth="2.25"
        />
        <path
          d="M26.5 6v4.5H22M22 25.5h4.5V30"
          stroke="currentColor"
          strokeWidth="1"
        />
        <rect x="34.5" y="8" width="3" height="3" fill="currentColor" />
        <rect x="34.5" y="25" width="3" height="3" fill="currentColor" />
      </svg>
    </span>
  );
}
