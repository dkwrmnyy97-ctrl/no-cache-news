import { PERIOD_LABELS } from '../utils/coverage.js'

function timeStr(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const sameDay = d.toDateString() === new Date().toDateString()
  return sameDay
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

/** Loading state while the first international briefing is generated. */
export function WorldwideLoading() {
  return (
    <div role="status" className="flex flex-col items-center justify-center py-24 sm:py-32 text-center px-4">
      <div className="w-10 h-10 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mb-5" />
      <p className="text-sm font-medium text-slate-400">Gathering international coverage…</p>
      <p className="text-xs text-slate-600 mt-1 max-w-sm">
        Reading publishers based in Europe, China and Asia-Pacific and summarizing them in English.
        The first load can take a minute or two.
      </p>
    </div>
  )
}

export function WorldwideError({ message, onRetry, onSwitchToMine }) {
  return (
    <div role="alert" className="card p-8 sm:p-10 text-center">
      <p className="text-slate-400 text-sm mb-1">International coverage isn't available right now.</p>
      {message && <p className="text-slate-600 text-xs mb-4">{message}</p>}
      <div className="flex items-center justify-center gap-4">
        {onRetry && <button onClick={onRetry} className="text-blue-400 text-sm hover:underline min-h-[44px]">Try again</button>}
        <button onClick={onSwitchToMine} className="text-slate-400 text-sm hover:underline min-h-[44px]">Back to Your Briefing</button>
      </div>
    </div>
  )
}

/** Provenance line + stale/empty notices shown above Worldwide content. */
export function WorldwideBanner({ state, regionLabel, regionDescription, period, isEmpty }) {
  const { stale, refreshing, briefing } = state
  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-500 leading-relaxed">
        <span className="text-cyan-400/90 font-semibold">Worldwide · {regionLabel}</span>
        {' — '}stories from publishers based {regionLabel === 'All international' ? 'in Europe, China and Asia-Pacific' : `in ${regionLabel}${regionDescription ? ` (${regionDescription[0].toLowerCase()}${regionDescription.slice(1)})` : ''}`}.
        {' '}Non-English reporting is summarized in English; tap a story for the original source.
      </p>
      {stale && (
        <p role="status" className="text-xs text-amber-300/90 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
          Showing coverage from {timeStr(briefing?.generated_at)}.{' '}
          {refreshing ? 'Updating in the background…' : 'The latest update failed, so this is the last successful briefing.'}
        </p>
      )}
      {isEmpty && (
        <p role="status" className="text-xs text-slate-400 bg-navy-800 border border-navy-600 rounded-lg px-3 py-2">
          No {regionLabel === 'All international' ? 'international' : regionLabel} stories for {PERIOD_LABELS[period].toLowerCase()} yet.
          {period === 'today' ? ' Try This Week.' : ''}
        </p>
      )}
    </div>
  )
}

/** Podcasts are USA-only: shown in Worldwide in place of recommendations. */
export function PodcastUnavailable({ onViewUsa, compact = false }) {
  return (
    <div className={`card border border-navy-700 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 ${compact ? 'p-4' : 'p-5'}`}>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span aria-hidden="true" className="text-base">🎧</span>
        <p className="text-sm text-slate-400">Podcast recommendations are currently available for the USA only.</p>
      </div>
      <button
        type="button"
        onClick={onViewUsa}
        className="self-start sm:self-auto shrink-0 min-h-[40px] px-3 rounded-lg text-xs font-semibold text-purple-300 border border-purple-500/30 hover:border-purple-400/60 hover:text-purple-200 transition-colors"
      >
        View USA recommendations
      </button>
    </div>
  )
}
