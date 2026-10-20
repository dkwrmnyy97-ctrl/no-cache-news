const SENTIMENT_COLOR = {
  positive: 'text-green-400',
  negative: 'text-red-400',
  neutral: 'text-slate-400',
  mixed: 'text-amber-400',
}

const TREND_ICON = {
  up: '↑',
  down: '↓',
  stable: '→',
}

const TREND_COLOR = {
  up: 'text-green-400',
  down: 'text-red-400',
  stable: 'text-slate-500',
}

const MODEL_COLORS = [
  'from-blue-600 to-blue-500',
  'from-violet-600 to-violet-500',
  'from-emerald-600 to-emerald-500',
  'from-orange-600 to-orange-500',
  'from-cyan-600 to-cyan-500',
  'from-pink-600 to-pink-500',
]

function ModelBar({ model, maxMentions, colorClass }) {
  const pct = maxMentions > 0 ? Math.max(8, Math.round((model.mentions / maxMentions) * 100)) : 8

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-200">{model.name}</span>
          {model.trend && (
            <span className={`text-xs font-bold ${TREND_COLOR[model.trend] || 'text-slate-500'}`}>
              {TREND_ICON[model.trend] || '→'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {model.sentiment && (
            <span className={`text-xs font-medium ${SENTIMENT_COLOR[model.sentiment] || 'text-slate-400'}`}>
              {model.sentiment}
            </span>
          )}
          <span className="text-xs text-slate-600 font-mono w-12 text-right">
            {model.mentions} {model.mentions === 1 ? 'mention' : 'mentions'}
          </span>
        </div>
      </div>

      <div className="h-2 bg-navy-600 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${colorClass} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {model.note && (
        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{model.note}</p>
      )}
    </div>
  )
}

function LeaderCard({ leader }) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-slate-200">{leader.name}</div>
          <div className="text-xs text-slate-600 mt-0.5">{leader.company}</div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`text-xs font-medium ${SENTIMENT_COLOR[leader.sentiment] || 'text-slate-400'}`}>
            {leader.sentiment}
          </span>
          <span className="text-xs text-slate-700 font-mono">{leader.mentions}x</span>
        </div>
      </div>
      {leader.note && (
        <p className="text-xs text-slate-600 mt-2 leading-relaxed">{leader.note}</p>
      )}
    </div>
  )
}

const PERIOD_LABEL = { today: 'today', week: 'this week', month: 'this month' }

export function ModelActivityList({ stats = [], twoColumn = false }) {
  const maxMentions = Math.max(...stats.map(m => m.mentions || 0), 1)
  return (
    <div className={`grid gap-4 ${twoColumn ? 'md:grid-cols-2' : ''}`}>
      {stats.map((model, i) => (
        <ModelBar
          key={model.name}
          model={model}
          maxMentions={maxMentions}
          colorClass={MODEL_COLORS[i % MODEL_COLORS.length]}
        />
      ))}
    </div>
  )
}

export function LeaderList({ leaderStats = [] }) {
  return (
    <div className="grid grid-cols-1 gap-3">
      {leaderStats.map((leader, i) => (
        <LeaderCard key={i} leader={leader} />
      ))}
    </div>
  )
}

export function periodPhrase(period) {
  return PERIOD_LABEL[period] || 'this week'
}

export default function ModelStats({ stats = [], leaderStats = [], period = 'week' }) {
  const periodLabel = PERIOD_LABEL[period] || 'this week'
  if (!stats.length && !leaderStats.length) return null

  return (
    <div className={`grid grid-cols-1 gap-6 ${stats.length && leaderStats.length ? 'md:grid-cols-2' : ''}`}>
      {/* Model Performance */}
      {stats.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-lg">🧠</span>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Model Activity</h2>
            <span className="ml-auto text-xs text-slate-700">by news mentions {periodLabel}</span>
          </div>
          <ModelActivityList stats={stats} twoColumn={stats.length > 4 && !leaderStats.length} />
        </div>
      )}

      {/* Industry Leaders */}
      {leaderStats.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-lg">👔</span>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Industry Leaders</h2>
            <span className="ml-auto text-xs text-slate-700">in the news {periodLabel}</span>
          </div>
          <LeaderList leaderStats={leaderStats} />
        </div>
      )}
    </div>
  )
}
