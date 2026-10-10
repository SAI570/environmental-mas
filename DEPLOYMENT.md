# Complete Deployment Guide

> **Deploying the Self-Organizing Environmental MAS to Free Cloud Services**  
> *Database: Supabase (PostgreSQL) • Backend: Render (FastAPI) • Frontend: Vercel (Next.js)*

---

## Architecture Overview

```
[ Next.js Frontend on Vercel ]
              │ (HTTPS REST API Requests)
              ▼
[ FastAPI Backend on Render ]
              │ (SQLAlchemy Connection Pool)
              ▼
[ PostgreSQL Database on Supabase ]
```

---

## Step 1: Cloud Database (Supabase PostgreSQL)

1. Sign up for free at **[supabase.com](https://supabase.com)**.
2. Click **New Project**:
   - **Name:** `environmental-mas-db`
   - **Database Password:** Enter a secure password (save this).
   - **Region:** Choose the region closest to you (e.g., Central India / Singapore / US East).
3. Once the database is provisioned (1-2 minutes):
   - Go to **Project Settings** (gear icon) $\rightarrow$ **Database**.
   - Under **Connection string**, select **URI**.
   - Copy the URI:
     ```text
     postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
     ```
   - Replace `[YOUR-PASSWORD]` with your actual database password.
4. *Note:* No tables need to be created manually. FastAPI will automatically initialize all required tables on startup.

---

## Step 2: Backend API (Render)

1. Sign up for free at **[render.com](https://render.com)**.
2. In your GitHub account, push this project repository.
3. In Render Dashboard, click **New +** $\rightarrow$ **Web Service**:
   - Connect your GitHub repository.
   - **Name:** `environmental-mas-backend`
   - **Root Directory:** `backend`
   - **Runtime:** `Python 3`
   - **Build Command:**
     ```bash
     pip install -r requirements.txt && python scripts/train_model.py
     ```
   - **Start Command:**
     ```bash
     uvicorn app.main:app --host 0.0.0.0 --port $PORT
     ```
   - **Instance Type:** `Free`
4. Add **Environment Variables**:
   - `ENVIRONMENT` = `production`
   - `CORS_ORIGINS` = `*` *(or your Vercel URL once known)*
   - `DATABASE_URL` = Paste your Supabase URI from Step 1.
5. Click **Create Web Service**.
6. Wait for the build and deployment to complete. Render will generate a public URL like:
   ```text
   https://environmental-mas-backend.onrender.com
   ```
7. Verify your deployed API by visiting:
   ```text
   https://environmental-mas-backend.onrender.com/docs
   ```

---

## Step 3: Frontend Website (Vercel)

1. Sign up for free at **[vercel.com](https://vercel.com)**.
2. Click **Add New...** $\rightarrow$ **Project**.
3. Import your GitHub repository.
4. In the configuration screen:
   - **Framework Preset:** `Next.js`
   - **Root Directory:** Click Edit and select `frontend`.
5. Under **Environment Variables**:
   - **Key:** `NEXT_PUBLIC_API_URL`
   - **Value:** Your Render backend URL from Step 2 (e.g., `https://environmental-mas-backend.onrender.com` without trailing slash).
6. Click **Deploy**.
7. Vercel will build and deploy the Next.js application, generating a public URL like:
   ```text
   https://environmental-mas.vercel.app
   ```

---

## Step 4: Final Verification

1. Open your Vercel URL in a browser.
2. Go to **Command Center**: Verify 20 agents and mesh links load from the Render backend.
3. Go to **Incident Management**: Click **Trigger Wildfire**. Check that the consensus calculation and database record update properly.
4. Go to **Network Intelligence**: Simulate an agent failure and verify real self-organizing recovery.
5. Go to **System History**: Verify that past activities are persistently saved in your Supabase database.
