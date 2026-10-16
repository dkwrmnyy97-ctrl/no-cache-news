// Section order must match the on-screen rendering order:
// DigestSection renders the first three, ExtraSections renders the last four.
export const ALL_SECTIONS = [
  { key: 'ai_news',       title: 'New in AI' },
  { key: 'cybersecurity', title: 'Cybersecurity' },
  { key: 'industry',      title: 'Industry and Business' },
  { key: 'market_pulse',  title: 'Market Pulse' },
  { key: 'research',      title: 'Research and Breakthroughs' },
  { key: 'releases',      title: 'AI Releases' },
  { key: 'policy',        title: 'Regulatory Watch' },
];

/**
 * Build the canonical flat list of stories for a given period.
 * Each story is one bullet from one section, in the order they appear on screen.
 * This is the single source of truth for both display and audio playback.
 * Call this on the already-deduplicated briefing from the server.
 */
export function buildFlatStories(briefing, period) {
  if (!briefing || !period) return [];
  const data = briefing[period] || {};
  const stories = [];
  for (const { key, title } of ALL_SECTIONS) {
    for (const bullet of (data[key] || [])) {
      if (bullet?.text) {
        stories.push({ sectionTitle: title, text: bullet.text, ids: bullet.ids || [] });
      }
    }
  }
  return stories;
}
