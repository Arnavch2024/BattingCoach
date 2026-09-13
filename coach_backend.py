import asyncio
import base64
import collections
import json
import random
import time
from pathlib import Path

import cv2
import mediapipe as mp
import numpy as np
import torch
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from transformers import VideoMAEForVideoClassification, VideoMAEImageProcessor

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

# Expanded Coaching Tips Mapping with Tiers
# Each shot has: Foundational (0-2), Intermediate (3-6), Elite (7+)
COACHING_TIPS = {
    "cover": [
        "FOUNDATIONAL: Lean forward with your head over the front knee.",
        "FOUNDATIONAL: Step firmly into the line of the shot.",
        "TECHNICAL: Keep your front elbow high throughout the swing.",
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
        "TECHNICAL: Fully extend your arms to generate power.",
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
INFER_EVERY = 24  # Run inference roughly once per second at 30fps
COOLDOWN_SECONDS = 3.0  # Minimum time between new coaching tips
CONSENSUS_WINDOW = 3   # Number of consecutive inferences to average for a stable result

# ──────────────────────────────────────────────────────────────────────────────
# AI Model & MediaPipe Setup
# ──────────────────────────────────────────────────────────────────────────────

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Device: {device}")

print(f"Loading model from: {MODEL_DIR}")
processor = VideoMAEImageProcessor.from_pretrained(str(MODEL_DIR))
model = VideoMAEForVideoClassification.from_pretrained(str(MODEL_DIR))
model.to(device).eval()

mp_pose = mp.solutions.pose
pose_engine = mp_pose.Pose(
    static_image_mode=False,
    model_complexity=1,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5,
)
mp_draw = mp.solutions.drawing_utils

# ──────────────────────────────────────────────────────────────────────────────
# FastAPI App
# ──────────────────────────────────────────────────────────────────────────────

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CoachState:
    def __init__(self):
        self.target_shot = "cover"
        self.frame_buffer = collections.deque(maxlen=NUM_FRAMES)
        self.running = False
        self.cap = None

state = CoachState()

@torch.no_grad()
def run_inference(frames_rgb):
    inputs = processor(frames_rgb, return_tensors="pt")
    pixel_values = inputs["pixel_values"].to(device)
    outputs = model(pixel_values=pixel_values)
    probs = torch.softmax(outputs.logits, dim=-1)[0].cpu().numpy()
    return probs

def calculate_angle(a, b, c):
    """Calculates the angle between three points (a, b, c) at joint b."""
    a = np.array([a.x, a.y])
    b = np.array([b.x, b.y])
    c = np.array([c.x, c.y])
    
    radians = np.arctan2(c[1] - b[1], c[0] - b[0]) - np.arctan2(a[1] - b[1], a[0] - b[0])
    angle = np.abs(radians * 180.0 / np.pi)
    
    if angle > 180.0:
        angle = 360 - angle
    return angle

def analyze_biometrics(landmarks, target_shot):
    """
    Analyzes body landmarks to find technical errors based on target shot.
    Returns (error_detected, priority_tip).
    """
    # Key Landmarks
    nose = landmarks[mp_pose.PoseLandmark.NOSE]
    l_shoulder = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER]
    r_shoulder = landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER]
    l_elbow = landmarks[mp_pose.PoseLandmark.LEFT_ELBOW]
    l_wrist = landmarks[mp_pose.PoseLandmark.LEFT_WRIST]
    l_knee = landmarks[mp_pose.PoseLandmark.LEFT_KNEE]
    l_hip = landmarks[mp_pose.PoseLandmark.LEFT_HIP]
    l_ankle = landmarks[mp_pose.PoseLandmark.LEFT_ANKLE]

    # 1. Head Stability (Priority #1)
    # Check if nose is too far from mid-shoulder line (Head Tilt)
    mid_shoulder_x = (l_shoulder.x + r_shoulder.x) / 2
    head_tilt = abs(nose.x - mid_shoulder_x) / abs(l_shoulder.x - r_shoulder.x) # Normalized
    if head_tilt > 0.15:
        return True, "Keep your head still and positioned forward over the line."

    # 2. Shot Specific Biometrics
    if "drive" in target_shot or "cover" in target_shot or "straight" in target_shot:
        # Elbow Height (Front elbow)
        elbow_angle = calculate_angle(l_shoulder, l_elbow, l_wrist)
        if elbow_angle < 130:
            return True, "Keep your front elbow high throughout the swing for better control."
        
        # Front Knee Bend
        knee_angle = calculate_angle(l_hip, l_knee, l_ankle)
        if knee_angle > 160:
            return True, "Lean forward and flex your front knee to maintain a stable base."

    if "pull" in target_shot or "hook" in target_shot:
        # Arm Extension
        elbow_angle = calculate_angle(l_shoulder, l_elbow, l_wrist)
        if elbow_angle < 110:
            return True, "Extend your arms fully for a wider and more powerful swing arc."

    return False, None

def get_coaching_feedback(detected_idx, target_shot, probs, landmarks=None):
    detected_shot = CLASS_NAMES[detected_idx]
    confidence = float(probs[target_shot])
    
    # 1. Select Tip Tier based on Model Probability
    # Foundational: 0-2, Technical: 2-6, Elite: 6-10
    all_tips = COACHING_TIPS.get(target_shot, [])
    if confidence < 0.3:
        # Focus on fundamentals (Foundational)
        eligible_tips = all_tips[0:2]
    elif confidence < 0.7:
        # Focus on refinement (Technical)
        eligible_tips = all_tips[2:6]
    else:
        # focus on elite mastery (Elite)
        eligible_tips = all_tips[6:]
    
    shuffled_tips = random.sample(eligible_tips, min(len(eligible_tips), 3))

    # 2. Check for Biometric/Form Errors First (if landmarks available)
    if landmarks:
        error_detected, bio_tip = analyze_biometrics(landmarks, target_shot)
        if error_detected:
            return {
                "status": "improving",
                "message": "Form Check: Biometric Alert",
                "tips": [bio_tip] + shuffled_tips[:2]
            }

    # 3. Global Feedback based on Classification
    if detected_shot == target_shot:
        msg = "Perfect Shot! Great mastery." if confidence > 0.8 else "Good Shot! Keep refining."
        return {
            "status": "success",
            "message": msg,
            "tips": shuffled_tips[:2]
        }
    else:
        return {
            "status": "improving",
            "message": f"Form Adjustment: Aim for {target_shot.replace('_', ' ')}.",
            "tips": shuffled_tips
        }

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("Websocket client connected")
    
    try:
        # Start camera
        cap = cv2.VideoCapture(0)
        frame_count = 0
        smooth_probs = np.ones(len(CLASS_NAMES)) / len(CLASS_NAMES)
        
        # Stability tracking
        inference_history = collections.deque(maxlen=CONSENSUS_WINDOW)
        last_feedback_sent_time = 0
        
        while True:
            # Check for incoming messages (like target shot changes)
            try:
                msg = await asyncio.wait_for(websocket.receive_text(), timeout=0.001)
                data = json.loads(msg)
                if "target" in data:
                    state.target_shot = data["target"]
                    # Reset feedback cooldown so user gets a tip immediately for the new shot
                    last_feedback_sent_time = 0
                    print(f"Target shot changed to: {state.target_shot}")
            except (asyncio.TimeoutError, json.JSONDecodeError):
                pass

            ret, frame = cap.read()
            if not ret:
                break
            
            frame_count += 1
            H, W = frame.shape[:2]
            
            # MediaPipe Pose
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            pose_results = pose_engine.process(rgb_frame)
            if pose_results.pose_landmarks:
                mp_draw.draw_landmarks(
                    frame, pose_results.pose_landmarks, mp_pose.POSE_CONNECTIONS,
                    mp_draw.DrawingSpec(color=(0, 200, 120), thickness=2, circle_radius=2),
                    mp_draw.DrawingSpec(color=(50, 150, 255), thickness=2)
                )

            # Buffer for inference
            small_frame = cv2.resize(rgb_frame, (IMAGE_SIZE, IMAGE_SIZE))
            state.frame_buffer.append(small_frame)
            
            feedback = None
            if len(state.frame_buffer) == NUM_FRAMES and frame_count % INFER_EVERY == 0:
                raw_probs = run_inference(list(state.frame_buffer))
                inference_history.append(raw_probs)
                
                # Use averaged probabilities over the consensus window
                consensus_probs = np.mean(list(inference_history), axis=0)
                smooth_probs = 0.5 * consensus_probs + 0.5 * smooth_probs
                
                top_idx = int(smooth_probs.argmax())
                
                # Only generate coaching feedback if cooldown has passed
                current_time = time.time()
                if (current_time - last_feedback_sent_time) > COOLDOWN_SECONDS:
                    # Pass landmarks for biometric analysis and probs for tiered feedback
                    landmarks = pose_results.pose_landmarks.landmark if pose_results.pose_landmarks else None
                    feedback = get_coaching_feedback(top_idx, state.target_shot, smooth_probs, landmarks)
                    last_feedback_sent_time = current_time

            # Encode frame to base64
            _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
            frame_base64 = base64.b64encode(buffer).decode('utf-8')

            # Prepare data to send
            payload = {
                "frame": frame_base64,
                "probs": {CLASS_NAMES[i]: float(smooth_probs[i]) for i in range(len(CLASS_NAMES))},
                "topShot": CLASS_NAMES[int(smooth_probs.argmax())],
                "confidence": float(np.max(smooth_probs)),
                "feedback": feedback
            }
            
            await websocket.send_text(json.dumps(payload))
            
            # Small delay to regulate FPS
            await asyncio.sleep(0.03)

    except WebSocketDisconnect:
        print("Websocket client disconnected")
    finally:
        if cap:
            cap.release()

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8888)
