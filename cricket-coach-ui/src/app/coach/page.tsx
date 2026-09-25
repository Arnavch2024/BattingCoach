"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { 
  Play, Pause, Target, Volume2, VolumeX, Activity, User, 
  Settings, Zap, CheckCircle2, AlertTriangle, Flame, 
  RotateCcw, Shield, Award, Cpu, Search, Sparkles, SlidersHorizontal,
  ChevronRight, BarChart2, Radio, Info, UserCheck, HelpCircle, ArrowLeft, Home,
  Crosshair, Layers, Compass, Lock, Unlock, AlertOctagon, XCircle, Video, Eye, Check, Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { cn } from "../../lib/utils";
import { TrainingCalendarModal } from "@/components/TrainingCalendarModal";
import { ThemeToggle } from "@/components/ThemeToggle";
import { API_BASE_URL, WS_BASE_URL } from "@/lib/api-config";

// ──────────────────────────────────────────────────────────────────────────────
// Shot Catalog & Metadata
// ──────────────────────────────────────────────────────────────────────────────

interface ShotPhase {
  title: string;
  cue: string;
  focusAngle: string;
}

interface ShotMetadata {
  id: string;
  name: string;
  category: "Drives" | "Power & Cross-Bat" | "Defensive & Technical" | "Whips & Sweeps";
  difficulty: "Foundational" | "Intermediate" | "Advanced";
  keyCue: string;
  proExample: string;
  targetElbowAngle: number;
  targetKneeAngle: number;
  videoUrl?: string;
  phases: ShotPhase[];
}

const SHOT_CATALOG: ShotMetadata[] = [
  {
    id: "cover",
    name: "Cover Drive",
    category: "Drives",
    difficulty: "Intermediate",
    keyCue: "Lead with high elbow, head over front knee",
    proExample: "Virat Kohli & Babar Azam Mastery",
    targetElbowAngle: 130,
    targetKneeAngle: 155,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    phases: [
      { title: "Phase 1: Initial Trigger", cue: "Slide backfoot slightly, eyes level on off-stump line", focusAngle: "Spine 10°" },
      { title: "Phase 2: Stride & Knee Flexion", cue: "Lunge forward onto front knee to pitch of delivery", focusAngle: "Knee ≤ 155°" },
      { title: "Phase 3: High Elbow Impact", cue: "Lead downswing with high front elbow directly through cover", focusAngle: "Elbow ≥ 130°" },
      { title: "Phase 4: Vertical Finish", cue: "Hold shape with vertical bat blade high over lead shoulder", focusAngle: "Blade Vertical" },
    ],
  },
  {
    id: "straight",
    name: "Straight Drive",
    category: "Drives",
    difficulty: "Foundational",
    keyCue: "Full bat face presentation down the ground",
    proExample: "Sachin Tendulkar Textbook",
    targetElbowAngle: 135,
    targetKneeAngle: 155,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    phases: [
      { title: "Phase 1: Balanced Base", cue: "Still head over middle stump line, relaxed grip", focusAngle: "Spine 8°" },
      { title: "Phase 2: Straight Stride", cue: "Step directly down the bowler's pitch line", focusAngle: "Knee ≤ 155°" },
      { title: "Phase 3: Full Blade Presentation", cue: "Present full face of the bat straight back past bowler", focusAngle: "Elbow ≥ 135°" },
      { title: "Phase 4: High Follow-Through", cue: "Finish check-drive with hands pointing toward bowler's head", focusAngle: "Blade Vertical" },
    ],
  },
  {
    id: "pull",
    name: "Pull Shot",
    category: "Power & Cross-Bat",
    difficulty: "Intermediate",
    keyCue: "Weight on back foot, full arm extension",
    proExample: "Rohit Sharma Power Arc",
    targetElbowAngle: 120,
    targetKneeAngle: 160,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    phases: [
      { title: "Phase 1: Back & Across Step", cue: "Transfer center of mass onto back foot early", focusAngle: "Weight Back Foot" },
      { title: "Phase 2: Hip Clearance", cue: "Pivot front foot to open hips toward mid-wicket", focusAngle: "Knee 160°" },
      { title: "Phase 3: Arm Extension Reach", cue: "Extend arms fully into wide swing arc in front of body", focusAngle: "Arm Extension ≥80%" },
      { title: "Phase 4: Wrist Roll", cue: "Roll wrists over ball at impact to keep stroke along ground", focusAngle: "Cross-Bat 180°" },
    ],
  },
  {
    id: "hook",
    name: "Hook Shot",
    category: "Power & Cross-Bat",
    difficulty: "Advanced",
    keyCue: "Pivot front hip, roll wrists over top",
    proExample: "Ricky Ponting Mastery",
    targetElbowAngle: 115,
    targetKneeAngle: 165,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4",
    phases: [
      { title: "Phase 1: Sight Bouncer Early", cue: "Keep head still, eyes locked on delivery at head height", focusAngle: "Head Level" },
      { title: "Phase 2: Dynamic Pivot", cue: "Swivel 90° on the ball of front foot", focusAngle: "Knee 165°" },
      { title: "Phase 3: High-to-Low Swing Arc", cue: "Swing bat from above eye line rolling downward", focusAngle: "Elbow 115°" },
      { title: "Phase 4: Control & Balance", cue: "Finish facing square leg with soft top-hand control", focusAngle: "Controlled Blade" },
    ],
  },
  {
    id: "square_cut",
    name: "Square Cut",
    category: "Power & Cross-Bat",
    difficulty: "Intermediate",
    keyCue: "Back & across, slice through point",
    proExample: "Brian Lara Precision",
    targetElbowAngle: 125,
    targetKneeAngle: 160,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    phases: [
      { title: "Phase 1: Back Foot Movement", cue: "Step deep into crease across off stump to create room", focusAngle: "Weight Back Foot" },
      { title: "Phase 2: Create Width", cue: "Free arms away from torso with high backlift", focusAngle: "Arm Extension" },
      { title: "Phase 3: Downward Chop", cue: "Slice blade sharply from high to low through point region", focusAngle: "Elbow 125°" },
      { title: "Phase 4: Wrist Pronation", cue: "Roll top wrist over impact to suppress bounce", focusAngle: "Cross-Bat Blade" },
    ],
  },
  {
    id: "lofted",
    name: "Lofted Drive",
    category: "Power & Cross-Bat",
    difficulty: "Advanced",
    keyCue: "Vertical swing plane with clean extension",
    proExample: "MS Dhoni Power Arc",
    targetElbowAngle: 140,
    targetKneeAngle: 150,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    phases: [
      { title: "Phase 1: Clear Front Leg", cue: "Step slightly outside the line to open swing channel", focusAngle: "Spine 15°" },
      { title: "Phase 2: Deep Flexion Base", cue: "Drop hips low to generate explosive upward launch", focusAngle: "Knee ≤ 150°" },
      { title: "Phase 3: Upward Swing Arc", cue: "Drive bat vertically upward through line of delivery", focusAngle: "Elbow ≥ 140°" },
      { title: "Phase 4: Full Extension Finish", cue: "Hold high finish pointing high above opposite shoulder", focusAngle: "Blade Vertical" },
    ],
  },
  {
    id: "defense",
    name: "Forward Defense",
    category: "Defensive & Technical",
    difficulty: "Foundational",
    keyCue: "Soft hands, bat beside front pad",
    proExample: "Rahul Dravid 'The Wall'",
    targetElbowAngle: 110,
    targetKneeAngle: 150,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
    phases: [
      { title: "Phase 1: Decisive Stride", cue: "Long stride forward onto front knee to smother spin/bounce", focusAngle: "Knee ≤ 150°" },
      { title: "Phase 2: Bat-Pad Gap Zero", cue: "Keep bat blade tucked directly flush with front pad", focusAngle: "Gap ≤ 0.15 L" },
      { title: "Phase 3: Soft Hands Grip", cue: "Relax bottom hand; let ball deaden directly onto pitch", focusAngle: "Elbow 110°" },
      { title: "Phase 4: Head Over Impact", cue: "Nose and eyes directly over point of ball impact", focusAngle: "Head Aligned" },
    ],
  },
  {
    id: "late_cut",
    name: "Late Cut",
    category: "Defensive & Technical",
    difficulty: "Advanced",
    keyCue: "Guide ball late with relaxed wrists",
    proExample: "Kane Williamson Soft Touch",
    targetElbowAngle: 115,
    targetKneeAngle: 160,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4",
    phases: [
      { title: "Phase 1: Extreme Patience", cue: "Wait for delivery to pass chest line before initiating", focusAngle: "Weight Back Foot" },
      { title: "Phase 2: Minimal Backlift", cue: "Compact, tidy movement with weight on back foot", focusAngle: "Knee 160°" },
      { title: "Phase 3: Soft Wrist Slice", cue: "Guide ball at the last microsecond toward third man", focusAngle: "Elbow 115°" },
      { title: "Phase 4: De-escalate Pace", cue: "Use bowler's pace with downward blade angle", focusAngle: "Angled Blade" },
    ],
  },
  {
    id: "flick",
    name: "Wrist Flick",
    category: "Whips & Sweeps",
    difficulty: "Intermediate",
    keyCue: "Snap wrists through mid-wicket line",
    proExample: "VVS Laxman & KL Rahul",
    targetElbowAngle: 125,
    targetKneeAngle: 155,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    phases: [
      { title: "Phase 1: Line Alignment", cue: "Step across to middle-and-leg stump line", focusAngle: "Spine 10°" },
      { title: "Phase 2: Balanced Stance", cue: "Upright torso with level shoulders", focusAngle: "Knee 155°" },
      { title: "Phase 3: Wrist Whipping Arc", cue: "Roll wrists from right to left through mid-wicket arc", focusAngle: "Elbow 125°" },
      { title: "Phase 4: Controlled Follow-Through", cue: "Guide smoothly along ground in front of square", focusAngle: "Whipped Blade" },
    ],
  },
  {
    id: "sweep",
    name: "Sweep Shot",
    category: "Whips & Sweeps",
    difficulty: "Intermediate",
    keyCue: "Drop back knee, horizontal blade sweep",
    proExample: "Joe Root Spin Counter",
    targetElbowAngle: 120,
    targetKneeAngle: 140,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    phases: [
      { title: "Phase 1: Drop Back Knee", cue: "Sink back knee onto the turf to lower eye line", focusAngle: "Back Knee Low" },
      { title: "Phase 2: Long Reach Stride", cue: "Extend front leg well forward toward pitch of delivery", focusAngle: "Front Knee 140°" },
      { title: "Phase 3: Horizontal Blade Sweep", cue: "Sweep bat in broad horizontal arc across line of ball", focusAngle: "Elbow 120°" },
      { title: "Phase 4: Head Locked Down", cue: "Keep head still and eyes focused on point of strike", focusAngle: "Cross-Bat Flat" },
    ],
  },
];

const CATEGORIES = ["All", "Drives", "Power & Cross-Bat", "Defensive & Technical", "Whips & Sweeps"] as const;

interface SessionLogItem {
  id: string;
  time: string;
  shot: string;
  confidence: number;
  grade: string;
  status: "success" | "wrong_shot" | "form_error" | "improving";
  message?: string;
}

interface ShotTutorialModalProps {
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

function ShotTutorialModal({
  shot,
  isOpen,
  onClose,
  onStartPractice,
  isFirstTime,
  playbackSpeed,
  onSpeedChange,
  highlightedMistake,
  correctionCue,
}: ShotTutorialModalProps) {
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
  }, [isOpen, shot.id]);

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
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{shot.name} Masterclass</h3>
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
                    <h4 className="text-sm font-bold text-white">{shot.name} Kinematic Simulator</h4>
                    <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                      Lead Elbow: <strong className="text-emerald-400">≥{shot.targetElbowAngle}°</strong> • Front Knee: <strong className="text-teal-400">≤{shot.targetKneeAngle}°</strong>
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
                <span>Speed: <strong>{playbackSpeed}x</strong></span>
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
                <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">≥{shot.targetElbowAngle}°</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-zinc-400">Target Front Knee:</span>
                <span className="font-bold font-mono text-teal-600 dark:text-teal-400">≤{shot.targetKneeAngle}°</span>
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
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 text-left space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{phase.title}</span>
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
            {isFirstTime ? "Preview required once before first drill session." : "Inspect technique anytime to calibrate muscle memory."}
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

export default function BatCoachDashboard() {
  const [targetShot, setTargetShot] = useState<string>("cover");
  const [practiceMode, setPracticeMode] = useState<"no_bat" | "with_bat">("no_bat");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLive, setIsLive] = useState<boolean>(false);
  const [hasLocalCamera, setHasLocalCamera] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showAngles, setShowAngles] = useState<boolean>(true);

  // Video Tutorial Masterclass State
  const [seenTutorials, setSeenTutorials] = useState<Record<string, boolean>>({});
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);
  const [tutorialShotId, setTutorialShotId] = useState<string>("cover");
  const [tutorialPlaybackSpeed, setTutorialPlaybackSpeed] = useState<number>(0.5); // Default slow-mo
  const [isFirstTimeTutorial, setIsFirstTimeTutorial] = useState<boolean>(false);
  const [tutorialHighlightedMistake, setTutorialHighlightedMistake] = useState<string | null>(null);
  const [tutorialCorrectionCue, setTutorialCorrectionCue] = useState<string | null>(null);

  // Live Stream & Telemetry State
  const [streamData, setStreamData] = useState<any>(null);
  const [persistentFeedback, setPersistentFeedback] = useState<any>(null);
  const [sessionLogs, setSessionLogs] = useState<SessionLogItem[]>([]);
  const [repCount, setRepCount] = useState<number>(0); // Clean, verified reps
  const [totalSwings, setTotalSwings] = useState<number>(0); // All physical attempts
  const [streakCount, setStreakCount] = useState<number>(0);
  const [sessionSeconds, setSessionSeconds] = useState<number>(0);

  // Repeated Error & Rep Locking State
  const [repeatErrorCount, setRepeatErrorCount] = useState<number>(0);
  const [isDrillLocked, setIsDrillLocked] = useState<boolean>(false);
  const [lockedErrorTitle, setLockedErrorTitle] = useState<string | null>(null);
  const [lockedCorrectionCue, setLockedCorrectionCue] = useState<string | null>(null);
  const lastErrorCodeRef = useRef<string>("");

  const [userProfile, setUserProfile] = useState<{ name: string; email: string; stance: string }>({
    name: "Arnav P.",
    email: "athlete@cricketcoach.ai",
    stance: "Right-Hand Batter",
  });

  // Supabase Database Sync State
  const [isSavingDb, setIsSavingDb] = useState<boolean>(false);
  const [dbSavedMessage, setDbSavedMessage] = useState<string | null>(null);

  // Training Schedule & Google Calendar Modal State
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);

  const wsRef = useRef<WebSocket | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const feedbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const streamIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastProcessedEventIdRef = useRef<string>("");
  const lastSpokenRef = useRef<string>("");
  const repeatErrorCountRef = useRef<number>(repeatErrorCount);
  const isDrillLockedRef = useRef<boolean>(isDrillLocked);
  const isLiveRef = useRef<boolean>(isLive);

  const targetShotRef = useRef<string>(targetShot);
  useEffect(() => {
    targetShotRef.current = targetShot;
    // Reset repeated error state when changing target shot
    repeatErrorCountRef.current = 0;
    isDrillLockedRef.current = false;
    setRepeatErrorCount(0);
    setIsDrillLocked(false);
    setLockedErrorTitle(null);
    setLockedCorrectionCue(null);
    lastErrorCodeRef.current = "";
  }, [targetShot]);

  const practiceModeRef = useRef<"no_bat" | "with_bat">(practiceMode);
  useEffect(() => {
    practiceModeRef.current = practiceMode;
  }, [practiceMode]);

  useEffect(() => {
    repeatErrorCountRef.current = repeatErrorCount;
  }, [repeatErrorCount]);

  useEffect(() => {
    isDrillLockedRef.current = isDrillLocked;
  }, [isDrillLocked]);

  useEffect(() => {
    isLiveRef.current = isLive;
  }, [isLive]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("batcoach_user");
      if (stored) {
        setUserProfile(JSON.parse(stored));
      }
      const storedSeen = localStorage.getItem("batcoach_seen_tutorials");
      if (storedSeen) {
        setSeenTutorials(JSON.parse(storedSeen));
      }

      // Check URL parameters for direct drill launch or calendar trigger
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const urlShot = params.get("shot");
        if (urlShot && SHOT_CATALOG.some(s => s.id === urlShot)) {
          setTargetShot(urlShot);
        }
        if (params.get("calendar") === "true") {
          setIsCalendarOpen(true);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const openTutorialModal = (
    shotId: string, 
    isFirstTime: boolean = false, 
    mistakeTitle: string | null = null, 
    correctionCue: string | null = null
  ) => {
    setTutorialShotId(shotId);
    setIsFirstTimeTutorial(isFirstTime);
    setTutorialHighlightedMistake(mistakeTitle);
    setTutorialCorrectionCue(correctionCue);
    setTutorialPlaybackSpeed(mistakeTitle ? 0.25 : 0.5);
    setIsTutorialOpen(true);
  };

  const handleStartFromTutorial = () => {
    const updated = { ...seenTutorials, [tutorialShotId]: true };
    setSeenTutorials(updated);
    try {
      localStorage.setItem("batcoach_seen_tutorials", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    setIsTutorialOpen(false);
    if (isDrillLocked) {
      setIsDrillLocked(false);
      setRepeatErrorCount(0);
      lastErrorCodeRef.current = "";
    }
    if (!isLive) {
      setIsLive(true);
    }
  };

  // Session elapsed timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLive) {
      timer = setInterval(() => setSessionSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isLive]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const getInitials = (name: string) => {
    return (
      name
        .split(" ")
        .map((n) => n[0])
        .filter(Boolean)
        .join("")
        .slice(0, 2)
        .toUpperCase() || "BC"
    );
  };

  const currentMetadata = useMemo(() => {
    return SHOT_CATALOG.find((s) => s.id === targetShot) || SHOT_CATALOG[0];
  }, [targetShot]);

  const filteredShots = useMemo(() => {
    return SHOT_CATALOG.filter((shot) => {
      const matchesCat = selectedCategory === "All" || shot.category === selectedCategory;
      const matchesSearch = shot.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Dynamic Rating Logic
  const formRating = useMemo(() => {
    if (!streamData?.probs) return { label: "Awaiting Data", rating: "--", gradeColor: "bg-zinc-800 text-zinc-400" };
    
    const p = streamData.probs[targetShot] || 0;
    if (p > 0.75) return { label: "Elite Mastery", rating: "A+", gradeColor: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" };
    if (p > 0.55) return { label: "Good Technique", rating: "A", gradeColor: "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" };
    if (p > 0.35) return { label: "Solid Foundation", rating: "B", gradeColor: "bg-blue-500/20 text-blue-400 border border-blue-500/30" };
    if (p > 0.20) return { label: "Needs Polish", rating: "C", gradeColor: "bg-amber-500/20 text-amber-400 border border-amber-500/30" };
    return { label: "Form Adjustment", rating: "D", gradeColor: "bg-red-500/20 text-red-400 border border-red-500/30" };
  }, [streamData, targetShot]);

  // Text to Speech Voice Coach with Intervention Cue Priority
  useEffect(() => {
    if (persistentFeedback && !isMuted && typeof window !== "undefined" && "speechSynthesis" in window) {
      let textToSpeak = "";
      if (isDrillLocked && lockedCorrectionCue) {
        textToSpeak = `Drill paused. Repeated error detected: ${lockedErrorTitle}. Action: ${lockedCorrectionCue}`;
      } else {
        const tipText = persistentFeedback.correction_cue || persistentFeedback.tips?.[0] || "";
        textToSpeak = `${persistentFeedback.message}. ${tipText}`;
      }

      if (textToSpeak && textToSpeak !== lastSpokenRef.current) {
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.rate = 1.05;
        utterance.pitch = 1.0;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
        lastSpokenRef.current = textToSpeak;
      }
    }
  }, [persistentFeedback, isMuted, isDrillLocked, lockedCorrectionCue, lockedErrorTitle]);

  // WebSocket Connection & Dual-Mode Camera Streaming
  useEffect(() => {
    if (!isLive) {
      wsRef.current?.close();
      setIsConnected(false);
      setStreamData(null);
      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      return;
    }

    let localStream: MediaStream | null = null;

    const connect = () => {
      const defaultWsUrl = WS_BASE_URL;
      const ws = new WebSocket(defaultWsUrl);

      ws.onopen = () => {
        setIsConnected(true);
        ws.send(JSON.stringify({ 
          target: targetShotRef.current,
          practice_mode: practiceModeRef.current
        }));

        // Start Browser Camera capture if supported
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          navigator.mediaDevices
            .getUserMedia({
              video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
              audio: false,
            })
            .then((stream) => {
              localStream = stream;
              setHasLocalCamera(true);
              if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play().catch(console.error);
              }

              // Send lightweight downscaled frames (320x240) only when network buffer is clear
              if (canvasRef.current) {
                canvasRef.current.width = 320;
                canvasRef.current.height = 240;
              }
              if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
              streamIntervalRef.current = setInterval(() => {
                if (
                  ws.readyState === WebSocket.OPEN &&
                  ws.bufferedAmount === 0 &&
                  videoRef.current &&
                  canvasRef.current &&
                  videoRef.current.videoWidth > 0
                ) {
                  const canvas = canvasRef.current;
                  const ctx = canvas.getContext("2d", { willReadFrequently: true });
                  if (ctx) {
                    ctx.drawImage(videoRef.current, 0, 0, 320, 240);
                    const base64Img = canvas.toDataURL("image/jpeg", 0.5);
                    ws.send(JSON.stringify({ 
                      image: base64Img, 
                      target: targetShotRef.current,
                      practice_mode: practiceModeRef.current
                    }));
                  }
                }
              }, 55); // ~18 FPS (smooth kinematics with 35% lower CPU load)
            })
            .catch((err) => {
              console.log("[Browser Camera Notice]: Using backend camera grabber:", err);
              setHasLocalCamera(false);
            });
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setStreamData(data);
          
          // Only process feedback when a genuine NEW event ID is delivered
          if (data.feedback && data.feedback.id && data.feedback.id !== lastProcessedEventIdRef.current) {
            lastProcessedEventIdRef.current = data.feedback.id;
            setPersistentFeedback(data.feedback);
            
            // Increment total physical swing attempts
            setTotalSwings((s) => s + 1);

            // STROKE EVALUATION & REPEATED MISTAKE DETECTION
            if (data.feedback.status === "success") {
              // SUCCESS: Clean stroke execution!
              if (isDrillLockedRef.current) {
                // Break out of the error lock
                isDrillLockedRef.current = false;
                repeatErrorCountRef.current = 0;
                setIsDrillLocked(false);
                setRepeatErrorCount(0);
                setLockedErrorTitle(null);
                setLockedCorrectionCue(null);
                lastErrorCodeRef.current = "";
              }
              setStreakCount((c) => c + 1);
              setRepCount((r) => r + 1);
            } else {
              // ERROR OCCURRED: Streak resets to 0
              setStreakCount(0);

              const currentErrCode = data.feedback.error_code || data.feedback.message || "FORM_ERROR";
              let nextRepeat = 1;
              if (currentErrCode === lastErrorCodeRef.current && currentErrCode !== "NONE") {
                nextRepeat = repeatErrorCountRef.current + 1;
              }
              lastErrorCodeRef.current = currentErrCode;
              repeatErrorCountRef.current = nextRepeat;
              setRepeatErrorCount(nextRepeat);

              // If repeating the same mistake 2 or more times, FREEZE REPS and display coaching lock!
              if (nextRepeat >= 2) {
                isDrillLockedRef.current = true;
                setIsDrillLocked(true);
                setLockedErrorTitle(`Repeated Mistake (${nextRepeat}x): ${data.feedback.message}`);
                setLockedCorrectionCue(data.feedback.correction_cue || data.feedback.tips?.[0] || "Correct your technique before attempting another rep.");
              }
            }

            const now = new Date();
            const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
            const p = data.probs?.[targetShotRef.current] || 0;
            const newLog: SessionLogItem = {
              id: data.feedback.id,
              time: timeStr,
              shot: (SHOT_CATALOG.find((s) => s.id === targetShotRef.current) || SHOT_CATALOG[0]).name,
              confidence: p,
              grade: data.feedback.status === "success" ? (p > 0.7 ? "A+" : "A") : data.feedback.status === "wrong_shot" ? "Wrong" : "Alert",
              status: data.feedback.status,
              message: data.feedback.message,
            };

            setSessionLogs((prev) => [newLog, ...prev.slice(0, 19)]);

            if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
            feedbackTimerRef.current = setTimeout(() => setPersistentFeedback(null), 7000);
          }
        } catch (e) {
          console.error("WS Parse error", e);
        }
      };

      ws.onerror = (err) => {
        console.error("WebSocket connection error:", err);
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (isLiveRef.current) setTimeout(connect, 2000);
      };

      wsRef.current = ws;
    };

    connect();
    return () => {
      wsRef.current?.close();
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isLive]);

  const handleShotChange = (shotId: string) => {
    setTargetShot(shotId);
    targetShotRef.current = shotId;
    repeatErrorCountRef.current = 0;
    isDrillLockedRef.current = false;
    setPersistentFeedback(null);
    setRepeatErrorCount(0);
    setIsDrillLocked(false);
    setLockedErrorTitle(null);
    setLockedCorrectionCue(null);
    lastErrorCodeRef.current = "";
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ 
        target: shotId,
        practice_mode: practiceModeRef.current
      }));
    }

    // Auto-display 5-second slow-mo tutorial before first-time practice
    if (!seenTutorials[shotId]) {
      openTutorialModal(shotId, true);
    }
  };

  const handleManualUnlockDrill = () => {
    isDrillLockedRef.current = false;
    repeatErrorCountRef.current = 0;
    setIsDrillLocked(false);
    setRepeatErrorCount(0);
    setLockedErrorTitle(null);
    setLockedCorrectionCue(null);
    lastErrorCodeRef.current = "";
  };

  const handleModeChange = (mode: "no_bat" | "with_bat") => {
    setPracticeMode(mode);
    practiceModeRef.current = mode;
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ 
        target: targetShotRef.current,
        practice_mode: mode
      }));
    }
  };

  const saveSessionToDatabase = async () => {
    if (sessionLogs.length === 0 && sessionSeconds < 5) return;
    setIsSavingDb(true);
    try {
      const successfulReps = sessionLogs.filter((l) => l.status === "success").length;
      const avgConf =
        sessionLogs.length > 0
          ? sessionLogs.reduce((acc, l) => acc + l.confidence, 0) / sessionLogs.length
          : 0;

      const payload = {
        athlete_email: userProfile.email || "athlete@cricketcoach.ai",
        session_duration_seconds: sessionSeconds,
        target_shot: currentMetadata.name,
        total_reps: repCount,
        successful_reps: successfulReps,
        best_streak: streakCount,
        avg_confidence: avgConf,
        practice_mode: practiceMode,
        strokes: sessionLogs.map((l) => ({
          shot_name: l.shot,
          status: l.status,
          confidence: l.confidence,
          elbow_angle: streamData?.biometrics?.elbow_angle || 0,
          knee_angle: streamData?.biometrics?.knee_angle || 0,
          blade_angle: streamData?.bat?.blade_angle || null,
          coach_feedback: `${l.grade} Grade performance`,
        })),
      };

      const res = await fetch(`${API_BASE_URL}/api/sessions/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Athlete-Email": userProfile.email,
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        setDbSavedMessage(`Session #${json.session_id} synced to Supabase DB!`);
        setTimeout(() => setDbSavedMessage(null), 4000);
      }
    } catch (err) {
      console.error("Failed to sync session with Supabase:", err);
    } finally {
      setIsSavingDb(false);
    }
  };

  const handleToggleLive = () => {
    if (isLive) {
      saveSessionToDatabase();
      setIsLive(false);
    } else {
      if (!seenTutorials[targetShot]) {
        openTutorialModal(targetShot, true);
      } else {
        setIsLive(true);
      }
    }
  };

  const bioData = streamData?.biometrics;
  const batData = streamData?.bat;
  const isBodyDetected = bioData?.body_detected === true;
  const elbowAngle = bioData?.elbow_angle || 0;
  const kneeAngle = bioData?.knee_angle || 0;
  const isElbowGood = elbowAngle >= currentMetadata.targetElbowAngle;
  const isKneeGood = kneeAngle <= currentMetadata.targetKneeAngle;
  const liveChecklist = bioData?.live_checklist || {
    elbow_ok: isElbowGood,
    knee_ok: isKneeGood,
    head_ok: bioData?.head_over_knee ?? true,
    spine_ok: (bioData?.spine_angle ?? 0) >= 6,
    blade_ok: batData?.alignment_match ?? true,
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-zinc-100 antialiased select-none overflow-hidden relative font-sans transition-colors duration-200">
      
      {/* ── Top DB Sync Banner ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {dbSavedMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-950/95 border border-emerald-500/60 text-emerald-300 text-xs px-4 py-2 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span className="font-semibold">{dbSavedMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Studio Navigation Header ────────────────────────────────────────── */}
      <header className="h-14 border-b border-slate-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md px-6 flex items-center justify-between z-20 shrink-0 transition-colors">
        <div className="flex items-center gap-4">
          <Link 
            href="/"
            className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 transition-all font-medium"
            title="Back to Home"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Home</span>
          </Link>

          <Separator orientation="vertical" className="h-5 bg-slate-200 dark:border-zinc-800" />

          <div className="flex items-center gap-2.5">
            <img
              src="/bat-icon.jpg"
              alt="BatCoach Icon"
              className="h-8 w-8 rounded-lg object-cover border border-emerald-500/40 shadow-sm"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900 dark:text-white">BatCoach AI Pro</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-zinc-800">
                  v2.0 Dual-Mode
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-zinc-500 leading-tight">VideoMAE + MediaPipe 3D + YOLOv8-OBB Bat Tracking</p>
            </div>
          </div>
        </div>

        {/* Practice Mode Selector Segmented Pill */}
        <div className="flex items-center bg-slate-100 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 rounded-xl p-0.5 shadow-inner">
          <button
            onClick={() => handleModeChange("no_bat")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.2 rounded-lg text-xs font-bold transition-all cursor-pointer",
              practiceMode === "no_bat"
                ? "bg-white dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/40 shadow-sm"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
            )}
            title="Shadow Practice: 0% YOLO overhead, pure 3D biomechanics & VideoMAE"
          >
            <span>🥋 Shadow Practice</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30 font-mono font-normal">
              No Bat (Light)
            </span>
          </button>

          <button
            onClick={() => handleModeChange("with_bat")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.2 rounded-lg text-xs font-bold transition-all cursor-pointer",
              practiceMode === "with_bat"
                ? "bg-white dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/50 shadow-sm"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
            )}
            title="Live Willow Practice: Real-time YOLOv8-OBB bat orientation & blade angle analysis"
          >
            <span>🏏 Live Willow</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 font-mono font-normal">
              With Bat (YOLO-OBB)
            </span>
          </button>
        </div>

        {/* Telemetry Bar & Controls */}
        <div className="flex items-center gap-2.5">
          <div className="hidden md:flex items-center gap-2 bg-slate-100/90 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-slate-700 dark:text-zinc-300">
            <span className={cn("h-2 w-2 rounded-full", isConnected ? "bg-emerald-500 animate-pulse" : "bg-slate-400 dark:bg-zinc-600")} />
            <span className="font-medium">{isConnected ? "Connected" : "Standby"}</span>
            <Separator orientation="vertical" className="h-3 mx-1 bg-slate-300 dark:bg-zinc-800" />
            <span className="text-slate-500 dark:text-zinc-400 mono">FPS: <strong className="text-slate-900 dark:text-white">{streamData?.telemetry?.fps || 0}</strong></span>
            <Separator orientation="vertical" className="h-3 mx-1 bg-slate-300 dark:bg-zinc-800" />
            <span className="text-slate-500 dark:text-zinc-400 mono">Latency: <strong className="text-slate-900 dark:text-white">{streamData?.telemetry?.inference_ms || 12}ms</strong></span>
            {practiceMode === "with_bat" && (
              <>
                <Separator orientation="vertical" className="h-3 mx-1 bg-slate-300 dark:bg-zinc-800" />
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">OBB Active</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 bg-slate-100/90 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs">
            <span className="text-slate-500 dark:text-zinc-500">Session:</span>
            <span className="mono font-bold text-slate-900 dark:text-white">{formatTime(sessionSeconds)}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCalendarOpen(true)}
            className="h-8 gap-1.5 text-xs text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-white border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 shadow-sm"
            title="Open Athlete Training Calendar & Google Calendar Sync"
          >
            <Calendar className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline font-semibold">Training Schedule</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => openTutorialModal(targetShot, false)}
            className="h-8 gap-1.5 text-xs text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 shadow-sm"
            title="Watch 5-Second Slow-Mo Masterclass"
          >
            <Video className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
            <span className="hidden sm:inline font-semibold">Form Guide</span>
          </Button>

          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setIsMuted(!isMuted)} 
            className="h-8 w-8 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 shadow-sm"
            title={isMuted ? "Unmute Voice Coach" : "Mute Voice Coach"}
          >
            {isMuted ? <VolumeX className="h-4 w-4 text-red-500 dark:text-red-400" /> : <Volume2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
          </Button>

          {/* Theme Toggle Component */}
          <ThemeToggle />

          <Button
            variant={isLive ? "destructive" : "default"}
            size="sm"
            onClick={handleToggleLive}
            className={cn(
              "font-bold text-xs gap-1.5 h-8 shadow-sm",
              isLive ? "bg-red-600 hover:bg-red-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white"
            )}
          >
            {isLive ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current" />}
            {isLive ? "End Session" : "Start Live Feed"}
          </Button>

          {sessionLogs.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={saveSessionToDatabase}
              disabled={isSavingDb}
              className="text-xs h-8 bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-white shadow-sm"
              title="Save Session to Supabase PostgreSQL"
            >
              <Shield className="h-3.5 w-3.5 mr-1 text-emerald-600 dark:text-emerald-400" />
              {isSavingDb ? "Syncing..." : "Sync DB"}
            </Button>
          )}

          <Separator orientation="vertical" className="h-6 bg-slate-200 dark:bg-zinc-800" />

          {/* User Profile */}
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
              {getInitials(userProfile.name)}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-semibold text-slate-800 dark:text-zinc-200 leading-tight truncate max-w-[120px]">
                {userProfile.name}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-zinc-500 leading-tight truncate max-w-[120px]">
                {userProfile.stance}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Workspace Grid ────────────────────────────────────────────── */}
      <div className="flex-1 grid grid-cols-12 gap-4 p-4 min-h-0">
        
        {/* ── Left Column: Shot Directory & Drills (3 Cols) ──────────────────── */}
        <div className="col-span-3 flex flex-col gap-3 min-h-0">
          <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-lg">
            
            {/* Search & Header */}
            <div className="p-4 pb-3 space-y-3 border-b border-slate-200 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Shot Syllabus</h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">Target stroke to evaluate</p>
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400">
                  {filteredShots.length} Drills
                </span>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search strokes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-zinc-200 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Category Pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer",
                      selectedCategory === cat
                        ? "bg-emerald-600 dark:bg-emerald-500 text-white font-semibold shadow-sm"
                        : "bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-800"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Shot List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
              {filteredShots.map((shot) => {
                const isActive = targetShot === shot.id;
                const matchProb = streamData?.probs?.[shot.id] || 0;
                return (
                  <button
                    key={shot.id}
                    onClick={() => handleShotChange(shot.id)}
                    className={cn(
                      "w-full text-left p-3 rounded-xl border transition-all duration-150 flex flex-col gap-1.5 group cursor-pointer",
                      isActive
                        ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-500/60 shadow-sm"
                        : "bg-slate-50/70 dark:bg-zinc-900/40 border-slate-200 dark:border-zinc-800/80 hover:bg-slate-100 dark:hover:bg-zinc-900/80 hover:border-slate-300 dark:hover:border-zinc-700"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className={cn("text-xs font-bold", isActive ? "text-emerald-700 dark:text-emerald-400" : "text-slate-900 dark:text-white")}>
                        {shot.name}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openTutorialModal(shot.id, false);
                          }}
                          className="p-1 rounded-md bg-slate-200/80 dark:bg-zinc-800 hover:bg-emerald-500 hover:text-white text-slate-600 dark:text-zinc-400 transition-all cursor-pointer"
                          title="Watch 5-Second Slow-Mo Blueprint"
                        >
                          <Video className="h-3 w-3" />
                        </button>
                        <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400">
                          {shot.difficulty}
                        </span>
                        {isActive && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />}
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-snug line-clamp-1">{shot.keyCue}</p>

                    {/* Live probability indicator */}
                    {isLive && (
                      <div className="w-full pt-1">
                        <div className="flex justify-between text-[10px] text-slate-500 dark:text-zinc-500 mb-0.5">
                          <span>Match Confidence</span>
                          <span className="mono font-bold text-slate-700 dark:text-zinc-300">{(matchProb * 100).toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all duration-200", isActive ? "bg-emerald-500" : "bg-slate-400 dark:bg-zinc-600")}
                            style={{ width: `${matchProb * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

          </div>
        </div>

        {/* ── Center Stage: Live Feed & Video Analysis (6 Cols) ──────────────── */}
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
              {isLive && practiceMode === "with_bat" && batData?.detected && showAngles && batData?.polygon && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <polygon
                    points={batData.polygon.map((pt: [number, number]) => {
                      const x = hasLocalCamera ? (1.0 - pt[0]) * 100 : pt[0] * 100;
                      const y = pt[1] * 100;
                      return `${x},${y}`;
                    }).join(" ")}
                    fill={batData.alignment_match ? "rgba(16, 185, 129, 0.18)" : "rgba(245, 158, 11, 0.18)"}
                    stroke={batData.alignment_match ? "#10b981" : "#f59e0b"}
                    strokeWidth="0.8"
                    strokeDasharray="2,1"
                  />
                  {batData.center && (
                    <circle
                      cx={hasLocalCamera ? (1.0 - batData.center[0]) * 100 : batData.center[0] * 100}
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
                        ? `Connecting to AI backend (${practiceMode === "with_bat" ? "YOLO-OBB + VideoMAE" : "Shadow Biomechanics + VideoMAE"})...` 
                        : "Click 'Start Live Feed' to begin real-time stroke analysis."}
                    </p>
                  </div>
                  {!isLive && (
                    <Button onClick={() => setIsLive(true)} size="sm" className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md">
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
                      <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Drill:</span>
                      <span className="font-bold text-emerald-400">{currentMetadata.name}</span>
                    </div>

                    {/* Active Mode HUD Pill */}
                    <div className={cn(
                      "flex items-center gap-2 backdrop-blur-md border rounded-lg px-3 py-1 text-xs shadow-md font-semibold",
                      practiceMode === "with_bat"
                        ? batData?.detected
                          ? "bg-emerald-950/85 border-emerald-500/50 text-emerald-300"
                          : "bg-zinc-950/85 border-amber-500/40 text-amber-300"
                        : "bg-cyan-950/85 border-cyan-500/40 text-cyan-300"
                    )}>
                      {practiceMode === "with_bat" ? (
                        <>
                          <span>🏏</span>
                          <span>
                            {batData?.detected 
                              ? `Blade: ${batData.blade_angle}° (${batData.is_vertical ? "Vertical Face" : "Cross-Bat"})` 
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
                      <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 mr-1.5">🎯 Key Cue:</span>
                      <span className="text-xs text-zinc-200 font-medium">{currentMetadata.keyCue}</span>
                    </div>
                  </div>

                  {/* Top Right: Form Rating & Live 30 FPS Kinematic Checklist */}
                  <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5 pointer-events-none z-20">
                    <div className={cn("px-3 py-1.5 rounded-lg text-xs font-bold backdrop-blur-md shadow-lg", formRating.gradeColor)}>
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
                          <span className={cn("font-bold font-mono px-1 rounded", liveChecklist.elbow_ok ? "text-emerald-400 bg-emerald-950/80" : "text-amber-400 bg-amber-950/80")}>
                            {liveChecklist.elbow_ok ? `${elbowAngle.toFixed(0)}° ✓` : `${elbowAngle.toFixed(0)}° (Low)`}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-300">Front Knee</span>
                          <span className={cn("font-bold font-mono px-1 rounded", liveChecklist.knee_ok ? "text-teal-400 bg-teal-950/80" : "text-amber-400 bg-amber-950/80")}>
                            {liveChecklist.knee_ok ? `${kneeAngle.toFixed(0)}° ✓` : `${kneeAngle.toFixed(0)}° (Stiff)`}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-300">Head over Knee</span>
                          <span className={cn("font-bold font-mono px-1 rounded", liveChecklist.head_ok ? "text-emerald-400 bg-emerald-950/80" : "text-amber-400 bg-amber-950/80")}>
                            {liveChecklist.head_ok ? "Aligned ✓" : "Off-Center ⚠️"}
                          </span>
                        </div>
                        {practiceMode === "with_bat" && batData?.detected && (
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-300">Blade Face</span>
                            <span className={cn("font-bold font-mono px-1 rounded", liveChecklist.blade_ok ? "text-emerald-400 bg-emerald-950/80" : "text-amber-400 bg-amber-950/80")}>
                              {liveChecklist.blade_ok ? `${batData.blade_angle}° ✓` : `${batData.blade_angle}° (Turn)`}
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
                            onClick={() => openTutorialModal(targetShot, false, lockedErrorTitle, lockedCorrectionCue)}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs gap-1.5 shadow-lg cursor-pointer h-7 px-2.5"
                          >
                            <Video className="h-3.5 w-3.5" />
                            <span>Watch 5s Slow-Mo Fix</span>
                          </Button>

                          <button
                            onClick={handleManualUnlockDrill}
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
                          <span className="text-emerald-400 shrink-0 font-bold">👉 ACTION:</span>
                          <span>{lockedCorrectionCue}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-zinc-300">
                        <span className="text-zinc-400">Perform 1 textbook rep to automatically unlock.</span>
                        <span className="text-amber-400 font-mono font-bold">🔒 Reps on Hold</span>
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
                    <div className={cn(
                      "p-4 rounded-xl backdrop-blur-xl border shadow-2xl flex items-start gap-3.5 text-left",
                      persistentFeedback.status === "success" 
                        ? "bg-emerald-950/95 border-emerald-500/70 text-emerald-100" 
                        : "bg-zinc-950/95 border-amber-500/70 text-zinc-100"
                    )}>
                      <div className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                        persistentFeedback.status === "success" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                      )}>
                        {persistentFeedback.status === "success" ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold tracking-tight">{persistentFeedback.message}</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                            {persistentFeedback.tier || "Coaching Cue"}
                          </span>
                        </div>
                        {persistentFeedback.correction_cue && (
                          <p className="text-xs text-emerald-300 font-semibold mt-1 leading-relaxed">
                            👉 {persistentFeedback.correction_cue}
                          </p>
                        )}
                        {persistentFeedback.tips?.[0] && persistentFeedback.tips[0] !== persistentFeedback.correction_cue && (
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
                <span className="text-slate-500 dark:text-zinc-400 font-semibold">Detected Action:</span>
                <span className="font-bold text-slate-900 dark:text-white px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                  {streamData?.topShot ? streamData.topShot.replace("_", " ").toUpperCase() : "Awaiting Movement"}
                </span>
                {streamData?.confidence && (
                  <span className="text-emerald-600 dark:text-emerald-400 mono font-bold text-xs">
                    {(streamData.confidence * 100).toFixed(0)}%
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-zinc-400">
                <span className="text-[11px] font-medium">AR Telemetry Overlay</span>
                <Switch checked={showAngles} onCheckedChange={setShowAngles} />
              </div>
            </div>

          </div>
        </div>

        {/* ── Right Column: Biometrics & Telemetry (3 Cols) ──────────────────── */}
        <div className="col-span-3 flex flex-col gap-3 min-h-0">
          
          {/* Biometrics & Angles Card */}
          <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm dark:shadow-lg space-y-3">
            
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Live Biometrics</h3>
              </div>
              <span className={cn(
                "text-[10px] font-semibold px-2 py-0.5 rounded border",
                !isBodyDetected ? "bg-slate-100 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-500" : isElbowGood && isKneeGood ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400" : "bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30 text-amber-700 dark:text-amber-400"
              )}>
                {!isBodyDetected ? "No Stance" : isElbowGood && isKneeGood ? "Optimal Shape" : "Form Adjustment"}
              </span>
            </div>

            {!isBodyDetected ? (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800/80 text-center space-y-1">
                <p className="text-xs text-slate-800 dark:text-zinc-300 font-bold">No Batter Stance Detected</p>
                <p className="text-[11px] text-slate-500 dark:text-zinc-500 leading-snug">
                  Stand in frame with your torso and arms visible to stream live joint angles.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className={cn("grid gap-2", practiceMode === "with_bat" ? "grid-cols-4" : "grid-cols-3")}>
                  
                  {/* Lead Elbow Metric Gauge */}
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 text-center flex flex-col items-center gap-1">
                    <span className="text-[9px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Elbow</span>
                    <div className={cn("text-lg font-black mono", isElbowGood ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400")}>
                      {elbowAngle.toFixed(0)}°
                    </div>
                    <span className={cn(
                      "text-[8px] font-bold px-1 py-0.2 rounded",
                      isElbowGood ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                    )}>
                      ≥{currentMetadata.targetElbowAngle}°
                    </span>
                  </div>

                  {/* Lead Knee Metric Gauge */}
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 text-center flex flex-col items-center gap-1">
                    <span className="text-[9px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Knee</span>
                    <div className={cn("text-lg font-black mono", isKneeGood ? "text-teal-600 dark:text-teal-400" : "text-amber-600 dark:text-amber-400")}>
                      {kneeAngle.toFixed(0)}°
                    </div>
                    <span className={cn(
                      "text-[8px] font-bold px-1 py-0.2 rounded",
                      isKneeGood ? "bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-400" : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                    )}>
                      ≤{currentMetadata.targetKneeAngle}°
                    </span>
                  </div>

                  {/* Torso Spine Lean Gauge */}
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 text-center flex flex-col items-center gap-1">
                    <span className="text-[9px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Spine Lean</span>
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
                      <span className="text-[9px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Blade</span>
                      <div className={cn(
                        "text-lg font-black mono", 
                        batData?.detected 
                          ? batData.alignment_match ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400" 
                          : "text-slate-400 dark:text-zinc-500"
                      )}>
                        {batData?.detected ? `${batData.blade_angle}°` : "--"}
                      </div>
                      <span className={cn(
                        "text-[8px] font-bold px-1 py-0.2 rounded",
                        batData?.detected 
                          ? batData.alignment_match ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400" 
                          : "bg-slate-200 dark:bg-zinc-800 text-slate-500 dark:text-zinc-500"
                      )}>
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
                    <span className={cn(
                      "font-semibold font-mono",
                      bioData?.head_over_knee ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                    )}>
                      {bioData?.head_over_knee ? "Over Front Knee ✓" : "Off Center ⚠️"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 dark:text-zinc-400">Arm Arc Reach:</span>
                    <span className="font-semibold text-slate-800 dark:text-zinc-200 font-mono">
                      {bioData?.arm_extension ? `${(bioData.arm_extension * 100).toFixed(0)}% Extension` : "--"}
                    </span>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* YOLOv8-OBB Bat Tracking Telemetry Card (Only in With-Bat Mode) */}
          {practiceMode === "with_bat" && (
            <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm dark:shadow-lg space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-2">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">YOLO-OBB Bat Telemetry</h3>
                </div>
                <span className={cn(
                  "text-[9px] font-semibold px-2 py-0.5 rounded border font-mono",
                  batData?.detected
                    ? batData.alignment_match
                      ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                      : "bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30 text-amber-700 dark:text-amber-400"
                    : "bg-slate-100 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-500"
                )}>
                  {batData?.detected ? (batData.alignment_match ? "Optimal Plane ✓" : "Angle Alert ⚠️") : "Standby"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 text-center flex flex-col items-center">
                  <span className="text-[9px] text-slate-500 dark:text-zinc-500 uppercase font-semibold">Face Alignment</span>
                  <div className="text-xs font-bold text-slate-800 dark:text-zinc-200 mt-1">
                    {batData?.detected ? (batData.is_vertical ? "Vertical Face" : "Horizontal Blade") : "No Bat"}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 text-center flex flex-col items-center">
                  <span className="text-[9px] text-slate-500 dark:text-zinc-500 uppercase font-semibold">Bat-to-Pad Gap</span>
                  <div className="text-xs font-bold text-cyan-600 dark:text-cyan-400 mt-1 mono">
                    {batData?.detected && batData?.bat_pad_gap !== null && batData?.bat_pad_gap !== undefined ? `${batData.bat_pad_gap} L (Compact)` : "--"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Session Performance Card */}
          <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm dark:shadow-lg space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Session Performance</span>
                <span className={cn(
                  "text-[9px] font-bold px-2 py-0.5 rounded border font-mono flex items-center gap-1",
                  isDrillLocked 
                    ? "bg-red-100 dark:bg-red-500/20 border-red-300 dark:border-red-500/50 text-red-700 dark:text-red-400 animate-pulse" 
                    : streakCount >= 3 
                    ? "bg-amber-100 dark:bg-amber-500/20 border-amber-300 dark:border-amber-500/40 text-amber-800 dark:text-amber-300" 
                    : "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                )}>
                  {isDrillLocked ? (
                    <>
                      <Lock className="h-3 w-3" />
                      <span>REPS FROZEN</span>
                    </>
                  ) : streakCount >= 3 ? (
                    <>
                      <Flame className="h-3 w-3 text-amber-500 fill-amber-500" />
                      <span>ON STREAK</span>
                    </>
                  ) : (
                    <>
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                      <span>ACTIVE DRILL</span>
                    </>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono">
                  {totalSwings > 0 ? `${((repCount / totalSwings) * 100).toFixed(0)}% Accuracy` : "0% Accuracy"}
                </span>
                <Flame className="h-4 w-4 text-amber-500" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className={cn(
                "p-2.5 rounded-xl border text-center transition-all",
                isDrillLocked ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-500/30" : "bg-slate-50 dark:bg-zinc-900/80 border-slate-200 dark:border-zinc-800"
              )}>
                <div className="text-[9px] text-slate-500 dark:text-zinc-500 uppercase font-semibold flex items-center justify-center gap-1">
                  <span>Clean Reps</span>
                  {isDrillLocked && <Lock className="h-2.5 w-2.5 text-red-500" />}
                </div>
                <div className={cn("text-xl font-black mono mt-0.5", isDrillLocked ? "text-red-500" : "text-emerald-600 dark:text-emerald-400")}>
                  {repCount}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 text-center">
                <div className="text-[9px] text-slate-500 dark:text-zinc-500 uppercase font-semibold">Total Swings</div>
                <div className="text-xl font-black mono text-slate-800 dark:text-zinc-300 mt-0.5">{totalSwings}</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 text-center">
                <div className="text-[9px] text-slate-500 dark:text-zinc-500 uppercase font-semibold">Streak</div>
                <div className="flex items-center justify-center gap-0.5 mt-0.5">
                  <Flame className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  <span className="text-xl font-black mono text-emerald-600 dark:text-emerald-400">{streakCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Stroke History Log */}
          <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-lg">
            <div className="p-3 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Activity Timeline</h4>
              <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400">{sessionLogs.length} Events</span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
              {sessionLogs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400 dark:text-zinc-500 text-xs">
                  <Info className="h-5 w-5 mb-2 text-slate-400 dark:text-zinc-600" />
                  No stroke events recorded yet. Perform shots in stance to log feedback.
                </div>
              ) : (
                sessionLogs.map((log) => (
                  <div
                    key={log.id}
                    className={cn(
                      "p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all",
                      log.status === "success" 
                        ? "bg-slate-50 dark:bg-zinc-900/60 border-slate-200 dark:border-zinc-800" 
                        : log.status === "wrong_shot"
                        ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-500/30"
                        : "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-500/30"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "h-2 w-2 rounded-full",
                        log.status === "success" ? "bg-emerald-500" : log.status === "wrong_shot" ? "bg-red-500" : "bg-amber-500"
                      )} />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white leading-tight">{log.shot}</div>
                        <div className="text-[10px] text-slate-500 dark:text-zinc-500 mono">{log.time}</div>
                      </div>
                    </div>
                    <span className={cn(
                      "font-mono text-[10px] font-bold px-2 py-0.5 rounded",
                      log.status === "success" 
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400" 
                        : log.status === "wrong_shot"
                        ? "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400"
                    )}>
                      {log.status === "success" ? `${log.grade} (${(log.confidence * 100).toFixed(0)}%)` : log.status === "wrong_shot" ? "Wrong Shot" : "Form Alert"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* ── 5-Second Video Tutorial Masterclass Modal ──────────────────────── */}
      <AnimatePresence>
        {isTutorialOpen && (
          <ShotTutorialModal
            shot={SHOT_CATALOG.find((s) => s.id === tutorialShotId) || SHOT_CATALOG[0]}
            isOpen={isTutorialOpen}
            onClose={() => setIsTutorialOpen(false)}
            onStartPractice={handleStartFromTutorial}
            isFirstTime={isFirstTimeTutorial}
            playbackSpeed={tutorialPlaybackSpeed}
            onSpeedChange={setTutorialPlaybackSpeed}
            highlightedMistake={tutorialHighlightedMistake}
            correctionCue={tutorialCorrectionCue}
          />
        )}
      </AnimatePresence>

      {/* ── Athlete Training Calendar & Google Calendar Modal ───────────────── */}
      <TrainingCalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        currentActiveShot={targetShot}
        userEmail={userProfile.email}
        userName={userProfile.name}
        onLaunchShot={(shotId) => {
          handleShotChange(shotId);
        }}
      />

    </div>
  );
}
