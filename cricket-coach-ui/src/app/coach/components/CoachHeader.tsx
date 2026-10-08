"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Video,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Shield,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <header className="border-b border-slate-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md sticky top-0 z-30 transition-colors">
      {/* ── Main Bar ──────────────────────────────────────────────────────── */}
      <div className="px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">
        {/* Left: Brand & Home */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link
            href="/"
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 transition-all font-medium text-xs flex items-center gap-1"
            title="Back to Home"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Home</span>
          </Link>

          <div className="flex items-center gap-2">
            <img
              src="/bat-icon.jpg"
              alt="BatCoach Icon"
              className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg object-cover border border-emerald-500/40 shadow-sm"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                  BatCoach AI
                </span>
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-100 dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-zinc-800 hidden xs:inline">
                  v2.0
                </span>
              </div>
              <p className="text-[9px] sm:text-[10px] text-slate-500 dark:text-zinc-500 leading-tight hidden lg:block">
                VideoMAE + MediaPipe 3D + YOLOv8-OBB Bat Tracking
              </p>
            </div>
          </div>
        </div>

        {/* Center: Desktop Practice Mode Pill (Visible on lg+) */}
        <div className="hidden lg:flex items-center bg-slate-100 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 rounded-xl p-0.5 shadow-inner shrink-0">
          <button
            onClick={() => onModeChange("no_bat")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.2 rounded-lg text-xs font-bold transition-all cursor-pointer",
              practiceMode === "no_bat"
                ? "bg-white dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/40 shadow-sm"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
            )}
            title="Shadow Practice: Pure 3D biomechanics & VideoMAE"
          >
            <span>🥋 Shadow Form</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30 font-mono font-normal">
              No Bat
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
            title="Live Willow Practice: Real-time YOLOv8-OBB bat orientation"
          >
            <span>🏏 Live Willow</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 font-mono font-normal">
              YOLO-OBB
            </span>
          </button>
        </div>

        {/* Right: Actions & Live Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Telemetry pill (desktop only) */}
          <div className="hidden xl:flex items-center gap-2 bg-slate-100/90 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-slate-700 dark:text-zinc-300">
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                isConnected ? "bg-emerald-500 animate-pulse" : "bg-slate-400 dark:bg-zinc-600"
              )}
            />
            <span className="font-medium">{isConnected ? "Connected" : "Standby"}</span>
            <Separator orientation="vertical" className="h-3 mx-0.5 bg-slate-300 dark:bg-zinc-800" />
            <span className="text-slate-500 dark:text-zinc-400 mono">
              FPS: <strong className="text-slate-900 dark:text-white">{streamData?.telemetry?.fps || 0}</strong>
            </span>
            <Separator orientation="vertical" className="h-3 mx-0.5 bg-slate-300 dark:bg-zinc-800" />
            <span className="text-slate-500 dark:text-zinc-400 mono">
              <strong className="text-slate-900 dark:text-white">{streamData?.telemetry?.inference_ms || 12}ms</strong>
            </span>
          </div>

          {/* Session Timer */}
          <div className="flex items-center gap-1.5 bg-slate-100/90 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 rounded-lg px-2 py-1 text-xs">
            <span className="text-slate-500 dark:text-zinc-500 hidden sm:inline">Session:</span>
            <span className="mono font-bold text-slate-900 dark:text-white text-[11px] sm:text-xs">
              {formatTime(sessionSeconds)}
            </span>
          </div>

          {/* Schedule Calendar (hidden on mobile, in mobile drawer) */}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenCalendar}
            className="hidden sm:inline-flex h-8 gap-1.5 text-xs text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-white border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 shadow-sm"
            title="Athlete Training Calendar"
          >
            <Calendar className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden md:inline font-semibold">Calendar</span>
          </Button>

          {/* Form Guide Masterclass */}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenFormGuide}
            className="hidden md:inline-flex h-8 gap-1.5 text-xs text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 shadow-sm"
            title="5-Second Slow-Mo Masterclass"
          >
            <Video className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
            <span className="font-semibold">Guide</span>
          </Button>

          {/* Voice Coach Mute Toggle */}
          <Button
            variant="outline"
            size="icon"
            onClick={onToggleMute}
            className="h-8 w-8 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 shadow-sm shrink-0"
            title={isMuted ? "Unmute Voice Coach" : "Mute Voice Coach"}
          >
            {isMuted ? (
              <VolumeX className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />
            ) : (
              <Volume2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            )}
          </Button>

          <ThemeToggle />

          {/* Live Session Toggle (Big CTA) */}
          <Button
            variant={isLive ? "destructive" : "default"}
            size="sm"
            onClick={onToggleLive}
            className={cn(
              "font-bold text-xs gap-1.5 h-8 shadow-sm shrink-0 px-2.5 sm:px-3",
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
            <span>{isLive ? "End" : "Start"}</span>
          </Button>

          {/* Mobile Secondary Toggle Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden h-8 w-8 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-zinc-800"
            title="Toggle extra options"
          >
            <ChevronDown className={cn("h-4 w-4 transition-transform", mobileMenuOpen && "rotate-180")} />
          </Button>

          {/* DB Sync if logs exist */}
          {hasLogs && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSaveDb}
              disabled={isSavingDb}
              className="hidden lg:inline-flex text-xs h-8 bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-white shadow-sm"
              title="Save Session to Supabase PostgreSQL"
            >
              <Shield className="h-3.5 w-3.5 mr-1 text-emerald-600 dark:text-emerald-400" />
              {isSavingDb ? "Syncing..." : "Sync DB"}
            </Button>
          )}

          {/* User Profile Avatar */}
          <div className="hidden lg:flex items-center gap-2 pl-1 border-l border-slate-200 dark:border-zinc-800">
            <div className="h-7 w-7 rounded-lg bg-emerald-600 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
              {getInitials(userProfile.name)}
            </div>
            <div className="text-left leading-tight hidden xl:block">
              <div className="text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate max-w-[100px]">
                {userProfile.name}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-zinc-500 truncate max-w-[100px]">
                {userProfile.stance}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile Mode Selector & Quick Actions Drawer ───────────────────── */}
      <div
        className={cn(
          "px-3 pb-2.5 pt-1 border-t border-slate-200/60 dark:border-zinc-800/60 lg:hidden flex flex-col gap-2 transition-all",
          !mobileMenuOpen && "hidden sm:flex"
        )}
      >
        <div className="flex items-center justify-between gap-2">
          {/* Practice Mode Segmented Pill */}
          <div className="flex-1 grid grid-cols-2 bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-0.5">
            <button
              onClick={() => onModeChange("no_bat")}
              className={cn(
                "py-1.5 text-center text-[11px] font-bold rounded-lg transition-all",
                practiceMode === "no_bat"
                  ? "bg-white dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 shadow-sm"
                  : "text-slate-600 dark:text-zinc-400"
              )}
            >
              🥋 Shadow (No Bat)
            </button>
            <button
              onClick={() => onModeChange("with_bat")}
              className={cn(
                "py-1.5 text-center text-[11px] font-bold rounded-lg transition-all",
                practiceMode === "with_bat"
                  ? "bg-white dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 shadow-sm"
                  : "text-slate-600 dark:text-zinc-400"
              )}
            >
              🏏 Live Willow (OBB)
            </button>
          </div>
        </div>

        {/* Collapsible Mobile Options Row */}
        {mobileMenuOpen && (
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-zinc-900 text-xs">
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenCalendar}
                className="h-7 text-[11px] px-2.5 gap-1 border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
              >
                <Calendar className="h-3 w-3" />
                <span>Calendar</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenFormGuide}
                className="h-7 text-[11px] px-2.5 gap-1"
              >
                <Video className="h-3 w-3" />
                <span>Form Guide</span>
              </Button>
              {hasLogs && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSaveDb}
                  disabled={isSavingDb}
                  className="h-7 text-[11px] px-2.5 gap-1 text-emerald-600 dark:text-emerald-400"
                >
                  <Shield className="h-3 w-3" />
                  <span>{isSavingDb ? "Syncing..." : "Sync DB"}</span>
                </Button>
              )}
            </div>

            <div className="text-[10px] font-mono text-slate-500 dark:text-zinc-500">
              {streamData?.telemetry?.fps || 0} FPS • {streamData?.telemetry?.inference_ms || 12}ms
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
