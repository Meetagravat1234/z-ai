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
| `RESEND_API_KEY` | `re_xxxxxxxxx` | For sending job alert emails |
| `RESEND_FROM_EMAIL` | `alerts@hirebase.in` | From address on alert emails |
| `NEXT_PUBLIC_APP_URL` | `https://www.hirebase.in` | Used in email links |
| `CRON_SECRET` | (random 32-char hex string) | Protects /api/alerts/send from abuse |

---

## Step 5: Set up Job Alerts email (Resend + cron-job.org)

The job alerts feature lets users get daily/weekly emails with new jobs matching their criteria. The code is already in the repo — you just need to wire up email + cron.

### 5a. Sign up for Resend (3 min, free)

1. Go to **https://resend.com** → Sign up (free, 3000 emails/month)
2. **Verify your sending domain**:
   - Resend Dashboard → **Domains** → **Add Domain**
   - Enter: `hirebase.in`
   - Resend will show you **3 DNS records** (SPF, DKIM, MX)
   - Go to your DNS provider (wherever you manage hirebase.in — Cloudflare, GoDaddy, etc.)
   - Add all 3 records exactly as Resend shows
   - Wait 5-30 minutes for DNS propagation
   - Click "Verify" in Resend dashboard — should turn green
3. **Create an API key**:
   - Resend Dashboard → **API Keys** → **Create API Key**
   - Name: `Hirebase Production`
   - Permission: `Sending access`
   - Copy the key (starts with `re_...`) — you won't see it again
4. **Add to Vercel env vars** (Vercel → Settings → Environment Variables):
   - `RESEND_API_KEY` = `re_xxxxx`
   - `RESEND_FROM_EMAIL` = `alerts@hirebase.in`
   - `NEXT_PUBLIC_APP_URL` = `https://www.hirebase.in`

### 5b. Generate CRON_SECRET (1 min)

The `/api/alerts/send` route is protected by a secret token so randos can't trigger mass emails. Generate one:

```bash
openssl rand -hex 32
```

Copy the output (a 64-character hex string). Add to Vercel env vars:
- `CRON_SECRET` = (paste the hex string)

### 5c. Set up the cron job (2 min)

You have **two options** — pick one:

#### Option A: Vercel Cron (recommended, automatic)

Already configured in `vercel.json`. Vercel will automatically hit `/api/alerts/send` daily at **3:30 AM UTC (9:00 AM IST)**. **No action needed** — this works as soon as you set the env vars above and redeploy.

> Note: Vercel Cron on the Hobby plan is limited to **daily** schedules. If you want twice-daily or hourly alert sends, use Option B.

#### Option B: cron-job.org (more flexible)

1. Go to **https://cron-job.org** → Create account (free)
2. Click **"Create Cronjob"**:
   - **Title**: `Hirebase Daily Alerts`
   - **URL**: `https://www.hirebase.in/api/alerts/send`
   - **Request Method**: `GET`
   - **Execution Schedule**: Every day at 09:00 (your local time)
   - **Request Headers** (click "Add header"):
     - Key: `x-cron-secret`
     - Value: (paste your CRON_SECRET from step 5b)
3. Click **"Save"**

### 5d. Test it works (2 min)

1. Sign in to your live site
2. Click **"Job Alerts"** in the sidebar
3. Create a test alert (use your own email)
4. Check your inbox — you should get a **confirmation email** ("Your alert is active ✅")
5. To trigger the first batch send immediately:
   - Either wait until 9 AM IST tomorrow for the cron to fire
   - Or open a terminal and run:
     ```bash
     curl -H "x-cron-secret: YOUR_CRON_SECRET" \
          https://www.hirebase.in/api/alerts/send
     ```
6. You should get an email with matching jobs (if any exist for your criteria)

---

## Troubleshooting

### "max clients reached in session mode" error
Make sure you're using port **6543** in `DATABASE_URL` and port **5432** in `DIRECT_URL`. Copy the URLs exactly from the table above.

### "Tenant/user not found" error
Your Supabase project is in **Singapore** (`ap-southeast-1`). If you created it in a different region, replace `ap-southeast-1` with your region in both URLs.

### Build still fails after updating env vars
1. Go to Vercel → Settings → Environment Variables → verify all vars are set correctly
2. Deployments → Redeploy (don't use cache)

### Login not working on live site
Make sure `NEXTAUTH_URL` is set to your EXACT Vercel URL including `https://`.

### Cron not syncing jobs
Check cron-job.org dashboard — if it shows red, the Vercel function might be timing out. Increase the cron interval to "Every hour" instead of "Every 30 min".

### Alert emails not arriving
1. Check Vercel function logs: Vercel → Project → Logs → filter by `/api/alerts/send`
2. Common causes:
   - `RESEND_API_KEY` not set → log says "RESEND_API_KEY not set"
   - Domain not verified in Resend → log shows Resend API error
   - `CRON_SECRET` not matching → returns 401 Unauthorized
   - No matching jobs found for any alert → log says "no matching jobs" (this is fine, just means nothing to send today)
3. **Gmail-specific**: Gmail sometimes blocks unknown senders. Add `alerts@hirebase.in` to your Google Contacts to improve deliverability.

### User clicks unsubscribe but it doesn't work
Check that `/api/alerts/unsubscribe` route returns HTTP 200. If 404, the unsubscribe token is invalid (alert was deleted). If 500, check the DB connection.

---

## Total cost: $0/month

| Service | Free tier | Your usage | Cost |
|---|---|---|---|
| Vercel Hobby | 100GB bandwidth | ~2GB/month | $0 |
| Supabase Free | 500MB DB | ~50MB | $0 |
| cron-job.org | Unlimited cronjobs | 2 jobs | $0 |
| Resend Free | 3000 emails/month | ~100/month | $0 |
| GitHub | Unlimited public repos | 1 repo | $0 |
| **Total** | | | **$0/month** |
