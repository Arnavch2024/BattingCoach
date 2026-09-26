"use client";

import posthog from "posthog-js";

/**
 * Analytics helper for custom cricket coaching telemetry events.
 * Safe to call even if PostHog keys are not yet configured.
 */

export function trackStrokeExecution(data: {
  shot: string;
  status: "success" | "wrong_shot" | "biomechanical_error" | "uncertain";
  confidence: number;
  elbowAngle?: number;
  kneeAngle?: number;
  spineAngle?: number;
  practiceMode: "with_bat" | "no_bat";
  errorCode?: string;
}) {
  if (typeof window !== "undefined" && posthog.__loaded) {
    posthog.capture("stroke_executed", {
      shot: data.shot,
      status: data.status,
      confidence: data.confidence,
      elbow_angle: data.elbowAngle,
      knee_angle: data.kneeAngle,
      spine_angle: data.spineAngle,
      practice_mode: data.practiceMode,
      error_code: data.errorCode || "NONE",
      timestamp: new Date().toISOString(),
    });
  }
}

export function trackDrillLockIntervention(data: {
  shot: string;
  flawCode: string;
  repeatCount: number;
  message: string;
}) {
  if (typeof window !== "undefined" && posthog.__loaded) {
    posthog.capture("drill_locked_intervention", {
      shot: data.shot,
      flaw_code: data.flawCode,
      repeat_count: data.repeatCount,
      intervention_message: data.message,
    });
  }
}

export function trackPracticeModeSwitch(mode: "with_bat" | "no_bat") {
  if (typeof window !== "undefined" && posthog.__loaded) {
    posthog.capture("practice_mode_switched", { mode });
  }
}

export function trackMasterclassWatched(data: {
  shotId: string;
  speed: string;
  source: "pre_drill_gate" | "error_banner_fix" | "manual_click";
}) {
  if (typeof window !== "undefined" && posthog.__loaded) {
    posthog.capture("masterclass_video_watched", data);
  }
}

export function trackSessionSaved(data: {
  totalReps: number;
  cleanReps: number;
  accuracy: number;
  longestStreak: number;
  durationSeconds: number;
}) {
  if (typeof window !== "undefined" && posthog.__loaded) {
    posthog.capture("practice_session_completed", data);
  }
}
