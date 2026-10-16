// Section priority: the first section in this list that claims an article ID "wins".
// An article can only appear in one section's ids array across the full page.
export const SECTION_PRIORITY = [
  'cybersecurity',
  'releases',
  'research',
  'market_pulse',
  'policy',
  'ai_news',
  'industry',
];

/**
 * Ensure each article ID appears in at most one section's bullet ids array,
 * assigning each article to the highest-priority section that claims it first.
 * Bullet text is kept even when all its source IDs are removed (the summary stands alone).
 */
export function deduplicatePeriod(periodData) {
  if (!periodData || typeof periodData !== 'object') return periodData;

  const seenIds = new Set();
  const result = {};

  for (const section of SECTION_PRIORITY) {
    const bullets = periodData[section];
    if (bullets === undefined) continue;

    if (!Array.isArray(bullets)) {
      result[section] = bullets;
      continue;
    }

    result[section] = bullets.map(bullet => {
      if (!Array.isArray(bullet?.ids) || bullet.ids.length === 0) return bullet;
      const uniqueIds = bullet.ids.filter(id => !seenIds.has(id));
      uniqueIds.forEach(id => seenIds.add(id));
      return uniqueIds.length === bullet.ids.length
        ? bullet
        : { ...bullet, ids: uniqueIds };
    });
  }

  // Pass through any sections not in SECTION_PRIORITY unchanged
  for (const key of Object.keys(periodData)) {
    if (!(key in result)) result[key] = periodData[key];
  }

  return result;
}
