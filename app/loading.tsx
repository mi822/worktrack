export default function Loading() {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden bg-transparent"
      aria-hidden="true"
    >
      <div className="h-full w-1/3 animate-pulse bg-action/70" />
    </div>
  );
}
