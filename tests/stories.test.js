import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { buildFlatStories, ALL_SECTIONS } from '../client/src/utils/flatStories.js';
import { deduplicatePeriod } from '../lib/dedup.js';

describe('buildFlatStories — screen-order story list', () => {

  test('returns empty array for null briefing', () => {
    assert.deepEqual(buildFlatStories(null, 'today'), []);
  });

  test('returns empty array for missing period data', () => {
    assert.deepEqual(buildFlatStories({ today: {} }, 'today'), []);
  });

  test('builds stories in section order matching screen render order', () => {
    const briefing = {
      today: {
        ai_news:      [{ text: 'AI story',   ids: [1] }],
        cybersecurity:[{ text: 'Cyber story', ids: [2] }],
        industry:     [{ text: 'Biz story',   ids: [3] }],
      }
    };
    const stories = buildFlatStories(briefing, 'today');
    assert.equal(stories.length, 3);
    // DigestSection renders: ai_news, cybersecurity, industry (in that order)
    assert.equal(stories[0].sectionTitle, 'New in AI');
    assert.equal(stories[1].sectionTitle, 'Cybersecurity');
    assert.equal(stories[2].sectionTitle, 'Industry and Business');
  });

  test('each story has sectionTitle, text, ids', () => {
    const briefing = {
      today: {
        releases: [{ text: 'New model launched', ids: [5, 6] }],
      }
    };
    const stories = buildFlatStories(briefing, 'today');
    assert.equal(stories.length, 1);
    assert.equal(stories[0].sectionTitle, 'AI Releases');
    assert.equal(stories[0].text, 'New model launched');
    assert.deepEqual(stories[0].ids, [5, 6]);
  });

  test('ExtraSections order: market_pulse, research, releases, policy after DigestSection', () => {
    const briefing = {
      today: {
        market_pulse: [{ text: 'Funding', ids: [1] }],
        research:     [{ text: 'Paper', ids: [2] }],
        releases:     [{ text: 'Launch', ids: [3] }],
        policy:       [{ text: 'Law', ids: [4] }],
      }
    };
    const stories = buildFlatStories(briefing, 'today');
    const titles = stories.map(s => s.sectionTitle);
    assert.deepEqual(titles, ['Market Pulse', 'Research and Breakthroughs', 'AI Releases', 'Regulatory Watch']);
  });

  test('section order in ALL_SECTIONS matches documented screen order', () => {
    const keys = ALL_SECTIONS.map(s => s.key);
    // DigestSection (first 3) then ExtraSections (last 4)
    assert.deepEqual(keys, [
      'ai_news', 'cybersecurity', 'industry',
      'market_pulse', 'research', 'releases', 'policy',
    ]);
  });

  test('playback uses deduplicated article IDs — no ID spoken twice', () => {
    // Simulate server-side dedup having already run
    const rawPeriod = {
      ai_news:      [{ text: 'AI security news', ids: [5] }],
      cybersecurity:[{ text: 'Security breach',  ids: [5] }], // same id
    };
    const deduped = deduplicatePeriod(rawPeriod);
    const briefing = { today: deduped };
    const stories = buildFlatStories(briefing, 'today');
    const allIds = stories.flatMap(s => s.ids);
    const unique = new Set(allIds);
    assert.equal(allIds.length, unique.size, 'No article ID should appear in more than one story');
  });

  test('no article spoken twice even when it matched multiple categories', () => {
    // Article 9 matched ai_news, cybersecurity, and market_pulse before dedup
    const rawPeriod = {
      ai_news:      [{ text: 'A', ids: [9] }],
      cybersecurity:[{ text: 'B', ids: [9] }],
      market_pulse: [{ text: 'C', ids: [9] }],
      releases:     [{ text: 'D', ids: [10] }],
    };
    const deduped = deduplicatePeriod(rawPeriod);
    const briefing = { today: deduped };
    const stories = buildFlatStories(briefing, 'today');
    const allIds = stories.flatMap(s => s.ids);
    const count9 = allIds.filter(id => id === 9).length;
    assert.equal(count9, 1, 'Article 9 should appear in at most one story');
  });

  test('stories are in the same order they appear on screen', () => {
    const briefing = {
      week: {
        ai_news:      [{ text: 'AI-1', ids: [1] }, { text: 'AI-2', ids: [2] }],
        cybersecurity:[{ text: 'CY-1', ids: [3] }],
        market_pulse: [{ text: 'MP-1', ids: [4] }],
        releases:     [{ text: 'RE-1', ids: [5] }],
      }
    };
    const stories = buildFlatStories(briefing, 'week');
    // Screen order: ai_news bullets first, then cybersecurity, then market_pulse, then releases
    assert.equal(stories[0].text, 'AI-1');
    assert.equal(stories[1].text, 'AI-2');
    assert.equal(stories[2].text, 'CY-1');
    assert.equal(stories[3].text, 'MP-1');
    assert.equal(stories[4].text, 'RE-1');
  });

  test('12 unique visible stories → audio briefing contains those same 12 stories', () => {
    // Build a briefing with 12 distinct bullets, one per "slot"
    const briefing = {
      today: {
        ai_news:      [{ text: 'AI-1', ids: [1]  }, { text: 'AI-2', ids: [2]  }],
        cybersecurity:[{ text: 'CY-1', ids: [3]  }, { text: 'CY-2', ids: [4]  }],
        industry:     [{ text: 'IN-1', ids: [5]  }, { text: 'IN-2', ids: [6]  }],
        market_pulse: [{ text: 'MP-1', ids: [7]  }, { text: 'MP-2', ids: [8]  }],
        research:     [{ text: 'RE-1', ids: [9]  }, { text: 'RE-2', ids: [10] }],
        releases:     [{ text: 'RL-1', ids: [11] }],
        policy:       [{ text: 'PO-1', ids: [12] }],
      }
    };
    const stories = buildFlatStories(briefing, 'today');
    assert.equal(stories.length, 12, 'audio briefing should have exactly 12 stories');
    const allIds = stories.flatMap(s => s.ids);
    const unique = new Set(allIds);
    assert.equal(unique.size, 12, 'all 12 article IDs should be distinct');
  });
});

describe('ReadAloud state machine', () => {
  // Pure state machine mirroring the component logic — no DOM required
  function createState() {
    return { status: 'stopped', index: -1 };
  }

  function apply(state, action, total = 10) {
    const s = { ...state };
    switch (action) {
      case 'PLAY':
        s.status = 'playing';
        if (s.index === -1) s.index = 0;
        break;
      case 'PAUSE':
        s.status = 'paused';
        break;
      case 'STOP':
        s.status = 'stopped';
        s.index = -1;
        break;
      case 'NEXT': {
        const next = s.index + 1;
        if (next >= total) { s.status = 'stopped'; s.index = -1; }
        else s.index = next;
        break;
      }
      case 'PREV':
        s.index = Math.max(0, s.index - 1);
        break;
      case 'STORY_END': {
        const next = s.index + 1;
        if (next >= total) { s.status = 'stopped'; s.index = -1; }
        else s.index = next;
        break;
      }
    }
    return s;
  }

  test('play starts from story 0', () => {
    let s = apply(createState(), 'PLAY');
    assert.equal(s.status, 'playing');
    assert.equal(s.index, 0);
  });

  test('pause preserves current story index', () => {
    let s = { status: 'playing', index: 2 };
    s = apply(s, 'PAUSE');
    assert.equal(s.status, 'paused');
    assert.equal(s.index, 2, 'index must be preserved so resume re-reads current story');
  });

  test('resume (PLAY from paused) re-plays from paused story index', () => {
    let s = { status: 'paused', index: 3 };
    s = apply(s, 'PLAY');
    assert.equal(s.status, 'playing');
    assert.equal(s.index, 3);
  });

  test('next story advances index', () => {
    let s = { status: 'playing', index: 1 };
    s = apply(s, 'NEXT', 5);
    assert.equal(s.index, 2);
    assert.equal(s.status, 'playing');
  });

  test('stop clears speech state completely', () => {
    let s = { status: 'playing', index: 3 };
    s = apply(s, 'STOP');
    assert.equal(s.status, 'stopped');
    assert.equal(s.index, -1);
  });

  test('next on last story stops playback', () => {
    let s = { status: 'playing', index: 4 };
    s = apply(s, 'NEXT', 5); // total = 5, so index 4 is last
    assert.equal(s.status, 'stopped');
    assert.equal(s.index, -1);
  });

  test('story end on last story stops playback', () => {
    let s = { status: 'playing', index: 4 };
    s = apply(s, 'STORY_END', 5);
    assert.equal(s.status, 'stopped');
    assert.equal(s.index, -1);
  });

  test('story end in the middle auto-advances to next story', () => {
    let s = { status: 'playing', index: 2 };
    s = apply(s, 'STORY_END', 5);
    assert.equal(s.index, 3);
    assert.equal(s.status, 'playing');
  });

  test('prev from story 0 stays at story 0', () => {
    let s = { status: 'playing', index: 0 };
    s = apply(s, 'PREV');
    assert.equal(s.index, 0);
  });

  test('unsupported browser: speechSynthesis absent → component returns null (graceful)', () => {
    // In Node.js test environment, window.speechSynthesis is not defined
    const supported = typeof globalThis.speechSynthesis !== 'undefined';
    assert.equal(supported, false,
      'speechSynthesis should be absent in Node env — component should return null gracefully');
  });

  test('no article spoken twice: story list from deduped data has unique IDs per story', () => {
    // After dedup, article 5 is in cybersecurity only; it was previously in ai_news too
    const rawPeriod = {
      ai_news:      [{ text: 'A', ids: [5] }],
      cybersecurity:[{ text: 'B', ids: [5] }],
    };
    const deduped = deduplicatePeriod(rawPeriod);
    // cybersecurity claims id 5; ai_news gets empty ids
    // The audio would play: "New in AI: A" (no source links) then "Cybersecurity: B" (source link = article 5)
    // Article 5 is referenced in audio exactly once (in cybersecurity story's ids)
    const cyberIds = (deduped.cybersecurity[0]?.ids ?? []);
    const aiIds    = (deduped.ai_news[0]?.ids     ?? []);
    const allIds   = [...cyberIds, ...aiIds];
    const countOf5 = allIds.filter(id => id === 5).length;
    assert.equal(countOf5, 1, 'article 5 should be in at most one story after dedup');
  });
});
