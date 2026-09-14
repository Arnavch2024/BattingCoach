import asyncio
import base64
import collections
import json
import random
import threading
import time
import uuid
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import cv2
import mediapipe as mp
import numpy as np
import torch
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from transformers import VideoMAEForVideoClassification, VideoMAEImageProcessor

# ──────────────────────────────────────────────────────────────────────────────
# System & Thread Limits (Prevents CPU Core Starvation & Laptop Lag)
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

COACHING_TIPS = {
    "cover": [
        "FOUNDATIONAL: Lean forward with your head over the front knee.",
        "FOUNDATIONAL: Step firmly into the line of the shot.",
        "TECHNICAL: Keep your front elbow high (≥130°) throughout the swing.",
        "TECHNICAL: Maintain a stable base with your back foot anchored.",
        "TECHNICAL: Transfer weight smoothly during the pivot.",
        "TECHNICAL: Focus on driving through the line, not across it.",
        "ELITE: Follow through vertically with the bat face finishing high.",
        "ELITE: Ensure your eyes are level with the point of impact.",
        "ELITE: Relax your bottom hand to allow for better wrist flow.",
        "ELITE: Lean your head slightly in front of your lead knee."
    ],
    "defense": [
        "FOUNDATIONAL: Keep the bat close to your front pad.",
        "FOUNDATIONAL: Maintain soft hands at impact for control.",
        "TECHNICAL: Ensure your head is still and positioned forward.",
        "TECHNICAL: Tuck your elbows in to stay compact and balanced.",
        "TECHNICAL: Present the full face of the bat while angling it down.",
        "TECHNICAL: Focus on making the bat a solid wall with no follow-through.",
        "ELITE: Relax your bottom hand to 'deaden' the strike effectively.",
        "ELITE: Keep your weight balanced evenly across both feet.",
        "ELITE: Ensure your front shoulder is pointing toward the bowler.",
        "ELITE: Retract the bat slightly at impact to absorb energy."
    ],
    "flick": [
        "FOUNDATIONAL: Use your wrists to guide the bat toward the leg side.",
        "FOUNDATIONAL: Keep your front foot slightly across the stumps.",
        "TECHNICAL: Leaning forward helps in maintaining balance.",
        "TECHNICAL: Ensure a smooth rotation of the wrists at impact.",
        "TECHNICAL: Keep your head over the front knee for direction.",
        "TECHNICAL: Maintain a fluid follow-through towards mid-wicket.",
        "ELITE: Avoid over-hitting; let the pace do the work.",
        "ELITE: Keep your shoulders side-on as long as possible.",
        "ELITE: Focus on the 'snap' of the wrists for precision.",
        "ELITE: Ensure your hands finish high and across your shoulder."
    ],
    "hook": [
        "FOUNDATIONAL: Transfer weight quickly to your back foot.",
        "FOUNDATIONAL: Pivot on your front foot to clear your hips.",
        "TECHNICAL: Roll your wrists downward to keep the shot low.",
        "TECHNICAL: Fully extend your arms for a wide swing arc.",
        "TECHNICAL: Maintain balance on the balls of your feet.",
        "TECHNICAL: Swing in a horizontal arc from high to low.",
        "ELITE: Keep your eyes focused on the target even as you rotate.",
        "ELITE: Avoid leaning back too far; stay over the line.",
        "ELITE: Ensure your hands finish high above your opposite shoulder.",
        "ELITE: Focus on timing the rotation with the swing height."
    ],
    "late_cut": [
        "FOUNDATIONAL: Wait for the delivery to come close to your body.",
        "FOUNDATIONAL: Maintain a stable base on your back foot.",
        "TECHNICAL: Slice behind square with a sharp wrist movement.",
        "TECHNICAL: Avoid over-extending; keep the action tidy.",
        "TECHNICAL: Guide the pace rather than hitting hard.",
        "TECHNICAL: Use a high-to-low blade movement.",
        "ELITE: Open the face of the bat at the last possible micro-second.",
        "ELITE: Keep your weight primarily on the back foot.",
        "ELITE: Keep your eyes focused on the bat's edge at impact.",
        "ELITE: Your top hand should lead the direction."
    ],
    "lofted": [
        "FOUNDATIONAL: Full extension of your arms provides power.",
        "FOUNDATIONAL: Keep your head still to maintain sight.",
        "TECHNICAL: Ensure a smooth, high follow-through.",
        "TECHNICAL: Hold your shape even after the swing.",
        "TECHNICAL: Pivot on your front foot for shoulder rotation.",
        "TECHNICAL: Focus on timing and a clean swing arc.",
        "ELITE: Clear your front leg to create a wider swing path.",
        "ELITE: The power should come from a vertical swing plane.",
        "ELITE: Keep your eyes on the target until the follow-through.",
        "ELITE: Maintain a firm grip to resist the strike force."
    ],
    "pull": [
        "FOUNDATIONAL: Get your weight onto the back foot early.",
        "FOUNDATIONAL: Step back and across to stabilize gravity.",
        "TECHNICAL: Extend your arms fully for a wider swing arc.",
        "TECHNICAL: Pivot your front foot to open up the hips.",
        "TECHNICAL: Roll your wrists over the impact to keep it flat.",
        "TECHNICAL: Ensure your head stays over the back foot.",
        "ELITE: Your shoulders should rotate as a single unit.",
        "ELITE: The swing should follow a high-to-low path.",
        "ELITE: Focus on hitting in front of square leg for safety.",
        "ELITE: Keep your front elbow pointing toward the target."
    ],
    "square_cut": [
        "FOUNDATIONAL: Step back and across to create room.",
        "FOUNDATIONAL: Transfer weight onto the back foot.",
        "TECHNICAL: Swing vertically from high to low.",
        "TECHNICAL: Roll your wrists at impact to suppress bounce.",
        "TECHNICAL: Keep your arms fully extended away from the body.",
        "TECHNICAL: Point your front shoulder toward the point region.",
        "ELITE: Focus on a clean lateral movement of the bat.",
        "ELITE: Avoid chasing deliveries that are too wide.",
        "ELITE: Your hands should move from high to low for placement.",
        "ELITE: Ensure your back foot is parallel to the crease."
    ],
    "straight": [
        "FOUNDATIONAL: Present the full face of the bat to the front.",
        "FOUNDATIONAL: Stay balanced on your front foot.",
        "TECHNICAL: Follow through vertically with a high elbow.",
        "TECHNICAL: Keep your head forward and over the impact.",
        "TECHNICAL: Ensure your shoulders are level and aligned.",
        "TECHNICAL: Avoid leaning across the line; stay centered.",
        "ELITE: Focus on pushing the bat through the line.",
        "ELITE: Maintain a relaxed top-hand grip for better touch.",
        "ELITE: Your hands should finish high toward the bowler.",
        "ELITE: Keep your knees flexed for minor adjustments."
    ],
    "sweep": [
        "FOUNDATIONAL: Get low on your back knee early.",
        "FOUNDATIONAL: Reach forward and sweep horizontally.",
        "TECHNICAL: Keep your head forward over the front knee.",
        "TECHNICAL: Roll your wrists at impact to keep it grounded.",
        "TECHNICAL: Ensure your front foot points to square leg.",
        "TECHNICAL: Focus on contacting well in front of the pad.",
        "ELITE: Keep your eyes level even while crouching.",
        "ELITE: Ensure your arms are fully extended.",
        "ELITE: Maintain soft wrists to control the placement.",
        "ELITE: Focus on torso and arm rotation for power."
    ]
}

NUM_FRAMES = 16
IMAGE_SIZE = 224
INFER_EVERY = 30
COOLDOWN_SECONDS = 3.0
CONSENSUS_WINDOW = 3
TARGET_FPS = 24
FRAME_DURATION = 1.0 / TARGET_FPS

# ──────────────────────────────────────────────────────────────────────────────
# AI Model & Hardware Acceleration Setup
# ──────────────────────────────────────────────────────────────────────────────

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
use_fp16 = torch.cuda.is_available()
print(f"[AI Pipeline] Device: {device} | Mixed Precision FP16: {use_fp16}")

print(f"[AI Pipeline] Loading VideoMAE model from: {MODEL_DIR}")
processor = VideoMAEImageProcessor.from_pretrained(str(MODEL_DIR))
model = VideoMAEForVideoClassification.from_pretrained(str(MODEL_DIR))
model.to(device).eval()

# MediaPipe Pose Engine (Fast mode)
mp_pose = mp.solutions.pose
pose_engine = mp_pose.Pose(
    static_image_mode=False,
    model_complexity=0,
    min_detection_confidence=0.6,
    min_tracking_confidence=0.6,
)
mp_draw = mp.solutions.drawing_utils

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
            else:
                time.sleep(0.01)

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
# Biometrics with Strict Batter Stance Detection
# ──────────────────────────────────────────────────────────────────────────────

def calculate_angle(a, b, c) -> float:
    a_pt = np.array([a.x, a.y])
    b_pt = np.array([b.x, b.y])
    c_pt = np.array([c.x, c.y])
    
    radians = np.arctan2(c_pt[1] - b_pt[1], c_pt[0] - b_pt[0]) - np.arctan2(a_pt[1] - b_pt[1], a_pt[0] - b_pt[0])
    angle = np.abs(radians * 180.0 / np.pi)
    if angle > 180.0:
        angle = 360.0 - angle
    return float(angle)

def extract_biometrics(landmarks, target_shot: str) -> Optional[Dict]:
    """
    Extracts joint angles only if a standing batter (shoulders & arms) is genuinely in view.
    Returns None if only a face/close-up is detected.
    """
    nose = landmarks[mp_pose.PoseLandmark.NOSE]
    l_shoulder = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER]
    r_shoulder = landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER]
    l_elbow = landmarks[mp_pose.PoseLandmark.LEFT_ELBOW]
    r_elbow = landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW]
    l_wrist = landmarks[mp_pose.PoseLandmark.LEFT_WRIST]
    r_wrist = landmarks[mp_pose.PoseLandmark.RIGHT_WRIST]
    l_knee = landmarks[mp_pose.PoseLandmark.LEFT_KNEE]
    l_hip = landmarks[mp_pose.PoseLandmark.LEFT_HIP]
    l_ankle = landmarks[mp_pose.PoseLandmark.LEFT_ANKLE]

    # Stance Validation: Check if upper torso & arms are genuinely visible in frame
    shoulder_vis = (l_shoulder.visibility + r_shoulder.visibility) / 2.0
    arm_vis = max(l_elbow.visibility, r_elbow.visibility)
    
    # If user is sitting close to webcam with only face visible, discard
    if shoulder_vis < 0.65 or arm_vis < 0.45:
        return None

    # Calculate lead arm angle (use left arm for right-hand stance or right if more visible)
    lead_shoulder = l_shoulder if l_elbow.visibility >= r_elbow.visibility else r_shoulder
    lead_elbow = l_elbow if l_elbow.visibility >= r_elbow.visibility else r_elbow
    lead_wrist = l_wrist if l_wrist.visibility >= r_wrist.visibility else r_wrist

    elbow_angle = calculate_angle(lead_shoulder, lead_elbow, lead_wrist)
    
    # Knee angle if legs are visible in frame
    knee_angle = None
    if l_knee.visibility > 0.45 and l_hip.visibility > 0.45 and l_ankle.visibility > 0.35:
        knee_angle = round(calculate_angle(l_hip, l_knee, l_ankle), 1)

    mid_shoulder_x = (l_shoulder.x + r_shoulder.x) / 2.0
    shoulder_width = max(abs(l_shoulder.x - r_shoulder.x), 1e-4)
    head_tilt = abs(nose.x - mid_shoulder_x) / shoulder_width

    error_detected = False
    priority_tip = None

    if head_tilt > 0.20:
        error_detected = True
        priority_tip = "Keep your head still and positioned forward over the line."
    elif ("drive" in target_shot or "cover" in target_shot or "straight" in target_shot) and elbow_angle < 125:
        error_detected = True
        priority_tip = "Keep your front elbow high (≥130°) throughout the swing for control."
    elif ("pull" in target_shot or "hook" in target_shot) and elbow_angle < 110:
        error_detected = True
        priority_tip = "Extend your arms fully for a wider and more powerful swing arc."
    elif knee_angle and ("drive" in target_shot or "cover" in target_shot) and knee_angle > 165:
        error_detected = True
        priority_tip = "Bend your front knee forward into the line to lower your center of gravity."

    return {
        "body_detected": True,
        "elbow_angle": round(elbow_angle, 1),
        "knee_angle": knee_angle if knee_angle else 150.0,
        "knee_visible": knee_angle is not None,
        "head_tilt": round(head_tilt, 2),
        "error_detected": error_detected,
        "priority_tip": priority_tip
    }

@torch.inference_mode()
def execute_model_inference(frames_rgb_list: List[np.ndarray]) -> Tuple[np.ndarray, float]:
    t0 = time.perf_counter()
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

def get_coaching_feedback(detected_shot: str, target_shot: str, confidence: float, bio_data: Optional[Dict]) -> Dict:
    all_tips = COACHING_TIPS.get(target_shot, [])
    if confidence < 0.35:
        eligible_tips = all_tips[0:2]
        tier = "Foundational"
    elif confidence < 0.70:
        eligible_tips = all_tips[2:6]
        tier = "Technical"
    else:
        eligible_tips = all_tips[6:]
        tier = "Elite"
    
    shuffled_tips = random.sample(eligible_tips, min(len(eligible_tips), 3))
    event_id = str(uuid.uuid4())

    if bio_data and bio_data.get("error_detected") and bio_data.get("priority_tip"):
        return {
            "id": event_id,
            "status": "improving",
            "tier": "Biometric Adjustment",
            "message": "Form Check: Biometric Alert",
            "tips": [bio_data["priority_tip"]] + shuffled_tips[:2]
        }

    if detected_shot == target_shot and confidence > 0.40:
        msg = "Excellent Shot! High technical precision." if confidence > 0.75 else "Good Shot! Keep solidifying posture."
        return {
            "id": event_id,
            "status": "success",
            "tier": tier,
            "message": msg,
            "tips": shuffled_tips[:2]
        }
    else:
        return {
            "id": event_id,
            "status": "improving",
            "tier": tier,
            "message": f"Form Adjustment: Focus on {target_shot.replace('_', ' ').title()}.",
            "tips": shuffled_tips
        }

# ──────────────────────────────────────────────────────────────────────────────
# FastAPI App & WebSocket Endpoint
# ──────────────────────────────────────────────────────────────────────────────

app = FastAPI(title="BatCoach AI Pro Backend", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {
        "status": "online",
        "device": str(device),
        "cuda_available": torch.cuda.is_available(),
        "fp16": use_fp16,
    }

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("[WebSocket] Client connected")

    camera = ThreadedCamera(0)
    target_shot = "cover"
    frame_buffer = collections.deque(maxlen=NUM_FRAMES)
    inference_history = collections.deque(maxlen=CONSENSUS_WINDOW)
    smooth_probs = np.ones(len(CLASS_NAMES)) / len(CLASS_NAMES)
    
    last_feedback_time = 0.0
    last_infer_time_ms = 12.0
    frame_idx = 0
    
    fps_start_time = time.time()
    fps_counter = 0
    current_fps = float(TARGET_FPS)

    inference_task = None

    try:
        while True:
            loop_start = time.perf_counter()

            # 1. Check for incoming control messages
            try:
                msg = await asyncio.wait_for(websocket.receive_text(), timeout=0.001)
                data = json.loads(msg)
                if "target" in data:
                    target_shot = data["target"]
                    last_feedback_time = 0.0
                    print(f"[Control] Target shot switched to: {target_shot}")
            except (asyncio.TimeoutError, json.JSONDecodeError):
                pass

            # 2. Grab frame from threaded camera
            ret, frame = camera.read()
            if not ret or frame is None:
                await asyncio.sleep(0.01)
                continue

            frame_idx += 1
            fps_counter += 1
            now = time.time()
            if now - fps_start_time >= 1.0:
                current_fps = round(fps_counter / (now - fps_start_time), 1)
                fps_counter = 0
                fps_start_time = now

            # 3. MediaPipe Pose processing on downsampled frame
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            small_pose_frame = cv2.resize(rgb_frame, (320, 240))
            pose_results = pose_engine.process(small_pose_frame)
            
            bio_data = None
            if pose_results.pose_landmarks:
                # Extract biometrics & check if user is actually standing in batter stance
                bio_data = extract_biometrics(pose_results.pose_landmarks.landmark, target_shot)
                
                # Only draw skeleton if batter body is genuinely in view (not on close-up face)
                if bio_data and bio_data.get("body_detected"):
                    mp_draw.draw_landmarks(
                        frame,
                        pose_results.pose_landmarks,
                        mp_pose.POSE_CONNECTIONS,
                        mp_draw.DrawingSpec(color=(16, 185, 129), thickness=2, circle_radius=2),
                        mp_draw.DrawingSpec(color=(59, 130, 246), thickness=2)
                    )

            # 4. Buffer frame for VideoMAE
            small_frame = cv2.resize(rgb_frame, (IMAGE_SIZE, IMAGE_SIZE))
            frame_buffer.append(small_frame)

            # 5. Non-blocking Asynchronous Inference
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
                    inference_history.append(raw_probs)
                    consensus_probs = np.mean(list(inference_history), axis=0)
                    smooth_probs = 0.5 * consensus_probs + 0.5 * smooth_probs
                except Exception as e:
                    print(f"[Inference Error]: {e}")
                inference_task = None

            top_idx = int(smooth_probs.argmax())
            top_shot = CLASS_NAMES[top_idx]
            target_conf = float(smooth_probs[CLASS_NAMES.index(target_shot)])

            # 6. Single-Fire Event Feedback Generation (ONLY when cooldown elapsed)
            new_feedback_event = None
            if (now - last_feedback_time) > COOLDOWN_SECONDS and bio_data and bio_data.get("body_detected"):
                new_feedback_event = get_coaching_feedback(top_shot, target_shot, target_conf, bio_data)
                last_feedback_time = now

            # 7. JPEG Compression
            _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
            frame_base64 = base64.b64encode(buffer).decode('utf-8')

            # 8. Dispatch Payload (feedback is ONLY non-null when a new event fires!)
            payload = {
                "frame": frame_base64,
                "probs": {CLASS_NAMES[i]: float(smooth_probs[i]) for i in range(len(CLASS_NAMES))},
                "topShot": top_shot,
                "confidence": float(np.max(smooth_probs)),
                "targetShot": target_shot,
                "targetConfidence": target_conf,
                "feedback": new_feedback_event,  # None on normal frames, dictionary only on new event!
                "biometrics": bio_data,
                "telemetry": {
                    "fps": current_fps,
                    "inference_ms": last_infer_time_ms,
                    "device": str(device),
                    "fp16": use_fp16
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
        camera.release()
        if inference_task and not inference_task.done():
            inference_task.cancel()

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8888)
