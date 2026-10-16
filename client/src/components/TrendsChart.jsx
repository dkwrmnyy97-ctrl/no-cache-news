function SkeletonBar() {
  return (
    <div className="flex items-center gap-3">
      <div className="skeleton h-3 w-20" />
      <div className="skeleton h-3 flex-1" />
      <div className="skeleton h-3 w-6" />
    </div>
  )
}

export default function TrendsChart({ trends, loading }) {
  if (loading) {
    return (
      <div className="card p-5">
        <div className="section-title mb-4">Trending Topics</div>
        <div className="space-y-3">
          {Array(8).fill(0).map((_, i) => <SkeletonBar key={i} />)}
        </div>
      </div>
    )
  }

  const items = trends?.trends || []

  return (
    <div className="card p-5">
      <div className="section-title mb-4">Trending Topics</div>
      <div className="space-y-2.5">
        {items.map((item, i) => (
          <div key={item.topic} className="flex items-center gap-3 group">
            <span className="text-xs text-slate-600 w-4 text-right shrink-0">{i + 1}</span>
            <span className="text-xs text-slate-400 w-28 shrink-0 truncate font-mono">{item.topic}</span>
            <div className="flex-1 h-1.5 bg-navy-600 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${item.pct}%`,
                  background: i === 0
                    ? 'linear-gradient(90deg, #3b82f6, #06b6d4)'
                    : i < 3
                    ? 'linear-gradient(90deg, #2563eb, #0284c7)'
                    : '#1e3a5f',
                }}
              />
            </div>
            <span className="text-xs text-slate-600 w-5 text-right shrink-0">{item.count}</span>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-xs text-slate-600 text-center py-4">No trend data yet</p>
        )}
      </div>
    </div>
  )
}
