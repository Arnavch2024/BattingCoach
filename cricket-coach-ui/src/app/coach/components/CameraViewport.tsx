"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Play,
  Lock,
  Video,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { PracticeMode, ShotMetadata } from "@/types/coach";

interface CameraViewportProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isLive: boolean;
  hasLocalCamera: boolean;
  streamData: any;
  practiceMode: PracticeMode;
  batData: any;
  showAngles: boolean;
  onToggleShowAngles: (show: boolean) => void;
  onStartPractice: () => void;
  currentMetadata: ShotMetadata;
  formRating: { rating: string; gradeColor: string };
  isBodyDetected: boolean;
  liveChecklist: {
    elbow_ok: boolean;
    knee_ok: boolean;
    head_ok: boolean;
    blade_ok?: boolean;
  };
  elbowAngle: number;
  kneeAngle: number;
  isDrillLocked: boolean;
  repeatErrorCount: number;
  lockedErrorTitle: string;
  lockedCorrectionCue: string;
  onOpenTutorialModal: (
    shotId: string,
    isFirstTime: boolean,
    errorTitle?: string,
    correctionCue?: string
  ) => void;
  onManualUnlockDrill: () => void;
  targetShot: string;
  persistentFeedback: any;
}

export function CameraViewport({
  videoRef,
  canvasRef,
  isLive,
  hasLocalCamera,
  streamData,
  practiceMode,
  batData,
  showAngles,
  onToggleShowAngles,
  onStartPractice,
  currentMetadata,
  formRating,
  isBodyDetected,
  liveChecklist,
  elbowAngle,
  kneeAngle,
  isDrillLocked,
  repeatErrorCount,
  lockedErrorTitle,
  lockedCorrectionCue,
  onOpenTutorialModal,
  onManualUnlockDrill,
  targetShot,
  persistentFeedback,
}: CameraViewportProps) {
  return (
    <div className="col-span-6 flex flex-col gap-3 min-h-0">
      <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-2xl relative">
        {/* Viewport Frame */}
        <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
          {/* Live Browser Camera feed with 0ms visual latency */}
          <video
            ref={videoRef}
            className={cn(
              "w-full h-full object-contain -scale-x-100",
              (!isLive || !hasLocalCamera) && "hidden"
            )}
            playsInline
            muted
            autoPlay
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Fallback image stream for backend hardware camera grabber */}
          {isLive && !hasLocalCamera && streamData?.frame && (
            <img
              src={`data:image/jpeg;base64,${streamData.frame}`}
              alt="Batting Coach Live Stream"
              className="w-full h-full object-contain"
            />
          )}

          {/* YOLOv8-OBB Bat Tracking AR Overlay */}
          {isLive &&
            practiceMode === "with_bat" &&
            batData?.detected &&
            showAngles &&
            batData?.polygon && (
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none z-10"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <polygon
                  points={batData.polygon
                    .map((pt: [number, number]) => {
                      const x = hasLocalCamera ? (1.0 - pt[0]) * 100 : pt[0] * 100;
                      const y = pt[1] * 100;
                      return `${x},${y}`;
                    })
                    .join(" ")}
                  fill={
                    batData.alignment_match
                      ? "rgba(16, 185, 129, 0.18)"
                      : "rgba(245, 158, 11, 0.18)"
                  }
                  stroke={batData.alignment_match ? "#10b981" : "#f59e0b"}
                  strokeWidth="0.8"
                  strokeDasharray="2,1"
                />
                {batData.center && (
                  <circle
                    cx={
                      hasLocalCamera
                        ? (1.0 - batData.center[0]) * 100
                        : batData.center[0] * 100
                    }
                    cy={batData.center[1] * 100}
                    r="1.2"
                    fill={batData.alignment_match ? "#10b981" : "#f59e0b"}
                  />
                )}
              </svg>
            )}

          {(!isLive || (!hasLocalCamera && !streamData?.frame)) && (
            <div className="flex flex-col items-center justify-center gap-4 text-center p-8">
              <div className="h-16 w-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600">
                <Activity className="h-8 w-8 animate-pulse text-emerald-500" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Camera Standby</h4>
                <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                  {isLive
                    ? `Connecting to AI backend (${
                        practiceMode === "with_bat"
                          ? "YOLO-OBB + VideoMAE"
                          : "Shadow Biomechanics + VideoMAE"
                      })...`
                    : "Click 'Start Live Feed' to begin real-time stroke analysis."}
                </p>
              </div>
              {!isLive && (
                <Button
                  onClick={onStartPractice}
                  size="sm"
                  className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  Start Practice
                </Button>
              )}
            </div>
          )}

          {/* AR HUD Overlay Badges */}
          {isLive && streamData && (
            <>
              {/* Top Left: Drill & Practice Mode */}
              <div className="absolute top-3 left-3 flex flex-col gap-2 pointer-events-none z-20">
                <div className="flex items-center gap-2 bg-zinc-950/90 backdrop-blur-md border border-zinc-800 rounded-lg px-3 py-1.5 text-xs shadow-lg">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                    Drill:
                  </span>
                  <span className="font-bold text-emerald-400">
                    {currentMetadata.name}
                  </span>
                </div>

                {/* Active Mode HUD Pill */}
                <div
                  className={cn(
                    "flex items-center gap-2 backdrop-blur-md border rounded-lg px-3 py-1 text-xs shadow-md font-semibold",
                    practiceMode === "with_bat"
                      ? batData?.detected
                        ? "bg-emerald-950/85 border-emerald-500/50 text-emerald-300"
                        : "bg-zinc-950/85 border-amber-500/40 text-amber-300"
                      : "bg-cyan-950/85 border-cyan-500/40 text-cyan-300"
                  )}
                >
                  {practiceMode === "with_bat" ? (
                    <>
                      <span>🏏</span>
                      <span>
                        {batData?.detected
                          ? `Blade: ${batData.blade_angle}° (${
                              batData.is_vertical ? "Vertical Face" : "Cross-Bat"
                            })`
                          : "Willow Tracking: Hold bat in frame"}
                      </span>
                    </>
                  ) : (
                    <>
                      <span>🥋</span>
                      <span>Shadow Form (Lightweight Biomechanics)</span>
                    </>
                  )}
                </div>
              </div>

              {/* Top Center: Target Drill Key Technical Cue */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none z-20 max-w-sm w-full px-2 hidden sm:block">
                <div className="bg-zinc-950/90 backdrop-blur-md border border-emerald-500/40 rounded-lg px-3 py-1.5 shadow-xl text-center">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 mr-1.5">
                    🎯 Key Cue:
                  </span>
                  <span className="text-xs text-zinc-200 font-medium">
                    {currentMetadata.keyCue}
                  </span>
                </div>
              </div>

              {/* Top Right: Form Rating & Live 30 FPS Kinematic Checklist */}
              <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5 pointer-events-none z-20">
                <div
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold backdrop-blur-md shadow-lg",
                    formRating.gradeColor
                  )}
                >
                  Form Rating: {formRating.rating}
                </div>

                {/* Real-time 30 FPS Kinematic Checklist */}
                {isBodyDetected && showAngles && (
                  <div className="bg-zinc-950/90 backdrop-blur-md border border-zinc-800/90 rounded-lg p-2 shadow-xl flex flex-col gap-1 text-[10px] w-48">
                    <div className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-800/80 pb-0.5 mb-0.5 flex justify-between">
                      <span>Kinematic Checklist</span>
                      <span className="text-emerald-400 font-mono">Live</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-300">Lead Elbow</span>
                      <span
                        className={cn(
                          "font-bold font-mono px-1 rounded",
                          liveChecklist.elbow_ok
                            ? "text-emerald-400 bg-emerald-950/80"
                            : "text-amber-400 bg-amber-950/80"
                        )}
                      >
                        {liveChecklist.elbow_ok
                          ? `${elbowAngle.toFixed(0)}° ✓`
                          : `${elbowAngle.toFixed(0)}° (Low)`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-300">Front Knee</span>
                      <span
                        className={cn(
                          "font-bold font-mono px-1 rounded",
                          liveChecklist.knee_ok
                            ? "text-teal-400 bg-teal-950/80"
                            : "text-amber-400 bg-amber-950/80"
                        )}
                      >
                        {liveChecklist.knee_ok
                          ? `${kneeAngle.toFixed(0)}° ✓`
                          : `${kneeAngle.toFixed(0)}° (Stiff)`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-300">Head over Knee</span>
                      <span
                        className={cn(
                          "font-bold font-mono px-1 rounded",
                          liveChecklist.head_ok
                            ? "text-emerald-400 bg-emerald-950/80"
                            : "text-amber-400 bg-amber-950/80"
                        )}
                      >
                        {liveChecklist.head_ok ? "Aligned ✓" : "Off-Center ⚠️"}
                      </span>
                    </div>
                    {practiceMode === "with_bat" && batData?.detected && (
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-300">Blade Face</span>
                        <span
                          className={cn(
                            "font-bold font-mono px-1 rounded",
                            liveChecklist.blade_ok
                              ? "text-emerald-400 bg-emerald-950/80"
                              : "text-amber-400 bg-amber-950/80"
                          )}
                        >
                          {liveChecklist.blade_ok
                            ? `${batData.blade_angle}° ✓`
                            : `${batData.blade_angle}° (Turn)`}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Repeated Form Error Drill Intervention Modal */}
          <AnimatePresence>
            {isDrillLocked && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute inset-x-4 top-16 z-40 flex justify-center pointer-events-auto"
              >
                <div className="w-full max-w-lg bg-red-950/95 border-2 border-red-500 rounded-2xl p-4 shadow-2xl backdrop-blur-2xl text-left space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center animate-pulse">
                        <Lock className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-xs font-black text-red-300 uppercase tracking-wide">
                          Rep Counter Frozen
                        </span>
                        <span className="text-[10px] ml-2 px-1.5 py-0.5 rounded bg-red-900/80 text-red-200 font-mono font-bold">
                          {repeatErrorCount}x Repeated Mistake
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() =>
                          onOpenTutorialModal(
                            targetShot,
                            false,
                            lockedErrorTitle,
                            lockedCorrectionCue
                          )
                        }
                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs gap-1.5 shadow-lg cursor-pointer h-7 px-2.5"
                      >
                        <Video className="h-3.5 w-3.5" />
                        <span>Watch 5s Slow-Mo Fix</span>
                      </Button>

                      <button
                        onClick={onManualUnlockDrill}
                        className="text-[11px] text-zinc-400 hover:text-white px-2.5 py-1 rounded bg-zinc-900/90 border border-zinc-700 cursor-pointer font-semibold transition-all hover:bg-zinc-850"
                        title="Dismiss lock and resume counting manually"
                      >
                        Override & Resume
                      </button>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-black/60 border border-red-500/40 space-y-1.5">
                    <div className="text-xs font-bold text-red-200">
                      {lockedErrorTitle}
                    </div>
                    <div className="text-xs font-semibold text-emerald-300 flex items-start gap-1.5">
                      <span className="text-emerald-400 shrink-0 font-bold">
                        👉 ACTION:
                      </span>
                      <span>{lockedCorrectionCue}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-300">
                    <span className="text-zinc-400">
                      Perform 1 textbook rep to automatically unlock.
                    </span>
                    <span className="text-amber-400 font-mono font-bold">
                      🔒 Reps on Hold
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stance prompt when body not in frame */}
          {isLive && streamData && !isBodyDetected && (
            <div className="absolute top-12 left-1/2 -translate-x-1/2 pointer-events-none z-20">
              <div className="px-3.5 py-1.5 rounded-full bg-zinc-950/90 border border-emerald-500/50 text-zinc-200 text-xs flex items-center gap-2 shadow-2xl backdrop-blur-md">
                <UserCheck className="h-4 w-4 text-emerald-400" />
                <span>Step back ~6–8 ft to frame full stance</span>
              </div>
            </div>
          )}

          {/* Instant Coaching Alert Banner */}
          <AnimatePresence>
            {persistentFeedback && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-4 inset-x-4 pointer-events-none z-30"
              >
                <div
                  className={cn(
                    "p-4 rounded-xl backdrop-blur-xl border shadow-2xl flex items-start gap-3.5 text-left",
                    persistentFeedback.status === "success"
                      ? "bg-emerald-950/95 border-emerald-500/70 text-emerald-100"
                      : "bg-zinc-950/95 border-amber-500/70 text-zinc-100"
                  )}
                >
                  <div
                    className={cn(
                      "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                      persistentFeedback.status === "success"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-amber-500/20 text-amber-400"
                    )}
                  >
                    {persistentFeedback.status === "success" ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <AlertTriangle className="h-5 w-5" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold tracking-tight">
                        {persistentFeedback.message}
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                        {persistentFeedback.tier || "Coaching Cue"}
                      </span>
                    </div>
                    {persistentFeedback.correction_cue && (
                      <p className="text-xs text-emerald-300 font-semibold mt-1 leading-relaxed">
                        👉 {persistentFeedback.correction_cue}
                      </p>
                    )}
                    {persistentFeedback.tips?.[0] &&
                      persistentFeedback.tips[0] !==
                        persistentFeedback.correction_cue && (
                        <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                          {persistentFeedback.tips[0]}
                        </p>
                      )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Viewport Toolbar Footer */}
        <div className="p-3 bg-white dark:bg-zinc-950 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between text-xs transition-colors">
          <div className="flex items-center gap-3">
            <span className="text-slate-500 dark:text-zinc-400 font-semibold">
              Detected Action:
            </span>
            <span className="font-bold text-slate-900 dark:text-white px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
              {streamData?.topShot
                ? streamData.topShot.replace("_", " ").toUpperCase()
                : "Awaiting Movement"}
            </span>
            {streamData?.confidence && (
              <span className="text-emerald-600 dark:text-emerald-400 mono font-bold text-xs">
                {(streamData.confidence * 100).toFixed(0)}%
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-zinc-400">
            <span className="text-[11px] font-medium">AR Telemetry Overlay</span>
            <Switch
              checked={showAngles}
              onCheckedChange={onToggleShowAngles}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
