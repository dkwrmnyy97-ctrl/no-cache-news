// Text helpers shared by Read Aloud (TTS) and chat, so both use exactly the
// stories of the briefing the user is looking at.

export const AUDIO_SECTIONS = [
  { key: 'ai_news',       title: 'New in AI' },
  { key: 'cybersecurity', title: 'Cybersecurity' },
  { key: 'industry',      title: 'Industry and Business' },
  { key: 'market_pulse',  title: 'Market Pulse' },
  { key: 'research',      title: 'Research and Breakthroughs' },
  { key: 'releases',      title: 'AI Releases' },
  { key: 'policy',        title: 'Regulatory Watch' },
];

const TTS_LIMIT = 4096; // OpenAI TTS input limit

/**
 * Build the spoken script for one briefing view + period.
 * Whole stories only: when the 4096-char limit is hit, remaining stories are
 * left out and `included` reports how many were actually read.
 */
export function buildTTSScript(briefing, period, intro = "Here's your AI and cybersecurity briefing.") {
  const data = briefing?.[period] || {};
  const stories = [];
  for (const { key, title } of AUDIO_SECTIONS) {
    for (const bullet of (data[key] || [])) {
      if (bullet?.text) stories.push(`${title}: ${bullet.text}`);
    }
  }
  let script = intro;
  let included = 0;
  for (const s of stories) {
    const next = `${script}\n\n${s}`;
    if (next.length > TTS_LIMIT) break;
    script = next;
    included++;
  }
  return { script, included, total: stories.length };
}

/** Plain-text list of the on-screen bullets for a period, used as chat context. */
export function briefingBulletLines(briefing, period, limit = 40) {
  const data = briefing?.[period] || {};
  const lines = [];
  for (const { key, title } of AUDIO_SECTIONS) {
    for (const b of (data[key] || [])) {
      if (b?.text) lines.push(`- [${title}] ${b.text}`);
    }
  }
  return lines.slice(0, limit);
}

const PERIOD_WINDOWS = {
  today: new Set(['today']),
  week: new Set(['today', 'week']),
  month: new Set(['today', 'week', 'month']),
};

/** Articles inside the selected timeframe; falls back to the whole pool when the window is nearly empty. */
export function articlesInPeriod(articles, period) {
  const allowed = PERIOD_WINDOWS[period] || PERIOD_WINDOWS.month;
  const inWindow = articles.filter(a => allowed.has(a._period));
  return inWindow.length >= 3 ? inWindow : articles;
}
