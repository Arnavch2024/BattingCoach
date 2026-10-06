"use client";

import React from "react";
import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-12 px-6 lg:px-12 text-xs text-slate-500 dark:text-zinc-500 transition-colors">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <img
            src="/bat-icon.jpg"
            alt="BatCoach Logo"
            className="h-7 w-7 rounded-lg object-cover border border-emerald-500/40"
          />
          <div>
            <span className="font-bold text-sm text-slate-900 dark:text-zinc-200">
              BatCoach AI Pro
            </span>
            <p className="text-[10px] text-slate-500 dark:text-zinc-500">
              Real-Time Batting Biomechanics & Stroke Intelligence
            </p>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-6 text-xs text-slate-600 dark:text-zinc-400">
          <Link
            href="/coach"
            className="hover:text-emerald-600 dark:hover:text-white transition-colors"
          >
            Launch Coaching Session
          </Link>
          <a href="#hero" className="hover:text-emerald-600 dark:hover:text-white transition-colors">
            Overview
          </a>
          <a
            href="#modules"
            className="hover:text-emerald-600 dark:hover:text-white transition-colors"
          >
            Stroke Syllabus
          </a>
        </div>

        <div className="text-[11px] text-slate-500 dark:text-zinc-500">
          © 2026 BatCoach AI Pro. Built with VideoMAE & MediaPipe.
        </div>
      </div>
    </footer>
  );
}
