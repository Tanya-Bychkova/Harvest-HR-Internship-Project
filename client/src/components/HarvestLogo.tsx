export function HarvestLogo({ className }: { className?: string }) {
  return (
    <svg
      width="138"
      height="38"
      viewBox="0 0 138 38"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Harvest HR"
    >
      {/* Wheat stem mark */}
      <g transform="translate(4,4)">
        <path
          d="M14 0 L14 30"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <ellipse cx="9" cy="6" rx="4" ry="2.5" fill="currentColor" transform="rotate(-30 9 6)" />
        <ellipse cx="19" cy="6" rx="4" ry="2.5" fill="currentColor" transform="rotate(30 19 6)" />
        <ellipse cx="8" cy="12" rx="4" ry="2.5" fill="currentColor" transform="rotate(-30 8 12)" />
        <ellipse cx="20" cy="12" rx="4" ry="2.5" fill="currentColor" transform="rotate(30 20 12)" />
        <ellipse cx="8" cy="18" rx="4" ry="2.5" fill="currentColor" transform="rotate(-30 8 18)" />
        <ellipse cx="20" cy="18" rx="4" ry="2.5" fill="currentColor" transform="rotate(30 20 18)" />
      </g>
      <text
        x="40"
        y="22"
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight="700"
        fontSize="15"
        fill="currentColor"
      >
        HARVEST
      </text>
      <text
        x="40"
        y="34"
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight="500"
        fontSize="9"
        fill="currentColor"
        opacity="0.7"
        letterSpacing="2"
      >
        AGRO HOLDING
      </text>
    </svg>
  );
}
