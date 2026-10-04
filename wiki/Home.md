# BatCoach AI Pro — Technical Wiki & Knowledge Base

![BatCoach AI Pro Banner](https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=1200&auto=format&fit=crop)

Welcome to the official technical documentation and engineering wiki for **BatCoach AI Pro**, a real-time cricket batting laboratory and biomechanical coaching system powered by computer vision and deep learning.

---

## System Overview

BatCoach AI Pro combines real-time 3D human pose kinematics, oriented bounding-box bat tracking, and temporal vision transformer action classification into a unified, low-latency browser application.

The platform is designed to give cricketers, performance analysts, and coaching academies professional-grade kinematic feedback without expensive laboratory motion-capture suits or wearable sensor hardware. A single consumer webcam running in modern web browsers delivers 30 FPS kinematic checklists, voice coaching feedback, and automated technique intervention.

---

## Technical Architecture Stack

| Layer | Technologies | Primary Function |
|---|---|---|
| **Pose Kinematics** | Google MediaPipe 3D Euclidean World Landmarks | Real-time joint estimation, vector angle extraction, balance tracking |
| **Object Detection** | Ultralytics YOLOv8-OBB (Oriented Bounding Boxes) | Bat blade tracking, face angle relative to spine, bat-pad gap |
| **Neural Classifier** | VideoMAE (Fine-tuned Video Transformer) | 16-frame temporal classification across 10 cricket shot categories |
| **Backend Engine** | Python 3.10, FastAPI, Uvicorn, WebSockets | Async frame processing, kinematics engine, security rate-limiting |
| **Edge Frontend** | Next.js 16 (Turbopack), React 19, TypeScript, TailwindCSS | 30 FPS AR overlay HUD, speech synthesis, slow-mo video masterclasses |
| **Cloud Hosting** | Azure Container Apps (Serverless Consumption) | Auto-scaling containerized backend with scale-to-zero capability |
| **Edge Distribution** | Vercel Edge Network | Sub-second global page loads and CDN asset streaming |
| **Database** | Supabase PostgreSQL (Session Pooler) | Athlete profile, session telemetry, and training schedule persistence |
| **Observability** | Datadog APM/RUM, Sentry APM, PostHog Analytics | Full-stack telemetry, error diagnostics, and feature usage analytics |

---

## Knowledge Base Navigation

Explore the in-depth documentation pages below:

### 1. [Biomechanical Science & Kinematics](Biomechanical-Science-and-Kinematics)
Explore the scientific foundations behind the coaching engine, citing the England and Wales Cricket Board (ECB) Coaching Manual, Marylebone Cricket Club (MCC) masterclass standards, and peer-reviewed research by Taliep et al. and Stretch et al. Includes mathematical formulations for 3D angles and flaw diagnosis logic.

### 2. [Dual-Model Computer Vision Architecture](Dual-Model-Computer-Vision-Architecture)
Technical specifications of the dual-pipeline design: zero-overhead shadow mode vs live willow tracking, MediaPipe 3D Euclidean coordinates, YOLOv8-OBB bat tracking geometry, and VideoMAE temporal attention mechanisms.

### 3. [Cloud Deployment & Scale-to-Zero Architecture](Cloud-Deployment-and-Scale-to-Zero)
Deep-dive runbook covering serverless Azure Container Apps configuration (`minReplicas = 0`), IPv4 Supabase session connection pooling, dynamic Vercel Content Security Policies (CSP), and automated GitHub Actions deployment.

### 4. [Enterprise Admin Studio & Security](Enterprise-Admin-Studio-and-Security)
Security guidelines covering constant-time cryptographic token verification (`secrets.compare_digest`), rolling IP brute-force lockout defenses, athlete email scope enforcement, and third-party observability integrations.

### 5. [Troubleshooting & Frequently Asked Questions](Troubleshooting-and-FAQ)
Diagnostic steps for webcam access, WebSocket handshakes, cold-start latency, container health checks, and database pooler configurations.

---

## Core Engineering Principles

1. **Deterministic Biomechanical Citations**: Coaching cues are never arbitrary. Every threshold (such as the 130-degree lead elbow drive angle) is grounded in published biomechanics literature.
2. **Resource Efficiency**: In shadow practice mode, the YOLO detector is completely bypassed, reducing CPU load to near zero for lightweight devices.
3. **Scale-to-Zero Cloud Economics**: The cloud backend automatically hibernates when idle, ensuring zero idle compute charges.
4. **Defense in Depth**: Zero secrets in client-side bundles, strict origin validation, rate-limiting on sensitive endpoints, and constant-time token evaluation.
