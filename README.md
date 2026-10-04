---
title: BatCoach AI Pro Backend
emoji: 🏏
colorFrom: green
colorTo: blue
sdk: gradio
sdk_version: 4.44.0
app_file: app.py
pinned: false
---

# BatCoach AI Pro v2.0
### Real-Time Cricket Batting Biomechanics, Dual-Mode YOLOv8-OBB & Neural Stroke Analytics

![Python](https://img.shields.io/badge/Python-3.9%2B-3776AB?style=flat&logo=python&logoColor=white)
![PyTorch](https://img.shields.io/badge/PyTorch-CPU%20%26%20FP16-EE4C2C?style=flat&logo=pytorch&logoColor=white)
![Azure](https://img.shields.io/badge/Azure-Container%20Apps%20(Serverless)-0078D4?style=flat&logo=microsoftazure&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-Edge%20Frontend-000000?style=flat&logo=vercel&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-GHCR%20Container-2496ED?style=flat&logo=docker&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16%20Turbopack-000000?style=flat&logo=nextdotjs&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-Async%20WebSockets-009688?style=flat&logo=fastapi&logoColor=white)
![MediaPipe](https://img.shields.io/badge/MediaPipe-3D%20World%20Landmarks-4285F4?style=flat&logo=google&logoColor=white)
![YOLOv8](https://img.shields.io/badge/YOLOv8--OBB-Oriented%20Bat%20Tracking-00FFFF?style=flat)
![Supabase](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ECF8E?style=flat&logo=supabase&logoColor=white)
![Sentry](https://img.shields.io/badge/Sentry-APM%20%26%20Crash%20Diagnostics-362D59?style=flat&logo=sentry&logoColor=white)
![Datadog](https://img.shields.io/badge/Datadog-RUM%20%26%20Tracing-632CA6?style=flat&logo=datadog&logoColor=white)
![PostHog](https://img.shields.io/badge/PostHog-Product%20Analytics-1D63FF?style=flat&logo=posthog&logoColor=white)
![VideoMAE](https://img.shields.io/badge/Vision%20Transformer-VideoMAE-7952B3?style=flat)
![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF?style=flat&logo=githubactions&logoColor=white)
![Tests](https://img.shields.io/badge/Tests-29%20Passing-brightgreen?style=flat)

---

## Overview

**BatCoach AI Pro** is an enterprise-grade, full-stack batting laboratory and virtual cricket coach designed for real-time biomechanical analysis directly in the browser. Using standard webcam video, the system performs:
- **3D Euclidean joint estimation** and kinematic angle extraction via Google MediaPipe.
- **Literature-grounded biomechanical flaw detection** based on ECB coaching manuals, MCC masterclass standards, and peer-reviewed sports science (Taliep et al., Stretch et al.).
- **Dual-mode practice isolation**: 0% YOLO overhead in shadow batting vs full YOLOv8-OBB oriented bat tracking in willow mode.
- **Neural stroke classification** across 10 foundational cricket shots via a fine-tuned VideoMAE transformer.
- **Real-time feedback & repeated error gating**: Instant AR HUD cues, voice coaching, and rep freezes on recurring technique flaws.
- **Athlete telemetry & training schedule persistence** backed by Supabase PostgreSQL with strict email-scoped API security.

---

## Key Features & Architecture

### 1. 🥋 Dual Practice Modes with Clean Isolation
* **🥋 Shadow Practice (`no_bat`)**:
  * 0% YOLO overhead; runs ultra-fast 3D MediaPipe Euclidean pose estimation + VideoMAE classification.
  * Bat-specific checks (blade alignment, bat-pad gap) are cleanly bypassed (`blade_ok=True`), preventing false alerts when training without equipment.
  * Ideal for indoor shadow batting, technique drills, and resource-constrained devices.
* **🏏 Live Willow Practice (`with_bat`)**:
  * Runs YOLOv8-OBB bat detection with oriented bounding boxes.
  * Real-time calculation of **bat blade angle relative to spine vector**, **bat-to-pad gap**, and **vertical face vs cross-bat alignment**.
  * Both MediaPipe and YOLO operate on downsampled 320×240 frames for synchronized spatial awareness.

---

### 2. 🔬 Literature-Backed Biomechanical Engine (`biomechanics.py`)
All biomechanical thresholds are codified as named constants cited directly from established cricket coaching science:
* **Lead Elbow Elevation (`MIN_DRIVE_ELBOW_ANGLE = 130.0°`)**: ECB Coaching Manual standard for vertical bat drives (Cover Drive, Straight Drive).
* **Lead Knee Flexion (`MAX_DRIVE_KNEE_ANGLE = 155.0°`)**: MCC Masterclass lunge benchmark into the pitch to lower center of gravity.
* **Head-over-Knee Balance (`MAX_HEAD_KNEE_DISTANCE = 0.35`)**: Torso-normalized Euclidean distance ensuring the head remains over the ball at impact.
* **Spine Forward Lean (`MAX_DRIVE_SPINE_ANGLE = 170.0°`)**: Forward trunk inclination toward the delivery line.
* **Cross-Bat Arm Extension (`MIN_PULL_HOOK_ELBOW_ANGLE = 115.0° - 120.0°`)**: Full horizontal extension through the ball on Pull and Hook shots.
* **Deep Knee Crouch (`MAX_SWEEP_BACK_KNEE_ANGLE = 130.0°`)**: Deep back-knee flexion on the Sweep shot.
* **Robust Lead-Side Detection**: Automatic lead vs back arm/leg identification with x-coordinate geometric fallback (`is_left_lead`) when visibility scores are tied.

---

### 3. 🎯 Real-Time Overlay HUD & 30 FPS Kinematic Checklist
* **Live Kinematic Checklist**: Direct visual pass/fail indicator displayed at 30 FPS:
  * **Lead Elbow Elevation**: $\ge 130^\circ$ on drives (`134° ✓` vs `112° (Low)`).
  * **Lead Knee Flexion**: $\le 155^\circ$ lunge into the pitch (`148° ✓` vs `168° (Stiff)`).
  * **Head-over-Knee Balance**: Distance of nose to lead knee normalized by torso height.
  * **Torso Spine Lean**: Forward trunk tilt toward delivery line.
  * **Blade Face Alignment**: Validates vertical down-the-ground presentation vs cross-bat swing (active in `with_bat` mode).
* **Drill Technical Cue Banner**: Constant reminder of target posture pinned to top of viewport.
* **Text-to-Speech Voice Coach**: Real-time auditory guidance and intervention feedback using the Web Speech API.

---

### 4. ⛔ Strict Rep Gating & Repeated Error Intervention
* **Verified Clean Reps vs Total Swings**:
  * **Clean Reps** increment **only upon textbook execution** passing all biomechanical angle thresholds, confidence gates, and stroke classification.
  * **Total Swings** tracks every physical stroke attempt to compute true **Form Accuracy %**.
* **Automated Flaw Diagnosis**: Flaws are categorized by explicit error codes (`LOW_ELBOW`, `HEAD_BEHIND_KNEE`, `STRAIGHT_KNEE`, `UPRIGHT_SPINE`, `CROSS_BAT_ON_DRIVE`, `BAT_PAD_GAP`, etc.).
* **Repeated Mistake Drill Lock**:
  * If the athlete repeats the exact same mistake consecutively ($\ge 2\times$), **the rep counter is frozen** to prevent ingraining flawed muscle memory.
  * Displays a high-contrast **Drill Intervention Banner** with direct actionable cues (`👉 ACTION: Raise your front elbow to eye level before starting downswing`).
  * Counter automatically resumes once **1 clean textbook stroke** is executed, or via manual override.

---

### 5. 📺 5-Second Slow-Mo Video Masterclass System
* **Pre-Drill Masterclass (Mandatory First-Time Gate)**:
  * Automatically prompts before the athlete starts coaching on any drill for the first time (persisted in `localStorage`).
  * 4-Phase Biomechanical Breakdown: Initial Trigger $\rightarrow$ Stride & Knee Lunge $\rightarrow$ High Elbow Impact $\rightarrow$ High Follow-Through.
* **Multi-Speed Slow-Motion Engine**:
  * Native browser hardware-accelerated playback speeds: **`0.25x Super Slow`**, **`0.5x Slow-Mo`**, **`0.75x`**, and **`1.0x Real-Time`**.
* **Repeated Error 0.25x Visual Correction**:
  * Clicking *"Watch 5s Slow-Mo Fix"* opens the masterclass at `0.25x` speed with the specific flaw highlighted.
* **100% Free-Tier & Offline Resilience**:
  * Direct static MP4 playback from `public/tutorials/{shot_id}.mp4` or Supabase Storage with $0 streaming cost.
  * Automatic offline **Kinematic Simulator Fallback** if no video file is present.

---

### 6. 🛡️ Security Hardening & Lifecycle Stability
* **WebSocket Lifecycle Stability**: Frontend socket connection depends strictly on `isLive`. Mutable runtime state (`isDrillLocked`, `repeatErrorCount`, `targetShot`) is managed via React `useRef` to eliminate reconnect churn during active drills.
* **Origin & Private-Network Validation**: Strict CORS and WebSocket origin verification using normalized domain matching and private network / loopback validation via Python `ipaddress`.
* **Input Sanitization**: Control messages strictly validate `target` against registered `CLASS_NAMES` and `practice_mode` against `("no_bat", "with_bat")`.
* **Athlete Scope Enforcement**: `X-Athlete-Email` header verification across all athlete profile, session save, session history, stats, and training calendar endpoints (403 Forbidden on email scope mismatch).

---

### 7. 🏛️ Enterprise Admin Dashboard & Token Authentication
* **Dedicated Administrative Studio (`/admin`)**:
  * Real-time aggregate analytics: total athletes, completed practice sessions, overall form accuracy %, flaw hotspot breakdown, and practice hour logs.
  * System health & inference telemetry: Live Azure CPU mode status, database connectivity, and WebSocket ping latency.
* **Cryptographic Token Verification**:
  * Constant-time token comparison via Python `secrets.compare_digest` to prevent timing attacks.
  * Ephemeral client-side session management (`sessionStorage`) ensuring admin credentials are never bundled into the public client JavaScript.
* **Brute-Force Lockout Defense**:
  * Rolling IP-based rate limiting on administrative endpoints: 5 failed attempts trigger an automatic 5-minute security lockout.

---

### 8. ☁️ Cloud Production Deployment & Scale-to-Zero Architecture
* **Frontend (Vercel Edge Network)**:
  * Next.js 16 compiled with Turbopack, served globally via Vercel's edge CDN with sub-second page loads.
  * Dynamic Content Security Policy (CSP) securing WebSockets (`wss://`), Azure API endpoints, and Supabase connections.
* **AI Backend (Azure Container Apps)**:
  * Hosted in Azure East Asia on a serverless consumption tier.
  * **Scale-to-Zero Capability (`minReplicas = 0`)**: Scales to 0 running instances when idle, incurring **$0.00 compute charges** and preserving cloud credits.
  * Auto-wakes on incoming HTTP/WebSocket traffic in seconds.
* **Cloud Database (Supabase PostgreSQL)**:
  * High-throughput PostgreSQL instance connected over IPv4 using Supabase's Session Pooler (`aws-0-ap-southeast-1.pooler.supabase.com:5432`).
  * Automatic table creation and schema validation on container initialization (`athletes`, `practice_sessions`, `stroke_telemetry_logs`, `training_schedules`).

---

### 9. 📊 Connected Third-Party Platforms & Observability Ecosystem

The platform integrates enterprise-grade monitoring, analytics, and cloud identity services across the full stack:

| Provider | Service Role | Integrated SDK / Library | Target Environment | Key Metrics & Telemetry Captured |
|---|---|---|---|---|
| **[PostHog](https://posthog.com)** | Product & Technique Analytics | `posthog-js` (`^1.434.15`) | Next.js Frontend | Event tracking (`stroke_executed`, `drill_locked_intervention`, `practice_mode_switched`, `masterclass_video_watched`), funnel drop-offs, user conversion. |
| **[Datadog](https://www.datadoghq.com)** | RUM & Distributed APM | `@datadog/browser-rum`, `ddtrace` | Frontend + Backend | Frontend Real User Monitoring (Core Web Vitals, LCP/FID/CLS, client crashes) + Backend APM latency spans (`batcoach-backend` on `us5.datadoghq.com`). |
| **[Sentry](https://sentry.io)** | Crash Diagnostics & APM | `@sentry/nextjs`, `sentry-sdk` | Frontend + Backend | Real-time exception capture, stack trace debugging, edge middleware errors, release health tracking (`batcoach-ai` project). |
| **[Supabase](https://supabase.com)** | Serverless PostgreSQL DB | `psycopg2-binary`, Supavisor Pooler | Cloud Database | Athlete profile sync, per-stroke telemetry logs, practice session history, and training schedule persistence over IPv4 Session Pooler. |
| **[Google Cloud](https://cloud.google.com)** | Identity & Calendar Sync | Google Identity Services, GCal API | Frontend | Google OAuth One-Tap sign-in, JWT credential validation, and automated synchronization of batting practice drills to Google Calendar. |
| **[Hugging Face](https://huggingface.co)** | Model Hub & Transformer Host | `transformers`, `huggingface_hub` | ML Pipeline | Model weight repository for fine-tuned VideoMAE transformer (`Arnav2005/cricket-videomae-classifier`). |

#### Detailed Integration Breakdown:
* **PostHog Product Analytics (`cricket-coach-ui/src/lib/analytics.ts`)**:
  * Event taxonomy captures every shot event with biomechanical score, stroke name, and clean/flawed status.
  * Captures `drill_locked_intervention` events whenever consecutive errors trigger technique intervention, allowing coaches to measure drill effectiveness.
  * Tracks slow-motion masterclass completion rates and playback speeds (`0.25x`, `0.5x`, `1.0x`).
* **Datadog RUM & APM Tracing**:
  * **Frontend RUM**: Initialized via `@datadog/browser-rum` in `cricket-coach-ui/src/app/layout.tsx` targeting Datadog US5 (`us5.datadoghq.com`).
  * **Backend APM**: Configured via `DD_API_KEY`, `DD_SITE`, `DD_SERVICE=batcoach-backend`, and `DD_ENV=development` in root `.env` for tracking WebSocket streaming latency and inference throughput.
* **Sentry Crash Diagnostics (`sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`)**:
  * DSN: Configured with automated source maps upload via `SENTRY_AUTH_TOKEN`.
  * Catches unhandled browser errors during video decoding, MediaPipe WebGL context losses, and backend inference exceptions.
* **Google Cloud Ecosystem**:
  * `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: Enables one-tap authentication for athletes.
  * `GOOGLE_API_KEY`: Facilitates one-click export of training drills to athlete Google Calendars.

---

## Supported Stroke Syllabus

| Shot | Category | Target Elbow | Target Knee | Pro Blueprint | Key Biomechanical Cue |
|---|---|---|---|---|---|
| **Cover Drive** | Drives | $\ge 130^\circ$ | $\le 155^\circ$ | Virat Kohli / Babar Azam | Lead with high front elbow, head positioned over lead knee. |
| **Straight Drive** | Drives | $\ge 135^\circ$ | $\le 155^\circ$ | Sachin Tendulkar | Present full vertical bat face straight back past the bowler. |
| **Pull Shot** | Power / Cross-Bat | $\ge 120^\circ$ | $\le 160^\circ$ | Rohit Sharma | Transfer weight to back foot, full horizontal arm extension. |
| **Hook Shot** | Power / Cross-Bat | $\ge 115^\circ$ | $\le 165^\circ$ | Ricky Ponting | Pivot front hip, roll wrists downward over impact. |
| **Square Cut** | Power / Cross-Bat | $\ge 125^\circ$ | $\le 160^\circ$ | Brian Lara | Back & across, slice blade sharply through point. |
| **Lofted Drive** | Power / Cross-Bat | $\ge 140^\circ$ | $\le 150^\circ$ | MS Dhoni | Vertical swing plane with clean extension and high finish. |
| **Forward Defense** | Defensive / Technical | $\sim 110^\circ$ | $\le 150^\circ$ | Rahul Dravid | Soft hands on impact, bat presented flush with front pad. |
| **Late Cut** | Defensive / Technical | $\sim 115^\circ$ | $\le 160^\circ$ | Kane Williamson | Feather touch guidance past slips with supple wrists. |
| **Wrist Flick** | Whips & Sweeps | $\ge 125^\circ$ | $\le 155^\circ$ | VVS Laxman / KL Rahul | Snappy forearm and wrist roll through mid-wicket corridor. |
| **Sweep Shot** | Whips & Sweeps | $\ge 120^\circ$ | $\le 145^\circ$ | Joe Root | Deep back-knee crouch with flat horizontal blade sweep. |

---

## System Architecture

```mermaid
flowchart TD
    A["Webcam Video Stream (25 FPS)"] --> B["Dual-Mode Processing Pipeline"]

    subgraph Backend ["AI Backend (Azure Container Apps - Serverless :7860)"]
        direction TB
        B -->|"Shadow Mode (no bat)"| C["MediaPipe 3D Euclidean Landmarks"]
        B -->|"Willow Mode (with bat)"| D["YOLOv8-OBB Oriented Bat Tracking"]
        B --> F["16-Frame VideoMAE Buffer"]
        
        C --> E["biomechanics.py (Kinematics & Flaw Diagnosis)"]
        D --> E
        F --> G["Async PyTorch VideoMAE Classifier"]
        
        E --> H["Coaching Feedback Engine"]
        G --> H
        
        H --> I["Secure WebSocket Stream (WSS)"]
        H --> J[("Supabase PostgreSQL Pooler (IPv4)")]
    end

    subgraph Frontend ["Next.js React Dashboard (Vercel Edge Network)"]
        direction TB
        I --> K["Live AR Video Viewport & Telemetry HUD"]
        I --> L["30 FPS Kinematic Checklist"]
        I --> M["Rep Counter & Error Freeze Engine"]
        I --> N["Web Speech Audio Coach"]
        I --> O["5s Multi-Speed Slow-Mo Masterclass"]
        I --> P["Interactive Training Calendar Modal"]
        I --> Q["Enterprise Admin Dashboard (/admin)"]
    end
```

---

## Quick Start Guide

### Prerequisites
- **Python 3.9+** (Python 3.10 recommended; CUDA GPU supported for FP16 acceleration)
- **Node.js 18+** and `npm`
- Standard webcam (built-in or USB)

---

### 1. Installation

#### Clone Repository
```bash
git clone https://github.com/Arnavch2024/BattingCoach.git
cd BattingCoach
```

#### Backend Setup
```bash
pip install -r requirements.txt
```
*(Or install core dependencies directly: `pip install fastapi uvicorn torch transformers ultralytics opencv-python mediapipe psycopg2-binary pydantic pytest`)*

#### Frontend Setup
```bash
cd cricket-coach-ui
npm install
cd ..
```

---

### 2. Environment Configuration

The application requires configuration files for both the AI backend and the Next.js frontend to securely connect to cloud databases and third-party observability providers.

#### A. AI Backend (`.env` in root)
Create a `.env` file in the project root:

```env
# Cloud Database (Supabase PostgreSQL IPv4 Pooler)
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres

# Admin Studio Security Gate
ADMIN_API_TOKEN=your-random-cryptographic-token-32-chars

# Datadog Backend APM & Distributed Tracing (us5.datadoghq.com)
DD_API_KEY=your-datadog-api-key
DD_SITE=us5.datadoghq.com
DD_SERVICE=batcoach-backend
DD_ENV=production

# Sentry Backend Crash Reporting & Diagnostics
SENTRY_DSN=https://[KEY]@o[ORG_ID].ingest.us.sentry.io/[PROJECT_ID]
SENTRY_AUTH_TOKEN=sntryu_...
SENTRY_ORG=your-sentry-org
SENTRY_PROJECT=batcoach-ai

# Hugging Face Hub (Model Weights)
HF_TOKEN=hf_...
HF_SPACE_URL=https://huggingface.co/spaces/Arnav2005/BatCoach
```

#### B. Next.js Frontend (`cricket-coach-ui/.env.local`)
Create a `.env.local` file in `cricket-coach-ui/`:

```env
# Backend Connection (Local dev or Azure Container Apps)
# Local:
NEXT_PUBLIC_API_URL=http://127.0.0.1:8888
NEXT_PUBLIC_WS_URL=ws://127.0.0.1:8888/ws
# Azure Production:
# NEXT_PUBLIC_API_URL=https://bat-coach.icypond-1d4761cb.eastasia.azurecontainerapps.io
# NEXT_PUBLIC_WS_URL=wss://bat-coach.icypond-1d4761cb.eastasia.azurecontainerapps.io/ws

# Supabase PostgreSQL & Storage
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_REF].supabase.co

# PostHog Product & Technique Analytics
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# Datadog Frontend Real User Monitoring (RUM)
NEXT_PUBLIC_DATADOG_APPLICATION_ID=your-datadog-rum-app-id
NEXT_PUBLIC_DATADOG_CLIENT_TOKEN=your-datadog-rum-client-token
NEXT_PUBLIC_DATADOG_SITE=us5.datadoghq.com
NEXT_PUBLIC_DATADOG_SERVICE=batcoach-ui

# Sentry Frontend APM & Exception Monitoring
NEXT_PUBLIC_SENTRY_DSN=https://[KEY]@o[ORG_ID].ingest.us.sentry.io/[PROJECT_ID]
SENTRY_AUTH_TOKEN=sntryu_...
SENTRY_ORG=your-sentry-org
SENTRY_PROJECT=batcoach-ai

# Google Cloud (Identity One-Tap Sign-In & Calendar API Sync)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
GOOGLE_API_KEY=your-google-calendar-api-key
NEXT_PUBLIC_GOOGLE_API_KEY=your-google-calendar-api-key

# Admin Studio Security Gate (Server verification reference)
ADMIN_API_TOKEN=your-random-cryptographic-token-32-chars
```

---

### 3. Running the Application

Launch both services simultaneously using the root runner script:

```bash
python run_coach.py
```

Or run them individually in separate terminals:

**Terminal 1 (Backend)**:
```bash
python coach_backend.py
```

**Terminal 2 (Frontend)**:
```bash
cd cricket-coach-ui
npm run dev
```

* **Landing / Home Page**: [http://localhost:3000](http://localhost:3000)
* **Live AI Coaching Studio**: [http://localhost:3000/coach](http://localhost:3000/coach)
* **FastAPI Swagger API Docs**: [http://127.0.0.1:8888/docs](http://127.0.0.1:8888/docs)

---

### 4. Running the Automated Test Suite

Run the unit tests for 3D angles, biomechanical flaw detection, feedback priority, and practice modes:

```bash
# Run the complete test suite (29 tests)
python -m pytest tests/test_biomechanics.py -v
```

Validate the frontend build with Turbopack:

```bash
cd cricket-coach-ui
npm run build
```

---

## REST & WebSocket API Reference

All athlete-scoped endpoints require the `X-Athlete-Email` header to match the email specified in the payload or query parameters.

| Endpoint | Protocol | Required Headers | Description |
|---|---|---|---|
| `/ws` | WebSocket | `Origin` | Real-time biometrics, YOLO-OBB bat telemetry, VideoMAE shot probabilities, and feedback events. |
| `GET /health` | HTTP GET | — | Service health check, CUDA status, FP16 execution state, and Supabase DB connection check. |
| `POST /api/athlete/sync` | HTTP POST | `X-Athlete-Email` | Upserts athlete profile (name, email, stance) in Supabase `athletes` table. |
| `POST /api/sessions/save` | HTTP POST | `X-Athlete-Email` | Persists completed practice session summary and per-stroke telemetry to Supabase. |
| `GET /api/sessions/history` | HTTP GET | `X-Athlete-Email` | Retrieves historical practice sessions for an athlete (`?email=...`). |
| `GET /api/stats` | HTTP GET | `X-Athlete-Email` | Computes aggregate career stats (total reps, clean accuracy %, best streak, practice time). |
| `POST /api/schedule/sync` | HTTP POST | `X-Athlete-Email` | Creates or updates a training calendar event for an athlete. |
| `GET /api/schedule/list` | HTTP GET | `X-Athlete-Email` | Lists scheduled training drills and workouts for an athlete (`?email=...`). |
| `DELETE /api/schedule/{id}` | HTTP DELETE | `X-Athlete-Email` | Deletes a scheduled training drill (`?email=...`). |
| `POST /api/admin/verify` | HTTP POST | `Authorization` | Verifies admin API token for frontend login gate with IP lockout defense. |
| `GET /api/admin/overview` | HTTP GET | `Authorization` | Returns platform aggregates: total athletes, sessions, reps, accuracy, and practice hours. |
| `GET /api/admin/shot-distribution` | HTTP GET | `Authorization` | Aggregates practice session volume and average accuracy per stroke type. |
| `GET /api/admin/flaw-hotspots` | HTTP GET | `Authorization` | Identifies most prevalent biomechanical flaws and recurring error patterns. |
| `GET /api/admin/athletes` | HTTP GET | `Authorization` | Retrieves complete registered athlete roster with lifetime practice stats. |
| `GET /api/admin/sessions/recent` | HTTP GET | `Authorization` | Streams recent practice sessions with per-stroke breakdowns. |
| `GET /api/admin/timeline` | HTTP GET | `Authorization` | Aggregates daily practice volume and rep completion trends. |

---

## CI/CD & Automated Quality Gates

The repository is protected by enterprise GitHub Actions CI/CD workflows:
1. **Frontend & Biomechanics CI (`.github/workflows/ci.yml`)**:
   - Executes Python 3.10 biomechanics test suite (`pytest`) with 29 passing unit tests.
   - Runs Next.js 16 Turbopack production build and TypeScript compilation.
   - Enforced as required status checks on the `main` branch.
2. **Container Build & Azure Continuous Deployment (`.github/workflows/build-container.yml`)**:
   - Compiles CPU-optimized Docker container (`ghcr.io/arnavch2024/batcoach-backend:latest`).
   - Strict path filter: triggers **only** on backend logic (`coach_backend.py`, `biomechanics.py`), dependencies (`requirements.txt`), or container runtime files (`Dockerfile`).
   - Automatically auto-discovers and deploys updated revisions to Azure Container Apps.
3. **Secret Scanning & Leak Prevention (`.github/workflows/secret-scanning.yml`)**:
   - Automated Gitleaks repository scanning on all pushes and pull requests.
   - Tree-tracking guardrails preventing accidental commits of `.env`, `.env.local`, or API tokens.
4. **Weekly Dependency Security Audit (`.github/workflows/dependency-audit.yml`)**:
   - Scans Python (`pip audit`) and NPM packages for known CVEs.
   - Automatically opens a prioritized GitHub Issue when vulnerabilities are discovered.
5. **Dependabot Optimization (`.github/dependabot.yml`)**:
   - Monthly version updates for Python, NPM, and GitHub Actions.
   - Pinned Python ML dependencies (NumPy `<2.0.0`, PyTorch, MediaPipe) for strict C-ABI stability.

---

## Repository Structure

```
.
├── Dockerfile                    # CPU-optimized multi-stage PyTorch & FastAPI container
├── .dockerignore                 # Excludes cache, git, and frontend from container builds
├── biomechanics.py               # Literature-backed biomechanics constants, 3D kinematics & feedback engine
├── coach_backend.py              # FastAPI server, WebSocket hub, YOLOv8-OBB, VideoMAE & Supabase pool
├── run_coach.py                  # Universal root launcher script (starts backend + frontend)
├── requirements.txt              # Pinned Python dependencies for reproducible builds
├── tests/
│   ├── __init__.py
│   └── test_biomechanics.py      # 29-test comprehensive biomechanical unit test suite
├── .github/
│   ├── dependabot.yml            # Dependabot updates (Python, npm, GitHub Actions)
│   └── workflows/
│       ├── build-container.yml   # Docker build, GHCR publish & Azure CD pipeline
│       ├── ci.yml                # Automated CI pipeline (Pytest + Next.js build)
│       ├── dependency-audit.yml  # Weekly automated vulnerability scanner
│       └── secret-scanning.yml   # Gitleaks secret and credential leak detector
│
├── cricket-coach-ui/             # Next.js 16 Web Application (Turbopack)
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx          # Landing / Home Page with hero banner & athlete sync
│   │   │   ├── layout.tsx        # Root layout, fonts, and dark theme wrapper
│   │   │   ├── admin/
│   │   │   │   └── page.tsx      # Enterprise Admin Studio with live analytics & token gate
│   │   │   └── coach/
│   │   │       └── page.tsx      # Dedicated live AI coaching studio, 30 FPS HUD & Video Masterclass
│   │   └── components/
│   │       ├── TrainingCalendarModal.tsx # Interactive training schedule & calendar
│   │       ├── CricketScrollAnimation.tsx# Dynamic interactive scroll animation
│   │       └── ui/               # UI component library (cards, buttons, badges, switch)
│   ├── public/
│   │   ├── tutorials/            # Local 5-second slow-mo tutorial MP4 directory ($0 streaming)
│   │   └── sw.js                 # Service worker for offline caching
│   ├── next.config.ts            # Next.js configuration with hardened Content-Security-Policy
│   └── package.json              # Frontend dependencies
│
├── train_yolov8.py               # YOLOv8-OBB bat detector training script
├── data.yaml                     # Roboflow dataset configuration
└── cricket_shot_classifier_colab.py # VideoMAE model fine-tuning & evaluation script
```

---

## License & Acknowledgements
* **Vision Transformer**: Fine-tuned VideoMAE via HuggingFace Transformers (`Arnav2005/cricket-videomae-classifier`).
* **Pose Estimation**: Google MediaPipe 3D Euclidean World Landmarks.
* **Bat Detection**: Ultralytics YOLOv8-OBB (`Arnav2005/cricket-yolov8-bat-detection`).
* **Cloud Infrastructure**: Azure Container Apps (Serverless), Vercel (Edge Frontend), Supabase (PostgreSQL).
* **Observability & Analytics**: Sentry (Crash Diagnostics & APM), Datadog (RUM & Distributed Tracing), PostHog (Product Analytics), Google Cloud Identity & Calendar API.
* **Biomechanical Standards**: England and Wales Cricket Board (ECB) Coaching Guidelines, MCC Masterclass Standards, and published research by Taliep et al. & Stretch et al.
