import asyncio
import base64
import collections
import json
import random
import threading
import time
import os
import uuid
import ipaddress
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from urllib.parse import urlparse

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Datadog APM & Tracing Initialization (Datadog Pro / GitHub Student Pack)
try:
    os.environ.setdefault("DD_SITE", "us5.datadoghq.com")
    os.environ.setdefault("DD_SERVICE", "batcoach-backend")
    os.environ.setdefault("DD_ENV", os.getenv("APP_ENV", "development"))
    os.environ.setdefault("DD_MAIN_PACKAGE", "coach_backend")
    os.environ.setdefault("DD_GIT_REPOSITORY_URL", "https://github.com/Arnavch2024/BattingCoach")
    import ddtrace.auto
    from ddtrace import tracer
    print(f"[Datadog APM] Auto-instrumentation active | Site: {os.environ.get('DD_SITE')} | Service: {os.environ.get('DD_SERVICE')}")
except Exception as _dd_err:
    try:
        from ddtrace import tracer
    except Exception:
        tracer = None

# Sentry Performance Tracing, Apdex & Crash Diagnostics (GitHub Student Pack)
SENTRY_DSN = os.getenv("SENTRY_DSN")
if SENTRY_DSN:
    try:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        from sentry_sdk.integrations.starlette import StarletteIntegration
        from sentry_sdk.integrations.logging import LoggingIntegration
        sentry_sdk.init(
            dsn=SENTRY_DSN,
            traces_sample_rate=1.0,  # 100% of transactions captured for Apdex calculation
            default_integrations=False,
            auto_enabling_integrations=False,
            integrations=[
                StarletteIntegration(transaction_style="endpoint"),
                FastApiIntegration(transaction_style="endpoint"),
                LoggingIntegration(),
            ],
            environment=os.getenv("DD_ENV", "development"),
        )
        print("[Sentry APM] Performance tracing & Apdex monitoring active.")
    except Exception as _sentry_err:
        print(f"[Sentry Notice]: {_sentry_err}")

import cv2
import mediapipe as mp
import numpy as np
import torch
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, Response, Header, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
# Bypass huggingface-hub strict upper-bound check in transformers
import sys
import types
mock_deps = types.ModuleType("transformers.dependency_versions_check")
mock_deps.dep_version_check = lambda *args, **kwargs: None
mock_deps.require_version_core = lambda *args, **kwargs: None
mock_deps.require_version = lambda *args, **kwargs: None
sys.modules["transformers.dependency_versions_check"] = mock_deps

try:
    from transformers import VideoMAEForVideoClassification, VideoMAEImageProcessor
except Exception as e:
    print(f"[Warning] Failed to import transformers VideoMAE: {e}")
    VideoMAEForVideoClassification = None
    VideoMAEImageProcessor = None
from ultralytics import YOLO

# Hugging Face Spaces ZeroGPU Support
try:
    import spaces
    has_zero_gpu = True
    print("[ZeroGPU] Hugging Face Spaces ZeroGPU detected and enabled.")
except (ImportError, Exception):
    has_zero_gpu = False
    spaces = None

def gpu_inference_decorator(func):
    if has_zero_gpu and spaces is not None:
        return spaces.GPU(func)
    return func

# ──────────────────────────────────────────────────────────────────────────────
# System & Thread Limits
# ──────────────────────────────────────────────────────────────────────────────

torch.set_num_threads(2)
cv2.setNumThreads(2)

# ──────────────────────────────────────────────────────────────────────────────
# Configuration
# ──────────────────────────────────────────────────────────────────────────────

BASE_DIR = Path(__file__).parent
MODEL_DIR = (
    BASE_DIR
    / "cricket_shot_classifier-20260420T175634Z-3-001"
    / "cricket_shot_classifier"
    / "best_model"
)

CLASS_NAMES = [
    "cover", "defense", "flick", "hook", "late_cut",
    "lofted", "pull", "square_cut", "straight", "sweep",
]

from biomechanics import (
    COACHING_TIPS,
    calculate_3d_angle,
    extract_biometrics,
    get_coaching_feedback,
)

NUM_FRAMES = 16
IMAGE_SIZE = 224
INFER_EVERY = 24
TARGET_FPS = 24
FRAME_DURATION = 1.0 / TARGET_FPS

# ──────────────────────────────────────────────────────────────────────────────
# AI Model & Hardware Acceleration Setup
# ──────────────────────────────────────────────────────────────────────────────

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
use_fp16 = torch.cuda.is_available()
print(f"[AI Pipeline] Device: {device} | Mixed Precision FP16: {use_fp16}")

label2id = {name: i for i, name in enumerate(CLASS_NAMES)}
id2label = {i: name for i, name in enumerate(CLASS_NAMES)}

HF_MODEL_ID = "Arnav2005/cricket-videomae-classifier"

if MODEL_DIR.exists() and any(MODEL_DIR.iterdir()):
    print(f"[AI Pipeline] Loading fine-tuned VideoMAE model from local path: {MODEL_DIR}")
    try:
        processor = VideoMAEImageProcessor.from_pretrained(str(MODEL_DIR))
        model = VideoMAEForVideoClassification.from_pretrained(str(MODEL_DIR))
    except Exception as load_err:
        print(f"[AI Pipeline] Local model loading notice: {load_err}, loading from HuggingFace Hub: {HF_MODEL_ID}...")
        processor = VideoMAEImageProcessor.from_pretrained(HF_MODEL_ID)
        model = VideoMAEForVideoClassification.from_pretrained(HF_MODEL_ID)
else:
    print(f"[AI Pipeline] Cloud container mode: Loading fine-tuned VideoMAE model from HuggingFace Hub ({HF_MODEL_ID})...")
    processor = VideoMAEImageProcessor.from_pretrained(HF_MODEL_ID)
    model = VideoMAEForVideoClassification.from_pretrained(HF_MODEL_ID)

model.to(device).eval()

# MediaPipe Pose Engine
try:
    import mediapipe.python.solutions.pose as mp_pose
    import mediapipe.python.solutions.drawing_utils as mp_draw
except (ImportError, AttributeError):
    try:
        import mediapipe as mp
        mp_pose = mp.solutions.pose
        mp_draw = mp.solutions.drawing_utils
    except Exception as e:
        print(f"[MediaPipe] Warning: Unable to load solutions directly ({e})")
        mp_pose = None
        mp_draw = None

if mp_pose:
    pose_engine = mp_pose.Pose(
        static_image_mode=False,
        model_complexity=0,
        min_detection_confidence=0.6,
        min_tracking_confidence=0.6,
    )
else:
    pose_engine = None

# YOLOv8-OBB Bat Orientation & Blade Angle Detector
BAT_MODEL_DIR = BASE_DIR / "runs" / "obb" / "runs" / "bat_detection" / "train" / "weights" / "best.pt"
HF_BAT_MODEL_REPO = "Arnav2005/cricket-yolov8-bat-detection"

bat_model = None
try:
    if BAT_MODEL_DIR.exists():
        print(f"[Bat Detector] Loading local YOLOv8-OBB model from: {BAT_MODEL_DIR}")
        bat_model = YOLO(str(BAT_MODEL_DIR))
    else:
        try:
            from huggingface_hub import hf_hub_download
            print(f"[Bat Detector] Cloud mode: Downloading YOLOv8-OBB model from HF Hub ({HF_BAT_MODEL_REPO})...")
            bat_model_path = hf_hub_download(repo_id=HF_BAT_MODEL_REPO, filename="best.pt")
            bat_model = YOLO(bat_model_path)
        except Exception as hf_err:
            print(f"[Bat Detector] Warning: HuggingFace Hub download notice: {hf_err}")
    if bat_model:
        bat_model.to(device)
        print(f"[Bat Detector] YOLOv8-OBB bat model successfully loaded on {device}.")
except Exception as e:
    print(f"[Bat Detector] Warning: Could not initialize YOLOv8-OBB model ({e})")
    bat_model = None

def extract_bat_telemetry(frame: np.ndarray, target_shot: str) -> Dict:
    """
    Extracts bat bounding polygon, blade angle, confidence, and stroke alignment using YOLOv8-OBB.
    """
    if bat_model is None:
        return {"detected": False}
    span = tracer.trace("ai.yolo.bat_obb", service="batcoach-backend", resource="YOLOv8-OBB") if tracer else None
    sentry_span = sentry_sdk.start_span(op="ai.yolo.bat_obb", description="YOLOv8-OBB bat blade tracking") if SENTRY_DSN else None
    try:
        h, w = frame.shape[:2]
        results = bat_model.predict(frame, imgsz=320, conf=0.25, verbose=False)
        if not results or len(results) == 0 or results[0].obb is None or len(results[0].obb) == 0:
            return {"detected": False}
        
        obb = results[0].obb
        confs = obb.conf.cpu().numpy()
        best_idx = int(np.argmax(confs))
        conf = float(confs[best_idx])
        
        # xywhr: [x_center, y_center, width, height, rotation_radians]
        xywhr = obb.xywhr[best_idx].cpu().numpy()
        x_c, y_c, bw, bh, rot_rad = xywhr
        rot_deg = float(np.degrees(rot_rad)) % 180.0
        
        # xyxyxyxy: 4 polygon corner points (4, 2)
        corners = obb.xyxyxyxy[best_idx].cpu().numpy()
        norm_corners = [[round(float(pt[0] / w), 4), round(float(pt[1] / h), 4)] for pt in corners]
        
        # Vertical shots vs Horizontal cross-bat shots
        is_vertical = (40.0 <= rot_deg <= 140.0)
        vertical_shots = ["cover", "straight", "defense", "lofted"]
        target_is_vertical = target_shot in vertical_shots
        alignment_match = (is_vertical == target_is_vertical)
        
        return {
            "detected": True,
            "confidence": round(conf, 3),
            "blade_angle": round(rot_deg, 1),
            "is_vertical": bool(is_vertical),
            "alignment_match": bool(alignment_match),
            "polygon": norm_corners,
            "center": [round(float(x_c / w), 4), round(float(y_c / h), 4)],
            "width": round(float(bw / w), 4),
            "height": round(float(bh / h), 4),
        }
    except Exception as e:
        print(f"[Bat Telemetry Error]: {e}")
        return {"detected": False}
    finally:
        if span:
            span.finish()
        if sentry_span:
            sentry_span.finish()


# ──────────────────────────────────────────────────────────────────────────────
# Threaded Camera Grabber
# ──────────────────────────────────────────────────────────────────────────────

class ThreadedCamera:
    """Efficient camera reader synced to webcam frame delivery."""
    def __init__(self, src=0):
        self.cap = cv2.VideoCapture(src, cv2.CAP_DSHOW if cv2.CAP_DSHOW else 0)
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        self.cap.set(cv2.CAP_PROP_FPS, 30)
        self.ret = False
        self.frame = None
        self.stopped = False
        self.lock = threading.Lock()
        
        self.ret, self.frame = self.cap.read()
        self.thread = threading.Thread(target=self._update, daemon=True)
        self.thread.start()

    def _update(self):
        while not self.stopped:
            if not self.cap.isOpened():
                break
            ret, frame = self.cap.read()
            if ret:
                with self.lock:
                    self.ret = ret
                    self.frame = frame
                time.sleep(0.015)  # Cap camera grab to ~35 FPS, eliminates 100% CPU core spinning
            else:
                time.sleep(0.02)

    def read(self) -> Tuple[bool, Optional[np.ndarray]]:
        with self.lock:
            if self.frame is not None:
                return self.ret, self.frame.copy()
            return self.ret, None

    def release(self):
        self.stopped = True
        if self.thread.is_alive():
            self.thread.join(timeout=0.5)
        self.cap.release()

# ──────────────────────────────────────────────────────────────────────────────
# 3D Biometrics & Kinematics engine is imported from biomechanics.py
# ──────────────────────────────────────────────────────────────────────────────

@gpu_inference_decorator
@torch.inference_mode()
def execute_model_inference(frames_rgb_list: List[np.ndarray]) -> Tuple[np.ndarray, float]:
    t0 = time.perf_counter()
    span = tracer.trace("ai.videomae.inference", service="batcoach-backend", resource="VideoMAEForVideoClassification") if tracer else None
    sentry_span = sentry_sdk.start_span(op="ai.inference", description="VideoMAE 16-frame classification") if SENTRY_DSN else None
    try:
        inputs = processor(frames_rgb_list, return_tensors="pt")
        pixel_values = inputs["pixel_values"].to(device)
        
        if use_fp16:
            with torch.autocast(device_type="cuda", dtype=torch.float16):
                outputs = model(pixel_values=pixel_values)
        else:
            outputs = model(pixel_values=pixel_values)
            
        probs = torch.softmax(outputs.logits, dim=-1)[0].cpu().numpy()
        inference_time_ms = (time.perf_counter() - t0) * 1000.0
        return probs, inference_time_ms
    finally:
        if span:
            span.finish()
        if sentry_span:
            sentry_span.finish()

# ──────────────────────────────────────────────────────────────────────────────
# get_coaching_feedback is imported from biomechanics.py
# ──────────────────────────────────────────────────────────────────────────────


# ──────────────────────────────────────────────────────────────────────────────
# Supabase PostgreSQL Database Integration
# ──────────────────────────────────────────────────────────────────────────────

import os
import psycopg2
from psycopg2 import pool
from pydantic import BaseModel

# Read strictly from environment variable (never hardcoded in source)
def _enforce_ssl_url(url: str) -> str:
    """Enforces TLS/SSL in-transit encryption for remote PostgreSQL connections."""
    if not url:
        return url
    if "sslmode=" not in url.lower() and "localhost" not in url.lower() and "127.0.0.1" not in url:
        sep = "&" if "?" in url else "?"
        return f"{url}{sep}sslmode=require"
    return url

DATABASE_URL = _enforce_ssl_url(os.getenv("DATABASE_URL", ""))

db_pool = None
if DATABASE_URL:
    try:
        db_pool = psycopg2.pool.SimpleConnectionPool(1, 10, DATABASE_URL)
        print("[Database] Supabase PostgreSQL connection pool initialized.")
    except Exception as e:
        print(f"[Database] Notice: DB pool init: {e}")

def get_db_conn():
    if db_pool:
        return db_pool.getconn()
    if DATABASE_URL:
        return psycopg2.connect(DATABASE_URL, connect_timeout=5)
    raise ValueError("DATABASE_URL environment variable is not set.")

def release_db_conn(conn):
    if db_pool and conn:
        try:
            db_pool.putconn(conn)
        except Exception:
            pass
    elif conn:
        try:
            conn.close()
        except Exception:
            pass

def init_db():
    if not DATABASE_URL:
        print("[Database] Notice: DATABASE_URL not provided, skipping database schema init.")
        return
    conn = None
    try:
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS athletes (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                name VARCHAR(255) NOT NULL,
                stance VARCHAR(50) DEFAULT 'Right-Hand Batter',
                experience_level VARCHAR(50) DEFAULT 'Club Cricketer',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS practice_sessions (
                id SERIAL PRIMARY KEY,
                athlete_email VARCHAR(255),
                session_duration_seconds INT DEFAULT 0,
                target_shot VARCHAR(100),
                total_reps INT DEFAULT 0,
                successful_reps INT DEFAULT 0,
                best_streak INT DEFAULT 0,
                avg_confidence FLOAT DEFAULT 0.0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS stroke_telemetry_logs (
                id SERIAL PRIMARY KEY,
                session_id INT REFERENCES practice_sessions(id) ON DELETE CASCADE,
                athlete_email VARCHAR(255),
                shot_name VARCHAR(100),
                status VARCHAR(50),
                confidence FLOAT,
                elbow_angle FLOAT,
                knee_angle FLOAT,
                coach_feedback TEXT,
                recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS training_schedules (
                id SERIAL PRIMARY KEY,
                schedule_id VARCHAR(100) UNIQUE NOT NULL,
                athlete_email VARCHAR(255),
                title VARCHAR(255) NOT NULL,
                shot_type VARCHAR(100),
                session_type VARCHAR(50) DEFAULT 'net_session',
                scheduled_date VARCHAR(50) NOT NULL,
                start_time VARCHAR(20) NOT NULL,
                duration_minutes INT DEFAULT 45,
                target_reps INT DEFAULT 30,
                location VARCHAR(255) DEFAULT 'Cricket Nets',
                notes TEXT,
                completed BOOLEAN DEFAULT FALSE,
                synced_to_google BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """)
        conn.commit()
        cur.close()
        print("[Database] Schema verified in Supabase.")
    except Exception as e:
        print(f"[Database] Init schema error: {e}")
    finally:
        release_db_conn(conn)

# Run schema init on startup
init_db()

class AthleteSyncRequest(BaseModel):
    email: str
    name: str
    stance: Optional[str] = "Right-Hand Batter"
    experience_level: Optional[str] = "Club Cricketer"

class ScheduleSyncRequest(BaseModel):
    id: str
    title: str
    shotId: Optional[str] = "cover"
    shotName: Optional[str] = "Cover Drive"
    sessionType: Optional[str] = "net_session"
    date: str
    startTime: str
    durationMinutes: Optional[int] = 45
    targetReps: Optional[int] = 30
    location: Optional[str] = "Cricket Nets"
    notes: Optional[str] = ""
    completed: Optional[bool] = False
    syncedToGoogle: Optional[bool] = False
    athlete_email: Optional[str] = None

class StrokeLogItem(BaseModel):
    shot_name: str
    status: str
    confidence: float
    elbow_angle: Optional[float] = 0.0
    knee_angle: Optional[float] = 0.0
    coach_feedback: Optional[str] = ""

class PracticeSessionSaveRequest(BaseModel):
    athlete_email: str
    session_duration_seconds: int
    target_shot: str
    total_reps: int
    successful_reps: int
    best_streak: int
    avg_confidence: float
    strokes: Optional[List[StrokeLogItem]] = []

def _normalize_origin(origin: str) -> str:
    return origin.strip().rstrip("/")

def _is_local_network_origin(origin: str) -> bool:
    try:
        parsed = urlparse(origin)
        if parsed.scheme not in ("http", "https"):
            return False
        hostname = (parsed.hostname or "").strip().lower()
        if hostname in ("localhost", "127.0.0.1"):
            return True
        ip = ipaddress.ip_address(hostname)
        return ip.is_private
    except Exception:
        return False

def _is_allowed_origin(origin: str) -> bool:
    if not origin:
        return True
    normalized = _normalize_origin(origin)
    if normalized in {_normalize_origin(o) for o in ALLOWED_ORIGINS}:
        return True
    return _is_local_network_origin(normalized)

def _normalize_email(email: str) -> str:
    return (email or "").strip().lower()

def _validate_email_or_422(email: str, field_name: str = "email") -> str:
    normalized = _normalize_email(email)
    if not normalized or " " in normalized:
        raise HTTPException(status_code=422, detail=f"Invalid {field_name}.")
    local_part, sep, domain_part = normalized.partition("@")
    if sep != "@" or not local_part or not domain_part:
        raise HTTPException(status_code=422, detail=f"Invalid {field_name}.")
    if "." not in domain_part or domain_part.startswith(".") or domain_part.endswith("."):
        raise HTTPException(status_code=422, detail=f"Invalid {field_name}.")
    return normalized

def _enforce_email_scope_or_raise(request_email: str, scope_header_email: Optional[str], field_name: str = "email") -> str:
    scoped = _validate_email_or_422(scope_header_email or "", "X-Athlete-Email header")
    requested = _validate_email_or_422(request_email, field_name)
    if requested != scoped:
        raise HTTPException(status_code=403, detail="Email scope mismatch.")
    return requested

# ──────────────────────────────────────────────────────────────────────────────
# Security: Strict CORS Whitelisting, Rate Limiting & HTTP Security Headers
# ──────────────────────────────────────────────────────────────────────────────

DEFAULT_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8888",
    "http://127.0.0.1:8888",
]
env_origins = os.getenv("ALLOWED_ORIGINS", "")
if env_origins:
    ALLOWED_ORIGINS = [orig.strip() for orig in env_origins.split(",") if orig.strip()]
else:
    ALLOWED_ORIGINS = DEFAULT_ALLOWED_ORIGINS

app = FastAPI(title="BatCoach AI Pro Backend", version="2.0.0")

# 1. Strict CORS Whitelisting (RFC Compliant with allow_credentials=True)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# 2. HTTP Security Defense Headers
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        return response

app.add_middleware(SecurityHeadersMiddleware)

# 3. In-Memory Sliding-Window Rate Limiter
class RateLimiterMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_requests: int = 150, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = collections.defaultdict(list)
        self.lock = asyncio.Lock()

    async def dispatch(self, request: Request, call_next):
        # Exclude real-time WebSocket frames and static health checks from rate limiter
        if request.url.path in ("/health", "/ws"):
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        now = time.time()

        async with self.lock:
            timestamps = self.requests[client_ip]
            cutoff = now - self.window_seconds
            self.requests[client_ip] = [t for t in timestamps if t > cutoff]

            if len(self.requests[client_ip]) >= self.max_requests:
                retry_after = int(self.window_seconds - (now - self.requests[client_ip][0]))
                return JSONResponse(
                    status_code=429,
                    content={"error": "Too Many Requests", "message": "API rate limit reached. Please wait before retrying."},
                    headers={
                        "Retry-After": str(max(1, retry_after)),
                        "X-RateLimit-Limit": str(self.max_requests),
                        "X-RateLimit-Remaining": "0",
                    }
                )

            self.requests[client_ip].append(now)
            remaining = self.max_requests - len(self.requests[client_ip])

        response: Response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(self.max_requests)
        response.headers["X-RateLimit-Remaining"] = str(max(0, remaining))
        return response

app.add_middleware(RateLimiterMiddleware, max_requests=150, window_seconds=60)

@app.get("/health")
async def health():
    db_ok = False
    try:
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute("SELECT 1;")
        cur.close()
        release_db_conn(conn)
        db_ok = True
    except Exception:
        db_ok = False

    return {
        "status": "online",
        "device": str(device),
        "cuda_available": torch.cuda.is_available(),
        "fp16": use_fp16,
        "database": "connected" if db_ok else "disconnected",
    }

@app.post("/api/athlete/sync")
async def sync_athlete(req: AthleteSyncRequest, x_athlete_email: Optional[str] = Header(default=None, alias="X-Athlete-Email")):
    req.email = _enforce_email_scope_or_raise(req.email, x_athlete_email, "athlete email")
    def _db_op():
        conn = get_db_conn()
        try:
            cur = conn.cursor()
            cur.execute("""
                INSERT INTO athletes (email, name, stance, experience_level)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (email) 
                DO UPDATE SET 
                    name = EXCLUDED.name,
                    stance = EXCLUDED.stance,
                    experience_level = EXCLUDED.experience_level
                RETURNING id, email, name, stance, experience_level, created_at;
            """, (req.email, req.name, req.stance, req.experience_level))
            row = cur.fetchone()
            conn.commit()
            cur.close()
            return {
                "id": row[0],
                "email": row[1],
                "name": row[2],
                "stance": row[3],
                "experience_level": row[4],
                "created_at": str(row[5])
            }
        finally:
            release_db_conn(conn)

    try:
        result = await asyncio.to_thread(_db_op)
        return {"success": True, "athlete": result}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/api/sessions/save")
async def save_session(req: PracticeSessionSaveRequest, x_athlete_email: Optional[str] = Header(default=None, alias="X-Athlete-Email")):
    req.athlete_email = _enforce_email_scope_or_raise(req.athlete_email, x_athlete_email, "athlete_email")
    def _db_op():
        conn = get_db_conn()
        try:
            cur = conn.cursor()
            cur.execute("""
                INSERT INTO practice_sessions 
                    (athlete_email, session_duration_seconds, target_shot, total_reps, successful_reps, best_streak, avg_confidence)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id;
            """, (
                req.athlete_email,
                req.session_duration_seconds,
                req.target_shot,
                req.total_reps,
                req.successful_reps,
                req.best_streak,
                req.avg_confidence
            ))
            session_id = cur.fetchone()[0]

            if req.strokes:
                for stroke in req.strokes:
                    cur.execute("""
                        INSERT INTO stroke_telemetry_logs
                            (session_id, athlete_email, shot_name, status, confidence, elbow_angle, knee_angle, coach_feedback)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s);
                    """, (
                        session_id,
                        req.athlete_email,
                        stroke.shot_name,
                        stroke.status,
                        stroke.confidence,
                        stroke.elbow_angle,
                        stroke.knee_angle,
                        stroke.coach_feedback
                    ))

            conn.commit()
            cur.close()
            return session_id
        finally:
            release_db_conn(conn)

    try:
        session_id = await asyncio.to_thread(_db_op)
        return {"success": True, "session_id": session_id}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/api/sessions/history")
async def get_session_history(email: str, x_athlete_email: Optional[str] = Header(default=None, alias="X-Athlete-Email")):
    email = _enforce_email_scope_or_raise(email, x_athlete_email, "email")
    def _db_op():
        conn = get_db_conn()
        try:
            cur = conn.cursor()
            cur.execute("""
                SELECT id, session_duration_seconds, target_shot, total_reps, successful_reps, best_streak, avg_confidence, created_at
                FROM practice_sessions
                WHERE athlete_email = %s
                ORDER BY created_at DESC
                LIMIT 20;
            """, (email,))
            rows = cur.fetchall()
            cur.close()
            return [
                {
                    "id": r[0],
                    "duration_seconds": r[1],
                    "target_shot": r[2],
                    "total_reps": r[3],
                    "successful_reps": r[4],
                    "best_streak": r[5],
                    "avg_confidence": round(r[6] or 0.0, 2),
                    "created_at": str(r[7]),
                }
                for r in rows
            ]
        finally:
            release_db_conn(conn)

    try:
        sessions = await asyncio.to_thread(_db_op)
        return {"success": True, "sessions": sessions}
    except Exception as e:
        return {"success": False, "error": str(e), "sessions": []}

@app.get("/api/stats")
async def get_stats(email: str, x_athlete_email: Optional[str] = Header(default=None, alias="X-Athlete-Email")):
    email = _enforce_email_scope_or_raise(email, x_athlete_email, "email")
    def _db_op():
        conn = get_db_conn()
        try:
            cur = conn.cursor()
            cur.execute("""
                SELECT 
                    COALESCE(SUM(total_reps), 0),
                    COALESCE(SUM(successful_reps), 0),
                    COALESCE(MAX(best_streak), 0),
                    COALESCE(AVG(avg_confidence), 0.0),
                    COALESCE(SUM(session_duration_seconds), 0)
                FROM practice_sessions
                WHERE athlete_email = %s;
            """, (email,))
            row = cur.fetchone()
            cur.close()
            return {
                "total_reps": int(row[0]),
                "successful_reps": int(row[1]),
                "best_streak": int(row[2]),
                "avg_confidence": round(float(row[3]), 2),
                "total_practice_time_seconds": int(row[4]),
            }
        finally:
            release_db_conn(conn)

    try:
        stats = await asyncio.to_thread(_db_op)
        return {"success": True, "stats": stats}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/api/schedule/sync")
async def sync_schedule(req: ScheduleSyncRequest, x_athlete_email: Optional[str] = Header(default=None, alias="X-Athlete-Email")):
    if req.athlete_email is None:
        raise HTTPException(status_code=422, detail="athlete_email is required.")
    req.athlete_email = _enforce_email_scope_or_raise(req.athlete_email, x_athlete_email, "athlete_email")
    def _db_op():
        conn = get_db_conn()
        try:
            cur = conn.cursor()
            cur.execute("""
                INSERT INTO training_schedules
                    (schedule_id, athlete_email, title, shot_type, session_type, scheduled_date, start_time, duration_minutes, target_reps, location, notes, completed, synced_to_google)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (schedule_id)
                DO UPDATE SET
                    title = EXCLUDED.title,
                    shot_type = EXCLUDED.shot_type,
                    session_type = EXCLUDED.session_type,
                    scheduled_date = EXCLUDED.scheduled_date,
                    start_time = EXCLUDED.start_time,
                    duration_minutes = EXCLUDED.duration_minutes,
                    target_reps = EXCLUDED.target_reps,
                    location = EXCLUDED.location,
                    notes = EXCLUDED.notes,
                    completed = EXCLUDED.completed,
                    synced_to_google = EXCLUDED.synced_to_google
                RETURNING id;
            """, (
                req.id, req.athlete_email, req.title, req.shotName or req.shotId,
                req.sessionType, req.date, req.startTime, req.durationMinutes,
                req.targetReps, req.location, req.notes, req.completed, req.syncedToGoogle
            ))
            sched_id = cur.fetchone()[0]
            conn.commit()
            cur.close()
            return sched_id
        finally:
            release_db_conn(conn)
    try:
        res_id = await asyncio.to_thread(_db_op)
        return {"success": True, "schedule_id": res_id}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/api/schedule/list")
async def list_schedule(email: str, x_athlete_email: Optional[str] = Header(default=None, alias="X-Athlete-Email")):
    email = _enforce_email_scope_or_raise(email, x_athlete_email, "email")
    def _db_op():
        conn = get_db_conn()
        try:
            cur = conn.cursor()
            cur.execute("""
                SELECT schedule_id, title, shot_type, session_type, scheduled_date, start_time, duration_minutes, target_reps, location, notes, completed, synced_to_google, created_at
                FROM training_schedules
                WHERE athlete_email = %s
                ORDER BY scheduled_date ASC, start_time ASC;
            """, (email,))
            rows = cur.fetchall()
            cur.close()
            return [
                {
                    "id": r[0],
                    "title": r[1],
                    "shotName": r[2],
                    "sessionType": r[3],
                    "date": r[4],
                    "startTime": r[5],
                    "durationMinutes": r[6],
                    "targetReps": r[7],
                    "location": r[8],
                    "notes": r[9],
                    "completed": r[10],
                    "syncedToGoogle": r[11],
                    "createdAt": str(r[12]),
                }
                for r in rows
            ]
        finally:
            release_db_conn(conn)
    try:
        items = await asyncio.to_thread(_db_op)
        return {"success": True, "schedules": items}
    except Exception as e:
        return {"success": False, "error": str(e), "schedules": []}

@app.delete("/api/schedule/{schedule_id}")
async def delete_schedule(schedule_id: str, email: str, x_athlete_email: Optional[str] = Header(default=None, alias="X-Athlete-Email")):
    email = _enforce_email_scope_or_raise(email, x_athlete_email, "email")
    def _db_op():
        conn = get_db_conn()
        try:
            cur = conn.cursor()
            cur.execute("DELETE FROM training_schedules WHERE schedule_id = %s AND athlete_email = %s;", (schedule_id, email))
            conn.commit()
            cur.close()
            return True
        finally:
            release_db_conn(conn)
    try:
        await asyncio.to_thread(_db_op)
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}

# ──────────────────────────────────────────────────────────────────────────────
# Admin Dashboard Aggregation API Endpoints
# ──────────────────────────────────────────────────────────────────────────────

@app.get("/api/admin/overview")
async def admin_overview():
    """Global KPIs for the Head Coach cockpit: total athletes, sessions, reps, accuracy, avg confidence."""
    def _db_op():
        conn = get_db_conn()
        try:
            cur = conn.cursor()
            # Athlete count
            cur.execute("SELECT COUNT(*) FROM athletes;")
            athlete_count = cur.fetchone()[0] or 0

            # Session aggregates
            cur.execute("""
                SELECT
                    COUNT(*),
                    COALESCE(SUM(total_reps), 0),
                    COALESCE(SUM(successful_reps), 0),
                    COALESCE(MAX(best_streak), 0),
                    COALESCE(AVG(avg_confidence), 0.0),
                    COALESCE(SUM(session_duration_seconds), 0)
                FROM practice_sessions;
            """)
            row = cur.fetchone()
            total_sessions = int(row[0])
            total_reps = int(row[1])
            successful_reps = int(row[2])
            best_streak = int(row[3])
            avg_confidence = round(float(row[4]), 2)
            total_practice_seconds = int(row[5])
            accuracy = round((successful_reps / total_reps * 100), 1) if total_reps > 0 else 0.0

            cur.close()
            return {
                "athlete_count": athlete_count,
                "total_sessions": total_sessions,
                "total_reps": total_reps,
                "successful_reps": successful_reps,
                "accuracy": accuracy,
                "best_streak": best_streak,
                "avg_confidence": avg_confidence,
                "total_practice_hours": round(total_practice_seconds / 3600, 1),
            }
        finally:
            release_db_conn(conn)
    try:
        data = await asyncio.to_thread(_db_op)
        return {"success": True, "overview": data}
    except Exception as e:
        return {"success": True, "overview": {
            "athlete_count": 0, "total_sessions": 0, "total_reps": 0,
            "successful_reps": 0, "accuracy": 0.0, "best_streak": 0,
            "avg_confidence": 0.0, "total_practice_hours": 0.0,
        }, "fallback": True, "error": str(e)}


@app.get("/api/admin/shot-distribution")
async def admin_shot_distribution():
    """Shot popularity matrix: how many sessions per target_shot, with accuracy."""
    def _db_op():
        conn = get_db_conn()
        try:
            cur = conn.cursor()
            cur.execute("""
                SELECT
                    target_shot,
                    COUNT(*) as session_count,
                    COALESCE(SUM(total_reps), 0) as total_reps,
                    COALESCE(SUM(successful_reps), 0) as successful_reps,
                    COALESCE(AVG(avg_confidence), 0.0) as avg_conf,
                    COALESCE(MAX(best_streak), 0) as max_streak
                FROM practice_sessions
                GROUP BY target_shot
                ORDER BY session_count DESC;
            """)
            rows = cur.fetchall()
            cur.close()
            return [
                {
                    "shot": r[0],
                    "sessions": int(r[1]),
                    "total_reps": int(r[2]),
                    "successful_reps": int(r[3]),
                    "accuracy": round((int(r[3]) / int(r[2]) * 100), 1) if int(r[2]) > 0 else 0.0,
                    "avg_confidence": round(float(r[4]), 2),
                    "max_streak": int(r[5]),
                }
                for r in rows
            ]
        finally:
            release_db_conn(conn)
    try:
        data = await asyncio.to_thread(_db_op)
        return {"success": True, "distribution": data}
    except Exception as e:
        return {"success": True, "distribution": [], "fallback": True, "error": str(e)}


@app.get("/api/admin/flaw-hotspots")
async def admin_flaw_hotspots():
    """Biomechanical flaw frequency from stroke_telemetry_logs where status != 'success'."""
    def _db_op():
        conn = get_db_conn()
        try:
            cur = conn.cursor()
            # Count errors by feedback/status
            cur.execute("""
                SELECT
                    coach_feedback,
                    status,
                    shot_name,
                    COUNT(*) as occurrence_count,
                    COALESCE(AVG(elbow_angle), 0.0) as avg_elbow,
                    COALESCE(AVG(knee_angle), 0.0) as avg_knee
                FROM stroke_telemetry_logs
                WHERE status != 'success' AND status IS NOT NULL AND coach_feedback IS NOT NULL AND coach_feedback != ''
                GROUP BY coach_feedback, status, shot_name
                ORDER BY occurrence_count DESC
                LIMIT 20;
            """)
            rows = cur.fetchall()
            cur.close()
            return [
                {
                    "feedback": r[0] or "Unknown",
                    "status": r[1],
                    "shot": r[2],
                    "count": int(r[3]),
                    "avg_elbow": round(float(r[4]), 1),
                    "avg_knee": round(float(r[5]), 1),
                }
                for r in rows
            ]
        finally:
            release_db_conn(conn)
    try:
        data = await asyncio.to_thread(_db_op)
        return {"success": True, "hotspots": data}
    except Exception as e:
        return {"success": True, "hotspots": [], "fallback": True, "error": str(e)}


@app.get("/api/admin/athletes")
async def admin_athletes():
    """Full athlete roster with aggregated practice stats per athlete."""
    def _db_op():
        conn = get_db_conn()
        try:
            cur = conn.cursor()
            cur.execute("""
                SELECT
                    a.id, a.email, a.name, a.stance, a.experience_level, a.created_at,
                    COALESCE(COUNT(ps.id), 0) as session_count,
                    COALESCE(SUM(ps.total_reps), 0) as total_reps,
                    COALESCE(SUM(ps.successful_reps), 0) as successful_reps,
                    COALESCE(MAX(ps.best_streak), 0) as best_streak,
                    COALESCE(AVG(ps.avg_confidence), 0.0) as avg_confidence,
                    COALESCE(SUM(ps.session_duration_seconds), 0) as total_time
                FROM athletes a
                LEFT JOIN practice_sessions ps ON a.email = ps.athlete_email
                GROUP BY a.id, a.email, a.name, a.stance, a.experience_level, a.created_at
                ORDER BY session_count DESC;
            """)
            rows = cur.fetchall()
            cur.close()
            return [
                {
                    "id": r[0],
                    "email": r[1],
                    "name": r[2],
                    "stance": r[3],
                    "experience": r[4],
                    "joined": str(r[5]),
                    "sessions": int(r[6]),
                    "total_reps": int(r[7]),
                    "successful_reps": int(r[8]),
                    "accuracy": round((int(r[8]) / int(r[7]) * 100), 1) if int(r[7]) > 0 else 0.0,
                    "best_streak": int(r[9]),
                    "avg_confidence": round(float(r[10]), 2),
                    "practice_hours": round(int(r[11]) / 3600, 1),
                }
                for r in rows
            ]
        finally:
            release_db_conn(conn)
    try:
        data = await asyncio.to_thread(_db_op)
        return {"success": True, "athletes": data}
    except Exception as e:
        return {"success": True, "athletes": [], "fallback": True, "error": str(e)}


@app.get("/api/admin/sessions/recent")
async def admin_recent_sessions():
    """Most recent practice sessions across all athletes (for the session feed)."""
    def _db_op():
        conn = get_db_conn()
        try:
            cur = conn.cursor()
            cur.execute("""
                SELECT
                    ps.id, ps.athlete_email, ps.target_shot, ps.total_reps, ps.successful_reps,
                    ps.best_streak, ps.avg_confidence, ps.session_duration_seconds, ps.created_at,
                    COALESCE(a.name, ps.athlete_email) as athlete_name
                FROM practice_sessions ps
                LEFT JOIN athletes a ON ps.athlete_email = a.email
                ORDER BY ps.created_at DESC
                LIMIT 50;
            """)
            rows = cur.fetchall()
            cur.close()
            return [
                {
                    "id": r[0],
                    "email": r[1],
                    "shot": r[2],
                    "total_reps": int(r[3]),
                    "successful_reps": int(r[4]),
                    "accuracy": round((int(r[4]) / int(r[3]) * 100), 1) if int(r[3]) > 0 else 0.0,
                    "best_streak": int(r[5]),
                    "avg_confidence": round(float(r[6] or 0), 2),
                    "duration_seconds": int(r[7]),
                    "created_at": str(r[8]),
                    "athlete_name": r[9],
                }
                for r in rows
            ]
        finally:
            release_db_conn(conn)
    try:
        data = await asyncio.to_thread(_db_op)
        return {"success": True, "sessions": data}
    except Exception as e:
        return {"success": True, "sessions": [], "fallback": True, "error": str(e)}


@app.get("/api/admin/timeline")
async def admin_timeline():
    """Daily aggregated metrics for time-series charts (last 30 days)."""
    def _db_op():
        conn = get_db_conn()
        try:
            cur = conn.cursor()
            cur.execute("""
                SELECT
                    DATE(created_at) as day,
                    COUNT(*) as sessions,
                    COALESCE(SUM(total_reps), 0) as reps,
                    COALESCE(SUM(successful_reps), 0) as clean_reps,
                    COALESCE(AVG(avg_confidence), 0.0) as avg_conf
                FROM practice_sessions
                WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
                GROUP BY DATE(created_at)
                ORDER BY day ASC;
            """)
            rows = cur.fetchall()
            cur.close()
            return [
                {
                    "date": str(r[0]),
                    "sessions": int(r[1]),
                    "reps": int(r[2]),
                    "clean_reps": int(r[3]),
                    "accuracy": round((int(r[3]) / int(r[2]) * 100), 1) if int(r[2]) > 0 else 0.0,
                    "avg_confidence": round(float(r[4]), 2),
                }
                for r in rows
            ]
        finally:
            release_db_conn(conn)
    try:
        data = await asyncio.to_thread(_db_op)
        return {"success": True, "timeline": data}
    except Exception as e:
        return {"success": True, "timeline": [], "fallback": True, "error": str(e)}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    # Cross-Site WebSocket Hijacking (CSWSH) Origin Validation
    origin = websocket.headers.get("origin", "")
    if origin and not _is_allowed_origin(origin):
        print(f"[WebSocket Security] Blocked connection from unauthorized origin: {origin}")
        await websocket.close(code=1008)
        return

    await websocket.accept()
    print("[WebSocket] Client connected")

    camera = None
    target_shot = "cover"
    practice_mode = "no_bat"  # "no_bat" (shadow practice) or "with_bat" (live willow)
    frame_buffer = collections.deque(maxlen=NUM_FRAMES)
    smooth_probs = np.ones(len(CLASS_NAMES)) / len(CLASS_NAMES)
    
    # Swing motion state machine
    # States: "IDLE" -> "SWINGING" -> "COMPLETED"
    swing_state = "IDLE"
    prev_wrist_pos = None
    motion_history = collections.deque(maxlen=10)
    swing_cooldown_until = 0.0
    
    last_infer_time_ms = 12.0
    frame_idx = 0
    
    fps_start_time = time.time()
    fps_counter = 0
    current_fps = float(TARGET_FPS)

    inference_task = None

    try:
        while True:
            loop_start = time.perf_counter()
            client_frame = None

            # 1. Control & Client Image Messages
            try:
                msg = await asyncio.wait_for(websocket.receive_text(), timeout=0.005)
                data = json.loads(msg)
                if "target" in data:
                    requested_target = str(data["target"]).strip().lower()
                    if requested_target in CLASS_NAMES:
                        target_shot = requested_target
                if "practice_mode" in data:
                    requested_mode = str(data["practice_mode"]).strip().lower()
                    if requested_mode in ("no_bat", "with_bat"):
                        practice_mode = requested_mode
                
                # Cloud mode: Decode client stream from browser / phone
                if "image" in data and data["image"]:
                    img_data = data["image"]
                    if "," in img_data:
                        img_data = img_data.split(",", 1)[1]
                    img_bytes = base64.b64decode(img_data)
                    np_arr = np.frombuffer(img_bytes, np.uint8)
                    client_frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
            except (asyncio.TimeoutError, json.JSONDecodeError):
                pass

            # 2. Acquire Frame (Client stream or Local Hardware Camera)
            if client_frame is not None:
                if camera is not None:
                    try:
                        camera.release()
                    except Exception:
                        pass
                    camera = None
                frame = client_frame
            else:
                if camera is None:
                    try:
                        camera = ThreadedCamera(0)
                    except Exception as cam_err:
                        print(f"[Camera Notice]: {cam_err}")
                
                if camera is not None:
                    ret, frame = camera.read()
                    if not ret or frame is None:
                        await asyncio.sleep(0.01)
                        continue
                else:
                    await asyncio.sleep(0.02)
                    continue

            frame_idx += 1
            fps_counter += 1
            now = time.time()
            if now - fps_start_time >= 1.0:
                current_fps = round(fps_counter / (now - fps_start_time), 1)
                fps_counter = 0
                fps_start_time = now

            # 3. Downsampled RGB frame
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            small_pose_frame = cv2.resize(rgb_frame, (320, 240))

            # 4. Bat Orientation & Blade Angle (Live Willow Mode Only - 0% overhead in No Bat Mode)
            bat_data = None
            if practice_mode == "with_bat":
                bat_data = extract_bat_telemetry(small_pose_frame, target_shot)

            # 5. MediaPipe Pose & Relative Biomechanics
            pose_results = pose_engine.process(small_pose_frame) if pose_engine is not None else None
            bio_data = None
            wrist_speed = 0.0

            if pose_results and pose_results.pose_landmarks:
                world_lms = pose_results.pose_world_landmarks.landmark if pose_results.pose_world_landmarks else None
                bio_data = extract_biometrics(
                    pose_results.pose_landmarks.landmark,
                    target_shot,
                    world_landmarks=world_lms,
                    bat_data=bat_data,
                    practice_mode=practice_mode,
                )
                
                if bio_data and bio_data.get("body_detected") and mp_draw and mp_pose:
                    # Draw skeleton only when batter is genuinely standing in view
                    mp_draw.draw_landmarks(
                        frame,
                        pose_results.pose_landmarks,
                        mp_pose.POSE_CONNECTIONS,
                        mp_draw.DrawingSpec(color=(16, 185, 129), thickness=2, circle_radius=2),
                        mp_draw.DrawingSpec(color=(59, 130, 246), thickness=2)
                    )

                    # Compute wrist motion velocity
                    curr_pos = bio_data["wrist_pos"]
                    if prev_wrist_pos is not None:
                        dx = curr_pos[0] - prev_wrist_pos[0]
                        dy = curr_pos[1] - prev_wrist_pos[1]
                        wrist_speed = np.hypot(dx, dy)
                    prev_wrist_pos = curr_pos
                    motion_history.append(wrist_speed)


            # 5. Buffer frame for VideoMAE
            small_frame = cv2.resize(rgb_frame, (IMAGE_SIZE, IMAGE_SIZE))
            frame_buffer.append(small_frame)

            # 6. Non-blocking Asynchronous Inference
            if len(frame_buffer) == NUM_FRAMES and frame_idx % INFER_EVERY == 0:
                if inference_task is None or inference_task.done():
                    frames_snapshot = list(frame_buffer)
                    inference_task = asyncio.create_task(
                        asyncio.to_thread(execute_model_inference, frames_snapshot)
                    )

            if inference_task is not None and inference_task.done() and not inference_task.cancelled():
                try:
                    raw_probs, infer_ms = inference_task.result()
                    last_infer_time_ms = round(infer_ms, 1)
                    smooth_probs = 0.4 * raw_probs + 0.6 * smooth_probs
                except Exception as e:
                    print(f"[Inference Error]: {e}")
                inference_task = None

            top_idx = int(smooth_probs.argmax())
            top_shot = CLASS_NAMES[top_idx]
            target_conf = float(smooth_probs[CLASS_NAMES.index(target_shot)])

            # 7. Physical Swing Detection State Machine
            new_stroke_event = None
            avg_speed = np.mean(motion_history) if motion_history else 0.0

            if bio_data and bio_data.get("body_detected") and now > swing_cooldown_until:
                # Detect rapid arm/wrist swing acceleration
                if swing_state == "IDLE" and avg_speed > 0.045:
                    swing_state = "SWINGING"
                
                # Swing deceleration (follow-through reached)
                elif swing_state == "SWINGING" and avg_speed < 0.025:
                    swing_state = "COMPLETED"
                    
                    # Generate coaching event for this completed stroke
                    new_stroke_event = get_coaching_feedback(
                        top_shot, target_shot, target_conf, bio_data,
                        bat_data=bat_data, practice_mode=practice_mode
                    )
                    swing_cooldown_until = now + 2.0  # 2-second cooldown between strokes
                    swing_state = "IDLE"

            # 8. JPEG Compression (only needed when client does not have local camera)
            frame_base64 = None
            if client_frame is None:
                _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 60])
                frame_base64 = base64.b64encode(buffer).decode('utf-8')

            # 9. Dispatch Payload
            payload = {
                "frame": frame_base64,
                "probs": {CLASS_NAMES[i]: float(smooth_probs[i]) for i in range(len(CLASS_NAMES))},
                "topShot": top_shot,
                "confidence": float(np.max(smooth_probs)),
                "targetShot": target_shot,
                "targetConfidence": target_conf,
                "feedback": new_stroke_event,
                "biometrics": bio_data,
                "bat": bat_data,
                "practiceMode": practice_mode,
                "telemetry": {
                    "fps": current_fps,
                    "inference_ms": last_infer_time_ms,
                    "device": str(device),
                    "fp16": use_fp16,
                    "bat_detector": practice_mode == "with_bat" and bat_model is not None
                }
            }

            await websocket.send_text(json.dumps(payload))
            
            elapsed = time.perf_counter() - loop_start
            sleep_time = max(0.005, FRAME_DURATION - elapsed)
            await asyncio.sleep(sleep_time)

    except WebSocketDisconnect:
        print("[WebSocket] Client disconnected")
    except Exception as e:
        print(f"[WebSocket Loop Exception]: {e}")
    finally:
        if camera is not None:
            try:
                camera.release()
            except Exception:
                pass
        if inference_task and not inference_task.done():
            inference_task.cancel()

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8888)
