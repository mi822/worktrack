export function BrandMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="9" fill="#5c6b56" />
      <rect x="8" y="10" width="16" height="3.5" rx="1.75" fill="#fcfbf8" />
      <rect x="8" y="18.5" width="10.5" height="3.5" rx="1.75" fill="#fcfbf8" />
    </svg>
  );
}
