# No Cache News

**AI moves fast. Attention is finite.**

A personal AI-news intelligence dashboard. It pulls articles from AI and cybersecurity publications, uses Claude to organize them into a categorized briefing for Today / This Week / This Month, and lets you ask follow-up questions about the news.

Live at **[nocachenews.com](https://nocachenews.com)**.

![Today's briefing](docs/screenshots/today-briefing.jpg)

## The problem

AI news arrives from many directions at once: research, product launches, policy, security incidents, funding, and developer tooling. No single source covers all of it, and generic aggregators don't add hierarchy. You end up either overloaded or under-informed.

**Who it's for:** I built it for my own daily review: someone in identity and security who needs a fast, structured picture of the AI landscape. I made it public after other people asked to use it.

## What it does

- **Multi-source aggregation.** The server fetches RSS feeds in parallel, up to 15 items per feed:
  - AI: VentureBeat AI, TechCrunch AI, The Verge AI, MIT News (AI), Ars Technica, Wired AI
  - Cybersecurity: The Hacker News, Dark Reading, Krebs on Security, BleepingComputer
- **Claude-generated briefing.** Up to 80 recent articles go to Claude in a single prompt. Claude returns structured JSON for each period (today, week, month) with these sections:
  - New in AI
  - Cybersecurity & AI Identity
  - Industry & Business
  - Market Pulse
  - Research
  - AI Releases
  - Regulatory Watch

  Each bullet links back to its source articles.
- **De-duplication.** `lib/dedup.js` makes sure a story appears in only one section, chosen by section priority. This is covered by unit tests.
- **Model activity and industry leaders.** The dashboard tracks how often models and leaders are mentioned, with sentiment.
- **"Ask your AI analyst" chat.** The server picks relevant cached articles by keyword score, and Claude answers with a summary, key points, sentiment, and chart data. The client renders the chart with Recharts.
- **Podcast suggestions.** The server collects recent episodes from six AI podcast feeds, and Claude picks the ones most relevant to the current briefing.
- **Read Aloud.** The server builds a script from the briefing and converts it to an MP3 with OpenAI text-to-speech, then caches it. If that fails, the client falls back to the browser's built-in speech synthesis.
- **Worldwide coverage.** A separate view covers AI news from publishers based in Europe, China, and Asia-Pacific, including non-English sources. `lib/worldwide.js` runs its own pipeline: it ingests the regional feeds, filters for relevance across languages, de-duplicates, makes one Claude call per region, and checks that every citation points to a real article. It never mixes with the main briefing. The first request returns `pending` while the briefing is generated, and the client polls until it's ready.
- **Mobile layout.** On phones, sections collapse into tiles that open as bottom sheets. Desktop keeps the expanded layout.
- **Fallback mode.** Without an Anthropic key, the server builds a keyword-based briefing so the app still works.
- **PWA.** You can install it on an iPhone home screen.

| | |
|---|---|
| ![This week sections](docs/screenshots/week-sections.jpg) | ![Model activity](docs/screenshots/model-activity.jpg) |
| ![Podcasts and analyst chat](docs/screenshots/podcasts-and-chat.jpg) | |

## Product decisions

- **Categorization is the product.** Raw aggregation is a solved problem. The value is in the category schema and in deciding what goes where.
- **Designed for scanning, not reading.** The layout is meant for a review of a few minutes, not long reading sessions.
- **Call the model once per cycle, not once per visitor.** Briefings, audio, and podcast picks are cached on the server and shared by every visitor. This keeps the site fast and the API cost bounded.
- **Built for one, opened to others.** Starting from one person's information diet kept the product opinionated.

## Architecture

```
RSS feeds ──► Express server (server.js) ──► Claude (briefing, chat, podcast matching)
                 │   node-cache (in-memory)  └► OpenAI TTS (read-aloud MP3)
                 ▼
          React + Vite client (served as static files by the same server)
```

- **Backend:** Node.js + Express (ES modules), `rss-parser`, `node-cache`, and `@anthropic-ai/sdk`. It uses `claude-sonnet-4-6`.
- **Caching:**
  - Briefing: 2 hours. It is pre-warmed on startup and rebuilt every 2 hours.
  - Stale-while-revalidate: if the cached briefing has expired, the server returns it straight away and rebuilds in the background. A lock stops two rebuilds from running at once.
  - Articles: 1 hour.
  - Podcast suggestions and audio: 30 minutes.
- **Frontend:** React 18, Vite 5, Tailwind CSS 3, Recharts.
- **Hosting (production):** Railway, behind a custom domain. Secrets are set as Railway environment variables and are never shipped to the client.
- **Tests:** `node:test` suites for de-duplication, story flattening, Worldwide coverage (`npm test`), and abuse limits (`node --test tests/abuse-limits.test.js`).

### API

| Route | Purpose |
|---|---|
| `GET /api/briefing` | Cached, Claude-generated briefing for all periods |
| `GET /api/worldwide/briefing?region=all\|europe\|china\|apac` | Worldwide coverage (202 `pending` while first generated) |
| `POST /api/chat` | Q&A over cached articles (rate-limited) |
| `GET /api/podcast-suggestions?period=` | Relevant podcast episodes |
| `GET /api/audio-briefing?period=` | MP3 read-aloud of the briefing |
| `POST /api/refresh` | Clear the cache (admin token required) |

### Security notes

**In this code.** API keys are read only from environment variables and are used only on the server. Routes that cost money are protected in `lib/abuse-limits.js`, and `tests/abuse-limits.test.js` covers these protections:

- **Chat:** per-IP limits (per minute and per day), a 500-character input cap, a global daily cap, and a limit on concurrent requests. Per-IP counters run before input validation, so bad requests still count against the limit.
- **Podcast picks and audio:** concurrent requests for the same item share one upstream call instead of each starting their own.
- **Admin routes** (`/api/refresh`, `/api/admin/client-ip`): require a bearer token (`NEWS_ADMIN_TOKEN`), compared in constant time. If the token isn't set, they return 503 instead of running unauthenticated.

**Design assumptions.** The counters live in memory, so they only work as intended when the server runs as a single instance. They reset on restart, so hard spending limits should also be set in the Anthropic and OpenAI consoles. CORS is open.

**Not verified in production.** This repo is a snapshot of the code, not a record of what's deployed. This README doesn't confirm that nocachenews.com currently runs this version, that `NEWS_ADMIN_TOKEN` is set there, that production runs a single instance, or that console spending limits are in place.

## Running locally

Requirements: Node.js 18 or newer. Production runs a recent Node release.

```bash
npm install
cp .env.example .env        # add your own keys; all are optional
npm run build               # installs and builds the client into client/dist
npm start                   # http://localhost:3001
npm test                    # unit tests
```

For frontend development, run `cd client && npm run dev`. The Vite dev server proxies `/api` to `localhost:3001`.

## Status

**Live** and in daily use. Some leftover components in `client/src/components` are not wired up: `SpotlightSection`, `CyberSecSection`, `TrendsChart`, `MetricsBar`, `NewsGrid`, and `ArticleCard`. `SpotlightSection` calls an endpoint that no longer exists. The Capacitor config is from an early plan for an iOS wrapper; the PWA turned out to be enough.

## How I built it

No Cache News is my product. I defined the problem, the category schema, and the product behavior, and I set up and run the deployment. I came to it from identity and access management rather than software engineering, and I used **Claude Code** as my main implementation tool: it wrote most of the code from my direction, and I reviewed and tested the work. Separately, the running app calls the Claude API for briefings, analyst chat, and podcast picks. `CLAUDE.md` is the project context file I kept for those sessions; parts of it are now out of date. Along the way I learned:

- how RSS works
- DNS (pointing a custom domain at Railway)
- server-side caching

## What's not in this repo

This is a cleaned public copy of my working project. I removed the following:

- environment files and local TLS certificates
- logs
- machine-specific launch and port-forwarding scripts
- an unrelated beta-signup page and its App Store Connect / TestFlight endpoints, which belong to a different project

The copy starts with fresh git history.

## License

No license has been chosen yet, so all rights are reserved by default. Please ask before reusing the code.
