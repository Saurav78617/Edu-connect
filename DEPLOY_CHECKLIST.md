# 🎯 PRODUCTION DEPLOYMENT - QUICK CHECKLIST

## ✅ Repo Status: DEPLOYMENT READY ✅

```
✓ Code builds successfully (npm run build)
✓ TypeScript passes (npm run lint)  
✓ Docker configured (Dockerfile present)
✓ .env.production template created
✓ DEPLOY.md guide added
✓ Latest commit pushed to GitHub (d374c4a)
```

---

## 🚀 Quick Deploy (Choose One Platform)

### Option 1️⃣: Render.com (Recommended - Free Tier Available)

**STEP-BY-STEP:**

1. Go to: https://dashboard.render.com
2. Click **New +** → **Web Service**
3. Click **Deploy from GitHub repo**
4. Search for & select: `Saurav78617/Edu-connect`
5. Fill settings:
   ```
   Name: edu-connect
   Environment: Node
   Build Command: npm install && npm run build
   Start Command: npm start
   Plan: Free
   ```
6. Click **Create Web Service**
7. Click **Environment** tab → Add variables:
   ```
   DATABASE_URL = postgresql://user:pass@host:port/db
   JWT_SECRET = (generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
   NODE_ENV = production
   PORT = 3000
   GOOGLE_CLIENT_ID = your_google_client_id
   GEMINI_API_KEY = your_gemini_key
   RAZORPAY_KEY_ID = your_razorpay_id
   RAZORPAY_KEY_SECRET = your_razorpay_secret
   EMAIL_USER = your_email@gmail.com
   EMAIL_PASS = your_app_password
   VITE_GOOGLE_CLIENT_ID = your_google_client_id
   ```
8. Click **Deploy** → Wait 5-10 mins
9. ✅ Live at: `https://edu-connect.onrender.com`

---

### Option 2️⃣: Railway.app (Even Simpler)

**STEP-BY-STEP:**

1. Go to: https://railway.app/dashboard
2. Click **New Project** → **Deploy from GitHub Repo**
3. Select: `Saurav78617/Edu-connect`
4. Railway auto-detects your Dockerfile ✓
5. Click **Variables** tab → Add all from "Option 1" list
6. Click **Deploy**
9. ✅ Live at: Railway-generated URL

---

### Option 3️⃣: Vercel (For Frontend Focus)

If you want React frontend on Vercel + API on another service:

1. Go to: https://vercel.com/new
2. Select GitHub repo: `Saurav78617/Edu-connect`
3. Vercel will auto-configure for Vite + Node.js
4. Add environment variables from the list above
5. Deploy

Note: Vercel is primarily for frontend; consider pairing with:
- Vercel API routes for lightweight endpoints
- OR separate backend on Render/Railway for Express API

---

## 📦 Setting Up PostgreSQL (Free Options)

### If using Render:
- In Render dashboard: **New +** → **PostgreSQL**
- Render auto-provides `DATABASE_URL`
- Copy to your Web Service environment variables

### If using Railway:
- In Railway project: **+ Add** → **PostgreSQL**
- Railway auto-injects `DATABASE_URL`

### If using external DB:
- Supabase (PostgreSQL): https://supabase.com
- Vercel Postgres: https://vercel.com/postgres
- AWS RDS free tier: https://aws.amazon.com/rds/free/

---

## 🔐 Getting Required API Keys

| Service | Get Key At | Time |
|---------|-----------|------|
| **Google OAuth** | https://console.cloud.google.com | 5 min |
| **Gemini API Key** | https://ai.google.dev | 2 min |
| **Razorpay Keys** | https://dashboard.razorpay.com | 10 min |
| **Gmail App Password** | https://myaccount.google.com/apppasswords | 3 min |
| **JWT Secret** | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` | 1 min |

---

## ✨ Post-Deployment Checks

Once live, verify:

```bash
# 1. Frontend loads
curl https://your-domain.com/

# 2. API responds
curl https://your-domain.com/api/mentors

# 3. Database connected
# Try creating an account in the UI

# 4. Check logs for errors
# Render: Dashboard → Web Service → Logs
# Railway: Dashboard → Deployment → Logs
```

---

## 📊 Auto-Deploy Setup (CI/CD)

After initial deployment:

### Render
- Dashboard → Web Service → **Settings**
- Enable **Auto Deploy** from `main` branch
- Now every `git push` auto-deploys ✅

### Railway  
- Similar: Enable auto-deploy from branch settings

---

## 💡 Tips

1. **First deployment takes 5-10 mins** (builds Docker image)
2. **Free tier scales down after inactivity** (OK for dev/demo)
3. **Use strong JWT_SECRET** (min 32 random chars)
4. **Never commit real `.env`** (already in .gitignore ✓)
5. **Monitor logs** if deployment fails
6. **Database migrations auto-run** via `npx prisma db push`

---

## 🆘 Troubleshooting

| Issue | Fix |
|-------|-----|
| **Build fails** | Check logs; ensure `npm install` works locally |
| **App crashes** | Missing env var; check DATABASE_URL and JWT_SECRET |
| **Database errors** | Verify PostgreSQL URL format: `postgresql://user:pass@host:port/db` |
| **Port issues** | Render/Railway ignore EXPOSE; use PORT env var (set to 3000) |
| **403 CORS errors** | Frontend needs `VITE_GOOGLE_CLIENT_ID` set |

---

## 📞 Need Help?

1. Check [DEPLOY.md](./DEPLOY.md) for detailed guide
2. View live logs in Render/Railway dashboard
3. Check GitHub Actions (if CI/CD enabled)

---

## 🎉 You're Production-Ready!

Choose your platform above and click to deploy. Takes ~15 minutes total.

**Let's ship it! 🚀**
