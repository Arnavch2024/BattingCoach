import asyncio
import base64
import collections
import json
import random
import threading
import time
import os
import uuid
from pathlib import Path
from typing import Dict, List, Optional, Tuple

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

import cv2
import mediapipe as mp
import numpy as np
import torch
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from transformers import VideoMAEForVideoClassification, VideoMAEImageProcessor
from ultralytics import YOLO


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
# Strict Batter Stance Validation & 3D World Biometrics
# ──────────────────────────────────────────────────────────────────────────────

def calculate_3d_angle(a, b, c) -> float:
    """Calculates true 3D Euclidean angle at joint b in degrees using real-world metric vectors (x, y, z)."""
    ba = np.array([a.x - b.x, a.y - b.y, a.z - b.z], dtype=np.float32)
    bc = np.array([c.x - b.x, c.y - b.y, c.z - b.z], dtype=np.float32)
    
    norm_ba = np.linalg.norm(ba)
    norm_bc = np.linalg.norm(bc)
    
    if norm_ba < 1e-5 or norm_bc < 1e-5:
        return 0.0
        
    cos_angle = np.dot(ba, bc) / (norm_ba * norm_bc)
    cos_angle = np.clip(cos_angle, -1.0, 1.0)
    
    angle = np.arccos(cos_angle) * (180.0 / np.pi)
    return float(angle)

def extract_biometrics(
    landmarks_2d, 
    target_shot: str, 
    world_landmarks=None, 
    bat_data: Optional[Dict] = None
) -> Optional[Dict]:
    """
    Computes body-relative, perspective-invariant biomechanics and bat-to-torso kinematics:
    1. Torso & Spine coordinate frame (forward/backward lean in degrees).
    2. Head-over-knee alignment relative to batter's torso scale.
    3. Stride length and stance weight transfer (front-foot vs back-foot).
    4. Lead arm 3D angle and extension reach ratio.
    5. Bat-to-pad proximity and blade-to-spine relative orientation (in With-Bat mode).
    """
    nose = landmarks_2d[mp_pose.PoseLandmark.NOSE]
    l_shoulder = landmarks_2d[mp_pose.PoseLandmark.LEFT_SHOULDER]
    r_shoulder = landmarks_2d[mp_pose.PoseLandmark.RIGHT_SHOULDER]
    l_elbow = landmarks_2d[mp_pose.PoseLandmark.LEFT_ELBOW]
    r_elbow = landmarks_2d[mp_pose.PoseLandmark.RIGHT_ELBOW]
    l_wrist = landmarks_2d[mp_pose.PoseLandmark.LEFT_WRIST]
    r_wrist = landmarks_2d[mp_pose.PoseLandmark.RIGHT_WRIST]
    l_hip = landmarks_2d[mp_pose.PoseLandmark.LEFT_HIP]
    r_hip = landmarks_2d[mp_pose.PoseLandmark.RIGHT_HIP]
    l_knee = landmarks_2d[mp_pose.PoseLandmark.LEFT_KNEE]
    r_knee = landmarks_2d[mp_pose.PoseLandmark.RIGHT_KNEE]
    l_ankle = landmarks_2d[mp_pose.PoseLandmark.LEFT_ANKLE]
    r_ankle = landmarks_2d[mp_pose.PoseLandmark.RIGHT_ANKLE]

    # 1. Torso Coordinate Frame & Anatomical Scaling (in 2D normalized space)
    mid_shoulder_x = (l_shoulder.x + r_shoulder.x) / 2.0
    mid_shoulder_y = (l_shoulder.y + r_shoulder.y) / 2.0
    mid_hip_x = (l_hip.x + r_hip.x) / 2.0
    mid_hip_y = (l_hip.y + r_hip.y) / 2.0

    torso_dx = mid_shoulder_x - mid_hip_x
    torso_dy = mid_shoulder_y - mid_hip_y  # negative when shoulders are above hips
    torso_length = float(np.hypot(torso_dx, torso_dy))
    shoulder_width = float(abs(l_shoulder.x - r_shoulder.x))

    # Reject non-standing or severe occlusion
    if torso_length < 0.10 or shoulder_width < 0.06:
        return None
    if l_shoulder.visibility < 0.60 or r_shoulder.visibility < 0.60 or (l_hip.visibility < 0.40 and r_hip.visibility < 0.40):
        return None

    # 2. Spine Lean Angle (Relative to anatomical vertical)
    # Forward lean (towards front knee / bowler) is positive degrees
    spine_angle_rad = np.arctan2(abs(torso_dx), max(abs(torso_dy), 1e-4))
    spine_angle_deg = round(float(np.degrees(spine_angle_rad)), 1)

    # 3. Lead Side vs Back Side Identification
    # In cricket batting stances, lead arm has highest visibility/extension towards the bowler
    is_left_lead = (l_elbow.visibility + l_wrist.visibility) >= (r_elbow.visibility + r_wrist.visibility)
    
    lead_sh_idx = mp_pose.PoseLandmark.LEFT_SHOULDER if is_left_lead else mp_pose.PoseLandmark.RIGHT_SHOULDER
    lead_el_idx = mp_pose.PoseLandmark.LEFT_ELBOW if is_left_lead else mp_pose.PoseLandmark.RIGHT_ELBOW
    lead_wr_idx = mp_pose.PoseLandmark.LEFT_WRIST if is_left_lead else mp_pose.PoseLandmark.RIGHT_WRIST
    lead_knee_idx = mp_pose.PoseLandmark.LEFT_KNEE if is_left_lead else mp_pose.PoseLandmark.RIGHT_KNEE
    trail_knee_idx = mp_pose.PoseLandmark.RIGHT_KNEE if is_left_lead else mp_pose.PoseLandmark.LEFT_KNEE
    lead_ankle_idx = mp_pose.PoseLandmark.LEFT_ANKLE if is_left_lead else mp_pose.PoseLandmark.RIGHT_ANKLE
    trail_ankle_idx = mp_pose.PoseLandmark.RIGHT_ANKLE if is_left_lead else mp_pose.PoseLandmark.LEFT_ANKLE

    lead_shoulder = landmarks_2d[lead_sh_idx]
    lead_elbow = landmarks_2d[lead_el_idx]
    lead_wrist = landmarks_2d[lead_wr_idx]
    lead_knee = landmarks_2d[lead_knee_idx]
    trail_knee = landmarks_2d[trail_knee_idx]
    lead_ankle = landmarks_2d[lead_ankle_idx]
    trail_ankle = landmarks_2d[trail_ankle_idx]

    # 4. Lead Arm 3D Angle
    if world_landmarks:
        s_pt = world_landmarks[lead_sh_idx]
        e_pt = world_landmarks[lead_el_idx]
        w_pt = world_landmarks[lead_wr_idx]
        elbow_angle = calculate_3d_angle(s_pt, e_pt, w_pt)
    else:
        s_pt = lead_shoulder
        e_pt = lead_elbow
        w_pt = lead_wrist
        elbow_angle = calculate_3d_angle(s_pt, e_pt, w_pt)

    # 5. Arm Extension Reach Ratio (Shoulder-to-wrist reach / total arm length)
    upper_arm = np.hypot(lead_elbow.x - lead_shoulder.x, lead_elbow.y - lead_shoulder.y)
    forearm = np.hypot(lead_wrist.x - lead_elbow.x, lead_wrist.y - lead_elbow.y)
    total_arm = max(upper_arm + forearm, 1e-4)
    direct_reach = np.hypot(lead_wrist.x - lead_shoulder.x, lead_wrist.y - lead_shoulder.y)
    arm_extension = round(float(np.clip(direct_reach / total_arm, 0.0, 1.0)), 2)

    # 6. Knee Angles (Lead Knee & Trail Knee)
    lead_knee_angle = 150.0
    trail_knee_angle = 155.0
    has_knees = False

    if lead_knee.visibility > 0.40 and lead_ankle.visibility > 0.35:
        has_knees = True
        if world_landmarks:
            h_pt = world_landmarks[mp_pose.PoseLandmark.LEFT_HIP if is_left_lead else mp_pose.PoseLandmark.RIGHT_HIP]
            k_pt = world_landmarks[lead_knee_idx]
            a_pt = world_landmarks[lead_ankle_idx]
            lead_knee_angle = round(calculate_3d_angle(h_pt, k_pt, a_pt), 1)
        else:
            h_pt = landmarks_2d[mp_pose.PoseLandmark.LEFT_HIP if is_left_lead else mp_pose.PoseLandmark.RIGHT_HIP]
            k_pt = lead_knee
            a_pt = lead_ankle
            lead_knee_angle = round(calculate_3d_angle(h_pt, k_pt, a_pt), 1)

    if trail_knee.visibility > 0.40 and trail_ankle.visibility > 0.35:
        if world_landmarks:
            h_pt = world_landmarks[mp_pose.PoseLandmark.RIGHT_HIP if is_left_lead else mp_pose.PoseLandmark.LEFT_HIP]
            k_pt = world_landmarks[trail_knee_idx]
            a_pt = world_landmarks[trail_ankle_idx]
            trail_knee_angle = round(calculate_3d_angle(h_pt, k_pt, a_pt), 1)
        else:
            h_pt = landmarks_2d[mp_pose.PoseLandmark.RIGHT_HIP if is_left_lead else mp_pose.PoseLandmark.LEFT_HIP]
            k_pt = trail_knee
            a_pt = trail_ankle
            trail_knee_angle = round(calculate_3d_angle(h_pt, k_pt, a_pt), 1)

    # 7. Head Position Relative to Lead Knee (Normalized by torso height)
    head_knee_gap = abs(nose.x - lead_knee.x) / max(torso_length, 1e-4) if has_knees else 0.0
    head_over_knee = bool(head_knee_gap <= 0.28) if has_knees else True
    head_tilt = round(abs(nose.x - mid_shoulder_x) / max(shoulder_width, 1e-4), 2)

    # 8. Stride Ratio & Weight Distribution
    stride_width = abs(lead_ankle.x - trail_ankle.x) if (lead_ankle.visibility > 0.35 and trail_ankle.visibility > 0.35) else 0.0
    stride_ratio = round(float(stride_width / max(torso_length, 1e-4)), 2)

    weight_distribution = "Balanced Stance"
    if has_knees:
        if lead_knee_angle < 155.0 and spine_angle_deg > 8.0:
            weight_distribution = "Front Foot Weighted"
        elif trail_knee_angle < 150.0 or spine_angle_deg < 6.0:
            weight_distribution = "Back Foot Anchored"

    # 9. Bat-to-Body Kinematics (When in With-Bat mode)
    bat_pad_gap = None
    bat_rel_spine_deg = None

    if bat_data and bat_data.get("detected"):
        bat_center = bat_data.get("center")
        if bat_center:
            # Distance from bat center to front knee / pad in torso units
            dx = bat_center[0] - lead_knee.x
            dy = bat_center[1] - lead_knee.y
            bat_pad_gap = round(float(np.hypot(dx, dy) / max(torso_length, 1e-4)), 2)

        # Angle of bat relative to batter's spine vector
        blade_angle = bat_data.get("blade_angle", 90.0)
        # Spine vector angle relative to horizontal
        spine_dir_deg = np.degrees(np.arctan2(-torso_dy, torso_dx)) % 180.0
        bat_rel_spine_deg = round(float(abs(blade_angle - spine_dir_deg)), 1)

    # 10. Anatomical Shot Diagnosis Heuristics (Relative to User's Body)
    error_detected = False
    error_code = "NONE"
    priority_tip = None
    correction_cue = "Maintain this rhythm and balance!"

    # Front Foot Drives: Cover Drive, Straight Drive, Lofted Drive
    if target_shot in ["cover", "straight", "lofted"]:
        if elbow_angle < 128.0:
            error_detected = True
            error_code = "LOW_ELBOW"
            priority_tip = "Keep your lead elbow high (≥130°) to present a full bat face and control trajectory."
            correction_cue = "Raise your front elbow to eye level before starting the downswing."
        elif has_knees and not head_over_knee and head_knee_gap > 0.32:
            error_detected = True
            error_code = "HEAD_BEHIND_KNEE"
            priority_tip = "Lean your head over your lead knee to get over the line of the ball."
            correction_cue = "Step forward and drop your nose directly over your lead knee."
        elif has_knees and lead_knee_angle > 165.0:
            error_detected = True
            error_code = "STRAIGHT_KNEE"
            priority_tip = "Bend your front knee forward into the shot to lower your center of gravity."
            correction_cue = "Flex your lead knee into a firm lunge into the pitch of the ball."
        elif spine_angle_deg < 6.0:
            error_detected = True
            error_code = "UPRIGHT_SPINE"
            priority_tip = "Transfer weight forward into the drive; avoid standing too upright."
            correction_cue = "Tilt your torso forward 15°–20° toward the bowler."
        elif bat_data and bat_data.get("detected") and not bat_data.get("is_vertical"):
            error_detected = True
            error_code = "CROSS_BAT_ON_DRIVE"
            priority_tip = "Keep bat blade vertical down the line — avoid cross-bat swinging on drives."
            correction_cue = "Present the full vertical face of the blade down the ground."

    # Forward Defense
    elif target_shot == "defense":
        if bat_pad_gap is not None and bat_pad_gap > 0.42:
            error_detected = True
            error_code = "BAT_PAD_GAP"
            priority_tip = "Bat-Pad Gap: Keep the bat blade close beside your front pad to avoid inside edges."
            correction_cue = "Tuck the bat blade directly against your lead pad with no gap."
        elif elbow_angle > 145.0:
            error_detected = True
            error_code = "HARD_HANDS_DEFENSE"
            priority_tip = "Maintain soft hands with elbows tucked in close to your body for defensive control."
            correction_cue = "Relax your bottom hand grip and keep elbows compact."
        elif has_knees and lead_knee_angle > 165.0:
            error_detected = True
            error_code = "STRAIGHT_KNEE_DEFENSE"
            priority_tip = "Lunge firmly onto the front knee to smother the bounce."
            correction_cue = "Get your head and front knee over the ball to deaden the strike."

    # Cross-Bat Power Shots: Pull Shot, Hook Shot
    elif target_shot in ["pull", "hook"]:
        if arm_extension < 0.76:
            error_detected = True
            error_code = "LOW_ARM_EXTENSION"
            priority_tip = "Extend your arms fully through the swing arc for maximum leverage and power."
            correction_cue = "Reach full arm extension through the impact zone for power."
        elif weight_distribution == "Front Foot Weighted" and spine_angle_deg > 22.0:
            error_detected = True
            error_code = "FRONT_FOOT_ON_PULL"
            priority_tip = "Anchor your weight onto the back foot to clear your front hip."
            correction_cue = "Shift your center of mass back onto the rear leg and pivot."
        elif bat_data and bat_data.get("detected") and bat_data.get("is_vertical"):
            error_detected = True
            error_code = "VERTICAL_BAT_ON_PULL"
            priority_tip = "Swing horizontally across the line with wrists rolled over the ball."
            correction_cue = "Swing in a horizontal arc and roll your wrists over top."

    # Square Cut & Late Cut
    elif target_shot in ["square_cut", "late_cut"]:
        if target_shot == "square_cut" and arm_extension < 0.74:
            error_detected = True
            error_code = "CRAMPED_ARMS_CUT"
            priority_tip = "Extend your hands away from your body to slice through the point region."
            correction_cue = "Free your arms and slice high-to-low through point."
        elif target_shot == "late_cut" and elbow_angle > 140.0:
            error_detected = True
            error_code = "HARD_HANDS_LATE_CUT"
            priority_tip = "Keep hands close to body with relaxed wrists to guide the ball fine."
            correction_cue = "Wait for the ball and open the blade with soft wrists late."

    # Sweep Shot
    elif target_shot == "sweep":
        if has_knees and trail_knee_angle > 140.0:
            error_detected = True
            error_code = "HIGH_BACK_KNEE_SWEEP"
            priority_tip = "Drop your back knee low to the ground to stabilize your sweeping base."
            correction_cue = "Kneel down low on your back knee before sweeping across."

    # General Head Stability Check
    if not error_detected and head_tilt > 0.25:
        error_detected = True
        error_code = "HEAD_TILT"
        priority_tip = "Keep your eyes and head level with the point of impact throughout the stroke."
        correction_cue = "Level your eyes horizontally with the delivery path."

    # 11. Live Technical Checklist for Overlay HUD
    live_checklist = {
        "elbow_ok": bool(elbow_angle >= 128.0) if target_shot in ["cover", "straight", "lofted"] else True,
        "knee_ok": bool(lead_knee_angle <= 160.0) if has_knees and target_shot in ["cover", "straight", "defense"] else True,
        "head_ok": bool(head_over_knee),
        "spine_ok": bool(spine_angle_deg >= 7.0) if target_shot in ["cover", "straight", "defense"] else True,
        "blade_ok": bool(bat_data.get("alignment_match", True)) if bat_data and bat_data.get("detected") else True
    }

    return {
        "body_detected": True,
        "is_3d": world_landmarks is not None,
        "elbow_angle": round(elbow_angle, 1),
        "knee_angle": round(lead_knee_angle, 1),
        "trail_knee_angle": round(trail_knee_angle, 1),
        "knee_visible": has_knees,
        "spine_angle": spine_angle_deg,
        "head_tilt": head_tilt,
        "head_over_knee": head_over_knee,
        "head_knee_gap": round(head_knee_gap, 2),
        "stride_ratio": stride_ratio,
        "arm_extension": arm_extension,
        "weight_distribution": weight_distribution,
        "bat_pad_gap": bat_pad_gap,
        "bat_rel_spine_deg": bat_rel_spine_deg,
        "wrist_pos": (float(lead_wrist.x), float(lead_wrist.y)),
        "error_detected": error_detected,
        "error_code": error_code,
        "priority_tip": priority_tip,
        "correction_cue": correction_cue,
        "live_checklist": live_checklist
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

def get_coaching_feedback(
    detected_shot: str,
    target_shot: str,
    confidence: float,
    bio_data: Optional[Dict],
    bat_data: Optional[Dict] = None,
    practice_mode: str = "no_bat"
) -> Dict:
    all_tips = COACHING_TIPS.get(target_shot, [])
    if confidence < 0.40:
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

    has_bio_error = bool(bio_data and bio_data.get("error_detected"))
    bio_tip = bio_data.get("priority_tip") if bio_data else None
    bio_error_code = bio_data.get("error_code", "BIOMECHANICAL_ERROR") if bio_data else "NONE"
    bio_correction_cue = bio_data.get("correction_cue") if bio_data else None

    # Case 1: Wrong stroke detected (e.g. pulled when drill was cover drive)
    if detected_shot != target_shot:
        det_name = detected_shot.replace('_', ' ').title()
        tgt_name = target_shot.replace('_', ' ').title()
        return {
            "id": event_id,
            "status": "wrong_shot",
            "is_correct": False,
            "error_code": "STROKE_MISMATCH",
            "tier": "Stroke Mismatch",
            "message": f"Wrong Shot: Detected {det_name} instead of {tgt_name}.",
            "correction_cue": f"Re-align your swing plane for a {tgt_name}.",
            "tips": [f"Adjust swing trajectory to match {tgt_name} plane."] + shuffled_tips[:1]
        }

    # Case 2: Priority Biomechanical / Bat-to-Body Adjustment
    if has_bio_error and bio_tip:
        return {
            "id": event_id,
            "status": "form_error",
            "is_correct": False,
            "error_code": bio_error_code,
            "tier": "Biomechanical Correction",
            "message": "Form Alert: Key technical adjustment required.",
            "correction_cue": bio_correction_cue or bio_tip,
            "tips": [bio_tip] + shuffled_tips[:1]
        }

    # Case 3: Bat Blade Alignment Check (In with_bat mode)
    if practice_mode == "with_bat" and bat_data and bat_data.get("detected"):
        if not bat_data.get("alignment_match"):
            target_name = target_shot.replace('_', ' ').title()
            vertical_shots = ["cover", "straight", "defense", "lofted"]
            expected_plane = "vertical down the ground" if target_shot in vertical_shots else "horizontal across the line"
            return {
                "id": event_id,
                "status": "form_error",
                "is_correct": False,
                "error_code": "BLADE_ALIGNMENT_MISMATCH",
                "tier": "Bat Blade Alignment",
                "message": f"Blade Angle Alert: Present bat face {expected_plane}.",
                "correction_cue": f"Rotate bat face {expected_plane} ({bat_data.get('blade_angle', 0)}° detected).",
                "tips": [f"Adjust blade orientation ({bat_data.get('blade_angle', 0)}°) to match the {target_name} plane."] + shuffled_tips[:1]
            }

    # Case 4: Target stroke detected with sufficient confidence and clean biomechanics
    if confidence >= 0.35:
        msg = "Textbook Execution! Perfect body & bat alignment." if confidence > 0.65 else "Clean Shot! Form criteria verified."
        return {
            "id": event_id,
            "status": "success",
            "is_correct": True,
            "error_code": "NONE",
            "tier": tier,
            "message": msg,
            "correction_cue": "Excellent technique — maintain this swing path!",
            "tips": shuffled_tips[:2]
        }
    else:
        return {
            "id": event_id,
            "status": "improving",
            "is_correct": False,
            "error_code": "LOW_POWER_COMMITMENT",
            "tier": "Commit to Shot",
            "message": f"Low Power: Commit fully to the {target_shot.replace('_', ' ').title()}.",
            "correction_cue": f"Accelerate smoothly through the impact line with full commitment.",
            "tips": shuffled_tips[:2]
        }


# ──────────────────────────────────────────────────────────────────────────────
# Supabase PostgreSQL Database Integration
# ──────────────────────────────────────────────────────────────────────────────

import os
import psycopg2
from psycopg2 import pool
from pydantic import BaseModel

# Read strictly from environment variable (never hardcoded in source)
DATABASE_URL = os.getenv("DATABASE_URL", "")

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
    athlete_email: Optional[str] = "athlete@cricketcoach.ai"

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

# ──────────────────────────────────────────────────────────────────────────────
# FastAPI App & WebSocket Endpoint with Swing Motion State Machine
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
async def sync_athlete(req: AthleteSyncRequest):
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
async def save_session(req: PracticeSessionSaveRequest):
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
async def get_session_history(email: str = "athlete@batcoach.ai"):
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
async def get_stats(email: str = "athlete@batcoach.ai"):
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
async def sync_schedule(req: ScheduleSyncRequest):
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
async def list_schedule(email: str = "athlete@cricketcoach.ai"):
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
async def delete_schedule(schedule_id: str, email: str = "athlete@cricketcoach.ai"):
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

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
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
                    target_shot = data["target"]
                if "practice_mode" in data:
                    practice_mode = data["practice_mode"]
                
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
                    bat_data=bat_data
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

            # 8. JPEG Compression (for fallback stream)
            _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
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
        camera.release()
        if inference_task and not inference_task.done():
            inference_task.cancel()

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8888)
