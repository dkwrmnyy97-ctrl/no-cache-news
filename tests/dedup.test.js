import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { deduplicatePeriod, SECTION_PRIORITY } from '../lib/dedup.js';

// Helper: collect all IDs across every section in a period result
function allIds(periodResult) {
  const ids = [];
  for (const section of SECTION_PRIORITY) {
    for (const bullet of (periodResult[section] || [])) {
      ids.push(...(bullet.ids || []));
    }
  }
  return ids;
}

describe('deduplicatePeriod — cross-category behavior', () => {

  test('one article matching one category → displayed once', () => {
    const period = {
      ai_news: [{ text: 'OpenAI news', ids: [1] }],
      cybersecurity: [],
    };
    const result = deduplicatePeriod(period);
    assert.deepEqual(result.ai_news[0].ids, [1]);
    assert.deepEqual(allIds(result), [1]);
  });

  test('one article matching three categories → appears in highest-priority section only', () => {
    // Article 5 matches cybersecurity, releases, and ai_news
    // cybersecurity has highest priority → it claims article 5
    const period = {
      ai_news:      [{ text: 'OpenAI security model', ids: [5] }],
      cybersecurity:[{ text: 'OpenAI security model', ids: [5] }],
      releases:     [{ text: 'OpenAI security model', ids: [5] }],
    };
    const result = deduplicatePeriod(period);
    assert.deepEqual(result.cybersecurity[0].ids, [5], 'cybersecurity should claim article 5');
    assert.deepEqual(result.releases[0].ids,      [],  'releases should have article 5 removed');
    assert.deepEqual(result.ai_news[0].ids,       [],  'ai_news should have article 5 removed');
  });

  test('two different articles about the same company → both remain visible', () => {
    const period = {
      ai_news: [{ text: 'OpenAI launches new model', ids: [1] }],
      industry:[{ text: 'Enterprises react to OpenAI new model', ids: [2] }],
    };
    const result = deduplicatePeriod(period);
    assert.deepEqual(result.ai_news[0].ids,  [1], 'first article kept');
    assert.deepEqual(result.industry[0].ids, [2], 'second distinct article kept');
    assert.equal(allIds(result).length, 2);
  });

  test('same article ID cannot appear in two section ids arrays', () => {
    const period = {
      ai_news:      [{ text: 'AI security breach', ids: [10, 11] }],
      cybersecurity:[{ text: 'Security detail',    ids: [10] }],
      market_pulse: [{ text: 'Funding for AI sec', ids: [11] }],
    };
    const result = deduplicatePeriod(period);
    const ids = allIds(result);
    const unique = new Set(ids);
    assert.equal(ids.length, unique.size, 'each article ID must appear at most once across all sections');
  });

  test('final page-level article list contains each article ID only once', () => {
    const period = {
      ai_news:       [{ text: 'A', ids: [1] }, { text: 'B', ids: [2, 3] }],
      cybersecurity: [{ text: 'C', ids: [3, 4] }],
      industry:      [{ text: 'D', ids: [2, 5] }],
      releases:      [{ text: 'E', ids: [6] }],
      market_pulse:  [{ text: 'F', ids: [1, 6] }],
      research:      [{ text: 'G', ids: [7] }],
      policy:        [{ text: 'H', ids: [4, 7] }],
    };
    const result = deduplicatePeriod(period);
    const ids = allIds(result);
    const unique = new Set(ids);
    assert.equal(ids.length, unique.size, 'final article list must have no duplicate IDs');
    // All 7 distinct article IDs should be present somewhere
    assert.equal(unique.size, 7, 'all 7 articles should appear exactly once');
  });

  test('bullet text is preserved even when all its IDs are removed', () => {
    const period = {
      cybersecurity: [{ text: 'Cyber story', ids: [1] }],
      ai_news:       [{ text: 'AI story referencing same article', ids: [1] }],
    };
    const result = deduplicatePeriod(period);
    // cybersecurity claims id 1; ai_news bullet keeps its text but loses id 1
    assert.equal(result.ai_news[0].text, 'AI story referencing same article');
    assert.deepEqual(result.ai_news[0].ids, []);
  });

  test('handles null/undefined/empty period gracefully', () => {
    assert.equal(deduplicatePeriod(null), null);
    assert.equal(deduplicatePeriod(undefined), undefined);
    assert.deepEqual(deduplicatePeriod({}), {});
  });

  test('SECTION_PRIORITY: cybersecurity outranks ai_news', () => {
    const cyIdx = SECTION_PRIORITY.indexOf('cybersecurity');
    const aiIdx = SECTION_PRIORITY.indexOf('ai_news');
    assert(cyIdx < aiIdx, `cybersecurity (${cyIdx}) should have higher priority than ai_news (${aiIdx})`);
  });

  test('SECTION_PRIORITY: releases outranks ai_news', () => {
    const relIdx = SECTION_PRIORITY.indexOf('releases');
    const aiIdx  = SECTION_PRIORITY.indexOf('ai_news');
    assert(relIdx < aiIdx, `releases (${relIdx}) should have higher priority than ai_news (${aiIdx})`);
  });

  test('sections not in SECTION_PRIORITY pass through unchanged', () => {
    const period = {
      ai_news:   [{ text: 'A', ids: [1] }],
      spotlight: [{ text: 'S', ids: [1] }], // unknown section
    };
    const result = deduplicatePeriod(period);
    // spotlight is not in SECTION_PRIORITY, so it keeps id 1
    assert.deepEqual(result.spotlight[0].ids, [1]);
  });
});
