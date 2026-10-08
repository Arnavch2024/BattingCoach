"use client";

import React from "react";
import Link from "next/link";
import { Play, LogIn, LogOut, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserProfile } from "@/types/landing";

interface LandingHeaderProps {
  userProfile: UserProfile | null;
  onOpenSignIn: () => void;
  onOpenCalendar: () => void;
  onSignOut: () => void;
}

export function LandingHeader({
  userProfile,
  onOpenSignIn,
  onOpenCalendar,
  onSignOut,
}: LandingHeaderProps) {
  return (
    <header className="fixed top-0 inset-x-0 h-14 sm:h-16 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-xl border-b border-slate-200/90 dark:border-zinc-800/80 z-50 px-3 sm:px-6 lg:px-12 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-2 sm:gap-3">
        <img
          src="/bat-icon.jpg"
          alt="BatCoach Logo"
          className="h-7 w-7 sm:h-9 sm:w-9 rounded-xl object-cover border border-emerald-500/40 shadow-sm shadow-emerald-500/10 shrink-0"
        />
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="font-bold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white">
              BatCoach AI Pro
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 hidden xs:inline">
              v2.0
            </span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-zinc-400 hidden sm:block">
            Olympic-Grade Batting Biomechanics & Stroke AI
          </p>
        </div>
      </div>

      {/* Center Navigation */}
      <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-xs text-slate-600 dark:text-zinc-300 font-medium">
        <a href="#hero" className="hover:text-emerald-600 dark:hover:text-white transition-colors">
          Overview
        </a>
        <a
          href="#demo-preview"
          className="hover:text-emerald-600 dark:hover:text-white transition-colors"
        >
          Biomechanics Engine
        </a>
        <a href="#modules" className="hover:text-emerald-600 dark:hover:text-white transition-colors">
          Stroke Syllabus
        </a>
      </nav>

      {/* Right CTA / Athlete Profile / Theme Toggle */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        <ThemeToggle />

        {userProfile ? (
          <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-100/90 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 rounded-xl p-1 pr-2 sm:pr-3 text-xs transition-colors">
            <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white text-[10px] sm:text-[11px] shadow-sm shrink-0">
              {userProfile.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="text-left hidden sm:block leading-tight">
              <div className="text-xs font-semibold text-slate-900 dark:text-zinc-200 truncate max-w-[90px]">
                {userProfile.name}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-zinc-500 truncate max-w-[90px]">
                {userProfile.stance}
              </div>
            </div>
            <button
              onClick={onSignOut}
              title="Sign Out"
              className="ml-1 sm:ml-2 text-slate-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400 transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenSignIn}
            className="text-slate-700 dark:text-zinc-200 border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs gap-1 font-medium rounded-xl h-8 px-2.5"
          >
            <LogIn className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sign In</span>
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={onOpenCalendar}
          className="text-xs border-emerald-500/30 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60 dark:hover:text-white gap-1 font-medium rounded-xl transition-all h-8 px-2 sm:px-3"
          title="Training Schedule"
        >
          <Calendar className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="hidden sm:inline">Schedule</span>
        </Button>

        <Link href="/coach">
          <Button
            size="sm"
            className="gap-1 sm:gap-1.5 font-semibold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 hover:shadow-emerald-600/30 rounded-xl transition-all h-8 px-2.5 sm:px-3.5"
          >
            <Play className="h-3 w-3 fill-current" />
            <span className="hidden sm:inline">Launch Coach</span>
            <span className="sm:hidden">Coach</span>
          </Button>
        </Link>
      </div>
    </header>
  );
}
