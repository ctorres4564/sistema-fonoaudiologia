function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-noble-100 bg-white p-5 shadow-card">
      <div className="mb-4 h-1.5 w-16 rounded-full bg-noble-200" />
      <div className="h-4 w-32 rounded bg-noble-200" />
      <div className="mt-4 h-8 w-16 rounded bg-noble-200" />
    </div>
  )
}

export default SkeletonCard
