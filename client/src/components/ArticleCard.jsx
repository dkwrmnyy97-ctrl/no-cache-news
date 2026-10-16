const TAG_STYLES = {
  'MCP': 'tag-mcp',
  'NHIM': 'tag-nhim',
  'Agentic AI': 'tag-agentic',
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (h < 1) return 'Just now'
  if (h < 24) return `${h}h ago`
  if (d < 7) return `${d}d ago`
  return new Date(dateStr).toLocaleDateString()
}

export default function ArticleCard({ article, size = 'normal' }) {
  const { title, link, pubDate, summary, aiSummary, source, topics = [] } = article

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className={`card block p-5 animate-fade-in group ${size === 'large' ? 'col-span-2' : ''}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">
            {source}
          </span>
          {topics.map(t => (
            <span key={t} className={`tag ${TAG_STYLES[t] || 'tag-mcp'}`}>{t}</span>
          ))}
        </div>
        <span className="text-xs text-slate-600 whitespace-nowrap shrink-0">{timeAgo(pubDate)}</span>
      </div>

      <h3 className={`font-semibold text-slate-200 group-hover:text-white transition-colors leading-snug mb-2 ${
        size === 'large' ? 'text-base' : 'text-sm'
      }`}>
        {title}
      </h3>

      {aiSummary ? (
        <div className="mt-2">
          <p className="text-xs text-slate-400 leading-relaxed">{aiSummary}</p>
          <div className="mt-2 flex items-center gap-1 text-xs text-blue-500/70">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span>AI Summary</span>
          </div>
        </div>
      ) : (
        summary && (
          <p className="text-xs text-slate-500 leading-relaxed mt-1 line-clamp-3">{summary}</p>
        )
      )}

      <div className="mt-3 flex items-center gap-1 text-xs text-blue-400/50 group-hover:text-blue-400/80 transition-colors">
        <span>Read full article</span>
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </a>
  )
}
