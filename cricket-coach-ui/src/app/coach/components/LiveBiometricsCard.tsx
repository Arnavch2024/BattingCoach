"use client";

import React from "react";
import { Activity, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";
import { PracticeMode, ShotMetadata } from "@/types/coach";

interface LiveBiometricsCardProps {
  isBodyDetected: boolean;
  isElbowGood: boolean;
  isKneeGood: boolean;
  elbowAngle: number;
  kneeAngle: number;
  currentMetadata: ShotMetadata;
  practiceMode: PracticeMode;
  bioData: any;
  batData: any;
}

export function LiveBiometricsCard({
  isBodyDetected,
  isElbowGood,
  isKneeGood,
  elbowAngle,
  kneeAngle,
  currentMetadata,
  practiceMode,
  bioData,
  batData,
}: LiveBiometricsCardProps) {
  return (
    <div className="space-y-3">
      {/* Biometrics & Angles Card */}
      <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm dark:shadow-lg space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Live Biometrics</h3>
          </div>
          <span
            className={cn(
              "text-[10px] font-semibold px-2 py-0.5 rounded border",
              !isBodyDetected
                ? "bg-slate-100 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-500"
                : isElbowGood && isKneeGood
                ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                : "bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30 text-amber-700 dark:text-amber-400"
            )}
          >
            {!isBodyDetected
              ? "No Stance"
              : isElbowGood && isKneeGood
              ? "Optimal Shape"
              : "Form Adjustment"}
          </span>
        </div>

        {!isBodyDetected ? (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800/80 text-center space-y-1">
            <p className="text-xs text-slate-800 dark:text-zinc-300 font-bold">
              No Batter Stance Detected
            </p>
            <p className="text-[11px] text-slate-500 dark:text-zinc-500 leading-snug">
              Stand in frame with your torso and arms visible to stream live joint angles.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            <div
              className={cn(
                "grid gap-2",
                practiceMode === "with_bat" ? "grid-cols-4" : "grid-cols-3"
              )}
            >
              {/* Lead Elbow Metric Gauge */}
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 text-center flex flex-col items-center gap-1">
                <span className="text-[9px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                  Elbow
                </span>
                <div
                  className={cn(
                    "text-lg font-black mono",
                    isElbowGood
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400"
                  )}
                >
                  {elbowAngle.toFixed(0)}°
                </div>
                <span
                  className={cn(
                    "text-[8px] font-bold px-1 py-0.2 rounded",
                    isElbowGood
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                  )}
                >
                  ≥{currentMetadata.targetElbowAngle}°
                </span>
              </div>

              {/* Lead Knee Metric Gauge */}
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 text-center flex flex-col items-center gap-1">
                <span className="text-[9px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                  Knee
                </span>
                <div
                  className={cn(
                    "text-lg font-black mono",
                    isKneeGood
                      ? "text-teal-600 dark:text-teal-400"
                      : "text-amber-600 dark:text-amber-400"
                  )}
                >
                  {kneeAngle.toFixed(0)}°
                </div>
                <span
                  className={cn(
                    "text-[8px] font-bold px-1 py-0.2 rounded",
                    isKneeGood
                      ? "bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-400"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                  )}
                >
                  ≤{currentMetadata.targetKneeAngle}°
                </span>
              </div>

              {/* Torso Spine Lean Gauge */}
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 text-center flex flex-col items-center gap-1">
                <span className="text-[9px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                  Spine Lean
                </span>
                <div className="text-lg font-black mono text-cyan-600 dark:text-cyan-400">
                  {bioData?.spine_angle ?? 0}°
                </div>
                <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300">
                  Forward
                </span>
              </div>

              {/* Bat Blade Angle Gauge (In With Bat mode) */}
              {practiceMode === "with_bat" && (
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 text-center flex flex-col items-center gap-1">
                  <span className="text-[9px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                    Blade
                  </span>
                  <div
                    className={cn(
                      "text-lg font-black mono",
                      batData?.detected
                        ? batData.alignment_match
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-amber-600 dark:text-amber-400"
                        : "text-slate-400 dark:text-zinc-500"
                    )}
                  >
                    {batData?.detected ? `${batData.blade_angle}°` : "--"}
                  </div>
                  <span
                    className={cn(
                      "text-[8px] font-bold px-1 py-0.2 rounded",
                      batData?.detected
                        ? batData.alignment_match
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                        : "bg-slate-200 dark:bg-zinc-800 text-slate-500 dark:text-zinc-500"
                    )}
                  >
                    {batData?.detected ? (batData.is_vertical ? "Vertical" : "Cross") : "None"}
                  </span>
                </div>
              )}
            </div>

            {/* Relative Body & Torso Kinematics Summary */}
            <div className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 dark:text-zinc-400">Stance Weight:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                  {bioData?.weight_distribution ?? "Balanced Stance"}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 dark:text-zinc-400">Head-over-Knee:</span>
                <span
                  className={cn(
                    "font-semibold font-mono",
                    bioData?.head_over_knee
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400"
                  )}
                >
                  {bioData?.head_over_knee ? "Over Front Knee ✓" : "Off Center ⚠️"}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 dark:text-zinc-400">Arm Arc Reach:</span>
                <span className="font-semibold text-slate-800 dark:text-zinc-200 font-mono">
                  {bioData?.arm_extension
                    ? `${(bioData.arm_extension * 100).toFixed(0)}% Extension`
                    : "--"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* YOLOv8-OBB Bat Tracking Telemetry Card */}
      {practiceMode === "with_bat" && (
        <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm dark:shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-2">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                YOLO-OBB Bat Telemetry
              </h3>
            </div>
            <span
              className={cn(
                "text-[9px] font-semibold px-2 py-0.5 rounded border font-mono",
                batData?.detected
                  ? batData.alignment_match
                    ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                    : "bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30 text-amber-700 dark:text-amber-400"
                  : "bg-slate-100 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-500"
              )}
            >
              {batData?.detected
                ? batData.alignment_match
                  ? "Optimal Plane ✓"
                  : "Angle Alert ⚠️"
                : "Standby"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 text-center flex flex-col items-center">
              <span className="text-[9px] text-slate-500 dark:text-zinc-500 uppercase font-semibold">
                Face Alignment
              </span>
              <div className="text-xs font-bold text-slate-800 dark:text-zinc-200 mt-1">
                {batData?.detected
                  ? batData.is_vertical
                    ? "Vertical Face"
                    : "Horizontal Blade"
                  : "No Bat"}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 text-center flex flex-col items-center">
              <span className="text-[9px] text-slate-500 dark:text-zinc-500 uppercase font-semibold">
                Bat-to-Pad Gap
              </span>
              <div className="text-xs font-bold text-cyan-600 dark:text-cyan-400 mt-1 mono">
                {batData?.detected &&
                batData?.bat_pad_gap !== null &&
                batData?.bat_pad_gap !== undefined
                  ? `${batData.bat_pad_gap} L (Compact)`
                  : "--"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
