# 🚀 Deploy Hirebase to Vercel (FREE — $0/month)

**Time required: 15 minutes** | **Cost: $0** | **Everything on free tiers**

---

## What you'll set up

| Service | Purpose | Free tier |
|---|---|---|
| **Supabase** | PostgreSQL database | 500MB storage, 50k users |
| **Vercel** | Hosts the Next.js app | 100GB bandwidth |
| **cron-job.org** | Auto-syncs jobs every 30 min | Unlimited jobs |

---

## ✅ You've already done: Supabase project created

Your Supabase project is set up and the database is **already populated** with:
- ✅ 30 India jobs (Google, Amazon, NVIDIA, Cisco, Accenture, etc.)
- ✅ 22 companies
- ✅ 12 career articles
- ✅ 1 admin user (`admin@hirebase.org` / `admin123`)

Your Supabase credentials:
- **Project ref**: `cggjtjzshhwzbycobrud`
- **Region**: Singapore (`ap-southeast-1`)
- **Password**: `Dadvameet@1234` (URL-encoded as `Dadvameet%401234`)

---

## ⚠️ The fix for the connection error

You hit the "max clients reached in session mode" error because the build was using port 5432 (session pooler, only 15 connections). The fix:

**Use TWO different URLs:**
- `DATABASE_URL` = port **6543** (transaction pooler — many concurrent connections, for runtime app)
- `DIRECT_URL` = port **5432** (session pooler — for migrations only)

---

## What you need to do NOW (5 minutes)

### Step 1: Update env vars in Vercel (3 min)

1. Go to **Vercel Dashboard** → your project (`z-ai`) → **Settings** → **Environment Variables**
2. **Update `DATABASE_URL`** — click ⋮ → Edit → replace value with:
   ```
   postgresql://postgres.cggjtjzshhwzbycobrud:Dadvameet%401234@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```
   Note: port is **6543** (no `?pgbouncer=true` needed)
3. **Add a new env var** — click "Add New":
   - **Key**: `DIRECT_URL`
   - **Value**: 
   ```
   postgresql://postgres.cggjtjzshhwzbycobrud:Dadvameet%401234@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
   ```
   Note: port is **5432** here
4. **Update `NEXTAUTH_URL`** — click ⋮ → Edit → set to your Vercel URL (e.g. `https://z-ai-abc123.vercel.app`)
5. **Add `SKIP_ENRICHMENT`** env var (so sync fits in Vercel's 60s timeout):
   - **Key**: `SKIP_ENRICHMENT`
   - **Value**: `true`

### Step 2: Redeploy (2 min)

1. Go to **Deployments** tab
2. Click **⋮** next to the failed deployment → **Redeploy**
3. Wait 3-5 minutes — build should succeed this time

### Step 3: Set up auto-sync every 30 min (2 min)

1. Go to **https://cron-job.org** → "Register" (free)
2. Click **"Create Cronjob"**:
   - **Title**: `Hirebase Auto-Sync`
   - **URL**: `https://YOUR-VERCEL-URL.vercel.app/api/sync/parallel` (replace with your actual Vercel URL)
   - **Execution Schedule**: select **"Every 30 minutes"** (or "Every 15 minutes" for faster updates)
   - **Request Method**: `GET`
3. Click **"Save"**

### Step 4: Log in to your live site

1. Open your Vercel URL (`https://z-ai-XXX.vercel.app`)
2. Click **"Sign in"** (top right) → switch to **"Log in"** mode
3. Use: `admin@hirebase.org` / `admin123`
4. Click **"Admin Dashboard"** in the sidebar → **"Fetch from URL"** tab → paste any job URL → "Fetch & preview job" → "Save job to website"

---

## Summary of Vercel env vars you need

| Key | Value | Why |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres.cggjtjzshhwzbycobrud:Dadvameet%401234@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres` | App runtime (port 6543, transaction pooler) |
| `DIRECT_URL` | `postgresql://postgres.cggjtjzshhwzbycobrud:Dadvameet%401234@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres` | Schema migrations during build (port 5432) |
| `NEXTAUTH_SECRET` | `k7m2n8p4q9r3s6t1u5v0w2x8y4z1a6b3` | JWT signing |
| `NEXTAUTH_URL` | `https://z-ai-XXX.vercel.app` (your Vercel URL) | Auth callback URLs |
| `SKIP_ENRICHMENT` | `true` | Skip AI during sync (fits in Vercel 60s limit) |

---

## Troubleshooting

### "max clients reached in session mode" error
Make sure you're using port **6543** in `DATABASE_URL` and port **5432** in `DIRECT_URL`. Copy the URLs exactly from the table above.

### "Tenant/user not found" error
Your Supabase project is in **Singapore** (`ap-southeast-1`). If you created it in a different region, replace `ap-southeast-1` with your region in both URLs.

### Build still fails after updating env vars
1. Go to Vercel → Settings → Environment Variables → verify all 5 vars are set correctly
2. Deployments → Redeploy (don't use cache)

### Login not working on live site
Make sure `NEXTAUTH_URL` is set to your EXACT Vercel URL including `https://`.

### Cron not syncing jobs
Check cron-job.org dashboard — if it shows red, the Vercel function might be timing out. Increase the cron interval to "Every hour" instead of "Every 30 min".

---

## Total cost: $0/month

| Service | Free tier | Your usage | Cost |
|---|---|---|---|
| Vercel Hobby | 100GB bandwidth | ~2GB/month | $0 |
| Supabase Free | 500MB DB | ~50MB | $0 |
| cron-job.org | Unlimited cronjobs | 1 job | $0 |
| GitHub | Unlimited public repos | 1 repo | $0 |
| **Total** | | | **$0/month** |
