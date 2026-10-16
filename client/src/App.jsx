import { useState, useEffect, useCallback, useMemo } from 'react'
import Header from './components/Header.jsx'
import DigestSection from './components/DigestSection.jsx'
import ModelStats from './components/ModelStats.jsx'
import ExtraSections from './components/ExtraSections.jsx'
import ChatSection from './components/ChatSection.jsx'
import ReadAloudPlayer from './components/ReadAloudPlayer.jsx'
import PodcastSection from './components/PodcastSection.jsx'
import { buildFlatStories } from './utils/flatStories.js'

export default function App() {
  const [period, setPeriod] = useState('today')
  const [briefing, setBriefing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const loadBriefing = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/briefing')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setBriefing(await res.json())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [refreshKey])

  useEffect(() => { loadBriefing() }, [loadBriefing])

  async function handleRefresh() {
    await fetch('/api/refresh', { method: 'POST' })
    setRefreshKey(k => k + 1)
  }

  // Canonical story list: same dataset rendered on screen, used by ReadAloudPlayer
  const flatStories = useMemo(() => buildFlatStories(briefing, period), [briefing, period])

  return (
    <div className="min-h-screen bg-navy-950">
      <Header
        period={period}
        onPeriodChange={setPeriod}
        onRefresh={handleRefresh}
        lastUpdated={briefing?.generated_at}
        totalArticles={briefing?._total}
        isFallback={briefing?._fallback}
      />

      <main className="max-w-screen-xl mx-auto px-3 sm:px-6 py-5 sm:py-8 space-y-5 sm:space-y-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 text-slate-600">
            <div className="w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-5" />
            <p className="text-sm font-medium text-slate-500">Generating your AI briefing...</p>
            <p className="text-xs mt-1">Analyzing articles from 9+ sources</p>
          </div>
        ) : error ? (
          <div className="card p-10 text-center">
            <p className="text-slate-500 text-sm mb-3">Could not load briefing: {error}</p>
            <button onClick={loadBriefing} className="text-blue-400 text-sm hover:underline">Try again</button>
          </div>
        ) : briefing ? (
          <>
            <ReadAloudPlayer stories={flatStories} period={period} />
            <DigestSection briefing={briefing} period={period} />
            <ExtraSections briefing={briefing} period={period} />
            <ModelStats stats={briefing[period]?.model_stats} leaderStats={briefing[period]?.leader_stats} period={period} />
            <PodcastSection period={period} />
            <ChatSection />
          </>
        ) : null}

        <footer className="text-center py-6 text-xs text-slate-800 border-t border-navy-800">
          AI Intelligence Dashboard · Powered by Claude · Data refreshes every 30 minutes
        </footer>
      </main>
    </div>
  )
}
