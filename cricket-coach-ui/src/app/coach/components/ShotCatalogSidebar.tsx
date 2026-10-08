"use client";

import React from "react";
import { Search, Video, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ShotMetadata, CATEGORIES } from "@/types/coach";

interface ShotCatalogSidebarProps {
  filteredShots: ShotMetadata[];
  targetShot: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  onSelectShot: (shotId: string) => void;
  onOpenTutorial: (shotId: string) => void;
  isLive: boolean;
  streamData: any;
}

export function ShotCatalogSidebar({
  filteredShots,
  targetShot,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  onSelectShot,
  onOpenTutorial,
  isLive,
  streamData,
}: ShotCatalogSidebarProps) {
  return (
    <div className="w-full h-full flex flex-col gap-3 min-h-0">
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
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-zinc-200 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Category Pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
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
                onClick={() => onSelectShot(shot.id)}
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
                        onOpenTutorial(shot.id);
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
  );
}
