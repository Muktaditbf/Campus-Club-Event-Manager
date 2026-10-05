export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="mb-8 space-y-3">
        <div className="h-7 w-48 rounded-lg bg-muted" />
        <div className="h-4 w-96 max-w-full rounded bg-muted" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-28 rounded-xl border border-border bg-card" />
        ))}
      </div>
      <div className="mt-6 h-80 rounded-xl border border-border bg-card" />
    </div>
  );
}
