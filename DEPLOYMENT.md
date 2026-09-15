# BatCoach AI Pro - Cloud Deployment Guide

This guide details how to deploy the **Next.js Web Frontend** to Vercel and the **Python AI & WebSocket Backend** to cloud container platforms (Railway, Render, Hugging Face Spaces, or AWS).

---

## 1. Frontend Deployment (Vercel)

The Next.js 16 frontend is pre-configured with PWA manifest, service worker, and standalone build optimizations.

### Steps:
1. Push this repository to **GitHub**.
2. Go to [Vercel Dashboard](https://vercel.com/new) and click **"Add New Project"**.
3. Select your GitHub repository.
4. Set the **Root Directory** to `cricket-coach-ui`.
5. Under **Environment Variables**, add:
   ```env
   NEXT_PUBLIC_API_URL=https://your-backend-url.com
   NEXT_PUBLIC_WS_URL=wss://your-backend-url.com/ws
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
   ```
6. Click **Deploy**. Vercel will build and assign you a global domain (e.g., `https://batcoach.vercel.app`).

---

## 2. Backend Deployment (Railway / Render / Hugging Face)

The backend is packaged with a `Dockerfile` that includes OpenCV headless, MediaPipe, PyTorch VideoMAE, and the Supabase PostgreSQL connection pool.

### Option A: Deploy on Lightning AI (Free GPU / CPU Studio - Recommended)
Lightning AI provides free monthly computing credits with instant GPU (NVIDIA T4 / L4 / A10G) and CPU environments with persistent port forwarding and public URLs.

#### Step-by-Step Setup:
1. Go to [lightning.ai](https://lightning.ai) and sign in / create an account.
2. Click **"New Studio"** (Select **Free CPU** or **T4 GPU**).
3. Open the **Terminal** in your Studio and run:
   ```bash
   git clone https://github.com/Arnavch2024/BattingCoach.git
   cd BattingCoach
   pip install -r requirements.txt
   ```
4. Set your database connection string and launch the backend:
   ```bash
   export DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
   python -m uvicorn coach_backend:app --host 0.0.0.0 --port 8888
   ```
5. **Expose Public URL / WebSockets**:
   - In the Studio sidebar / bottom panel, click on the **Ports** plugin (or **Port Forwarding**).
   - Enter port `8888` and toggle the visibility to **Public**.
   - Lightning AI will give you a public HTTPS URL (e.g., `https://8888-01hxxxxxx.studios.lightning.ai`).
6. **Connect your Frontend on Vercel**:
   - `NEXT_PUBLIC_API_URL`: `https://8888-01hxxxxxx.studios.lightning.ai`
   - `NEXT_PUBLIC_WS_URL`: `wss://8888-01hxxxxxx.studios.lightning.ai/ws`

---

### Option B: Deploy on Railway
1. Go to [Railway.app](https://railway.app) and click **"New Project"** -> **"Deploy from GitHub repo"**.
2. Select your repository.
3. Railway automatically detects the root `Dockerfile`.
4. Add the following **Environment Variables**:
   ```env
   DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
   PORT=8888
   ```
5. In the service settings, generate a **Public Domain** (e.g., `https://batcoach-backend.up.railway.app`).
6. Update `NEXT_PUBLIC_WS_URL` in Vercel to `wss://batcoach-backend.up.railway.app/ws`.

---

### Option C: Deploy on Render
1. Go to [Render Dashboard](https://dashboard.render.com) and create a **New Web Service**.
2. Connect your GitHub repository.
3. Select **Docker** as the Runtime.
4. Set the Environment Variables:
   - `DATABASE_URL`: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`
   - `PORT`: `8888`
5. Click **Create Web Service**.

---

### Option D: Deploy on Hugging Face Spaces (Free GPU Option)
1. Create a new Space at [huggingface.co/spaces](https://huggingface.co/spaces).
2. Select **Docker** as the SDK.
3. Push the repository files to the Space.
4. In Space Settings, add the `DATABASE_URL` secret.
5. Access your free GPU-backed WebSocket endpoint directly.

---

## 3. Local Container Testing (Docker Compose)

To test both frontend and backend in isolated Docker containers on your machine:

```bash
docker compose up --build
```

- **Frontend**: `http://localhost:3000`
- **Backend**: `http://localhost:8888`
- **Health Check**: `http://localhost:8888/health`

---

## 4. Google OAuth Configuration
Ensure your production Vercel domain (e.g. `https://batcoach.vercel.app`) is added to:
- **Authorized JavaScript Origins** in [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
