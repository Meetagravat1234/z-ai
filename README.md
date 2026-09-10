# Hirebase 🚀

Career intelligence platform — verified jobs from multiple sources, AI resume tools, salary analytics, and an application tracker.

Built with Next.js 16, TypeScript, Tailwind CSS, Prisma, and z-ai-web-dev-sdk.

## Quick start (local setup)

```bash
# 1. Clone the repo
git clone https://github.com/Meetagravat1234/z-ai.git
cd z-ai

# 2. Install dependencies
bun install

# 3. Set up the database
cp .env.example .env           # creates your local .env
bun run db:push                # creates SQLite schema
bun run scripts/seed.ts        # seeds 30 starter jobs + 22 companies + articles

# 4. Start the dev server
bun run dev
# Open http://localhost:3000
```

## Features

### Job discovery
- **Live sync** from 10+ sources every 30 minutes (Greenhouse, Ashby, Remotive, Arbeitnow, The Muse, RemoteOK, We Work Remotely, Indeed RSS, + web-search across LinkedIn/Naukri/Internshala/Google Jobs)
- AI-enriched job descriptions (rewritten Markdown + extracted skills/salary/experience)
- Browse by category: Freshers, Internships, Walk-in, Hidden/referral
- Company profiles with hiring velocity and 7-day trends
- Job detail page with Apply button → redirects to official employer site + adds to tracker

### AI tools (powered by z-ai-web-dev-sdk)
1. **AI Resume Optimizer** — tailor resume to any job description
2. **AI Cover Letter** — generate personalized cover letters
3. **AI Mock Interview** — interactive chat with an AI interviewer
4. **Salary Predictor** — predict salary range + negotiation tips
5. **Skill Gap Analyzer** — find missing skills + personalized learning path
6. **Resume ATS Score Checker** — get ATS compatibility score (0-100) + fix recommendations

### Insights & decision tools
- **Salary Benchmark Dashboard** — interactive charts (salary by role/company/city/experience)
- **Interview Question Bank** — 40+ real questions with AI-generated model answers
- **Job Comparison Tool** — compare 2-3 jobs side by side

### My career
- **Saved Jobs** — bookmark jobs for later
- **Application Tracker** — Kanban board (Wishlist → Applied → Screening → Interview → Offer → Rejected) with drag-and-drop

## Project structure

```
.
├── prisma/schema.prisma        # Database models (Job, Company, User, SavedJob, Application, Article, JobSync)
├── scripts/
│   ├── seed.ts                 # Seeds initial data
│   └── backfill-hash.ts        # One-time migration for dedup hashes
├── src/
│   ├── app/
│   │   ├── api/                # API routes (jobs, companies, articles, save, applications, sync, ai/*)
│   │   ├── layout.tsx          # Root layout with theme provider
│   │   └── page.tsx            # Main SPA page (view router)
│   ├── components/
│   │   ├── layout/             # Sidebar, top nav, bottom nav
│   │   ├── views/              # 20+ view components
│   │   ├── jobs/               # Job card, etc.
│   │   └── command/            # Cmd+K command palette
│   └── lib/
│       ├── nav-store.ts        # Zustand navigation state
│       ├── db.ts               # Prisma client
│       ├── utils.ts            # cn() helper
│       └── job-sources/        # Source adapters (Greenhouse, Ashby, web-search, career-page crawler, etc.)
└── mini-services/
    └── job-aggregator/         # Cron service (every 30 min) — triggers parallel sync
```

## Tech stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui (New York) + Lucide icons |
| Database | Prisma ORM + SQLite |
| State | Zustand (client) + TanStack Query (server, available) |
| Auth | NextAuth.js v4 (available — not yet wired) |
| Charts | recharts |
| AI | z-ai-web-dev-sdk (chat completions, web_search, page_reader) |
| Cron | node-cron (in mini-service) |

## Useful commands

```bash
bun run dev              # Start dev server (port 3000)
bun run lint             # ESLint
bun run db:push          # Apply schema changes to SQLite
bun run db:generate      # Regenerate Prisma Client
bun run db:reset         # Reset DB (destroys all data)
bun run scripts/seed.ts  # Re-seed initial data

# Mini-service (job aggregator cron) — separate process
cd mini-services/job-aggregator
bun install
bun run dev              # Runs on port 3001, cron every 30 min
```

## Sync modes

In the **Live Sync Status** page (sidebar → "Live Sync Status LIVE"):

- **Single sync** — round-robin, 1 source per click
- **⚡ Boost Sync** — 14 sources in parallel (~2 min)
- **🚀 Deep Crawl** — ALL 34 sources (all APIs + 12 web-search queries + 8 career-page crawlers, ~3-5 min, adds 100-200 jobs)

## Notes

- This project was built in a sandbox environment. The `.env` file is gitignored — copy `.env.example` to `.env` on your local machine.
- The SQLite database (`db/custom.db`) is gitignored. Run `bun run db:push && bun run scripts/seed.ts` to recreate it locally.
- The job-aggregator mini-service is optional — the main app works fine without it (you just won't get auto-syncs every 30 min). To enable live sync, run it in a separate terminal.
- All AI features require the `z-ai-web-dev-sdk` package, which is already in `package.json`.
