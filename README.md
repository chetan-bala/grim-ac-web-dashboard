# Grim AC Web Dashboard

Free self-hosted web dashboard for Grim Anti-Cheat with 30s flag recordings, friend invites, and web preview.

## Features
- Records ~30 seconds of player position data when Grim AC flags them
- Web dashboard to preview recordings with position replay
- Invite friends via email to help moderate
- Link your Grim AC plugin to the web dashboard
- 100% FREE hosting (Vercel + Render + Supabase)

## Quick Setup

### 1. Supabase (Database + Auth)
1. Go to [supabase.com](https://supabase.com) → New Project (free)
2. Go to SQL Editor → Run `supabase-schema.sql`
3. Go to Settings → API → Copy URL and Service Role Key

### 2. Backend (Render - Free)
1. Fork/upload this repo to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect repo, select `backend/` folder
4. Add environment variables from `.env.example`
5. Deploy (free tier: 750 hrs/month, spins down after 15min)

### 3. Frontend (Vercel - Free)
1. Go to [vercel.com](https://vercel.com) → New Project
2. Import repo, set root to `frontend/`
3. Add env var: `REACT_APP_API_URL=https://your-backend.onrender.com`
4. Deploy (free: 100GB bandwidth, custom domain)

### 4. Minecraft Plugin
1. Edit `plugin/src/main/resources/plugin.yml` if needed
2. Run `mvn clean package` in `plugin/` folder
3. Drop JAR into server `plugins/` folder
4. Edit `plugins/GrimWebDashboard/config.yml`:
   ```yaml
   backend-url: https://your-backend.onrender.com
   ```
5. Restart server

## Free Hosting Stack
| Component | Service | Free Tier |
|-----------|---------|-----------|
| Frontend | Vercel | Unlimited sites, 100GB bandwidth |
| Backend | Render | 750 hrs/month, spins down after 15min |
| Database | Supabase | 500MB DB, 50K MAU |
| Email | Gmail SMTP | Free with Gmail account |

## File Structure
```
GrimWebDashboard/
├── plugin/          # Minecraft plugin (Grim AC listener)
├── backend/         # Node.js API (Express + Supabase)
├── frontend/        # React dashboard (Vercel)
├── supabase-schema.sql
└── README.md
```

## Usage
1. Register at your Vercel URL
2. Link Grim AC in dashboard settings
3. Invite friends via email
4. When players get flagged, recordings appear automatically
5. Click "View" to replay 30s of position data
