import { useState, useRef, useEffect } from 'react'

/**
 * Best-effort voice picker for the browser TTS fallback path.
 * Prefers enhanced/premium voices; falls back to any English voice.
 */
function pickBestVoice() {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const en = voices.filter(v => v.lang.startsWith('en'));
  return en.find(v => /enhanced|premium/i.test(v.name))
    || en.find(v => /samantha/i.test(v.name))
    || en.find(v => /google us english/i.test(v.name))
    || en.find(v => v.lang === 'en-US')
    || en[0] || null;
}

/**
 * ReadAloudPlayer
 *
 * Prefers server-side OpenAI TTS (natural voice, zero user setup).
 * Falls back to browser speechSynthesis if OPENAI_API_KEY is not set on the server.
 *
 * props:
 *   stories — flat story list from buildFlatStories(), same data shown on screen
 *   period  — 'today' | 'week' | 'month', passed to /api/audio-briefing
 */
export default function ReadAloudPlayer({ stories, period }) {
  const [status, setStatus] = useState('idle')
  // 'idle' | 'loading' | 'playing' | 'paused' | 'blocked'
  const [mode, setMode] = useState(null)       // null | 'server' | 'browser'
  const [elapsed, setElapsed] = useState(0)
  const [duration, setDuration] = useState(0)
  const [storyIndex, setStoryIndex] = useState(-1) // browser TTS only

  const audioRef    = useRef(null)
  const blobUrlRef  = useRef(null)
  const abortRef    = useRef(null)
  // Refs for values needed inside async/event callbacks
  const statusRef   = useRef('idle')
  const modeRef     = useRef(null)
  const idxRef      = useRef(-1)

  const speechOk = typeof window !== 'undefined' && 'speechSynthesis' in window

  function syncStatus(s) { setStatus(s);      statusRef.current = s; }
  function syncMode(m)   { setMode(m);        modeRef.current   = m; }
  function syncIdx(i)    { setStoryIndex(i);  idxRef.current    = i; }

  // ── cleanup helpers ────────────────────────────────────────────────────────

  function cleanupResources() {
    abortRef.current?.abort();
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; }
    if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null; }
    if (speechOk) window.speechSynthesis.cancel();
  }

  function fullStop() {
    cleanupResources();
    syncStatus('idle'); syncMode(null); syncIdx(-1);
    setElapsed(0); setDuration(0);
  }

  useEffect(() => () => cleanupResources(), []);

  // Reset when period changes (new audio needed) or stories list changes
  useEffect(() => { fullStop(); }, [period, stories]);

  // ── browser TTS ───────────────────────────────────────────────────────────

  function speakAt(index) {
    if (!speechOk || !stories?.length) return;
    window.speechSynthesis.cancel();

    if (index < 0 || index >= stories.length) { syncStatus('idle'); syncIdx(-1); return; }

    syncIdx(index); syncStatus('playing');
    const story = stories[index];
    const intro = index === 0 ? "Here's your AI and cybersecurity briefing for today. " : '';
    const utterance = new SpeechSynthesisUtterance(`${intro}${story.sectionTitle}: ${story.text}`);
    utterance.rate = 0.92;
    const voice = pickBestVoice();
    if (voice) utterance.voice = voice;
    utterance.onend = () => {
      if (statusRef.current === 'playing') speakAt(idxRef.current + 1);
    };
    utterance.onerror = (e) => {
      if (e.error !== 'interrupted' && e.error !== 'canceled') { syncStatus('idle'); syncIdx(-1); }
    };
    window.speechSynthesis.speak(utterance);
  }

  // ── server TTS ────────────────────────────────────────────────────────────

  async function startServerAudio() {
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`/api/audio-briefing?period=${period}`, { signal: controller.signal });
      if (!res.ok) throw new Error(`${res.status}`);

      const blob = await res.blob();
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = URL.createObjectURL(blob);

      const audio = audioRef.current;
      audio.src = blobUrlRef.current;
      syncMode('server');
      try {
        await audio.play();
        syncStatus('playing');
      } catch (playErr) {
        if (playErr.name === 'NotAllowedError') {
          // Autoplay blocked (common on corporate browsers) — show native controls
          syncStatus('blocked');
        } else {
          throw playErr;
        }
      }
    } catch (e) {
      if (e.name === 'AbortError') return; // user stopped during load
      // Server TTS unavailable (no API key, network error, etc.) → browser TTS
      syncMode('browser');
      speakAt(0);
    }
  }

  // ── controls ──────────────────────────────────────────────────────────────

  function handlePlay() {
    if (statusRef.current === 'idle') {
      if (!stories?.length) return;
      syncStatus('loading'); syncMode(null);
      startServerAudio();
    } else if (statusRef.current === 'paused') {
      if (modeRef.current === 'server') {
        audioRef.current?.play();
        syncStatus('playing');
      } else {
        speakAt(idxRef.current >= 0 ? idxRef.current : 0);
      }
    }
  }

  function handlePause() {
    if (modeRef.current === 'server') audioRef.current?.pause();
    else window.speechSynthesis.cancel();
    syncStatus('paused');
  }

  function handleNext() { speakAt(idxRef.current + 1); }
  function handlePrev() { speakAt(Math.max(0, idxRef.current - 1)); }

  // ── render ────────────────────────────────────────────────────────────────

  if (!speechOk) return null; // no TTS capability at all

  const isActive  = status === 'playing' || status === 'paused' || status === 'loading';
  const total     = stories?.length ?? 0;
  const curStory  = storyIndex >= 0 ? stories?.[storyIndex] : null;
  const pct       = duration > 0 ? Math.min(100, (elapsed / duration) * 100) : 0;
  const fmt       = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  return (
    <div className="card px-4 py-3 flex flex-wrap items-center gap-3 border border-navy-700">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 shrink-0">🎧 Listen</span>

      {/* Idle: play button */}
      {!isActive && (
        <button
          onClick={handlePlay}
          disabled={total === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg transition-colors shrink-0"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
          </svg>
          Read Aloud · {total} {total === 1 ? 'story' : 'stories'}
        </button>
      )}

      {/* Loading spinner */}
      {status === 'loading' && (
        <div className="flex items-center gap-2 text-xs text-slate-400 shrink-0">
          <div className="w-3.5 h-3.5 border border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          Preparing audio…
        </div>
      )}

      {/* Active controls */}
      {isActive && status !== 'loading' && (
        <div className="flex items-center gap-1 shrink-0">
          {/* Prev — browser mode only */}
          {mode === 'browser' && (
            <button onClick={handlePrev} disabled={storyIndex <= 0} title="Previous"
              className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 rounded transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Pause / Resume */}
          {status === 'playing' ? (
            <button onClick={handlePause} title="Pause"
              className="p-1.5 text-blue-400 hover:text-blue-300 rounded transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" clipRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" />
              </svg>
            </button>
          ) : (
            <button onClick={handlePlay} title="Resume"
              className="p-1.5 text-blue-400 hover:text-blue-300 rounded transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" clipRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
              </svg>
            </button>
          )}

          {/* Stop */}
          <button onClick={fullStop} title="Stop"
            className="p-1.5 text-slate-400 hover:text-white rounded transition-colors">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" clipRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" />
            </svg>
          </button>

          {/* Next — browser mode only */}
          {mode === 'browser' && (
            <button onClick={handleNext} disabled={storyIndex >= total - 1} title="Next"
              className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 rounded transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Now-playing info */}
      {isActive && status !== 'loading' && (
        <div className="flex-1 min-w-0">
          {mode === 'server' && (
            <>
              {duration > 0 && (
                <div className="w-full h-1 bg-navy-600 rounded-full overflow-hidden mb-1">
                  <div className="h-full bg-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${pct}%` }} />
                </div>
              )}
              <p className="text-xs text-slate-500">
                {duration > 0 ? `${fmt(elapsed)} / ${fmt(duration)}` : 'Playing…'}
              </p>
            </>
          )}
          {mode === 'browser' && curStory && (
            <p className="text-xs text-slate-500 truncate">
              {status === 'playing' ? '▶' : '⏸'} {storyIndex + 1}/{total} · {curStory.sectionTitle}
            </p>
          )}
        </div>
      )}

      {/* Native audio controls — shown when autoplay is blocked by browser policy */}
      {status === 'blocked' ? (
        <audio
          ref={audioRef}
          controls
          className="h-8 flex-1 min-w-0"
          onTimeUpdate={e => { setElapsed(e.target.currentTime); setDuration(e.target.duration || 0); }}
          onEnded={() => { syncStatus('idle'); setElapsed(0); setDuration(0); }}
          onError={() => { syncStatus('idle'); syncMode(null); }}
          onPlay={() => syncStatus('playing')}
        />
      ) : (
        <audio
          ref={audioRef}
          onTimeUpdate={e => { setElapsed(e.target.currentTime); setDuration(e.target.duration || 0); }}
          onEnded={() => { syncStatus('idle'); setElapsed(0); setDuration(0); }}
          onError={() => { syncStatus('idle'); syncMode(null); }}
        />
      )}
    </div>
  );
}
