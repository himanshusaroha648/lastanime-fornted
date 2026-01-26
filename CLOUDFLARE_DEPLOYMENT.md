# 🚀 AniVerse Cloudflare Pages Deployment Guide

## Overview

```
Cloudflare Pages (Frontend)  ←→  Render Backend  ←→  Supabase Database
     Static Site                  API Server           Cloud Database
```

---

## ✅ Prerequisites

1. ✅ **Frontend is ready** - Your React app builds perfectly
2. ✅ **Cloudflare account** (free tier available)
3. ✅ **GitHub repository** (code must be on GitHub)
4. ✅ **Backend deployed** (Use Render or another service for Express backend)

---

## Step 1: Deploy Backend First (to Render)

### Why?
Cloudflare Pages **cannot** run Node.js servers. Your Express backend MUST be hosted elsewhere.

### Quick Render Deployment:

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New" → "Web Service"
3. Connect your GitHub repo
4. Configure:
   - **Name:** `aniverse-backend`
   - **Root Directory:** `.` (leave blank)
   - **Environment:** Node
   - **Build:** `npm install`
   - **Start:** `cd backend && PORT=3000 node src/server.js`
   - **Plan:** Free

5. Add Environment Variables:
   ```
   SUPABASE_URL = your-supabase-url
   SUPABASE_ANON_KEY = your-anon-key
   ```

6. **Get your backend URL:** `https://aniverse-backend.onrender.com`

---

## Step 2: Update Frontend Environment Variables

Update `.env.production` with your **actual backend URL**:

```bash
# aniVerse1/.env.production
VITE_API_BASE_URL=https://aniverse-backend.onrender.com/api
```

---

## Step 3: Deploy to Cloudflare Pages

### Option A: Via Cloudflare Dashboard (Recommended)

1. **Go to [Cloudflare Pages](https://pages.cloudflare.com/)**
2. **Create new project** → "Connect to Git"
3. **Select your GitHub repository**
4. **Configure build settings:**
   - **Project name:** `aniverse`
   - **Production branch:** `main`
   - **Framework:** `Vite`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** `aniVerse1`

5. **Add Environment Variable:**
   - Click "Environment variables"
   - Add `VITE_API_BASE_URL` = `https://your-backend-url.onrender.com/api`
   - Select "Production" environment

6. **Click "Save and Deploy"**

### Option B: Via Cloudflare CLI (Wrangler)

```bash
# Install wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy from aniVerse1 folder
cd aniVerse1
wrangler pages deploy dist --project-name aniverse
```

---

## Step 4: Verify Deployment

### Check Cloudflare Pages
1. Go to Cloudflare Pages dashboard
2. Click your project
3. View URL: `https://aniverse.pages.dev` (or your custom domain)

### Check if it's working
- Homepage should load
- Click on anime → should play episode
- Check browser console (F12) for any errors

---

## 🔧 Troubleshooting

### Issue: "Cannot connect to backend server"
**Solution:**
- Verify `VITE_API_BASE_URL` in Cloudflare environment variables
- Check if Render backend is running
- Render free tier sleeps after 15 min - first request takes time

### Issue: "CORS error"
**Solution:**
- Backend must allow frontend origin
- Add this to your backend CORS config:
```javascript
cors({
  origin: ['https://aniverse.pages.dev', 'http://localhost:5000'],
  credentials: true
})
```

### Issue: Build failing on Cloudflare
**Solution:**
- Make sure `root directory` is set to `aniVerse1`
- Check that `package.json` and `package-lock.json` are committed to Git
- Run `npm run build` locally to verify it works

---

## 📝 Final Checklist

- [ ] Backend deployed to Render with environment variables
- [ ] Backend URL copied (e.g., `https://aniverse-backend.onrender.com`)
- [ ] `.env.production` updated with backend URL
- [ ] Code pushed to GitHub
- [ ] Cloudflare Pages connected to GitHub repo
- [ ] Root directory set to `aniVerse1`
- [ ] `VITE_API_BASE_URL` environment variable added to Cloudflare
- [ ] Deployment successful (check Cloudflare dashboard)
- [ ] Frontend loads without errors
- [ ] Can view anime list
- [ ] Can play episodes

---

## 🎉 Your Live URLs

After deployment:

- **Frontend:** `https://aniverse.pages.dev` or custom domain
- **Backend API:** `https://aniverse-backend.onrender.com`

---

## 💡 Pro Tips

1. **Render free tier**: 
   - Sleeps after 15 min of inactivity
   - First request takes ~30 seconds
   - Consider upgrading to paid ($7/month) for continuous running

2. **Auto-deployment**:
   - Push to GitHub → Cloudflare automatically rebuilds
   - Takes 2-3 minutes

3. **Custom Domain**:
   - Add your domain in Cloudflare Pages settings
   - SSL certificate is automatic

---

## ❌ What WON'T Work on Cloudflare Pages

- ❌ Backend server (Express, Node.js)
- ❌ Database server
- ❌ WebSockets
- ❌ Server-side rendering

**Solution:** Use separate backend service (Render, Vercel, Railway, etc.)

---

## Need Help?

- Cloudflare Docs: https://developers.cloudflare.com/pages/
- Render Docs: https://render.com/docs
- React Docs: https://react.dev

**Good Luck! 🚀**
