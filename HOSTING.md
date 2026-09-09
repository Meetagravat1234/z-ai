# 🚀 Free Hosting Guide for CareerNest

This guide walks you through deploying CareerNest to free hosting services. The app is built with Next.js 16, so it deploys perfectly to Vercel (the company behind Next.js).

**Total monthly cost: $0** (with free tiers of Vercel + Supabase + Vercel Cron)

---

## Architecture overview

```
┌─────────────────────────────────────────────────────────┐
│  Vercel (free) — hosts the Next.js app                  │
│  - Serverless functions for all /api/* routes            │
│  - Static + server-rendered pages                        │
│  - Automatic HTTPS + custom domain support               │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│  Supabase (free) — PostgreSQL database                  │
│  - 500MB storage (enough for ~100k jobs)                │
│  - Automatic backups                                     │
│  - Connection pooling for serverless                     │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│  Vercel Cron (free) — replaces the mini-service         │
│  - Hits /api/sync/parallel every 30 minutes             │
│  - No separate process to maintain                       │
└─────────────────────────────────────────────────────────┘
```

### Why not Render / Railway / Fly.io?

| Option | Free tier | Problem for CareerNest |
|---|---|---|
| **Vercel** ✅ | Yes — generous | None. Perfect for Next.js. |
| **Render** | Yes — but sleeps after 15 min inactivity | Cron stops when app sleeps |
| **Railway** | $5 free credit/month | Runs out after ~3 weeks of usage |
| **Fly.io** | 3 shared VMs | More complex to set up |
| **Cloudflare Pages** | Yes | Next.js on Pages has limitations (no ISR, limited API routes) |

**Vercel wins** because:
1. Built by the same team that makes Next.js — best-in-class Next.js support
2. Free forever for hobby projects (not just a trial)
3. Vercel Cron Jobs are free and built-in
4. Automatic deploys from your GitHub repo (every push = new deploy)
5. Edge network (fast globally)
6. Custom domain support on free tier

---

## Step-by-step: Deploy to Vercel + Supabase

### Step 1: Set up Supabase (free PostgreSQL database)

1. Go to **https://supabase.com** → Sign up (use GitHub login)
2. Click **"New project"**
3. Fill in:
   - **Name**: `careernest`
   - **Database password**: generate a strong one and SAVE it (you'll need it)
   - **Region**: choose the closest to your users (e.g., `Mumbai (ap-south-1)` for India)
   - **Pricing plan**: Free
4. Click **"Create new project"** — wait ~2 minutes for it to provision
5. Once ready, go to **Project Settings → Database → Connection string → URI**
6. Copy the connection string. It looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   ```
   Replace `[YOUR-PASSWORD]` with the password you saved.

### Step 2: Update Prisma to use PostgreSQL

In your local clone of the repo:

```bash
git clone https://github.com/Meetagravat1234/z-ai.git
cd z-ai
```

Edit `prisma/schema.prisma` — change the datasource provider from `sqlite` to `postgresql`:

```prisma
datasource db {
  provider = "postgresql"   // was: sqlite
  url      = env("DATABASE_URL")
}
```

Create a `.env` file with your Supabase connection string:

```bash
cp .env.example .env
# Edit .env and set DATABASE_URL to your Supabase connection string
```

Push the schema to your new Postgres database:

```bash
bun install
bun run db:push
bun run scripts/seed.ts   # seed 30 India jobs + companies + articles
```

Commit the schema change:

```bash
git add prisma/schema.prisma
git commit -m "chore: migrate from SQLite to PostgreSQL for production"
git push
```

### Step 3: Deploy to Vercel

1. Go to **https://vercel.com** → Sign up with GitHub (use your `Meetagravat1234` account)
2. Click **"Add New Project"**
3. Import your `Meetagravat1234/z-ai` repo
4. Vercel will auto-detect Next.js — keep all defaults
5. **Add environment variables** (click "Environment Variables" and add each):
   - `DATABASE_URL` = your Supabase connection string
   - `NEXTAUTH_SECRET` = generate one at https://generate-secret.now.sh/ or run `openssl rand -base64 32`
   - `NEXTAUTH_URL` = `https://your-app.vercel.app` (you'll update this after first deploy)
6. Click **"Deploy"**
7. Wait ~2 minutes — Vercel builds and deploys

### Step 4: Set up Vercel Cron (replaces the mini-service)

The `mini-services/job-aggregator` runs on a separate port locally. On Vercel, you can't run a separate process — but you can use **Vercel Cron Jobs** (free) to trigger the sync endpoint.

Create a new file in your repo: `vercel.json` at the project root:

```json
{
  "crons": [
    {
      "path": "/api/sync/parallel",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

Commit and push:

```bash
git add vercel.json
git commit -m "feat: add Vercel Cron for auto-sync every 30 min"
git push
```

Vercel will auto-redeploy with the cron configured. Every 30 minutes, Vercel will hit `https://your-app.vercel.app/api/sync/parallel` which triggers the parallel sync across all sources.

### Step 5: Update NEXTAUTH_URL

After your first deploy, Vercel gives you a URL like `careernest-xyz.vercel.app`. Update the environment variable:

1. Vercel dashboard → your project → **Settings → Environment Variables**
2. Edit `NEXTAUTH_URL` → set to `https://careernest-xyz.vercel.app`
3. Trigger a redeploy (Deployments → "Redeploy")

### Step 6 (optional): Add a custom domain

1. Buy a domain (e.g., `careernest.in` from GoDaddy/Namecheap — ~₹700/year)
2. Vercel dashboard → your project → **Settings → Domains**
3. Add your domain → follow the DNS instructions
4. Update `NEXTAUTH_URL` to your custom domain
5. Vercel auto-provisions HTTPS via Let's Encrypt

---

## Free tier limits (and how to handle them)

### Vercel Hobby (free)
- 100GB bandwidth/month
- 100GB-hours of serverless function execution
- **For CareerNest**: 1 sync every 30 min × ~10s each = ~5 min/day of function execution. **Way under the limit.**

### Supabase Free
- 500MB database storage
- 50,000 monthly active users
- **For CareerNest**: each job is ~2KB. 500MB = ~250,000 jobs. **Plenty.**

### z-ai-web-dev-sdk
- This is the rate-limited one. The 429 errors you're seeing are from this.
- Free tier: ~100 requests/hour
- **Mitigation**: the parallel sync already staggers requests. For more, upgrade to a paid z-ai plan OR reduce the number of web-search queries per cycle.

---

## Alternative: Render (if you want the mini-service)

If you prefer to keep the `mini-services/job-aggregator` running as a separate process (not Vercel Cron):

1. Deploy the main Next.js app to **Vercel** (as above)
2. Deploy the `mini-services/job-aggregator` to **Render** as a "Background Worker":
   - Render dashboard → New → Background Worker
   - Connect your GitHub repo
   - Root directory: `mini-services/job-aggregator`
   - Build command: `bun install`
   - Start command: `bun run start`
   - Add env var: `NEXT_API=https://your-vercel-app.vercel.app`
3. Render's free tier sleeps after 15 min inactivity — your cron would skip cycles.
   - **Workaround**: use an external uptime monitor like **UptimeRobot** (free) to ping the worker every 10 min

---

## Troubleshooting

**"Prisma Client failed to initialize"** — Vercel caches the Prisma client. Add to `package.json`:
```json
"scripts": {
  "postinstall": "prisma generate"
}
```

**"Database connection limit reached"** — Supabase free tier allows 60 connections. Prisma's default pool is 5. Should be fine.

**"Function timeout"** — Vercel Hobby has a 10s default function timeout. The Deep Crawl takes 3-5 min. Increase it:
- Add `maxDuration: 300` to the route's config export:
  ```ts
  export const maxDuration = 300 // 5 minutes
  ```
- Note: Hobby tier allows max 60 seconds per function. Upgrade to Pro ($20/month) for 300s.

**"Cron not firing"** — Vercel Cron only runs in production. Make sure you're hitting the deployed URL, not localhost. Check Vercel dashboard → your project → **Cron Jobs** tab.

---

## Quick reference: env vars you need

| Variable | Where to get it | Example |
|---|---|---|
| `DATABASE_URL` | Supabase → Settings → Database → Connection URI | `postgresql://postgres:abc123@db.xyz.supabase.co:5432/postgres` |
| `NEXTAUTH_SECRET` | Generate at https://generate-secret.now.sh | `a1b2c3d4e5f6...` (32+ random chars) |
| `NEXTAUTH_URL` | Your Vercel app URL | `https://careernest-xyz.vercel.app` |

---

## Total cost breakdown

| Service | Free tier | Your usage | Cost |
|---|---|---|---|
| Vercel Hobby | 100GB bandwidth | ~1GB/month | **$0** |
| Supabase Free | 500MB DB | ~50MB | **$0** |
| Vercel Cron | Free | 48 runs/day | **$0** |
| GitHub | Free | Unlimited public repos | **$0** |
| Custom domain (optional) | — | — | ~₹700/year (~$8) |
| **Total** | | | **$0/month** |

The only thing that could push you to paid tiers is heavy z-ai-web-dev-sdk usage (the AI features). If you hit the 429 rate limits, you'd need to upgrade that specific service.
