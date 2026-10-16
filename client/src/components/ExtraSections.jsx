import { useState } from 'react'

const SECTIONS = [
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

function ArticleList({ ids, articles }) {
  if (!ids?.length || !articles?.length) return null
  const linked = ids.map(id => articles.find(a => a._id === id)).filter(Boolean)
  if (!linked.length) return null
  return (
    <div className="mt-3 ml-5 space-y-2 border-l-2 border-slate-800 pl-4">
      {linked.map((a, i) => (
        <a key={i} href={a.link} target="_blank" rel="noopener noreferrer" className="block group">
          <div className="text-xs font-medium text-slate-400 group-hover:text-blue-400 transition-colors leading-snug">{a.title}</div>
          <div className="text-xs text-slate-600 mt-0.5">{a.source}</div>
        </a>
      ))}
    </div>
  )
}

function BulletItem({ bullet, articles }) {
  const [open, setOpen] = useState(false)
  const hasArticles = bullet.ids?.length > 0
  return (
    <div>
      <button
        onClick={() => hasArticles && setOpen(o => !o)}
        className={`w-full text-left flex items-start gap-2.5 group py-1.5 ${hasArticles ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <span className="text-slate-600 mt-1 shrink-0">•</span>
        <span className="text-sm text-slate-300 group-hover:text-white transition-colors leading-relaxed flex-1">{bullet.text}</span>
        {hasArticles && (
          <span className="shrink-0 mt-1 text-slate-700 group-hover:text-slate-400 transition-colors">
            <svg className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        )}
      </button>
      {open && hasArticles && <ArticleList ids={bullet.ids} articles={articles} />}
    </div>
  )
}

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

export default function ExtraSections({ briefing, period }) {
  const data = briefing[period] || {}
  const articles = briefing._articles || []

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">More This {period === 'today' ? 'Day' : period === 'week' ? 'Week' : 'Month'}</span>
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
