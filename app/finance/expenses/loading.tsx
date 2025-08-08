export default function LoadingExpenses() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 bg-muted rounded w-64 animate-pulse" />
          <div className="mt-2 h-4 bg-muted rounded w-72 animate-pulse" />
        </div>
        <div className="h-10 w-32 bg-muted rounded animate-pulse" />
      </div>
      <div className="h-10 bg-muted rounded w-full animate-pulse" />
      <div className="h-6 bg-muted rounded w-40 animate-pulse" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-14 bg-muted rounded animate-pulse" />
      ))}
    </div>
  );
}
