export function BrandMark({ size = 34, inverted = false }: { size?: number; inverted?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" aria-hidden="true" className="shrink-0">
      <rect width="512" height="512" rx="112" fill={inverted ? "#ffffff" : "#0f766e"} />
      <path d="M395 271 271 395a32 32 0 0 1-45 0L117 286V117h169l109 109a32 32 0 0 1 0 45z" fill="none" stroke={inverted ? "#0f766e" : "#ffffff"} strokeWidth="34" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="190" cy="190" r="30" fill="#f43f5e" />
    </svg>
  );
}
