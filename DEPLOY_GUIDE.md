# Deploy Guide - Grim AC Web Dashboard

## Step 1: Push to GitHub
```bash
cd C:\GrimWebDashboard
git add .
git commit -m "Initial commit: Grim AC Web Dashboard"
gh repo create grim-ac-web-dashboard --public
git push -u origin main
```

## Step 2: Create Supabase Database
1. Go to https://supabase.com → New Project
2. Project Name: `grim-ac-dashboard`
3. Database Password: (save this!)
4. Region: Choose closest to you
5. Go to SQL Editor → Run the contents of `supabase-schema.sql`
6. Go to Settings → API → Copy:
   - URL: `https://xxxxx.supabase.co`
   - Service Role Key: `eyJ...` (secret key)

## Step 3: Deploy Backend to Render (Free)
1. Go to https://render.com → Sign up (free)
2. New → Web Service → Connect GitHub repo
3. Configure:
   - Root Directory: `backend`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `node server.js`
   - Instance Type: `Free`
4. Add Environment Variables:
   ```
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_SERVICE_KEY=eyJ... (service role key)
   JWT_SECRET=make-up-a-random-string-here
   EMAIL_USER=your-gmail@gmail.com
   EMAIL_PASS=your-gmail-app-password
   FRONTEND_URL=https://your-frontend.vercel.app (add after step 4)
   ```
5. Click "Create Web Service"
6. Copy your backend URL: `https://grim-web-backend.onrender.com`

## Step 4: Deploy Frontend to Vercel (Free)
1. Go to https://vercel.com → Sign up (free)
2. New Project → Import GitHub repo
3. Configure:
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `build`
4. Add Environment Variable:
   ```
   REACT_APP_API_URL=https://grim-web-backend.onrender.com
   ```
5. Click "Deploy"
6. Copy your frontend URL: `https://grim-ac-web-dashboard.vercel.app`

## Step 5: Update Backend URL
1. Go back to Render → Your backend service → Environment
2. Update `FRONTEND_URL` to your Vercel URL
3. Save and redeploy

## Step 6: Build & Install Minecraft Plugin
```bash
cd C:\GrimWebDashboard\plugin
mvn clean package
```
- Copy `target/GrimWebDashboard-1.0.0.jar` to your server's `plugins/` folder
- Edit `plugins/GrimWebDashboard/config.yml`:
  ```yaml
  backend-url: https://grim-web-backend.onrender.com
  ```
- Restart server

## Step 7: Test
1. Visit your Vercel URL
2. Register an account
3. Link your Grim AC server in Settings
4. Invite friends via email
5. When players get flagged, recordings appear!

## Free Tier Limits
| Service | Limit |
|---------|-------|
| Render (Backend) | 750 hrs/month, sleeps after 15min |
| Vercel (Frontend) | Unlimited sites, 100GB bandwidth |
| Supabase (DB) | 500MB, 50K MAU |
| Gmail SMTP | 500 emails/day |

## Troubleshooting
- **Backend sleeping?** Normal - Render free tier sleeps after 15min. First request after sleep takes ~30s.
- **CORS errors?** Check `FRONTEND_URL` in Render matches your Vercel URL.
- **Plugin not connecting?** Check `backend-url` in config.yml is correct.
