"""
Unit Tests for BatCoach AI Pro Biomechanical Kinematics & Coaching Feedback
Verifies 3D angle math, posture heuristics, and feedback priority logic.
"""

import math
import os
import sys
import unittest
from pathlib import Path

# Add project root to sys.path
ROOT_DIR = Path(__file__).parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import numpy as np

from biomechanics import (
    calculate_3d_angle,
    extract_biometrics,
    get_coaching_feedback,
    PoseLandmark,
    COACHING_TIPS,
)

class Landmark:
    """Mock MediaPipe PoseLandmark object."""
    def __init__(self, x: float, y: float, z: float = 0.0, visibility: float = 0.95):
        self.x = x
        self.y = y
        self.z = z
        self.visibility = visibility

def create_synthetic_landmarks(
    elbow_x: float = 0.30,
    elbow_y: float = 0.40,
    wrist_x: float = 0.34,
    wrist_y: float = 0.58,
    knee_x: float = 0.38,
    knee_y: float = 0.70,
    head_x: float = 0.42,
) -> list:
    """Generates standard standing batter landmarks with adjustable key joints."""
    lm = [Landmark(0.5, 0.5) for _ in range(33)]

    # Head & Shoulders (Forward lean: shoulders at mid-x=0.42, hips at mid-x=0.50)
    lm[PoseLandmark.NOSE] = Landmark(head_x, 0.20, 0.0)
    lm[PoseLandmark.LEFT_SHOULDER] = Landmark(0.36, 0.30, 0.0)
    lm[PoseLandmark.RIGHT_SHOULDER] = Landmark(0.48, 0.30, 0.0)

    # Lead Arm (Left Arm) - Default high elbow form (136.5 deg)
    lm[PoseLandmark.LEFT_ELBOW] = Landmark(elbow_x, elbow_y, 0.0)
    lm[PoseLandmark.LEFT_WRIST] = Landmark(wrist_x, wrist_y, 0.0)

    # Rear Arm
    lm[PoseLandmark.RIGHT_ELBOW] = Landmark(0.52, 0.45, 0.0, visibility=0.5)
    lm[PoseLandmark.RIGHT_WRIST] = Landmark(0.44, 0.58, 0.0, visibility=0.5)

    # Hips & Core (mid-hip = 0.50)
    lm[PoseLandmark.LEFT_HIP] = Landmark(0.46, 0.55, 0.0)
    lm[PoseLandmark.RIGHT_HIP] = Landmark(0.54, 0.55, 0.0)

    # Lead Leg (Left Leg) - Default flexed forward knee (128 deg)
    lm[PoseLandmark.LEFT_KNEE] = Landmark(knee_x, knee_y, 0.0)
    lm[PoseLandmark.LEFT_ANKLE] = Landmark(0.46, 0.88, 0.0)

    # Trail Leg (Right Leg)
    lm[PoseLandmark.RIGHT_KNEE] = Landmark(0.58, 0.70, 0.0)
    lm[PoseLandmark.RIGHT_ANKLE] = Landmark(0.62, 0.88, 0.0)

    return lm


class Test3DAngleCalculations(unittest.TestCase):
    """Verifies vector dot product and Euclidean angle mathematics."""

    def test_orthogonal_vectors_90_degrees(self):
        """Verifies 90-degree right angle (e.g. horizontal arm & vertical forearm)."""
        joint_b = Landmark(0.0, 0.0, 0.0)
        point_a = Landmark(1.0, 0.0, 0.0)
        point_c = Landmark(0.0, 1.0, 0.0)
        angle = calculate_3d_angle(point_a, joint_b, point_c)
        self.assertAlmostEqual(angle, 90.0, places=2)

    def test_straight_line_180_degrees(self):
        """Verifies fully locked straight arm (180 degrees)."""
        joint_b = Landmark(0.0, 0.0, 0.0)
        point_a = Landmark(-1.0, 0.0, 0.0)
        point_c = Landmark(1.0, 0.0, 0.0)
        angle = calculate_3d_angle(point_a, joint_b, point_c)
        self.assertAlmostEqual(angle, 180.0, places=2)

    def test_acute_angle_45_degrees(self):
        """Verifies 45-degree acute angle."""
        joint_b = Landmark(0.0, 0.0, 0.0)
        point_a = Landmark(1.0, 0.0, 0.0)
        point_c = Landmark(1.0, 1.0, 0.0)
        angle = calculate_3d_angle(point_a, joint_b, point_c)
        self.assertAlmostEqual(angle, 45.0, places=2)

    def test_3d_z_depth_angle(self):
        """Verifies true 3D Euclidean angle using non-zero Z coordinate."""
        joint_b = Landmark(0.0, 0.0, 0.0)
        point_a = Landmark(1.0, 0.0, 0.0)
        point_c = Landmark(0.0, 0.0, 1.0)
        angle = calculate_3d_angle(point_a, joint_b, point_c)
        self.assertAlmostEqual(angle, 90.0, places=2)

    def test_zero_norm_safeguard(self):
        """Verifies zero vector edge cases return 0.0 rather than raising ZeroDivisionError."""
        joint_b = Landmark(0.5, 0.5, 0.5)
        point_a = Landmark(0.5, 0.5, 0.5)  # coincident
        point_c = Landmark(1.0, 0.8, 0.2)
        angle = calculate_3d_angle(point_a, joint_b, point_c)
        self.assertEqual(angle, 0.0)


class TestBiomechanicalEngine(unittest.TestCase):
    """Verifies biomechanical fault diagnosis (elbow droop, stiff knee, spine lean)."""

    def test_textbook_drive_clean_form(self):
        """Standard balanced drive posture should pass without biomechanical errors."""
        landmarks = create_synthetic_landmarks()
        bio = extract_biometrics(landmarks, target_shot="cover")

        self.assertIsNotNone(bio)
        self.assertTrue(bio["body_detected"])
        self.assertFalse(bio["error_detected"])
        self.assertEqual(bio["error_code"], "NONE")

    def test_low_front_elbow_detected_on_cover_drive(self):
        """Low front elbow (< 128°) on Cover Drive must trigger LOW_ELBOW error."""
        # Folded low elbow angle (~59°)
        landmarks = create_synthetic_landmarks(elbow_x=0.35, elbow_y=0.45, wrist_x=0.48, wrist_y=0.45)
        bio = extract_biometrics(landmarks, target_shot="cover")

        self.assertIsNotNone(bio)
        self.assertTrue(bio["body_detected"])
        self.assertTrue(bio["error_detected"])
        self.assertEqual(bio["error_code"], "LOW_ELBOW")
        self.assertIn("lead elbow high", bio["priority_tip"])

    def test_stiff_front_knee_detected(self):
        """Unbent straight front knee (> 165°) must trigger STRAIGHT_KNEE error."""
        # Stiff locked knee in direct vertical line with hip & ankle (~180°)
        landmarks = create_synthetic_landmarks(knee_x=0.46, knee_y=0.71)
        bio = extract_biometrics(landmarks, target_shot="cover")

        self.assertIsNotNone(bio)
        self.assertTrue(bio["error_detected"])
        self.assertEqual(bio["error_code"], "STRAIGHT_KNEE")

    def test_severely_occluded_body_rejected(self):
        """When shoulders or hips have low visibility, extract_biometrics returns None."""
        landmarks = create_synthetic_landmarks()
        landmarks[PoseLandmark.LEFT_SHOULDER].visibility = 0.20
        landmarks[PoseLandmark.RIGHT_SHOULDER].visibility = 0.15

        bio = extract_biometrics(landmarks, target_shot="cover")
        self.assertIsNone(bio)


class TestCoachingFeedbackLogic(unittest.TestCase):
    """Verifies hierarchy: Stroke Mismatch > Biomechanical Form > Blade Angle > Textbook."""

    def test_stroke_mismatch_priority(self):
        """If batter plays a Pull shot when drill was Cover Drive, mismatch takes precedence."""
        bio_error = {"error_detected": True, "error_code": "LOW_ELBOW", "priority_tip": "Raise elbow"}
        feedback = get_coaching_feedback(
            detected_shot="pull",
            target_shot="cover",
            confidence=0.85,
            bio_data=bio_error
        )

        self.assertEqual(feedback["status"], "wrong_shot")
        self.assertFalse(feedback["is_correct"])
        self.assertEqual(feedback["error_code"], "STROKE_MISMATCH")
        self.assertIn("Wrong Shot", feedback["message"])

    def test_biomechanical_error_priority(self):
        """Correct shot played, but poor form -> triggers Form Alert with correction cue."""
        bio_error = {
            "error_detected": True,
            "error_code": "LOW_ELBOW",
            "priority_tip": "Keep your lead elbow high (≥130°).",
            "correction_cue": "Raise your front elbow to eye level before downswing."
        }
        feedback = get_coaching_feedback(
            detected_shot="cover",
            target_shot="cover",
            confidence=0.75,
            bio_data=bio_error
        )

        self.assertEqual(feedback["status"], "form_error")
        self.assertFalse(feedback["is_correct"])
        self.assertEqual(feedback["error_code"], "LOW_ELBOW")
        self.assertEqual(feedback["correction_cue"], "Raise your front elbow to eye level before downswing.")

    def test_textbook_execution(self):
        """Target shot matched with high confidence and no biomechanical errors -> Textbook Execution."""
        bio_clean = {"error_detected": False, "error_code": "NONE", "priority_tip": None}
        feedback = get_coaching_feedback(
            detected_shot="cover",
            target_shot="cover",
            confidence=0.82,
            bio_data=bio_clean
        )

        self.assertEqual(feedback["status"], "success")
        self.assertTrue(feedback["is_correct"])
        self.assertEqual(feedback["error_code"], "NONE")
        self.assertIn("Textbook Execution", feedback["message"])

    def test_blade_alignment_check_in_with_bat_mode(self):
        """In With-Bat mode, misaligned bat blade face must trigger BLADE_ALIGNMENT_MISMATCH."""
        bat_data = {
            "detected": True,
            "alignment_match": False,
            "blade_angle": 35.0,
            "is_vertical": False,
        }
        feedback = get_coaching_feedback(
            detected_shot="cover",
            target_shot="cover",
            confidence=0.72,
            bio_data={"error_detected": False},
            bat_data=bat_data,
            practice_mode="with_bat"
        )

        self.assertEqual(feedback["status"], "form_error")
        self.assertEqual(feedback["error_code"], "BLADE_ALIGNMENT_MISMATCH")
        self.assertIn("Blade Angle Alert", feedback["message"])

class TestBiomechanicalEngineExtended(unittest.TestCase):
    """Extended tests covering all remaining error codes in extract_biometrics."""

    def test_upright_spine_on_drive(self):
        """Completely upright posture (near-zero forward lean) triggers UPRIGHT_SPINE."""
        # Place shoulders and hips at same x (no lean), so spine_angle_deg ≈ 0°
        landmarks = create_synthetic_landmarks()
        landmarks[PoseLandmark.LEFT_SHOULDER] = Landmark(0.36, 0.30, 0.0)
        landmarks[PoseLandmark.RIGHT_SHOULDER] = Landmark(0.48, 0.30, 0.0)
        landmarks[PoseLandmark.LEFT_HIP] = Landmark(0.36, 0.55, 0.0)   # same x as shoulder -> 0 lean
        landmarks[PoseLandmark.RIGHT_HIP] = Landmark(0.48, 0.55, 0.0)
        bio = extract_biometrics(landmarks, target_shot="cover")
        self.assertIsNotNone(bio)
        self.assertTrue(bio["error_detected"])
        self.assertEqual(bio["error_code"], "UPRIGHT_SPINE")

    def test_head_tilt_fallthrough(self):
        """If no other error, excessive lateral head tilt triggers HEAD_TILT."""
        landmarks = create_synthetic_landmarks()
        # Use pull shot to avoid HEAD_BEHIND_KNEE (which only fires on cover/straight/lofted).
        # Move nose far to the right: head_tilt = |0.75 - 0.42| / 0.12 = 2.75 >> 0.25 threshold.
        landmarks[PoseLandmark.NOSE] = Landmark(0.75, 0.20, 0.0)
        bio = extract_biometrics(landmarks, target_shot="pull")
        self.assertIsNotNone(bio)
        self.assertTrue(bio["error_detected"])
        self.assertEqual(bio["error_code"], "HEAD_TILT")

    def test_sweep_high_back_knee_error(self):
        """On a sweep shot, trail knee angle > 140° must trigger HIGH_BACK_KNEE_SWEEP."""
        landmarks = create_synthetic_landmarks()
        # Right is the trail knee. Align trail hip, knee, ankle vertically -> ~180°
        landmarks[PoseLandmark.RIGHT_HIP]   = Landmark(0.60, 0.50, 0.0)
        landmarks[PoseLandmark.RIGHT_KNEE]  = Landmark(0.60, 0.70, 0.0)
        landmarks[PoseLandmark.RIGHT_ANKLE] = Landmark(0.60, 0.90, 0.0)
        bio = extract_biometrics(landmarks, target_shot="sweep")
        self.assertIsNotNone(bio)
        self.assertTrue(bio["error_detected"])
        self.assertEqual(bio["error_code"], "HIGH_BACK_KNEE_SWEEP")

    def test_low_arm_extension_on_pull_shot(self):
        """Cramped arms (extension ≈ 0.0) on a pull shot must trigger LOW_ARM_EXTENSION."""
        # Collapse wrist onto the same position as the elbow -> upper arm exists, forearm = 0
        # direct_reach / total_arm = upper_arm / (upper_arm + 0) = 1.0 -> that's still high.
        # Instead fully collapse everything: elbow AND wrist at shoulder position -> arm_extension ≈ 0
        landmarks = create_synthetic_landmarks()
        # Shoulder is at (0.36, 0.30). Collapse wrist to shoulder position.
        # upper_arm = dist(shoulder, elbow), forearm = dist(elbow, wrist), direct_reach = dist(shoulder, wrist)
        # Move wrist and elbow both to the same position slightly below shoulder -> near-zero reach ratio.
        landmarks[PoseLandmark.LEFT_ELBOW] = Landmark(0.36, 0.31, 0.0)
        landmarks[PoseLandmark.LEFT_WRIST] = Landmark(0.36, 0.30, 0.0)  # wrist at shoulder
        bio = extract_biometrics(landmarks, target_shot="pull")
        self.assertIsNotNone(bio)
        # arm_extension = direct_reach / total_arm. direct_reach~0, total_arm~small but > 0
        # With wrist at shoulder, direct_reach is very small; extension < 0.76
        self.assertTrue(bio["error_detected"])
        self.assertEqual(bio["error_code"], "LOW_ARM_EXTENSION")

    def test_weight_distribution_field_is_populated(self):
        """extract_biometrics must always return a non-empty weight_distribution string."""
        landmarks = create_synthetic_landmarks()
        bio = extract_biometrics(landmarks, target_shot="cover")
        self.assertIsNotNone(bio)
        self.assertIn("weight_distribution", bio)
        self.assertIsInstance(bio["weight_distribution"], str)
        self.assertGreater(len(bio["weight_distribution"]), 0)

    def test_arm_extension_within_valid_range(self):
        """arm_extension must be a float clipped strictly within [0.0, 1.0]."""
        landmarks = create_synthetic_landmarks()
        bio = extract_biometrics(landmarks, target_shot="pull")
        self.assertIsNotNone(bio)
        self.assertGreaterEqual(bio["arm_extension"], 0.0)
        self.assertLessEqual(bio["arm_extension"], 1.0)


class TestCoachingFeedbackEdgeCases(unittest.TestCase):
    """Covers edge cases: no body detected, low confidence, and clean with_bat paths."""

    def test_low_confidence_returns_uncertain(self):
        """Confidence below 0.35 with matching shot returns 'uncertain' status."""
        feedback = get_coaching_feedback(
            detected_shot="cover",
            target_shot="cover",
            confidence=0.20,
            bio_data={"error_detected": False},
        )
        self.assertEqual(feedback["status"], "uncertain")
        self.assertFalse(feedback["is_correct"])
        self.assertEqual(feedback["error_code"], "LOW_CONFIDENCE")

    def test_no_bio_data_does_not_crash(self):
        """When bio_data is None (body not detected), feedback must still return cleanly."""
        feedback = get_coaching_feedback(
            detected_shot="cover",
            target_shot="cover",
            confidence=0.80,
            bio_data=None,
        )
        self.assertIn("status", feedback)
        self.assertIn(feedback["status"], ["success", "uncertain", "form_error", "wrong_shot"])

    def test_with_bat_mode_clean_alignment_returns_success(self):
        """In with_bat mode, if blade IS aligned and shot matches, return success."""
        bat_data = {
            "detected": True,
            "alignment_match": True,
            "blade_angle": 88.0,
            "is_vertical": True,
        }
        feedback = get_coaching_feedback(
            detected_shot="cover",
            target_shot="cover",
            confidence=0.78,
            bio_data={"error_detected": False},
            bat_data=bat_data,
            practice_mode="with_bat",
        )
        self.assertEqual(feedback["status"], "success")
        self.assertTrue(feedback["is_correct"])

    def test_coaching_tips_always_returned_as_list(self):
        """feedback['tips'] must always be a list regardless of error state."""
        feedback = get_coaching_feedback(
            detected_shot="hook",
            target_shot="hook",
            confidence=0.60,
            bio_data={"error_detected": False},
        )
        self.assertIsInstance(feedback["tips"], list)



class TestPracticeModes(unittest.TestCase):
    """Verifies with_bat vs no_bat mode isolation in extract_biometrics."""

    def _bat(self, is_vertical=True, aligned=True):
        return {
            'detected': True, 'confidence': 0.87,
            'blade_angle': 90.0 if is_vertical else 10.0,
            'is_vertical': is_vertical, 'alignment_match': aligned,
            'polygon': [[0.3, 0.4], [0.4, 0.4], [0.4, 0.6], [0.3, 0.6]],
            'center': [0.35, 0.5], 'width': 0.1, 'height': 0.2,
        }

    def test_no_bat_blade_ok_always_true(self):
        """In no_bat mode, blade_ok must be True even with bat_data present."""
        landmarks = create_synthetic_landmarks()
        bio = extract_biometrics(
            landmarks, target_shot='cover',
            bat_data=self._bat(is_vertical=False, aligned=False),
            practice_mode='no_bat'
        )
        self.assertIsNotNone(bio)
        self.assertTrue(bio['live_checklist']['blade_ok'])
        self.assertNotEqual(bio['error_code'], 'CROSS_BAT_ON_DRIVE')

    def test_with_bat_vertical_on_pull_fires(self):
        """In with_bat mode, vertical blade on pull fires VERTICAL_BAT_ON_PULL."""
        landmarks = create_synthetic_landmarks()
        bio = extract_biometrics(
            landmarks, target_shot='pull',
            bat_data=self._bat(is_vertical=True, aligned=False),
            practice_mode='with_bat'
        )
        self.assertIsNotNone(bio)
        self.assertTrue(bio['error_detected'])
        self.assertEqual(bio['error_code'], 'VERTICAL_BAT_ON_PULL')

    def test_no_bat_vertical_on_pull_does_not_fire(self):
        """In no_bat mode, bat checks suppressed; VERTICAL_BAT_ON_PULL must not fire."""
        landmarks = create_synthetic_landmarks()
        bio = extract_biometrics(
            landmarks, target_shot='pull',
            bat_data=self._bat(is_vertical=True, aligned=False),
            practice_mode='no_bat'
        )
        self.assertIsNotNone(bio)
        self.assertNotEqual(bio.get('error_code'), 'VERTICAL_BAT_ON_PULL')

    def test_practice_mode_in_return_dict(self):
        """bio_data return dict must include practice_mode for downstream logging."""
        landmarks = create_synthetic_landmarks()
        bio_wb = extract_biometrics(landmarks, target_shot='cover', practice_mode='with_bat')
        bio_nb = extract_biometrics(landmarks, target_shot='cover', practice_mode='no_bat')
        self.assertEqual(bio_wb['practice_mode'], 'with_bat')
        self.assertEqual(bio_nb['practice_mode'], 'no_bat')

    def test_bat_pad_gap_none_in_no_bat_mode(self):
        """bat_pad_gap must be None in no_bat mode even when bat_data is present."""
        landmarks = create_synthetic_landmarks()
        bio = extract_biometrics(
            landmarks, target_shot='defense',
            bat_data=self._bat(), practice_mode='no_bat'
        )
        self.assertIsNotNone(bio)
        self.assertIsNone(bio['bat_pad_gap'])

    def test_bat_pad_gap_computed_in_with_bat_mode(self):
        """bat_pad_gap must be a float in with_bat mode when bat is detected."""
        landmarks = create_synthetic_landmarks()
        bio = extract_biometrics(
            landmarks, target_shot='defense',
            bat_data=self._bat(), practice_mode='with_bat'
        )
        self.assertIsNotNone(bio)
        self.assertIsNotNone(bio['bat_pad_gap'])
        self.assertIsInstance(bio['bat_pad_gap'], float)

if __name__ == "__main__":
    unittest.main()
