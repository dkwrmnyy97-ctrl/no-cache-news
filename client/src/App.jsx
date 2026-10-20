import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Header from './components/Header.jsx'
import DigestSection from './components/DigestSection.jsx'
import ModelStats from './components/ModelStats.jsx'
import ExtraSections from './components/ExtraSections.jsx'
import ChatSection from './components/ChatSection.jsx'
import ReadAloudPlayer from './components/ReadAloudPlayer.jsx'
import PodcastSection from './components/PodcastSection.jsx'
import MobileBriefing from './components/MobileBriefing.jsx'
import { WorldwideLoading, WorldwideError, WorldwideBanner, PodcastUnavailable } from './components/WorldwideNotices.jsx'
import { buildFlatStories } from './utils/flatStories.js'
import useMediaQuery, { DESKTOP_QUERY } from './hooks/useMediaQuery.js'
import {
  DEFAULT_REGIONS, loadCoverage, saveCoverage, loadRegion, saveRegion,
  viewKey, regionLabel, contextLabel,
} from './utils/coverage.js'

const POLL_PENDING_MS = 4000
const POLL_REFRESHING_MS = 15000
const MAX_PENDING_POLLS = 90 // ~6 minutes

export default function App() {
  const [period, setPeriod] = useState('today')
  const [coverage, setCoverage] = useState(loadCoverage)
  const [region, setRegion] = useState(loadRegion)
  const [regions, setRegions] = useState(DEFAULT_REGIONS)
  // One entry per coverage+region view, so selections never overwrite each other.
  const [views, setViews] = useState({})
  const [refreshKey, setRefreshKey] = useState(0)
  const [retryNonce, setRetryNonce] = useState(0)
  const [chatMessages, setChatMessages] = useState([])
  const [pendingScroll, setPendingScroll] = useState(false) // scroll to podcasts once Your Briefing is ready

  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const key = viewKey(coverage, region)
  const viewsRef = useRef(views)
  viewsRef.current = views

  const setView = useCallback((k, v) => setViews(prev => ({ ...prev, [k]: v })), [])

  useEffect(() => {
    let cancelled = false
    let timer = null
    const existing = viewsRef.current[key]
    const current = existing?.loadedFor === refreshKey
    // Already loaded for this refresh and not waiting on a background update.
    if (current && existing.status === 'ready' && !existing.refreshing) return
    if (current && existing.status === 'error') return

    async function run(attempt) {
      if (attempt === 0 && !(current && existing.status === 'ready')) setView(key, { status: 'loading', loadedFor: refreshKey })
      try {
        if (coverage === 'mine') {
          // Your Briefing: unchanged endpoint and behaviour.
          const res = await fetch('/api/briefing')
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const briefing = await res.json()
          if (!cancelled) setView(key, { status: 'ready', briefing, loadedFor: refreshKey })
          return
        }
        const res = await fetch(`/api/worldwide/briefing?region=${encodeURIComponent(region)}`)
        const body = await res.json().catch(() => ({}))
        if (cancelled) return
        if (Array.isArray(body.regions)) setRegions(body.regions)
        if (body.status === 'ready' && body.briefing?.region === region) {
          setView(key, { status: 'ready', briefing: body.briefing, stale: body.stale, refreshing: body.refreshing, loadedFor: refreshKey })
          if (body.refreshing) timer = setTimeout(() => run(attempt + 1), POLL_REFRESHING_MS)
        } else if (body.status === 'pending') {
          if (attempt < MAX_PENDING_POLLS) {
            setView(key, { status: 'pending', loadedFor: refreshKey })
            timer = setTimeout(() => run(attempt + 1), POLL_PENDING_MS)
          } else {
            setView(key, { status: 'error', error: 'This is taking longer than expected.', loadedFor: refreshKey })
          }
        } else {
          setView(key, { status: 'error', error: body.error || `HTTP ${res.status}`, loadedFor: refreshKey })
        }
      } catch (e) {
        if (!cancelled) setView(key, { status: 'error', error: e.message, loadedFor: refreshKey })
      }
    }
    run(0)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [key, coverage, region, refreshKey, retryNonce, setView])

  async function handleRefresh() {
    await fetch('/api/refresh', { method: 'POST' })
    setViews({})
    setRefreshKey(k => k + 1)
  }

  function retry() {
    setViews(prev => { const next = { ...prev }; delete next[key]; return next })
    setRetryNonce(n => n + 1)
  }

  function changeCoverage(c) {
    setCoverage(c)
    saveCoverage(c)
  }

  function changeRegion(r) {
    setRegion(r)
    saveRegion(r)
  }

  // "View USA recommendations": switch to Your Briefing, then scroll to the inline podcasts.
  function viewUsaPodcasts() {
    changeCoverage('mine')
    setPendingScroll(true)
  }

  const view = views[key] || { status: 'loading' }
  const briefing = view.status === 'ready' ? view.briefing : null

  useEffect(() => {
    if (!pendingScroll || coverage !== 'mine' || !briefing) return
    setPendingScroll(false)
    requestAnimationFrame(() => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      document.getElementById('podcasts')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
    })
  }, [pendingScroll, coverage, briefing])

  // Canonical story list: same dataset rendered on screen, used by ReadAloudPlayer
  const flatStories = useMemo(() => buildFlatStories(briefing, period), [briefing, period])

  const isWorldwide = coverage === 'worldwide'
  const activeRegionLabel = regionLabel(regions, region)
  const activeRegion = regions.find(r => r.id === region)
  const ctxLabel = contextLabel(coverage, regions, region, period)
  const chatContext = useMemo(() => ({ coverage, region, period, label: ctxLabel }), [coverage, region, period, ctxLabel])
  const isEmpty = Boolean(briefing) && flatStories.length === 0

  const readAloud = briefing && (
    <ReadAloudPlayer
      key={`${key}:${period}`}
      stories={flatStories}
      period={period}
      audioParams={isWorldwide ? `&coverage=worldwide&region=${encodeURIComponent(region)}` : ''}
      intro={isWorldwide
        ? `Here's your worldwide AI and cybersecurity briefing${region === 'all' ? '' : `, from ${activeRegionLabel}`}. `
        : "Here's your AI and cybersecurity briefing. "}
    />
  )

  const notices = isWorldwide && briefing && (
    <WorldwideBanner
      state={view}
      regionLabel={activeRegionLabel}
      regionDescription={activeRegion?.description}
      period={period}
      isEmpty={isEmpty}
    />
  )

  const chat = (
    <ChatSection messages={chatMessages} setMessages={setChatMessages} context={chatContext} />
  )

  // Podcasts are USA-only: inline recommendations in Your Briefing, a notice in Worldwide.
  const podcasts = isWorldwide
    ? <PodcastUnavailable compact={!isDesktop} onViewUsa={viewUsaPodcasts} />
    : <PodcastSection period={period} />

  function renderBody() {
    if (view.status === 'loading' || view.status === 'pending') {
      if (isWorldwide) return <WorldwideLoading />
      return (
        <div className="flex flex-col items-center justify-center py-40 text-slate-600">
          <div className="w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-5" />
          <p className="text-sm font-medium text-slate-500">Generating your AI briefing...</p>
          <p className="text-xs mt-1">Analyzing articles from 9+ sources</p>
        </div>
      )
    }
    if (view.status === 'error') {
      if (isWorldwide) return <WorldwideError message={view.error} onRetry={retry} onSwitchToMine={() => changeCoverage('mine')} />
      return (
        <div className="card p-10 text-center">
          <p className="text-slate-500 text-sm mb-3">Could not load briefing: {view.error}</p>
          <button onClick={retry} className="text-blue-400 text-sm hover:underline">Try again</button>
        </div>
      )
    }
    if (!briefing) return null

    if (!isDesktop) {
      return (
        <MobileBriefing
          briefing={briefing}
          period={period}
          selectionKey={key}
          contextText={ctxLabel}
          readAloud={readAloud}
          notices={notices}
          podcasts={podcasts}
          chat={chat}
        />
      )
    }

    // Desktop: the existing expanded layout.
    return (
      <>
        {readAloud}
        {notices}
        <DigestSection briefing={briefing} period={period} />
        <ExtraSections briefing={briefing} period={period} />
        <ModelStats stats={briefing[period]?.model_stats} leaderStats={briefing[period]?.leader_stats} period={period} />
        {podcasts}
        {chat}
      </>
    )
  }

  return (
    <div className="min-h-screen bg-navy-950">
      <Header
        period={period}
        onPeriodChange={setPeriod}
        onRefresh={handleRefresh}
        lastUpdated={briefing?.generated_at}
        totalArticles={briefing?._total}
        isFallback={briefing?._fallback}
        coverage={coverage}
        onCoverageChange={changeCoverage}
        region={region}
        onRegionChange={changeRegion}
        regions={regions}
        compact={!isDesktop}
      />

      <main className="max-w-screen-xl mx-auto px-3 sm:px-6 py-5 sm:py-8 space-y-5 sm:space-y-8">
        {renderBody()}

        <footer className="text-center py-6 text-xs text-slate-800 border-t border-navy-800">
          AI Intelligence Dashboard · Powered by Claude · Data refreshes every 30 minutes
        </footer>
      </main>
    </div>
  )
}
