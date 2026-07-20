# 🚀 Production Deployment Guide

This guide walks you through deploying Edu-Connect to production using **Render.com** (recommended) or **Railway.app**.

---

## 📋 Prerequisites

- GitHub account with this repo
- One of:
  - **Render.com** account (free tier available)
  - **Railway.app** account (free tier available)
- Production environment variables ready (see `.env.production`)

---

## 🔑 Required Environment Variables

Before deploying, gather these credentials:

### Essential
- `JWT_SECRET` - Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- `DATABASE_URL` - PostgreSQL connection string (recommended for production)
- `NODE_ENV=production`
- `PORT=3000`

### Authentication
- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` - From [Google Cloud Console](https://console.cloud.google.com)
- `VITE_GOOGLE_CLIENT_ID` - Same as `GOOGLE_CLIENT_ID`

### Services (Optional but recommended)
- `GEMINI_API_KEY` - From [Google AI Studio](https://ai.google.dev)
- `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` - From [Razorpay Dashboard](https://dashboard.razorpay.com)
- `EMAIL_USER` + `EMAIL_PASS` - Gmail account with [App Password](https://myaccount.google.com/apppasswords)

---

## 🎯 Option 1: Deploy to Render.com (Recommended)

### Step 1: Push to GitHub
```bash
git add .
git commit -m "chore: production deployment prep"
git push origin main
```

### Step 2: Create Render Service

1. Go to [render.com](https://render.com)
2. Click **New +** → **Web Service**
3. Connect your GitHub repo (`Saurav78617/Edu-connect`)
4. Fill in:
   - **Name**: `edu-connect`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Free` (or Paid for better uptime)

### Step 3: Add Environment Variables

In Render dashboard:
- Click **Environment** tab
- Add each variable from `.env.production`
- Key ones:
  - `DATABASE_URL` (Render provides a PostgreSQL free tier at `postgres://...`)
  - `JWT_SECRET`
  - `GOOGLE_CLIENT_ID`
  - `GEMINI_API_KEY`
  - etc.

### Step 4: Deploy

Click **Deploy** button. Render will:
- Build your app
- Run migrations via `npx prisma db push`
- Start the server

**Your app will be live at**: `https://edu-connect.onrender.com` (or your custom domain)

---

## 🚂 Option 2: Deploy to Railway.app

### Step 1: Push to GitHub (same as above)

### Step 2: Connect to Railway

1. Go to [railway.app](https://railway.app)
2. Click **New Project** → **Deploy from GitHub Repo**
3. Select `Saurav78617/Edu-connect`
4. Railway auto-detects the Dockerfile

### Step 3: Add Environment Variables

Railway dashboard → **Variables**:
- Add all variables from `.env.production`
- Railway provides PostgreSQL plugin (free tier available)

### Step 4: Deploy

Click **Deploy**. Your app will be live at a generated Railway URL.

---

## 🐘 Setting Up PostgreSQL (Recommended for Production)

### Using Render's Managed Database

1. In Render dashboard: **New +** → **PostgreSQL**
2. Create database
3. Render provides connection string automatically
4. Copy to `DATABASE_URL` in your Web Service environment

### Using Railway's PostgreSQL Plugin

1. In Railway project: Click **+ Add**
2. Select **PostgreSQL**
3. Railway auto-injects `DATABASE_URL`

---

## ✅ Verification Checklist

After deployment:

```bash
# 1. Check if app is running
curl https://your-app-url.com

# 2. Check API health
curl https://your-app-url.com/api/mentors

# 3. Verify frontend loads
# Visit https://your-app-url.com in browser

# 4. Test authentication flow
# Try registering/logging in

# 5. Check logs
# In Render/Railway dashboard, view logs for errors
```

---

## 🔐 Security Best Practices

1. **JWT_SECRET**: Use strong, random value
2. **Email credentials**: Use app-specific passwords (Gmail App Passwords)
3. **API Keys**: Never commit real keys; use environment variables
4. **HTTPS**: Both Render and Railway provide free HTTPS
5. **Database**: Keep backups; use managed database services

---

## 🚨 Troubleshooting

### App crashes on startup
Check logs for:
- `DATABASE_URL` not set or unreachable
- Missing required env vars
- Prisma migration issues

**Fix**:
```bash
# Manually run migrations
npx prisma db push --accept-data-loss
```

### Build fails
- Ensure Node version is 18+ (set in `engines` in package.json if needed)
- Check `npm install` works locally
- Verify all build scripts in `package.json`

### Database issues
- Verify PostgreSQL connection string format: `postgresql://user:pass@host:port/db`
- Check if database exists
- Run: `npx prisma db push`

---

## 📊 Monitoring & Logs

### View Logs in Render
Dashboard → Web Service → **Logs** tab

### View Logs in Railway
Railway dashboard → Deployment → **Logs**

---

## 🔄 Continuous Deployment

Both Render and Railway support auto-redeploy on push to GitHub:

1. Go to service settings
2. Enable **Auto Deploy** from `main` branch
3. Now every `git push` triggers a new deployment

---

## 💰 Costs

- **Render Free Tier**: $0/month (spins down after inactivity)
- **Railway Free Tier**: $5 credit/month
- **PostgreSQL**: Usually included in free tier or ~$7/month

---

## 🎉 You're Live!

Your Edu-Connect app is now running in production. Share the URL with students and mentors!

Need help? Check logs in Render/Railway dashboard or reach out to the team.
