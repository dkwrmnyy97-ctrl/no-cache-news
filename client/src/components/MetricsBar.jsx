function Metric({ label, value, icon, color }) {
  return (
    <div className="card px-5 py-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${color}`}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-white">{value ?? '—'}</div>
        <div className="text-xs text-slate-500 font-medium">{label}</div>
      </div>
    </div>
  )
}

export default function MetricsBar({ trends, newsCount, cyberCount }) {
  const topTrend = trends?.trends?.[0]?.topic

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Metric label="AI Articles" value={newsCount} icon="📰" color="bg-blue-500/10" />
      <Metric label="Cyber Alerts" value={cyberCount} icon="🛡️" color="bg-red-500/10" />
      <Metric label="News Sources" value={trends?.sources} icon="📡" color="bg-cyan-500/10" />
      <Metric label="Top Trend" value={topTrend} icon="📈" color="bg-violet-500/10" />
    </div>
  )
}
