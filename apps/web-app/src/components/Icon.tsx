// Shared SVG icon component used across all pages.
// Pass any SVG path `d` attribute to render a stroke-only icon.
export const Icon = ({
  d,
  size = 20,
  className = '',
}: {
  d: string;
  size?: number;
  className?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d={d} />
  </svg>
);
