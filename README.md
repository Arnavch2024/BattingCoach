# BatCoach AI Pro v2.0
### Real-Time Cricket Batting Biomechanics, 3D Pose AI & Neural Stroke Analytics

![Python](https://img.shields.io/badge/Python-3.9%2B-3776AB?style=flat&logo=python&logoColor=white)
![PyTorch](https://img.shields.io/badge/PyTorch-CUDA%20FP16-EE4C2C?style=flat&logo=pytorch&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16%20Turbopack-000000?style=flat&logo=nextdotjs&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-Async%20WebSockets-009688?style=flat&logo=fastapi&logoColor=white)
![MediaPipe](https://img.shields.io/badge/MediaPipe-3D%20World%20Landmarks-4285F4?style=flat&logo=google&logoColor=white)
![Supabase](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ECF8E?style=flat&logo=supabase&logoColor=white)
![VideoMAE](https://img.shields.io/badge/Vision%20Transformer-VideoMAE-7952B3?style=flat)

---

## Overview

BatCoach AI Pro is an enterprise-grade, full-stack batting laboratory and virtual cricket coach designed for real-time biomechanical analysis directly in the browser. Using standard webcam video, the system performs 3D biomechanical posture estimation, kinematic swing motion tracking, and neural stroke classification across 10 foundational cricket shots.

Practice sessions and individual stroke metrics are tracked, graded, and persisted to a Supabase PostgreSQL database for performance tracking and historical analytics.

---

## Core Capabilities & Architecture

### 1. 3D Euclidean World Biomechanics
- Computes perspective-invariant joint angles using MediaPipe `pose_world_landmarks` (3D Euclidean coordinates in metric space) rather than 2D screen projections.
- Evaluates **Front Elbow Elevation** ($\ge 130^\circ$ for drives), **Lead Knee Flexion** ($\le 155^\circ$), and **Head Alignment** relative to the lead knee.
- Implements strict batter stance validation to ensure metrics are only processed when the athlete is in a valid batting stance.

### 2. Kinetic Swing Motion State Machine
- Implements a 3-stage kinematic motion tracker (`IDLE` $\rightarrow$ `SWINGING` $\rightarrow$ `COMPLETED`).
- Measures wrist acceleration and follow-through deceleration so rep counts and coaching feedback are triggered exclusively on genuine physical bat swings, eliminating false counts from head or torso movement.

### 3. Low-Latency AI Pipeline
- **Decoupled 24 FPS Hardware Pacing**: Multi-threaded camera grabber (`ThreadedCamera`) eliminates frame drops and camera stutter.
- **CUDA FP16 Mixed Precision**: PyTorch inference accelerated via `torch.autocast('cuda', dtype=torch.float16)` and `torch.inference_mode()`.
- **Non-Blocking Asynchronous VideoMAE**: Neural network evaluations run in background worker threads (`asyncio.to_thread`) to maintain continuous 24 FPS video throughput.
- **Thread Management**: Hard-capped PyTorch and OpenCV CPU threads (`torch.set_num_threads(2)`, `cv2.setNumThreads(2)`) to minimize CPU utilization.

### 4. Supabase PostgreSQL Persistence
- Connects directly to Supabase PostgreSQL with pooled connection management.
- Persists athlete profiles, training durations, stroke counts, success rates, best streaks, and individual shot logs with full biomechanical telemetry.

### 5. Multi-Page Web Platform
- **Landing / Home Page (`/`)**:
  - Unsplash cricket background slider with dark gradient overlays.
  - Athlete authentication portal supporting both 1-Click Google Sign In and Email/Password authentication.
  - Feature matrix, 10-shot syllabus directory, and technique cue cards.
- **Dedicated Coach Dashboard (`/coach`)**:
  - Live AI video monitor with AR skeletal overlays and real-time biometrics HUD.
  - Interactive drill selector, live rep/streak counter, and audible coaching feedback.
  - Automated and manual telemetry synchronization with Supabase PostgreSQL.

---

## Supported Stroke Syllabus

| Shot | Category | Target Elbow | Target Knee | Primary Biomechanical Cue |
|---|---|---|---|---|
| **Cover Drive** | Drives | $\ge 130^\circ$ | $\le 155^\circ$ | Lead with high elbow, head positioned over front knee. |
| **Straight Drive** | Drives | $\ge 135^\circ$ | $\le 155^\circ$ | Full vertical bat face presentation straight down the line. |
| **Pull Shot** | Power / Cross-Bat | $\ge 120^\circ$ | $\le 160^\circ$ | Transfer weight to back foot, full horizontal arm extension. |
| **Hook Shot** | Power / Cross-Bat | $\ge 115^\circ$ | $\le 165^\circ$ | Pivot front hip, roll wrists downward over impact. |
| **Square Cut** | Power / Cross-Bat | $\ge 125^\circ$ | $\le 160^\circ$ | Back & across, slice blade through backward point. |
| **Lofted Drive** | Power / Cross-Bat | $\ge 140^\circ$ | $\le 150^\circ$ | Vertical swing plane with clean extension and high finish. |
| **Forward Defense** | Defensive / Technical | $\sim 110^\circ$ | $\le 150^\circ$ | Soft hands on impact, bat presented adjacent to front pad. |
| **Late Cut** | Defensive / Technical | $\sim 115^\circ$ | $\le 160^\circ$ | Feather touch guidance past slips with supple wrists. |
| **Wrist Flick** | Whips & Sweeps | $\ge 125^\circ$ | $\le 155^\circ$ | Snappy forearm and wrist roll through mid-wicket corridor. |
| **Sweep Shot** | Whips & Sweeps | $\ge 120^\circ$ | $\le 145^\circ$ | Deep back-knee crouch with flat horizontal blade sweep. |

---

## System Architecture

```mermaid
graph TD
    A[Webcam 24 FPS] --> B[ThreadedCamera Grabber]
    B --> C[Downsampled 320x240 Pose Engine]
    B --> D[16-Frame VideoMAE Buffer]
    C --> E[3D World Metric Landmarks]
    E --> F[Kinetic Swing State Machine]
    D --> G[Async VideoMAE PyTorch FP16]
    F --> H[FastAPI WebSocket Server :8888]
    G --> H
    H --> I[Next.js React Dashboard :3000]
    I --> J[Live AR Video & Gauges]
    I --> K[Audio Coach Web Speech]
    H --> L[(Supabase PostgreSQL)]
```

---

## Quick Start Guide

### Prerequisites
- Python 3.9+ (CUDA-enabled GPU recommended for optimal performance)
- Node.js 18+ and npm
- Standard USB webcam or integrated camera

### 1. Installation

#### Clone Repository
```bash
git clone <repo-url>
cd "Cricket Bat Dataset.v1i.yolov8-obb"
```

#### Backend Setup
```bash
pip install fastapi uvicorn torch transformers ultralytics opencv-python mediapipe psycopg2-binary pydantic
```

#### Frontend Setup
```bash
cd cricket-coach-ui
npm install
cd ..
```

---

### 2. Environment Configuration

Create or verify `.env.local` inside `cricket-coach-ui/`:

```env
DATABASE_URL=postgresql://postgres:000%40Rnav200@db.swwjmugxzlriklspxqpu.supabase.co:5432/postgres
NEXT_PUBLIC_API_URL=http://127.0.0.1:8888
NEXT_PUBLIC_WS_URL=ws://127.0.0.1:8888/ws
```

---

### 3. Launching the Application

Start both the FastAPI backend and Next.js frontend with the universal runner script:

```bash
python run_coach.py
```

- **Landing / Home Page**: [http://localhost:3000](http://localhost:3000)
- **Live AI Coaching Dashboard**: [http://localhost:3000/coach](http://localhost:3000/coach)
- **FastAPI API Documentation**: [http://127.0.0.1:8888/docs](http://127.0.0.1:8888/docs)

*To terminate both services cleanly, press Ctrl+C in the terminal.*

---

## REST & WebSocket API Reference

| Endpoint | Protocol | Description |
|---|---|---|
| `/ws` | WebSocket | Real-time 24 FPS video stream, 3D biometrics, top shot probabilities, and swing events. |
| `GET /health` | HTTP GET | Service health status, CUDA availability, FP16 execution state, and Supabase DB connection check. |
| `POST /api/athlete/sync` | HTTP POST | Upserts athlete profile (name, email, stance, experience level) in Supabase `athletes` table. |
| `POST /api/sessions/save` | HTTP POST | Persists completed practice session summary and per-stroke telemetry to Supabase. |
| `GET /api/sessions/history` | HTTP GET | Retrieves historical practice sessions for a given athlete email. |
| `GET /api/stats` | HTTP GET | Computes aggregate career metrics (total reps, accuracy, best streak, practice time). |

---

## Repository Structure

```
.
├── coach_backend.py              # FastAPI WebSocket server, 3D Pose engine, VideoMAE inference & Supabase pool
├── run_coach.py                  # Universal root launcher script (starts backend + frontend)
├── cricket_shot_classifier_colab.py # VideoMAE model fine-tuning & evaluation script
├── train_yolov8.py               # YOLOv8-OBB bat detector training script
├── data.yaml                     # Roboflow dataset configuration
│
├── cricket-coach-ui/             # Next.js 16 Web Application
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx          # Landing / Home Page with Unsplash slider & Google/Email Auth
│   │   │   ├── layout.tsx        # Root layout, fonts, and dark theme wrapper
│   │   │   └── coach/
│   │   │       └── page.tsx      # Dedicated live AI coaching dashboard & Supabase sync
│   │   └── components/ui/        # UI component library (cards, buttons, badges)
│   ├── public/
│   │   └── bat-icon.jpg          # 3D Bat icon asset
│   └── package.json              # Frontend dependencies
│
└── cricket_shot_classifier-.../  # Fine-tuned VideoMAE transformer weights
```

---

## License & Acknowledgements
- **VideoMAE**: HuggingFace Transformers & `rokmr/cricketshot` dataset.
- **MediaPipe**: Google MediaPipe Pose & 3D World Landmarks.
- **Database**: Supabase PostgreSQL.
