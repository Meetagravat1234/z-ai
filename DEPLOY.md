# 🚀 Deploy CareerNest to Vercel (FREE — $0/month)

**Time required: 15 minutes** | **Cost: $0** | **Everything on free tiers**

---

## What you'll set up

| Service | Purpose | Free tier |
|---|---|---|
| **Supabase** | PostgreSQL database | 500MB storage, 50k users |
| **Vercel** | Hosts the Next.js app | 100GB bandwidth |
| **cron-job.org** | Auto-syncs jobs every 30 min | Unlimited jobs |

---

## Step 1: Create Supabase database (5 min)

1. Go to **https://supabase.com** → click "Start your project" → **Sign in with GitHub**
2. Click **"New project"**
3. Fill in:
   - **Name**: `careernest`
   - **Database Password**: click "Generate a password" → **COPY IT** and save somewhere safe (you'll need it)
   - **Region**: `Mumbai (ap-south-1)` (closest to India)
   - **Pricing Plan**: `Free`
4. Click **"Create new project"** → wait ~2 minutes (status bar will say "Setting up project")
5. Once ready, click the **gear icon** (Settings, bottom-left) → **Database**
6. Scroll to **Connection string** → **URI**
7. Copy the URI. It looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.abcdefghijklm.supabase.co:5432/postgres
   ```
8. Replace `[YOUR-PASSWORD]` with the password you saved in step 3
9. **Save this full URL** — you'll need it 3 times (Vercel env var, cron-job.org, and sending to me)

**✅ You now have a free PostgreSQL database. Supabase URL saved.**

---

## Step 2: Deploy to Vercel (7 min)

1. Go to **https://vercel.com** → click **"Sign Up"** → **"Continue with GitHub"**
2. Authorize Vercel to access your GitHub (click "Authorize Vercel")
3. Click **"Add New..."** → **"Project"**
4. Find `Meetagravat1234/z-ai` in the list → click **"Import"**
5. On the **Configure Project** screen:
   - **Framework Preset**: should auto-detect "Next.js" (leave it)
   - **Root Directory**: leave as `./`
6. Expand **"Environment Variables"** → add these **3 variables** (click "Add" after each):

   | Key | Value |
   |---|---|
   | `DATABASE_URL` | Paste your Supabase URL from Step 1.9 |
   | `NEXTAUTH_SECRET` | Go to https://generate-secret.now.sh/ → copy the string → paste here |
   | `NEXTAUTH_URL` | `https://z-ai.vercel.app` (you'll update this after deploy — for now, just type a placeholder like `https://placeholder.com`) |

7. Click **"Deploy"** — wait 2-3 minutes for the build to finish
8. When you see "Congratulations" screen → **COPY the URL** at the top (looks like `https://z-ai-abc123.vercel.app`)

**✅ Your app is now LIVE on the internet!**

---

## Step 3: Fix NEXTAUTH_URL (1 min)

1. Go to your **Vercel dashboard** → click your project (`z-ai`)
2. Go to **Settings** (top tab) → **Environment Variables** (left sidebar)
3. Find `NEXTAUTH_URL` → click the **⋮** (3 dots) → **Edit**
4. Replace the value with the URL you copied in Step 2.8 (e.g. `https://z-ai-abc123.vercel.app`)
5. Click **Save**
6. Go to **Deployments** tab → click the **⋮** next to the latest deploy → **Redeploy** → confirm
7. Wait 1-2 minutes for the rebuild

**✅ Login/signup will now work correctly.**

---

## Step 4: Set up auto-sync every 30 min (2 min)

Vercel's free tier only allows 1 cron job per day. To sync every 30 minutes (for fresh jobs), use **cron-job.org** (free, unlimited):

1. Go to **https://cron-job.org** → click **"Register"** → fill in the form
2. Once logged in, click **"Create Cronjob"**
3. Fill in:
   - **Title**: `CareerNest Auto-Sync`
   - **URL**: `https://YOUR-VERCEL-URL.vercel.app/api/sync/parallel` (replace with your actual Vercel URL from Step 2.8)
   - **Execution Schedule**: select **"Every 30 minutes"** (or "Every 15 minutes" if you want faster updates)
   - **Request Method**: `GET`
4. Click **"Save"**

**✅ Your website will now auto-sync fresh jobs from Greenhouse, Ashby, Remotive, Arbeitnow, The Muse, RemoteOK, We Work Remotely + web-search (LinkedIn/Naukri/Internshala) every 30 minutes.**

---

## Step 5: Send me your Supabase URL (so the sandbox works too)

The sandbox (this chat) uses SQLite locally. Since we switched to PostgreSQL, the sandbox preview is temporarily broken. To fix it:

**Send me your Supabase URL** (the one from Step 1.9, with the password in it). I'll:
1. Update the sandbox's `.env` to use your Supabase database
2. Run `db:push` to create the tables
3. Run the seed script to add 30 India-based starter jobs
4. The sandbox preview will work again, sharing the SAME database as your live Vercel site

So when you add a job in the sandbox Admin Dashboard, it appears on your live site immediately. And when the cron syncs new jobs, they appear in the sandbox too.

---

## After deployment: admin access

Your live site has a default admin account:
- **Email**: `admin@careernest.org`
- **Password**: `admin123`

⚠️ **IMPORTANT**: Change this password immediately after first login:
1. Go to your live site → Sign in with admin credentials
2. Click your avatar → Profile
3. (For now, there's no password change feature — I'll add one if you ask)

---

## Troubleshooting

### "Build failed" on Vercel
- Check that `DATABASE_URL` env var is set correctly (must start with `postgresql://`)
- Check the build logs for the specific error

### "Database connection failed"
- Make sure your Supabase project is not paused (free tier pauses after 7 days of inactivity)
- Go to Supabase dashboard → Settings → General → if paused, click "Restore"

### "Login not working" / "NEXTAUTH_URL error"
- Make sure `NEXTAUTH_URL` env var is set to your exact Vercel URL (including `https://`)
- Make sure you redeployed after changing it

### "Cron not syncing"
- Check cron-job.org dashboard → your cronjob should show green "Success" status
- If it shows red, check the response — might be a Vercel timeout (reduce sources in parallel sync)

### "Only 30 jobs showing"
- The seed script adds 30 India jobs. The cron will add more every 30 minutes.
- You can also manually add jobs via Admin Dashboard → "Fetch from URL"

---

## Total cost: $0/month

| Service | Free tier | Your usage | Cost |
|---|---|---|---|
| Vercel Hobby | 100GB bandwidth | ~2GB/month | $0 |
| Supabase Free | 500MB DB | ~50MB | $0 |
| cron-job.org | Unlimited cronjobs | 1 job | $0 |
| GitHub | Unlimited public repos | 1 repo | $0 |
| **Total** | | | **$0/month** |
