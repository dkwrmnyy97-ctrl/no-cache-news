// Coverage selection: "Your Briefing" (existing feed) vs "Worldwide".
// Remembered per device in localStorage — no account needed.

export const COVERAGES = [
  { id: 'mine',      label: 'Your Briefing' },
  { id: 'worldwide', label: 'Worldwide' },
]

// Shown before the server reports which regions have coverage.
// The server's list (with availability) replaces this once loaded.
export const DEFAULT_REGIONS = [
  { id: 'all', label: 'All international', available: true },
  { id: 'europe', label: 'Europe', available: false },
  { id: 'china', label: 'China', available: false },
  { id: 'apac', label: 'Asia-Pacific', available: false },
]

export const PERIOD_LABELS = { today: 'Today', week: 'This Week', month: 'This Month' }

const KEY_COVERAGE = 'ncn.coverage'
const KEY_REGION = 'ncn.region'

function read(key) {
  try { return window.localStorage.getItem(key) } catch { return null }
}
function write(key, value) {
  try { window.localStorage.setItem(key, value) } catch { /* private mode etc. */ }
}

export function loadCoverage() {
  return read(KEY_COVERAGE) === 'worldwide' ? 'worldwide' : 'mine'
}
export function saveCoverage(c) { write(KEY_COVERAGE, c) }

export function loadRegion() {
  return read(KEY_REGION) || 'all'
}
export function saveRegion(r) { write(KEY_REGION, r) }

/** Stable key for one briefing view; used for client caches and reading positions. */
export function viewKey(coverage, region) {
  return coverage === 'worldwide' ? `worldwide:${region}` : 'mine'
}

export function regionLabel(regions, id) {
  return regions.find(r => r.id === id)?.label || 'All international'
}

export function contextLabel(coverage, regions, region, period) {
  const base = coverage === 'worldwide' ? `Worldwide · ${regionLabel(regions, region)}` : 'Your Briefing'
  return `${base} · ${PERIOD_LABELS[period]}`
}
