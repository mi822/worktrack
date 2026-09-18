export function PageFallback() {
  return (
    <div className="space-y-6">
      <div>
        <div className="skeleton h-3 w-16" />
        <div className="skeleton mt-3 h-8 w-56" />
        <div className="skeleton mt-3 h-4 w-80 max-w-full" />
      </div>
      <div className="panel p-6">
        <div className="skeleton h-3 w-20" />
        <div className="skeleton mt-3 h-5 w-36" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="skeleton h-24" />
          <div className="skeleton h-24" />
          <div className="skeleton h-24" />
          <div className="skeleton h-24" />
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-full bg-canvas text-ink">
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-line lg:bg-surface">
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="skeleton h-8 w-8 rounded-lg" />
          <div className="flex-1">
            <div className="skeleton h-4 w-24" />
            <div className="skeleton mt-2 h-3 w-32" />
          </div>
        </div>
        <div className="space-y-2 px-4">
          <div className="skeleton h-9" />
          <div className="skeleton h-9" />
          <div className="skeleton h-9" />
          <div className="skeleton h-9" />
        </div>
      </div>
      <div className="lg:pl-64">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <PageFallback />
        </div>
      </div>
    </div>
  );
}
