"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Video, XCircle, Activity, Pause, Play, RotateCcw, SlidersHorizontal, AlertTriangle, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ShotMetadata } from "@/types/coach";

export interface MasterclassModalProps {
  shot: ShotMetadata;
  isOpen: boolean;
  onClose: () => void;
  onStartPractice: () => void;
  isFirstTime: boolean;
  playbackSpeed: number;
  onSpeedChange: (speed: number) => void;
  highlightedMistake?: string | null;
  correctionCue?: string | null;
}

export function MasterclassModal({
  shot,
  isOpen,
  onClose,
  onStartPractice,
  isFirstTime,
  playbackSpeed,
  onSpeedChange,
  highlightedMistake,
  correctionCue,
}: MasterclassModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(5.5);
  const [videoError, setVideoError] = useState<boolean>(false);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  useEffect(() => {
    setVideoError(false);
    if (isOpen && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.playbackRate = playbackSpeed;
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [isOpen, shot.id, playbackSpeed]);

  if (!isOpen) return null;

  const togglePlay = () => {
    if (videoRef.current && !videoError) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const restartVideo = () => {
    if (videoRef.current && !videoError) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      setCurrentTime(0);
      setIsPlaying(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 10 }}
        className="relative w-full max-w-4xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 flex items-center justify-center">
              <Video className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {shot.name} Masterclass
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-zinc-700">
                  {shot.difficulty}
                </span>
                {isFirstTime && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40">
                    ⭐ Pre-Drill Masterclass
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                {shot.proExample} • 5-Second Slow-Mo Form Blueprint
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
            title="Close modal"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body: Split 2 Columns */}
        <div className="flex-1 grid grid-cols-12 gap-6 p-6 overflow-y-auto custom-scrollbar">
          {/* Left Column: Video Player & Speed Controller (7 Cols) */}
          <div className="col-span-12 md:col-span-7 flex flex-col gap-3">
            <div className="relative aspect-video rounded-xl bg-black border border-zinc-800 overflow-hidden shadow-inner group flex items-center justify-center">
              {!videoError ? (
                <video
                  ref={videoRef}
                  src={shot.videoUrl || `/tutorials/${shot.id}.mp4`}
                  loop
                  muted
                  playsInline
                  autoPlay
                  onError={() => setVideoError(true)}
                  onTimeUpdate={() => {
                    if (videoRef.current) {
                      setCurrentTime(videoRef.current.currentTime);
                      if (videoRef.current.duration) setDuration(videoRef.current.duration);
                    }
                  }}
                  className="w-full h-full object-cover"
                />
              ) : (
                /* Biomechanical Simulator Fallback if video offline */
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-zinc-950 to-zinc-900 p-6 text-center space-y-3">
                  <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Activity className="h-7 w-7 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {shot.name} Kinematic Simulator
                    </h4>
                    <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                      Lead Elbow:{" "}
                      <strong className="text-emerald-400">≥{shot.targetElbowAngle}°</strong> •
                      Front Knee:{" "}
                      <strong className="text-teal-400">≤{shot.targetKneeAngle}°</strong>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-300 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-500/30">
                    <span>Active Blueprint: {shot.keyCue}</span>
                  </div>
                </div>
              )}

              {/* Slow-Mo AR Dial Watermark */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md border border-zinc-700 text-xs font-mono text-zinc-200">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>
                  Speed: <strong>{playbackSpeed}x</strong>
                </span>
              </div>

              {/* Video Overlay Control Bar */}
              <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={togglePlay}
                    className="p-1.5 rounded-lg bg-zinc-900/90 text-white hover:bg-emerald-500 hover:text-black transition-all cursor-pointer"
                    title={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
                  </button>
                  <button
                    onClick={restartVideo}
                    className="p-1.5 rounded-lg bg-zinc-900/90 text-zinc-300 hover:text-white transition-all cursor-pointer"
                    title="Replay from start"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>

                <div className="text-[11px] font-mono text-zinc-300 bg-black/60 px-2 py-0.5 rounded border border-zinc-800">
                  {currentTime.toFixed(1)}s / {duration.toFixed(1)}s
                </div>
              </div>
            </div>

            {/* Playback Speed Switcher */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100/80 dark:bg-zinc-900/70 border border-slate-200 dark:border-zinc-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-zinc-300 font-semibold">
                <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
                <span>Slow-Mo Speed:</span>
              </div>

              <div className="flex items-center gap-1.5">
                {[
                  { speed: 0.25, label: "0.25x Super Slow" },
                  { speed: 0.5, label: "0.5x Slow-Mo" },
                  { speed: 0.75, label: "0.75x" },
                  { speed: 1.0, label: "1.0x Realtime" },
                ].map(({ speed, label }) => (
                  <button
                    key={speed}
                    onClick={() => onSpeedChange(speed)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer font-mono",
                      playbackSpeed === speed
                        ? "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-black shadow-md"
                        : "bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 hover:text-slate-900 dark:hover:text-white"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Target Biometric Specs */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-zinc-400">Target Lead Elbow:</span>
                <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  ≥{shot.targetElbowAngle}°
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-zinc-400">Target Front Knee:</span>
                <span className="font-bold font-mono text-teal-600 dark:text-teal-400">
                  ≤{shot.targetKneeAngle}°
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Key Checkpoints & Form Correction (5 Cols) */}
          <div className="col-span-12 md:col-span-5 flex flex-col gap-3">
            {/* If Opened from Repeated Mistake: Correction Callout */}
            {highlightedMistake && (
              <div className="p-3.5 rounded-xl bg-red-950/70 border-2 border-red-500/80 text-left space-y-1.5 shadow-lg">
                <div className="flex items-center gap-1.5 text-xs font-bold text-red-300 uppercase tracking-wide">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <span>Flaw to Eliminate</span>
                </div>
                <p className="text-xs text-red-200 font-semibold">{highlightedMistake}</p>
                {correctionCue && (
                  <div className="text-xs text-emerald-300 font-bold bg-black/40 p-2 rounded-lg border border-emerald-500/40">
                    👉 FIX: {correctionCue}
                  </div>
                )}
              </div>
            )}

            {/* 4-Phase Biomechanical Breakdown */}
            <div className="flex-1 flex flex-col gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Key Execution Phases
              </span>

              <div className="space-y-2">
                {shot.phases.map((phase, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 text-left space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {phase.title}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
                        {phase.focusAngle}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-zinc-300 leading-snug">
                      {phase.cue}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/70 flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-zinc-400">
            {isFirstTime
              ? "Preview required once before first drill session."
              : "Inspect technique anytime to calibrate muscle memory."}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white"
            >
              {isFirstTime ? "Skip Preview" : "Close"}
            </Button>

            <Button
              size="sm"
              onClick={onStartPractice}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs gap-1.5 shadow-lg"
            >
              <Check className="h-4 w-4" />
              <span>{isFirstTime ? "Understood, Start Practicing" : "Resume Practice"}</span>
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
