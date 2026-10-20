import { useEffect, useId, useRef, useState } from 'react'
import BottomSheet from './BottomSheet.jsx'
import { BulletList } from './StoryList.jsx'
import { SECTIONS as DIGEST_SECTIONS, digestHeading } from './DigestSection.jsx'
import { SECTIONS as EXTRA_SECTIONS, extrasHeading } from './ExtraSections.jsx'
import { ModelActivityList, LeaderList, periodPhrase } from './ModelStats.jsx'

function plural(n, one, many) {
  return `${n} ${n === 1 ? one : many}`
}

function Chevron() {
  return (
    <svg aria-hidden="true" className="w-3.5 h-3.5 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}

/**
 * Category tile: emoji left of the headline, count under the headline
 * (aligned with it), chevron right. Titles wrap only between words; the grid
 * guarantees each tile is wide enough for the longest word.
 */
function Tile({ section, count, onOpen }) {
  const countText = plural(count, 'story', 'stories')
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-haspopup="dialog"
      aria-label={`${section.title}, ${countText}. Opens panel.`}
      className={`tile ${section.accent} border text-left min-h-[64px] pl-2.5 pr-2 py-3 flex items-center gap-1.5`}
    >
      <span aria-hidden="true" className="text-base leading-snug shrink-0 self-start">{section.icon}</span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-semibold text-slate-100 leading-snug">{section.title}</span>
        <span className={`block text-xs mt-0.5 ${count ? 'text-slate-400' : 'text-slate-600'}`}>{countText}</span>
      </span>
      <Chevron />
    </button>
  )
}

/** Full-width compact row (Industry & Business): emoji, title, count beside it, chevron at the far right. */
function RowTile({ section, count, onOpen }) {
  const countText = plural(count, 'story', 'stories')
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-haspopup="dialog"
      aria-label={`${section.title}, ${countText}. Opens panel.`}
      className={`tile ${section.accent} border col-span-full text-left min-h-[48px] pl-2.5 pr-2 py-2.5 flex items-center gap-1.5`}
    >
      {/* Pinned to the title's first line, so it stays beside the title if the count wraps. */}
      <span aria-hidden="true" className="text-base leading-snug shrink-0 self-start">{section.icon}</span>
      <span className="flex-1 min-w-0 flex flex-wrap items-baseline gap-x-2">
        <span className="text-sm font-semibold text-slate-100 leading-snug">{section.title}</span>
        <span className={`text-xs ${count ? 'text-slate-400' : 'text-slate-600'}`}>{countText}</span>
      </span>
      <Chevron />
    </button>
  )
}

// Two columns while a tile is wide enough for its longest title word
// ("Breakthroughs") without breaking it; 10.5rem scales with text size, so
// very large text (or a sub-375px screen) drops to one column instead.
const TILE_GRID = 'grid gap-2 grid-cols-[repeat(auto-fit,minmax(10.5rem,1fr))]'

function GroupHeading({ children }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <h2 className="text-xs font-bold uppercase tracking-widest text-slate-600">{children}</h2>
      <div className="flex-1 h-px bg-navy-700" />
    </div>
  )
}

const STATS_TABS = [
  { id: 'models', label: 'Model Activity', icon: '🧠' },
  { id: 'leaders', label: 'Industry Leaders', icon: '👔' },
]

/**
 * Model Activity / Industry Leaders as two text tabs over one inline card.
 * Content and formatting are the desktop cards' (ModelStats.jsx), stacked for mobile.
 */
function StatsTabs({ data, period }) {
  const [tab, setTab] = useState('models')
  const baseId = useId()
  const refs = useRef({})
  const models = data.model_stats || []
  const leaders = data.leader_stats || []
  const phrase = periodPhrase(period)

  function onKeyDown(e) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    const next = tab === 'models' ? 'leaders' : 'models'
    setTab(next)
    refs.current[next]?.focus()
  }

  const isModels = tab === 'models'
  return (
    <section>
      <div role="tablist" aria-label="Model Activity and Industry Leaders" className="flex gap-6 border-b border-navy-700 mb-3" onKeyDown={onKeyDown}>
        {STATS_TABS.map(t => {
          const selected = tab === t.id
          return (
            <button
              key={t.id}
              ref={el => { refs.current[t.id] = el }}
              type="button"
              role="tab"
              id={`${baseId}-${t.id}-tab`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setTab(t.id)}
              className={`min-h-[44px] -mb-px border-b-2 text-sm font-semibold transition-colors ${
                selected ? 'border-blue-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      <div role="tabpanel" id={`${baseId}-panel`} aria-labelledby={`${baseId}-${tab}-tab`} className="card p-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg" aria-hidden="true">{isModels ? '🧠' : '👔'}</span>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">{isModels ? 'Model Activity' : 'Industry Leaders'}</h3>
          <span className="ml-auto text-xs text-slate-700 text-right">{isModels ? `by news mentions ${phrase}` : `in the news ${phrase}`}</span>
        </div>
        {isModels
          ? (models.length ? <ModelActivityList stats={models} /> : <p className="text-xs text-slate-600 py-4 text-center">No model mentions for this period.</p>)
          : (leaders.length ? <LeaderList leaderStats={leaders} /> : <p className="text-xs text-slate-600 py-4 text-center">No leader mentions for this period.</p>)}
      </div>
    </section>
  )
}

/**
 * Mobile-only layout. News categories are compact tiles that open reading
 * panels; Model Activity / Industry Leaders, podcasts and chat stay inline.
 * Desktop keeps the existing expanded sections (see App.jsx).
 */
export default function MobileBriefing({ briefing, period, selectionKey, contextText, readAloud, notices, podcasts, chat }) {
  const [active, setActive] = useState(null)
  // Reading position per category, scoped to coverage + region + timeframe.
  const positions = useRef(new Map())

  const data = briefing?.[period] || {}
  const articles = briefing?._articles || []
  const posKey = id => `${selectionKey}:${period}:${id}`

  // A panel's content belongs to one selection; close it if the selection changes underneath.
  useEffect(() => { setActive(null) }, [selectionKey, period])

  const count = s => data[s.key]?.length || 0
  const sectionDef = [...DIGEST_SECTIONS, ...EXTRA_SECTIONS].find(s => s.key === active)

  return (
    <div className="space-y-6">
      {readAloud}
      {notices}

      <section>
        <GroupHeading>{digestHeading(period)}</GroupHeading>
        <div className={TILE_GRID}>
          <Tile section={DIGEST_SECTIONS[0]} count={count(DIGEST_SECTIONS[0])} onOpen={() => setActive(DIGEST_SECTIONS[0].key)} />
          <Tile section={DIGEST_SECTIONS[1]} count={count(DIGEST_SECTIONS[1])} onOpen={() => setActive(DIGEST_SECTIONS[1].key)} />
          <RowTile section={DIGEST_SECTIONS[2]} count={count(DIGEST_SECTIONS[2])} onOpen={() => setActive(DIGEST_SECTIONS[2].key)} />
        </div>
      </section>

      <section>
        <GroupHeading>{extrasHeading(period)}</GroupHeading>
        <div className={TILE_GRID}>
          {EXTRA_SECTIONS.map(s => <Tile key={s.key} section={s} count={count(s)} onOpen={() => setActive(s.key)} />)}
        </div>
      </section>

      <StatsTabs data={data} period={period} />

      {podcasts}
      {chat}

      {sectionDef && (
        <BottomSheet
          key={active}
          title={sectionDef.title}
          subtitle={contextText}
          onClose={() => setActive(null)}
          initialScrollTop={positions.current.get(posKey(active)) || 0}
          onScrollPositionChange={top => positions.current.set(posKey(active), top)}
        >
          <BulletList bullets={data[sectionDef.key]} articles={articles} />
        </BottomSheet>
      )}
    </div>
  )
}
