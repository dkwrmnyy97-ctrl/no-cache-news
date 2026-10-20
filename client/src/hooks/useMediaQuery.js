import { useEffect, useState } from 'react'

/** Live media-query match. Used to switch the mobile tile layout below Tailwind's `md` breakpoint. */
export default function useMediaQuery(query) {
  const get = () => typeof window !== 'undefined' && window.matchMedia(query).matches
  const [matches, setMatches] = useState(get)
  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])
  return matches
}

// Tailwind `md` — the project's existing mobile/desktop split (e.g. md:grid-cols-3).
export const DESKTOP_QUERY = '(min-width: 768px)'
