import { COVERAGES } from '../utils/coverage.js'

function RegionOptions({ regions, region }) {
  return regions.map(r => (
    <option key={r.id} value={r.id} disabled={!r.available && r.id !== region}>
      {r.label}{!r.available && r.id !== 'all' ? ' (no coverage yet)' : ''}
    </option>
  ))
}

const GLOBE = 'M21 12a9 9 0 11-18 0 9 9 0 0118 0zM3.6 9h16.8M3.6 15h16.8M12 3a15 15 0 010 18M12 3a15 15 0 000 18'

/**
 * Your Briefing | Worldwide, plus a Region dropdown shown only in Worldwide.
 * Regions without working ingestion/coverage are listed but disabled.
 *
 * variant 'pill' — desktop: segmented control + boxed dropdown
 * variant 'tabs' — mobile: underlined text tabs + plain-text dropdown ("All international ▾")
 */
export default function CoverageSelector({ coverage, onCoverageChange, region, onRegionChange, regions, variant = 'pill' }) {
  if (variant === 'tabs') {
    const current = regions.find(r => r.id === region)?.label || 'All international'
    return (
      <div className="flex items-end justify-between gap-3 mb-2 border-b border-navy-700">
        <div role="group" aria-label="Coverage" className="flex gap-5">
          {COVERAGES.map(c => {
            const active = coverage === c.id
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={active}
                onClick={() => onCoverageChange(c.id)}
                className={`min-h-[44px] -mb-px border-b-2 text-sm font-semibold whitespace-nowrap transition-colors ${
                  active ? 'border-blue-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                {c.label}
              </button>
            )
          })}
        </div>

        {coverage === 'worldwide' && (
          // The visible text is a label; the native <select> sits invisibly on top so
          // the OS picker still opens on tap and keyboard/screen readers work normally.
          <label className="relative min-h-[44px] flex items-center min-w-0 text-sm font-semibold text-cyan-300 rounded focus-within:outline focus-within:outline-2 focus-within:outline-blue-500">
            <span className="sr-only">Region</span>
            <span aria-hidden="true" className="truncate">{current}</span>
            <span aria-hidden="true" className="ml-1 text-xs text-cyan-400/80">▾</span>
            <select
              value={region}
              onChange={e => onRegionChange(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-base"
            >
              <RegionOptions regions={regions} region={region} />
            </select>
          </label>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mb-2">
      <div role="group" aria-label="Coverage" className="flex items-center gap-1 bg-navy-800 rounded-lg p-1 border border-navy-600 flex-1 min-w-[12.5rem]">
        {COVERAGES.map(c => {
          const active = coverage === c.id
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={active}
              onClick={() => onCoverageChange(c.id)}
              className={`flex-1 min-h-[32px] px-2 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                active
                  ? 'bg-slate-100 text-navy-950 shadow-sm'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {c.id === 'worldwide' && (
                <svg aria-hidden="true" className="inline w-3.5 h-3.5 mr-1 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={GLOBE} />
                </svg>
              )}
              {c.label}
            </button>
          )
        })}
      </div>

      {coverage === 'worldwide' && (
        <label className="relative flex-none">
          <span className="sr-only">Region</span>
          <select
            value={region}
            onChange={e => onRegionChange(e.target.value)}
            className="appearance-none bg-navy-800 border border-navy-600 hover:border-slate-600 focus:border-blue-500/60 focus:outline-none rounded-lg pl-2.5 pr-7 py-2 text-xs font-semibold text-slate-200"
          >
            <RegionOptions regions={regions} region={region} />
          </select>
          <svg aria-hidden="true" className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </label>
      )}
    </div>
  )
}
