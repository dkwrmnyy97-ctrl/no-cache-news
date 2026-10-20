import { BulletItem } from './StoryList.jsx'

export const SECTIONS = [
  {
    key: 'market_pulse',
    title: 'Market Pulse',
    icon: '💰',
    accent: 'border-emerald-500/30',
    tagColor: 'text-emerald-400',
    tagBg: 'bg-emerald-500/10',
  },
  {
    key: 'research',
    title: 'Research & Breakthroughs',
    icon: '🔬',
    accent: 'border-cyan-500/30',
    tagColor: 'text-cyan-400',
    tagBg: 'bg-cyan-500/10',
  },
  {
    key: 'releases',
    title: 'AI Releases',
    icon: '🚀',
    accent: 'border-orange-500/30',
    tagColor: 'text-orange-400',
    tagBg: 'bg-orange-500/10',
  },
  {
    key: 'policy',
    title: 'Regulatory Watch',
    icon: '⚖️',
    accent: 'border-slate-500/30',
    tagColor: 'text-slate-400',
    tagBg: 'bg-slate-500/10',
  },
]

function SectionCard({ section, bullets, articles }) {
  const isEmpty = !bullets || bullets.length === 0
  return (
    <div className={`card p-6 border ${section.accent}`}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">{section.icon}</span>
        <h2 className={`text-sm font-bold uppercase tracking-wider ${section.tagColor}`}>{section.title}</h2>
        {!isEmpty && (
          <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${section.tagBg} ${section.tagColor}`}>
            {bullets.length}
          </span>
        )}
      </div>
      {isEmpty ? (
        <p className="text-xs text-slate-700 py-4 text-center">No updates for this period.</p>
      ) : (
        <div className="space-y-0.5">
          {bullets.map((bullet, i) => (
            <BulletItem key={i} bullet={bullet} articles={articles} />
          ))}
        </div>
      )}
      {!isEmpty && (
        <div className="mt-4 pt-3 border-t border-navy-700">
          <p className="text-xs text-slate-700">Click any bullet to see source articles ↑</p>
        </div>
      )}
    </div>
  )
}

export function extrasHeading(period) {
  return `More This ${period === 'today' ? 'Day' : period === 'week' ? 'Week' : 'Month'}`
}

export default function ExtraSections({ briefing, period }) {
  const data = briefing[period] || {}
  const articles = briefing._articles || []

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">{extrasHeading(period)}</span>
        <div className="flex-1 h-px bg-navy-700" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {SECTIONS.map(section => (
          <SectionCard
            key={section.key}
            section={section}
            bullets={data[section.key]}
            articles={articles}
          />
        ))}
      </div>
    </div>
  )
}
