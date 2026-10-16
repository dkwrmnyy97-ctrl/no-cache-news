import { useState } from 'react'

const PERIODS = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
]

export default function Header({ period, onPeriodChange, onRefresh, lastUpdated, totalArticles, isFallback }) {
  const [refreshing, setRefreshing] = useState(false)

  async function handleRefresh() {
    setRefreshing(true)
    await onRefresh()
    setTimeout(() => setRefreshing(false), 1500)
  }

  const timeStr = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <header className="border-b border-blue-950/60 bg-navy-900/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-screen-xl mx-auto px-4 py-3">
        {/* Row 1: Brand + Refresh */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-xs font-black text-white shrink-0">
              AI
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight">No Cache News <span className="font-normal text-slate-400">— Bella's Briefing</span></h1>
              {timeStr && (
                <span className="flex items-center gap-1.5 text-xs text-slate-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse-slow" />
                  Updated {timeStr}
                  {totalArticles && <span className="hidden sm:inline">· {totalArticles} articles</span>}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 border border-navy-600 hover:border-slate-600 rounded-lg transition-all disabled:opacity-40 shrink-0"
          >
            <svg className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="hidden sm:inline">{refreshing ? 'Refreshing' : 'Refresh'}</span>
          </button>
        </div>

        {/* Row 2: Period tabs (full width) */}
        <div className="flex items-center gap-1 bg-navy-800 rounded-lg p-1 border border-navy-600">
          {PERIODS.map(p => (
            <button
              key={p.id}
              onClick={() => onPeriodChange(p.id)}
              className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all ${
                period === p.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}
