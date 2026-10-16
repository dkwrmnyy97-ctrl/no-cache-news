import { useState, useRef, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const SUGGESTIONS = [
  "What's the world's reaction to Claude Opus?",
  "How are AI agents being adopted by enterprises?",
  "What are the latest NHIM security threats?",
  "Which AI company had the biggest news this week?",
  "What do industry leaders say about AI regulation?",
]

function ChatMessage({ msg }) {
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="bg-blue-600/20 border border-blue-500/30 text-slate-200 text-sm px-4 py-3 rounded-2xl rounded-tr-sm max-w-lg">
          {msg.content}
        </div>
      </div>
    )
  }

  if (msg.role === 'error') {
    return (
      <div className="flex justify-start">
        <div className="bg-red-900/20 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-2xl rounded-tl-sm max-w-lg">
          {msg.content}
        </div>
      </div>
    )
  }

  const { summary, key_points = [], industry_quotes = [], chart_data = [], articles = [], sentiment } = msg.data || {}

  const SENTIMENT_COLORS = {
    positive: '#22c55e',
    negative: '#ef4444',
    mixed: '#f59e0b',
    neutral: '#64748b',
  }

  const BAR_COLORS = ['#3b82f6', '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b']

  return (
    <div className="flex justify-start">
      <div className="max-w-2xl w-full space-y-4 animate-fade-in">
        {/* AI icon + summary */}
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-xs font-black text-white shrink-0 mt-0.5">
            AI
          </div>
          <div className="card p-5 flex-1">
            {sentiment && (
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-slate-600">Sentiment:</span>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ color: SENTIMENT_COLORS[sentiment], background: `${SENTIMENT_COLORS[sentiment]}20` }}
                >
                  {sentiment}
                </span>
              </div>
            )}
            <p className="text-sm text-slate-300 leading-relaxed">{summary}</p>

            {key_points.length > 0 && (
              <div className="mt-4 space-y-2">
                {key_points.map((pt, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1 shrink-0">•</span>
                    <p className="text-xs text-slate-400 leading-relaxed">{pt}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chart */}
        {chart_data.length > 0 && (
          <div className="sm:ml-10 card p-5">
            <div className="section-title mb-4">Related Metrics</div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chart_data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{ background: '#0d1526', border: '1px solid #1a2b4a', borderRadius: 8, fontSize: 12 }}
                  cursor={{ fill: 'rgba(59,130,246,0.05)' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chart_data.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Industry quotes */}
        {industry_quotes.length > 0 && (
          <div className="sm:ml-10 card p-5">
            <div className="section-title mb-3">Industry Perspective</div>
            <div className="space-y-3">
              {industry_quotes.map((q, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-blue-500/40 text-2xl leading-none mt-0.5">"</span>
                  <p className="text-xs text-slate-400 leading-relaxed italic">{q}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Article links */}
        {articles.length > 0 && (
          <div className="sm:ml-10 card p-5">
            <div className="section-title mb-3">Read More</div>
            <div className="space-y-2">
              {articles.map((a, i) => (
                <a
                  key={i}
                  href={a.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 group"
                >
                  <span className="text-blue-500/50 text-xs mt-0.5 shrink-0">{i + 1}.</span>
                  <div>
                    <p className="text-xs text-slate-400 group-hover:text-blue-400 transition-colors leading-snug font-medium">
                      {a.title}
                    </p>
                    <p className="text-xs text-slate-700 mt-0.5">{a.source}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ChatSection() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(query) {
    const q = query || input.trim()
    if (!q || loading) return

    setInput('')
    setMessages(m => [...m, { role: 'user', content: q }])
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      })
      const data = await res.json()

      if (!res.ok) {
        setMessages(m => [...m, { role: 'error', content: data.error || 'Request failed' }])
      } else {
        setMessages(m => [...m, { role: 'assistant', data }])
      }
    } catch {
      setMessages(m => [...m, { role: 'error', content: 'Network error — is the server running?' }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="card p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-lg">💬</span>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Ask Your AI Analyst</h2>
        <span className="ml-2 text-xs text-slate-700">Powered by Claude</span>
      </div>

      {/* Suggestions (shown when no messages) */}
      {messages.length === 0 && (
        <div className="mb-6">
          <p className="text-xs text-slate-600 mb-3">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => sendMessage(s)}
                className="text-xs px-3 py-2 bg-navy-700/60 hover:bg-navy-600/60 border border-navy-600 hover:border-slate-600 text-slate-400 hover:text-slate-200 rounded-lg transition-all text-left"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      {messages.length > 0 && (
        <div className="space-y-6 mb-6 max-h-[800px] overflow-y-auto pr-1">
          {messages.map((msg, i) => (
            <ChatMessage key={i} msg={msg} />
          ))}
          {loading && (
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-xs font-black text-white shrink-0">
                AI
              </div>
              <div className="card px-5 py-4 flex items-center gap-2">
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
                <span className="text-xs text-slate-600">Analyzing...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Input */}
      <div className="flex gap-3">
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask about any AI topic, company, model, or trend..."
          className="flex-1 bg-navy-800 border border-navy-600 focus:border-blue-500/50 focus:outline-none rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-700 transition-colors"
          disabled={loading}
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          className="px-5 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all"
        >
          Ask
        </button>
      </div>
    </div>
  )
}
