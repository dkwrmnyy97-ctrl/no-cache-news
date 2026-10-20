import { BulletItem } from './StoryList.jsx'

export const SECTIONS = [
  {
    key: 'ai_news',
    title: 'New in AI',
    icon: '🤖',
    accent: 'border-blue-500/30',
    tagColor: 'text-blue-400',
    tagBg: 'bg-blue-500/10',
    dotColor: 'bg-blue-500',
  },
  {
    key: 'cybersecurity',
    title: 'Cybersecurity & AI Identity',
    icon: '🛡️',
    accent: 'border-red-500/30',
    tagColor: 'text-red-400',
    tagBg: 'bg-red-500/10',
    dotColor: 'bg-red-500',
  },
  {
    key: 'industry',
    title: 'Industry & Business',
    icon: '📊',
    accent: 'border-violet-500/30',
    tagColor: 'text-violet-400',
    tagBg: 'bg-violet-500/10',
    dotColor: 'bg-violet-500',
  },
]

function SectionCard({ section, bullets, articles }) {
  const isEmpty = !bullets || bullets.length === 0

  return (
    <div className={`card p-6 border ${section.accent}`}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">{section.icon}</span>
        <h2 className={`text-sm font-bold uppercase tracking-wider ${section.tagColor}`}>
          {section.title}
        </h2>
        {!isEmpty && (
          <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${section.tagBg} ${section.tagColor}`}>
            {bullets.length}
          </span>
        )}
      </div>

      {isEmpty ? (
        <p className="text-xs text-slate-700 py-4 text-center">
          No relevant updates for this period.
        </p>
      ) : (
        <div className="space-y-0.5">
          {bullets.map((bullet, i) => (
            <BulletItem key={i} bullet={bullet} articles={articles} />
          ))}
        </div>
      )}

      {!isEmpty && (
        <div className="mt-4 pt-3 border-t border-navy-700">
          <p className="text-xs text-slate-700">
            Click any bullet to see source articles ↑
          </p>
        </div>
      )}
    </div>
  )
}

export function digestHeading(period) {
  return period === 'today' ? "Today's Briefing" : period === 'week' ? "This Week's Digest" : 'Monthly Overview'
}

export default function DigestSection({ briefing, period }) {
  const data = briefing[period] || {}
  const articles = briefing._articles || []

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          {digestHeading(period)}
        </span>
        <div className="flex-1 h-px bg-navy-700" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
