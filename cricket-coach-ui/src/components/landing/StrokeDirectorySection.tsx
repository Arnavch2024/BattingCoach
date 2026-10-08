"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ShotModule } from "@/types/landing";

interface StrokeDirectorySectionProps {
  shots: ShotModule[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
}

export function StrokeDirectorySection({
  shots,
  selectedCategory,
  onSelectCategory,
}: StrokeDirectorySectionProps) {
  return (
    <section
      id="modules"
      className="py-12 sm:py-20 px-4 sm:px-6 lg:px-12 bg-slate-50 dark:bg-[#09090b] border-t border-slate-200 dark:border-zinc-800 transition-colors"
    >
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4">
          <div className="space-y-1.5 sm:space-y-2">
            <span className="text-[11px] sm:text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
              10-Stroke Syllabus
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Supported Stroke Directory
            </h2>
            <p className="text-xs text-slate-600 dark:text-zinc-400">
              Select any category to inspect target technical angles.
            </p>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-200/80 dark:bg-zinc-900 border border-slate-300/80 dark:border-zinc-800 p-1 rounded-xl text-xs overflow-x-auto custom-scrollbar w-full sm:w-auto">
            {["All", "Drives", "Power", "Technical", "Whips"].map((cat) => (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className={cn(
                  "px-2.5 sm:px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 text-[11px] sm:text-xs",
                  selectedCategory === cat
                    ? "bg-white dark:bg-emerald-500 text-slate-900 dark:text-white font-bold shadow-sm"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {shots.map((shot) => (
            <motion.div
              key={shot.id}
              whileHover={{ y: -4, transition: { type: "spring", stiffness: 400, damping: 20 } }}
              className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-950 border border-slate-200/90 dark:border-zinc-800/90 hover:border-emerald-500/50 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-3 sm:gap-4 group cursor-pointer"
            >
              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {shot.name}
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400">
                    {shot.difficulty}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                  {shot.cue}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2.5 sm:pt-3 border-t border-slate-100 dark:border-zinc-800/80 text-[10px] sm:text-[11px]">
                <span className="text-slate-500 dark:text-zinc-500 uppercase font-semibold">
                  {shot.category}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 dark:text-zinc-400">
                    Elbow:{" "}
                    <strong className="text-emerald-600 dark:text-emerald-400 mono">
                      {shot.targetElbow}
                    </strong>
                  </span>
                  <span className="text-slate-600 dark:text-zinc-400">
                    Knee:{" "}
                    <strong className="text-teal-600 dark:text-teal-400 mono">
                      {shot.targetKnee}
                    </strong>
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
