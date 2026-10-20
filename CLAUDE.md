# Bella AI Dashboard

## Project Overview
A locally-hosted AI news dashboard that aggregates RSS feeds, generates AI-powered briefings via Claude, and supports Q&A about AI industry news. Goal is to eventually deploy as a native iOS app via Capacitor + Railway.

## Architecture
- **Backend**: Node.js + Express (`server.js`) — serves API + built React frontend
- **Frontend**: React + Vite + Tailwind CSS (`client/`)
- **AI**: Anthropic SDK (`@anthropic-ai/sdk`) — `claude-sonnet-4-6` for briefings and chat
- **Caching**: `node-cache` with 30-minute TTL for briefings

## Key Files
- `server.js` — Express server, RSS fetching, Claude integration, API routes
- `client/src/main.jsx` — React app entry point
- `client/src/components/` — UI components (NewsGrid, ArticleCard, TrendsChart, etc.)
- `client/index.html` — PWA-enabled HTML with manifest link
- `client/public/manifest.json` — PWA manifest for "Add to Home Screen"
- `capacitor.config.json` — Capacitor config (`webDir: "client/dist"`)
- `.env` — `ANTHROPIC_API_KEY` and `PORT` (copy from `.env.example`)

## API Routes
- `GET /api/briefing` — fetch + cache AI-generated news digest
- `POST /api/chat` — Q&A against cached articles
- `POST /api/refresh` — flush cache
- `GET /api/worldwide/briefing?region=all|europe|china|apac` — Worldwide coverage; returns 202 `pending` while first generated (client polls)
- `/api/chat` and `/api/audio-briefing` accept `coverage`, `region`, `period` so they use the briefing on screen

## Worldwide coverage
- `lib/worldwide-sources.js` — region registry + international feeds (publisher country, original language). Add a region by adding to `REGIONS` + sources.
- `lib/worldwide.js` — ingest → multilingual relevance filter → dedupe → one Claude call per region → validate citations → cache `briefing:worldwide:<region>`. Never touches the Your Briefing pool.
- Region = where the publisher is based; `bullet.places` = what the story is about.
- Needs `ANTHROPIC_API_KEY`. Scheduled refresh only runs if Worldwide was viewed in the last 24h (3 Claude calls/run).
- Mobile (< md / 768px) uses tiles + bottom-sheet panels (`MobileBriefing.jsx`, `BottomSheet.jsx`); desktop keeps expanded sections.

## Dev Commands
```bash
# Start backend (from project root)
npm start          # production
npm run dev        # watch mode

# Build frontend
cd client && npm run build

# Run frontend dev server (separate from backend)
cd client && npm run dev
```

## Feed Sources
- **AI**: VentureBeat AI, TechCrunch AI, The Verge AI, MIT AI News, Ars Technica, Wired AI
- **Cybersecurity**: The Hacker News, Dark Reading, Krebs on Security, BleepingComputer

## Deployment Plan (Pending)
1. Deploy backend to **Railway** (get public URL)
2. Set `ANTHROPIC_API_KEY` as Railway env var
3. Build frontend with Railway URL as API base
4. Configure `capacitor.config.json` `server.url` to Railway URL
5. `npx cap add ios` → open in Xcode → submit to TestFlight

## Capacitor Notes
- Packages installed: `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`
- Use `./node_modules/.bin/cap` if `npx cap` fails
- Must build frontend (`cd client && npm run build`) before Capacitor sync

## Fallback Mode
If no `ANTHROPIC_API_KEY`, server uses keyword-based `generateFallbackBriefing()` — no Claude call needed. App still works, just without AI-generated summaries.
