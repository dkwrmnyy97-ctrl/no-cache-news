import { useState, useEffect } from 'react'

const SHOW_ICONS = {
  'Lex Fridman Podcast': '🎙️',
  'Hard Fork':           '🔀',
  'The a16z Podcast':    '💡',
  'TWIML AI Podcast':    '🤖',
  'All-In Podcast':      '📈',
  'Acquired':            '🏢',
}

function PodcastCard({ episode }) {
  const icon = SHOW_ICONS[episode.show] || '🎧'
  return (
    <a
      href={episode.link}
      target="_blank"
      rel="noopener noreferrer"
      className="card p-5 border border-navy-700 hover:border-purple-500/40 transition-all group flex flex-col gap-2"
    >
      <div className="flex items-center gap-2">
        <span className="text-base">{icon}</span>
        <span className="text-xs font-semibold text-purple-400 uppercase tracking-wide">
          {episode.show}
        </span>
      </div>

      <p className="text-sm font-medium text-slate-200 group-hover:text-white leading-snug transition-colors line-clamp-2">
        {episode.title}
      </p>

      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
        {episode.why}
      </p>

      <div className="flex items-center gap-1 mt-auto pt-1 text-xs text-purple-400/70 group-hover:text-purple-400 transition-colors">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Listen
      </div>
    </a>
  )
}

export default function PodcastSection({ period }) {
  const [episodes, setEpisodes] = useState(null) // null = loading, [] = none found
  const [error, setError] = useState(false)

  useEffect(() => {
    setEpisodes(null)
    setError(false)
    fetch(`/api/podcast-suggestions?period=${period}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => setEpisodes(data))
      .catch(() => setError(true))
  }, [period])

  // Don't render the section at all if nothing to show
  if (error || (episodes !== null && episodes.length === 0)) return null

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
          Go Deeper · Relevant Episodes
        </span>
        <div className="flex-1 h-px bg-navy-700" />
      </div>

      {episodes === null ? (
        // Loading skeleton
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card p-5 border border-navy-700 animate-pulse">
              <div className="h-3 bg-navy-600 rounded w-1/2 mb-3" />
              <div className="h-4 bg-navy-600 rounded w-full mb-2" />
              <div className="h-4 bg-navy-600 rounded w-3/4 mb-3" />
              <div className="h-3 bg-navy-700 rounded w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {episodes.map((ep, i) => (
            <PodcastCard key={i} episode={ep} />
          ))}
        </div>
      )}
    </div>
  )
}
