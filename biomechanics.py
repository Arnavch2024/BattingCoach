"""
BatCoach AI Pro - Biomechanical Kinematics & Rule Engine
Extracts 3D joint angles, torso lean, limb extension, and provides textbook coaching feedback.
Pure algorithmic module: Lightweight, fast, and testable without GPU or ML weight dependencies.
"""

import math

# ──────────────────────────────────────────────────────────────────────────────
# Biomechanical Threshold Constants
# Sources:
#   ECB Level 3 Coaching Manual (2019 edition), Section 4: Front-Foot Drives
#   Taliep et al., 'Kinematics of the front-foot off-drive', J. Sports Sciences (2007)
#   MCC Coaching Fundamentals Guide (2021)
# ──────────────────────────────────────────────────────────────────────────────

# Lead elbow extension for front-foot drives: 125°–155° = ideal window
# Below 128° indicates collapsed elbow / insufficient lever
LEAD_ELBOW_MIN_DEG     = 128.0   # ECB: "Front elbow must form clear 'V' shape above ball"
LEAD_ELBOW_SOFT_DEG    = 135.0   # Ideal centre of range

# Front knee flexion: straight knee (>165°) locks the hip and causes top-edges
KNEE_STRAIGHT_DEG      = 165.0   # ECB: knee must flex ≥10° into the shot
KNEE_DEFENSE_HARD_DEG  = 145.0   # Defense: hard hands threshold
KNEE_CHECKLIST_DEG     = 160.0   # HUD green/red threshold aligned to ECB guideline

# Spine forward lean threshold
# <6° indicates upright stance; 10°–20° is the ideal drive range
SPINE_LEAN_MIN_DEG     = 6.0
SPINE_CHECKLIST_DEG    = 7.0     # Slightly higher than error threshold for HUD

# Head alignment: max gap from nose to lead knee in torso-normalised units
HEAD_KNEE_MAX_GAP      = 0.28    # Error trigger
HEAD_KNEE_HARD_GAP     = 0.32    # Error confirmed (secondary guard)
HEAD_TILT_MAX          = 0.25    # Lateral head wobble limit (shoulder-width normalised)

# Arm extension for power shots (pull, hook, cut)
# <0.76 means cramped arms; ideal is >0.80 at impact
ARM_EXTENSION_MIN_PULL = 0.76    # Pull/hook minimum
ARM_EXTENSION_MIN_CUT  = 0.74    # Square cut minimum

# Bat-pad proximity for forward defense
BAT_PAD_MAX_GAP        = 0.42    # Gap > 0.42× torso length = inside-edge risk

# Defense hard hands: too much arm extension opens the face
DEFENSE_ELBOW_MAX      = 145.0

# Late cut hard hands
LATE_CUT_ELBOW_MAX     = 140.0

# Sweep: back knee should be low to the ground
SWEEP_TRAIL_KNEE_MAX   = 140.0

# Front foot pull shot: forward lean + front-foot weight = wrong base
PULL_SPINE_FRONT_FOOT  = 22.0
import random
import uuid
from enum import IntEnum
from typing import Dict, List, Optional, Tuple, Any
import numpy as np

# Standard 33-point MediaPipe Pose Landmark Indices Fallback
class PoseLandmark(IntEnum):
    NOSE = 0
    LEFT_EYE_INNER = 1
    LEFT_EYE = 2
    LEFT_EYE_OUTER = 3
    RIGHT_EYE_INNER = 4
    RIGHT_EYE = 5
    RIGHT_EYE_OUTER = 6
    LEFT_EAR = 7
    RIGHT_EAR = 8
    MOUTH_LEFT = 9
    MOUTH_RIGHT = 10
    LEFT_SHOULDER = 11
    RIGHT_SHOULDER = 12
    LEFT_ELBOW = 13
    RIGHT_ELBOW = 14
    LEFT_WRIST = 15
    RIGHT_WRIST = 16
    LEFT_PINKY = 17
    RIGHT_PINKY = 18
    LEFT_INDEX = 19
    RIGHT_INDEX = 20
    LEFT_THUMB = 21
    RIGHT_THUMB = 22
    LEFT_HIP = 23
    RIGHT_HIP = 24
    LEFT_KNEE = 25
    RIGHT_KNEE = 26
    LEFT_ANKLE = 27
    RIGHT_ANKLE = 28
    LEFT_HEEL = 29
    RIGHT_HEEL = 30
    LEFT_FOOT_INDEX = 31
    RIGHT_FOOT_INDEX = 32

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

def calculate_3d_angle(a, b, c) -> float:
    """Calculates true 3D Euclidean angle at joint b in degrees using metric vectors (x, y, z)."""
    az = getattr(a, 'z', 0.0)
    bz = getattr(b, 'z', 0.0)
    cz = getattr(c, 'z', 0.0)

    ba = np.array([a.x - b.x, a.y - b.y, az - bz], dtype=np.float32)
    bc = np.array([c.x - b.x, c.y - b.y, cz - bz], dtype=np.float32)

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
    bat_data: Optional[Dict] = None,
    practice_mode: str = "no_bat",
) -> Optional[Dict]:
    """
    Computes body-relative, perspective-invariant biomechanics and bat-to-torso kinematics.

    Args:
        landmarks_2d:   MediaPipe 33-point landmark list (normalised [0,1] coordinates).
        target_shot:    Drill target (e.g. 'cover', 'pull', 'sweep').
        world_landmarks: MediaPipe 3D world landmark list for true metric joint angles.
        bat_data:       YOLO-OBB bat telemetry dict (only populated when practice_mode='with_bat').
                        NOTE: bat_data coordinates are normalised over the SAME downsampled frame
                        that MediaPipe processed, so the coordinate spaces are directly comparable.
        practice_mode:  'with_bat'  — live willow session; YOLO bat checks active.
                        'no_bat'    — shadow/ghost swing; bat checks suppressed.

    Returns:
        Dict of biomechanical metrics, or None if body is too occluded to measure.
    """
    nose = landmarks_2d[PoseLandmark.NOSE]
    l_shoulder = landmarks_2d[PoseLandmark.LEFT_SHOULDER]
    r_shoulder = landmarks_2d[PoseLandmark.RIGHT_SHOULDER]
    l_elbow = landmarks_2d[PoseLandmark.LEFT_ELBOW]
    r_elbow = landmarks_2d[PoseLandmark.RIGHT_ELBOW]
    l_wrist = landmarks_2d[PoseLandmark.LEFT_WRIST]
    r_wrist = landmarks_2d[PoseLandmark.RIGHT_WRIST]
    l_hip = landmarks_2d[PoseLandmark.LEFT_HIP]
    r_hip = landmarks_2d[PoseLandmark.RIGHT_HIP]
    l_knee = landmarks_2d[PoseLandmark.LEFT_KNEE]
    r_knee = landmarks_2d[PoseLandmark.RIGHT_KNEE]
    l_ankle = landmarks_2d[PoseLandmark.LEFT_ANKLE]
    r_ankle = landmarks_2d[PoseLandmark.RIGHT_ANKLE]

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
    l_sh_vis = getattr(l_shoulder, 'visibility', 1.0)
    r_sh_vis = getattr(r_shoulder, 'visibility', 1.0)
    l_hip_vis = getattr(l_hip, 'visibility', 1.0)
    r_hip_vis = getattr(r_hip, 'visibility', 1.0)

    if l_sh_vis < 0.60 or r_sh_vis < 0.60 or (l_hip_vis < 0.40 and r_hip_vis < 0.40):
        return None

    # 2. Spine Lean Angle (Relative to anatomical vertical)
    spine_angle_rad = np.arctan2(abs(torso_dx), max(abs(torso_dy), 1e-4))
    spine_angle_deg = round(float(np.degrees(spine_angle_rad)), 1)

    # 3. Lead Side vs Back Side Identification
    l_el_vis = getattr(l_elbow, 'visibility', 1.0)
    l_wr_vis = getattr(l_wrist, 'visibility', 1.0)
    r_el_vis = getattr(r_elbow, 'visibility', 1.0)
    r_wr_vis = getattr(r_wrist, 'visibility', 1.0)
    # Lead-arm detection: higher-visibility side is lead arm.
    # Tiebreaker: if visibilities are within 0.05 of each other, use shoulder x-position
    # (lead shoulder is typically the one closer to camera / smaller x for right-handers).
    vis_diff = (l_el_vis + l_wr_vis) - (r_el_vis + r_wr_vis)
    if abs(vis_diff) > 0.05:
        is_left_lead = vis_diff > 0
    else:
        # Use the shoulder that is more forward (lower x when facing left)
        is_left_lead = l_shoulder.x <= r_shoulder.x

    lead_sh_idx = PoseLandmark.LEFT_SHOULDER if is_left_lead else PoseLandmark.RIGHT_SHOULDER
    lead_el_idx = PoseLandmark.LEFT_ELBOW if is_left_lead else PoseLandmark.RIGHT_ELBOW
    lead_wr_idx = PoseLandmark.LEFT_WRIST if is_left_lead else PoseLandmark.RIGHT_WRIST
    lead_knee_idx = PoseLandmark.LEFT_KNEE if is_left_lead else PoseLandmark.RIGHT_KNEE
    trail_knee_idx = PoseLandmark.RIGHT_KNEE if is_left_lead else PoseLandmark.LEFT_KNEE
    lead_ankle_idx = PoseLandmark.LEFT_ANKLE if is_left_lead else PoseLandmark.RIGHT_ANKLE
    trail_ankle_idx = PoseLandmark.RIGHT_ANKLE if is_left_lead else PoseLandmark.LEFT_ANKLE

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
    else:
        s_pt = lead_shoulder
        e_pt = lead_elbow
        w_pt = lead_wrist
    elbow_angle = calculate_3d_angle(s_pt, e_pt, w_pt)

    # 5. Arm Extension Reach Ratio
    upper_arm = np.hypot(lead_elbow.x - lead_shoulder.x, lead_elbow.y - lead_shoulder.y)
    forearm = np.hypot(lead_wrist.x - lead_elbow.x, lead_wrist.y - lead_elbow.y)
    total_arm = max(upper_arm + forearm, 1e-4)
    direct_reach = np.hypot(lead_wrist.x - lead_shoulder.x, lead_wrist.y - lead_shoulder.y)
    arm_extension = round(float(np.clip(direct_reach / total_arm, 0.0, 1.0)), 2)

    # 6. Knee Angles
    lead_knee_angle = 150.0
    trail_knee_angle = 155.0
    lead_kn_vis = getattr(lead_knee, 'visibility', 1.0)
    lead_ak_vis = getattr(lead_ankle, 'visibility', 1.0)
    trail_kn_vis = getattr(trail_knee, 'visibility', 1.0)
    trail_ak_vis = getattr(trail_ankle, 'visibility', 1.0)

    has_knees = False
    if lead_kn_vis > 0.40 and lead_ak_vis > 0.35:
        has_knees = True
        h_idx = PoseLandmark.LEFT_HIP if is_left_lead else PoseLandmark.RIGHT_HIP
        if world_landmarks:
            h_pt = world_landmarks[h_idx]
            k_pt = world_landmarks[lead_knee_idx]
            a_pt = world_landmarks[lead_ankle_idx]
        else:
            h_pt = landmarks_2d[h_idx]
            k_pt = lead_knee
            a_pt = lead_ankle
        lead_knee_angle = round(calculate_3d_angle(h_pt, k_pt, a_pt), 1)

    if trail_kn_vis > 0.40 and trail_ak_vis > 0.35:
        th_idx = PoseLandmark.RIGHT_HIP if is_left_lead else PoseLandmark.LEFT_HIP
        if world_landmarks:
            h_pt = world_landmarks[th_idx]
            k_pt = world_landmarks[trail_knee_idx]
            a_pt = world_landmarks[trail_ankle_idx]
        else:
            h_pt = landmarks_2d[th_idx]
            k_pt = trail_knee
            a_pt = trail_ankle
        trail_knee_angle = round(calculate_3d_angle(h_pt, k_pt, a_pt), 1)

    # 7. Head Position Relative to Lead Knee
    head_knee_gap = abs(nose.x - lead_knee.x) / max(torso_length, 1e-4) if has_knees else 0.0
    head_over_knee = bool(head_knee_gap <= 0.28) if has_knees else True
    head_tilt = round(abs(nose.x - mid_shoulder_x) / max(shoulder_width, 1e-4), 2)

    # 8. Stride Ratio & Weight Distribution
    stride_width = abs(lead_ankle.x - trail_ankle.x) if (lead_ak_vis > 0.35 and trail_ak_vis > 0.35) else 0.0
    stride_ratio = round(float(stride_width / max(torso_length, 1e-4)), 2)

    weight_distribution = "Balanced Stance"
    if has_knees:
        if lead_knee_angle < 155.0 and spine_angle_deg > 8.0:
            weight_distribution = "Front Foot Weighted"
        elif trail_knee_angle < 150.0 or spine_angle_deg < 6.0:
            weight_distribution = "Back Foot Anchored"

    # 9. Bat-to-Body Kinematics (With-Bat mode only)
    # YOLO bat_data and MediaPipe landmarks are both normalized over the same 320×240
    # downsampled frame, so bat_data["center"] and lead_knee.x/y share the same coordinate space.
    bat_pad_gap = None
    bat_rel_spine_deg = None

    has_bat = (practice_mode == "with_bat") and bool(bat_data and bat_data.get("detected"))

    if has_bat:
        bat_center = bat_data.get("center")
        if bat_center:
            dx = bat_center[0] - lead_knee.x
            dy = bat_center[1] - lead_knee.y
            bat_pad_gap = round(float(np.hypot(dx, dy) / max(torso_length, 1e-4)), 2)

        blade_angle = bat_data.get("blade_angle", 90.0)
        spine_dir_deg = np.degrees(np.arctan2(-torso_dy, torso_dx)) % 180.0
        bat_rel_spine_deg = round(float(abs(blade_angle - spine_dir_deg)), 1)

    # 10. Anatomical Shot Diagnosis Heuristics
    error_detected = False
    error_code = "NONE"
    priority_tip = None
    correction_cue = "Maintain this rhythm and balance!"

    # Front Foot Drives: Cover Drive, Straight Drive, Lofted Drive
    if target_shot in ["cover", "straight", "lofted"]:
        if elbow_angle < LEAD_ELBOW_MIN_DEG:
            error_detected = True
            error_code = "LOW_ELBOW"
            priority_tip = "Keep your lead elbow high (≥130°) to present a full bat face and control trajectory."
            correction_cue = "Raise your front elbow to eye level before starting the downswing."
        elif has_knees and not head_over_knee and head_knee_gap > HEAD_KNEE_HARD_GAP:
            error_detected = True
            error_code = "HEAD_BEHIND_KNEE"
            priority_tip = "Lean your head over your lead knee to get over the line of the ball."
            correction_cue = "Step forward and drop your nose directly over your lead knee."
        elif has_knees and lead_knee_angle > KNEE_STRAIGHT_DEG:
            error_detected = True
            error_code = "STRAIGHT_KNEE"
            priority_tip = "Bend your front knee forward into the shot to lower your center of gravity."
            correction_cue = "Flex your lead knee into a firm lunge into the pitch of the ball."
        elif spine_angle_deg < SPINE_LEAN_MIN_DEG:
            error_detected = True
            error_code = "UPRIGHT_SPINE"
            priority_tip = "Transfer weight forward into the drive; avoid standing too upright."
            correction_cue = "Tilt your torso forward 15°–20° toward the bowler."
        elif bat_data and has_bat and not bat_data.get("is_vertical"):
            error_detected = True
            error_code = "CROSS_BAT_ON_DRIVE"
            priority_tip = "Keep bat blade vertical down the line — avoid cross-bat swinging on drives."
            correction_cue = "Present the full vertical face of the blade down the ground."

    # Forward Defense
    elif target_shot == "defense":
        if bat_pad_gap is not None and bat_pad_gap > BAT_PAD_MAX_GAP:
            error_detected = True
            error_code = "BAT_PAD_GAP"
            priority_tip = "Bat-Pad Gap: Keep the bat blade close beside your front pad to avoid inside edges."
            correction_cue = "Tuck the bat blade directly against your lead pad with no gap."
        elif elbow_angle > DEFENSE_ELBOW_MAX:
            error_detected = True
            error_code = "HARD_HANDS_DEFENSE"
            priority_tip = "Maintain soft hands with elbows tucked in close to your body for defensive control."
            correction_cue = "Relax your bottom hand grip and keep elbows compact."
        elif has_knees and lead_knee_angle > KNEE_STRAIGHT_DEG:
            error_detected = True
            error_code = "STRAIGHT_KNEE_DEFENSE"
            priority_tip = "Lunge firmly onto the front knee to smother the bounce."
            correction_cue = "Get your head and front knee over the ball to deaden the strike."

    # Cross-Bat Power Shots: Pull Shot, Hook Shot
    elif target_shot in ["pull", "hook"]:
        if arm_extension < ARM_EXTENSION_MIN_PULL:
            error_detected = True
            error_code = "LOW_ARM_EXTENSION"
            priority_tip = "Extend your arms fully through the swing arc for maximum leverage and power."
            correction_cue = "Reach full arm extension through the impact zone for power."
        elif weight_distribution == "Front Foot Weighted" and spine_angle_deg > PULL_SPINE_FRONT_FOOT:
            error_detected = True
            error_code = "FRONT_FOOT_ON_PULL"
            priority_tip = "Anchor your weight onto the back foot to clear your front hip."
            correction_cue = "Shift your center of mass back onto the rear leg and pivot."
        elif bat_data and has_bat and bat_data.get("is_vertical"):
            error_detected = True
            error_code = "VERTICAL_BAT_ON_PULL"
            priority_tip = "Swing horizontally across the line with wrists rolled over the ball."
            correction_cue = "Swing in a horizontal arc and roll your wrists over top."

    # Square Cut & Late Cut
    elif target_shot in ["square_cut", "late_cut"]:
        if target_shot == "square_cut" and arm_extension < ARM_EXTENSION_MIN_CUT:
            error_detected = True
            error_code = "CRAMPED_ARMS_CUT"
            priority_tip = "Extend your hands away from your body to slice through the point region."
            correction_cue = "Free your arms and slice high-to-low through point."
        elif target_shot == "late_cut" and elbow_angle > LATE_CUT_ELBOW_MAX:
            error_detected = True
            error_code = "HARD_HANDS_LATE_CUT"
            priority_tip = "Keep hands close to body with relaxed wrists to guide the ball fine."
            correction_cue = "Wait for the ball and open the blade with soft wrists late."

    # Sweep Shot
    elif target_shot == "sweep":
        if has_knees and trail_knee_angle > SWEEP_TRAIL_KNEE_MAX:
            error_detected = True
            error_code = "HIGH_BACK_KNEE_SWEEP"
            priority_tip = "Drop your back knee low to the ground to stabilize your sweeping base."
            correction_cue = "Kneel down low on your back knee before sweeping across."

    # General Head Stability Check
    if not error_detected and head_tilt > HEAD_TILT_MAX:
        error_detected = True
        error_code = "HEAD_TILT"
        priority_tip = "Keep your eyes and head level with the point of impact throughout the stroke."
        correction_cue = "Level your eyes horizontally with the delivery path."

    # 11. Live Technical Checklist for Overlay HUD
    # NOTE: Checklist thresholds exactly match error-detection constants above
    # to prevent HUD red-state without a coaching tip (UX dead zone).
    # blade_ok: always True in no_bat mode (shadow practice — no bat to judge).
    live_checklist = {
        "elbow_ok": bool(elbow_angle >= LEAD_ELBOW_MIN_DEG) if target_shot in ["cover", "straight", "lofted"] else True,
        "knee_ok": bool(lead_knee_angle <= KNEE_STRAIGHT_DEG) if has_knees and target_shot in ["cover", "straight", "defense"] else True,
        "head_ok": bool(head_over_knee),
        "spine_ok": bool(spine_angle_deg >= SPINE_CHECKLIST_DEG) if target_shot in ["cover", "straight", "defense"] else True,
        "blade_ok": bool(bat_data.get("alignment_match", True)) if has_bat else True,
    }

    return {
        "body_detected": True,
        "is_3d": world_landmarks is not None,
        "practice_mode": practice_mode,
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

def get_coaching_feedback(
    detected_shot: str,
    target_shot: str,
    confidence: float,
    bio_data: Optional[Dict],
    bat_data: Optional[Dict] = None,
    practice_mode: str = "no_bat"
) -> Dict:
    """
    Evaluates detected stroke vs target drill, prioritizing:
    1. Stroke mismatch (wrong shot played)
    2. Biomechanical form corrections
    3. Bat blade alignment
    4. Textbook execution congratulatory feedback
    """
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

    # Case 1: Wrong stroke detected
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
            "correction_cue": bio_correction_cue or "Hold your shape and balance through the follow-through.",
            "tips": shuffled_tips
        }

    # Case 5: Low confidence or uncertain stroke
    return {
        "id": event_id,
        "status": "uncertain",
        "is_correct": False,
        "error_code": "LOW_CONFIDENCE",
        "tier": tier,
        "message": f"Shot Attempt Logged: Confidence low ({int(confidence * 100)}%). Commit to the stroke.",
        "correction_cue": "Commit fully through the swing with firm wrists.",
        "tips": shuffled_tips
    }
