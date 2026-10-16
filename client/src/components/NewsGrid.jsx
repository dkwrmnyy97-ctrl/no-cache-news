import ArticleCard from './ArticleCard.jsx'

function SkeletonCard() {
  return (
    <div className="card p-5 space-y-3">
      <div className="flex gap-2">
        <div className="skeleton h-5 w-24 rounded-full" />
        <div className="skeleton h-5 w-16 rounded-full" />
      </div>
      <div className="skeleton h-4 w-full" />
      <div className="skeleton h-4 w-5/6" />
      <div className="space-y-1.5">
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-3 w-4/5" />
        <div className="skeleton h-3 w-3/4" />
      </div>
    </div>
  )
}

export default function NewsGrid({ articles, loading, title = 'Latest AI News' }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="section-title">{title}</div>
        <div className="flex-1 h-px bg-blue-900/30" />
        {!loading && articles.length > 0 && (
          <span className="text-xs text-slate-600 font-mono">{articles.length} articles</span>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array(9).fill(0).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {articles.map((article, i) => (
            <ArticleCard key={article.link || i} article={article} />
          ))}
        </div>
      )}
    </div>
  )
}
