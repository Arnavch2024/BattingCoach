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


if __name__ == "__main__":
    unittest.main()
