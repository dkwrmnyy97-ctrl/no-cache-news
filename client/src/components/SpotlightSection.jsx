import { useState, useEffect } from 'react'
import ArticleCard from './ArticleCard.jsx'

const TOPICS = [
  {
    id: 'mcp',
    label: 'MCP',
    full: 'Model Context Protocol',
    desc: 'Anthropic\'s open standard for connecting AI models to tools and data sources.',
    color: 'text-emerald-400',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/10',
    dot: 'bg-emerald-400',
  },
  {
    id: 'nhim',
    label: 'NHIM',
    full: 'Non-Human Identity Management',
    desc: 'Managing identities for AI agents, bots, service accounts, and automated systems.',
    color: 'text-violet-400',
    border: 'border-violet-500/30',
    bg: 'bg-violet-500/10',
    dot: 'bg-violet-400',
  },
  {
    id: 'agentic',
    label: 'Agentic AI',
    full: 'Autonomous AI Agents',
    desc: 'AI systems that plan, reason, and take multi-step actions with minimal human oversight.',
    color: 'text-amber-400',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
    dot: 'bg-amber-400',
  },
]

function TopicTab({ topic, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all border ${
        active
          ? `${topic.bg} ${topic.border} ${topic.color}`
          : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-700/50'
      }`}
    >
      <div className={`w-2 h-2 rounded-full ${active ? topic.dot : 'bg-slate-600'}`} />
      {topic.label}
    </button>
  )
}

export default function SpotlightSection() {
  const [activeId, setActiveId] = useState('mcp')
  const [articles, setArticles] = useState({})
  const [loading, setLoading] = useState({})

  const activeTopic = TOPICS.find(t => t.id === activeId)

  useEffect(() => {
    if (articles[activeId]) return
    setLoading(l => ({ ...l, [activeId]: true }))
    fetch(`/api/spotlight/${activeId}`)
      .then(r => r.json())
      .then(data => setArticles(a => ({ ...a, [activeId]: data })))
      .catch(() => setArticles(a => ({ ...a, [activeId]: [] })))
      .finally(() => setLoading(l => ({ ...l, [activeId]: false })))
  }, [activeId])

  const currentArticles = articles[activeId] || []
  const isLoading = loading[activeId]

  return (
    <div className="card p-5">
      <div className="section-title mb-4">Spotlight Topics</div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {TOPICS.map(t => (
          <TopicTab key={t.id} topic={t} active={activeId === t.id} onClick={() => setActiveId(t.id)} />
        ))}
      </div>

      {activeTopic && (
        <div className={`rounded-lg ${activeTopic.bg} border ${activeTopic.border} p-4 mb-5`}>
          <div className={`text-sm font-semibold ${activeTopic.color} mb-1`}>{activeTopic.full}</div>
          <p className="text-xs text-slate-400">{activeTopic.desc}</p>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="card p-5 space-y-3">
              <div className="skeleton h-3 w-24" />
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-4 w-3/4" />
              <div className="skeleton h-3 w-full" />
              <div className="skeleton h-3 w-2/3" />
            </div>
          ))}
        </div>
      ) : currentArticles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {currentArticles.map((article, i) => (
            <ArticleCard key={article.link || i} article={article} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 text-slate-600">
          <div className="text-3xl mb-2">🔍</div>
          <p className="text-sm">No recent articles found for this topic.</p>
          <p className="text-xs mt-1">Check back after a refresh.</p>
        </div>
      )}
    </div>
  )
}
