export default function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-ink-100 dark:bg-ink-700 ${className}`} />;
}

export function PageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28" />)}
      </div>
      <Skeleton className="h-72" />
    </div>
  );
}
