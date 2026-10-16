import ArticleCard from './ArticleCard.jsx'

function SkeletonCard() {
  return (
    <div className="card p-5 space-y-3">
      <div className="skeleton h-3 w-24" />
      <div className="skeleton h-4 w-full" />
      <div className="skeleton h-4 w-3/4" />
      <div className="skeleton h-3 w-full" />
      <div className="skeleton h-3 w-2/3" />
    </div>
  )
}

export default function CyberSecSection({ articles, loading }) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <div className="section-title">Cybersecurity & AI</div>
        <div className="flex-1 h-px bg-red-900/30" />
        <span className="text-xs text-red-400/60 font-mono">AI-related threats & security</span>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : articles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {articles.map((article, i) => (
            <a
              key={article.link || i}
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="card block p-5 group animate-fade-in border-red-900/20 hover:border-red-500/30"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-red-400 bg-red-400/10 px-2 py-0.5 rounded">
                  {article.source}
                </span>
                <span className="tag tag-cyber">CYBER</span>
              </div>
              <h3 className="text-sm font-semibold text-slate-200 group-hover:text-white leading-snug mb-2 transition-colors">
                {article.title}
              </h3>
              {article.aiSummary ? (
                <p className="text-xs text-slate-400 leading-relaxed">{article.aiSummary}</p>
              ) : (
                article.summary && (
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">{article.summary}</p>
                )
              )}
              <div className="mt-3 flex items-center gap-1 text-xs text-red-400/50 group-hover:text-red-400/80 transition-colors">
                <span>Read more</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="card p-10 text-center text-slate-600">
          <div className="text-3xl mb-2">🛡️</div>
          <p className="text-sm">No cybersecurity articles loaded yet. Try refreshing.</p>
        </div>
      )}
    </section>
  )
}
