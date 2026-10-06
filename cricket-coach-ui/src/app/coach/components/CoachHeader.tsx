"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, Video, Volume2, VolumeX, Play, Pause, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";
import { PracticeMode } from "@/types/coach";

interface CoachHeaderProps {
  practiceMode: PracticeMode;
  onModeChange: (mode: PracticeMode) => void;
  isConnected: boolean;
  streamData: any;
  sessionSeconds: number;
  formatTime: (sec: number) => string;
  isMuted: boolean;
  onToggleMute: () => void;
  isLive: boolean;
  onToggleLive: () => void;
  onOpenCalendar: () => void;
  onOpenFormGuide: () => void;
  hasLogs: boolean;
  onSaveDb: () => void;
  isSavingDb: boolean;
  userProfile: { name: string; email: string; stance: string };
}

export function CoachHeader({
  practiceMode,
  onModeChange,
  isConnected,
  streamData,
  sessionSeconds,
  formatTime,
  isMuted,
  onToggleMute,
  isLive,
  onToggleLive,
  onOpenCalendar,
  onOpenFormGuide,
  hasLogs,
  onSaveDb,
  isSavingDb,
  userProfile,
}: CoachHeaderProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <header className="px-6 py-3 border-b border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md flex items-center justify-between shrink-0 sticky top-0 z-30 transition-colors">
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
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                BatCoach AI Pro
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-zinc-800">
                v2.0 Dual-Mode
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-zinc-500 leading-tight">
              VideoMAE + MediaPipe 3D + YOLOv8-OBB Bat Tracking
            </p>
          </div>
        </div>
      </div>

      {/* Practice Mode Selector Segmented Pill */}
      <div className="flex items-center bg-slate-100 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 rounded-xl p-0.5 shadow-inner">
        <button
          onClick={() => onModeChange("no_bat")}
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
          onClick={() => onModeChange("with_bat")}
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
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              isConnected ? "bg-emerald-500 animate-pulse" : "bg-slate-400 dark:bg-zinc-600"
            )}
          />
          <span className="font-medium">{isConnected ? "Connected" : "Standby"}</span>
          <Separator orientation="vertical" className="h-3 mx-1 bg-slate-300 dark:bg-zinc-800" />
          <span className="text-slate-500 dark:text-zinc-400 mono">
            FPS:{" "}
            <strong className="text-slate-900 dark:text-white">
              {streamData?.telemetry?.fps || 0}
            </strong>
          </span>
          <Separator orientation="vertical" className="h-3 mx-1 bg-slate-300 dark:bg-zinc-800" />
          <span className="text-slate-500 dark:text-zinc-400 mono">
            Latency:{" "}
            <strong className="text-slate-900 dark:text-white">
              {streamData?.telemetry?.inference_ms || 12}ms
            </strong>
          </span>
          {practiceMode === "with_bat" && (
            <>
              <Separator
                orientation="vertical"
                className="h-3 mx-1 bg-slate-300 dark:bg-zinc-800"
              />
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                OBB Active
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 bg-slate-100/90 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs">
          <span className="text-slate-500 dark:text-zinc-500">Session:</span>
          <span className="mono font-bold text-slate-900 dark:text-white">
            {formatTime(sessionSeconds)}
          </span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onOpenCalendar}
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
          onClick={onOpenFormGuide}
          className="h-8 gap-1.5 text-xs text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 shadow-sm"
          title="Watch 5-Second Slow-Mo Masterclass"
        >
          <Video className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
          <span className="hidden sm:inline font-semibold">Form Guide</span>
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={onToggleMute}
          className="h-8 w-8 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 shadow-sm"
          title={isMuted ? "Unmute Voice Coach" : "Mute Voice Coach"}
        >
          {isMuted ? (
            <VolumeX className="h-4 w-4 text-red-500 dark:text-red-400" />
          ) : (
            <Volume2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          )}
        </Button>

        {/* Theme Toggle Component */}
        <ThemeToggle />

        <Button
          variant={isLive ? "destructive" : "default"}
          size="sm"
          onClick={onToggleLive}
          className={cn(
            "font-bold text-xs gap-1.5 h-8 shadow-sm",
            isLive
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white"
          )}
        >
          {isLive ? (
            <Pause className="h-3.5 w-3.5 fill-current" />
          ) : (
            <Play className="h-3.5 w-3.5 fill-current" />
          )}
          {isLive ? "End Session" : "Start Live Feed"}
        </Button>

        {hasLogs && (
          <Button
            variant="outline"
            size="sm"
            onClick={onSaveDb}
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
  );
}
