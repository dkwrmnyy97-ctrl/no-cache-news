import { useState } from 'react'

// Shared bullet + source-article rendering for DigestSection, ExtraSections
// and the mobile reading panels. Your Briefing articles render exactly as
// before; Worldwide articles also show publisher country, original language
// and an English headline when the original isn't English.

function ArticleList({ ids, articles }) {
  if (!ids?.length || !articles?.length) return null
  const linked = ids.map(id => articles.find(a => a._id === id)).filter(Boolean)
  if (!linked.length) return null

  return (
    <div className="mt-3 ml-5 space-y-2 border-l-2 border-slate-800 pl-4">
      {linked.map((a, i) => (
        <a
          key={i}
          href={a.link}
          target="_blank"
          rel="noopener noreferrer"
          className="block group"
        >
          <div className="text-xs font-medium text-slate-400 group-hover:text-blue-400 transition-colors leading-snug">
            {a.title_en || a.title}
          </div>
          {a.title_en && (
            <div className="text-xs text-slate-600 mt-0.5 leading-snug" lang={a.language}>{a.title}</div>
          )}
          <div className="text-xs text-slate-600 mt-0.5">
            {a.source}
            {a.publisher_country && (
              <span> · Publisher in {a.publisher_country}{a.language_name ? ` · ${a.language_name}` : ''}</span>
            )}
          </div>
        </a>
      ))}
    </div>
  )
}

export function BulletItem({ bullet, articles }) {
  const [open, setOpen] = useState(false)
  const hasArticles = bullet.ids?.length > 0

  return (
    <div>
      <button
        onClick={() => hasArticles && setOpen(o => !o)}
        aria-expanded={hasArticles ? open : undefined}
        className={`w-full text-left flex items-start gap-2.5 group py-1.5 ${hasArticles ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <span className="text-slate-600 mt-1 shrink-0">•</span>
        <span className="text-sm text-slate-300 group-hover:text-white transition-colors leading-relaxed flex-1">
          {bullet.text}
          {bullet.places?.length > 0 && (
            <span className="block text-xs text-slate-600 mt-0.5">About: {bullet.places.join(', ')}</span>
          )}
        </span>
        {hasArticles && (
          <span className="shrink-0 mt-1 text-slate-700 group-hover:text-slate-400 transition-colors">
            <svg
              className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-90' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        )}
      </button>

      {open && hasArticles && (
        <ArticleList ids={bullet.ids} articles={articles} />
      )}
    </div>
  )
}

/** Bullet list for one section, as used inside a mobile reading panel. */
export function BulletList({ bullets, articles, emptyText = 'No relevant updates for this period.' }) {
  if (!bullets?.length) {
    return <p className="text-sm text-slate-500 py-8 text-center">{emptyText}</p>
  }
  return (
    <div className="space-y-0.5">
      {bullets.map((bullet, i) => (
        <BulletItem key={i} bullet={bullet} articles={articles} />
      ))}
      <p className="text-xs text-slate-600 pt-4">Tap any story to see its source articles.</p>
    </div>
  )
}
