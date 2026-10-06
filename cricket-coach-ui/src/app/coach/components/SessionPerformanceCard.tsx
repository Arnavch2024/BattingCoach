"use client";

import React from "react";
import { Lock, Flame, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { SessionLogItem } from "@/types/coach";

interface SessionPerformanceCardProps {
  repCount: number;
  totalSwings: number;
  streakCount: number;
  isDrillLocked: boolean;
  sessionLogs: SessionLogItem[];
}

export function SessionPerformanceCard({
  repCount,
  totalSwings,
  streakCount,
  isDrillLocked,
  sessionLogs,
}: SessionPerformanceCardProps) {
  return (
    <div className="space-y-3 flex-1 flex flex-col min-h-0">
      {/* Session Performance Card */}
      <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm dark:shadow-lg space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Session Performance
            </span>
            <span
              className={cn(
                "text-[9px] font-bold px-2 py-0.5 rounded border font-mono flex items-center gap-1",
                isDrillLocked
                  ? "bg-red-100 dark:bg-red-500/20 border-red-300 dark:border-red-500/50 text-red-700 dark:text-red-400 animate-pulse"
                  : streakCount >= 3
                  ? "bg-amber-100 dark:bg-amber-500/20 border-amber-300 dark:border-amber-500/40 text-amber-800 dark:text-amber-300"
                  : "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
              )}
            >
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
              {totalSwings > 0
                ? `${((repCount / totalSwings) * 100).toFixed(0)}% Accuracy`
                : "0% Accuracy"}
            </span>
            <Flame className="h-4 w-4 text-amber-500" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div
            className={cn(
              "p-2.5 rounded-xl border text-center transition-all",
              isDrillLocked
                ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-500/30"
                : "bg-slate-50 dark:bg-zinc-900/80 border-slate-200 dark:border-zinc-800"
            )}
          >
            <div className="text-[9px] text-slate-500 dark:text-zinc-500 uppercase font-semibold flex items-center justify-center gap-1">
              <span>Clean Reps</span>
              {isDrillLocked && <Lock className="h-2.5 w-2.5 text-red-500" />}
            </div>
            <div
              className={cn(
                "text-xl font-black mono mt-0.5",
                isDrillLocked ? "text-red-500" : "text-emerald-600 dark:text-emerald-400"
              )}
            >
              {repCount}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 text-center">
            <div className="text-[9px] text-slate-500 dark:text-zinc-500 uppercase font-semibold">
              Total Swings
            </div>
            <div className="text-xl font-black mono text-slate-800 dark:text-zinc-300 mt-0.5">
              {totalSwings}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 text-center">
            <div className="text-[9px] text-slate-500 dark:text-zinc-500 uppercase font-semibold">
              Streak
            </div>
            <div className="flex items-center justify-center gap-0.5 mt-0.5">
              <Flame className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
              <span className="text-xl font-black mono text-emerald-600 dark:text-emerald-400">
                {streakCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Stroke History Log */}
      <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-lg">
        <div className="p-3 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Activity Timeline
          </h4>
          <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400">
            {sessionLogs.length} Events
          </span>
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
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      log.status === "success"
                        ? "bg-emerald-500"
                        : log.status === "wrong_shot"
                        ? "bg-red-500"
                        : "bg-amber-500"
                    )}
                  />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white leading-tight">
                      {log.shot}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-zinc-500 mono">
                      {log.time}
                    </div>
                  </div>
                </div>
                <span
                  className={cn(
                    "font-mono text-[10px] font-bold px-2 py-0.5 rounded",
                    log.status === "success"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400"
                      : log.status === "wrong_shot"
                      ? "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400"
                  )}
                >
                  {log.status === "success"
                    ? `${log.grade} (${(log.confidence * 100).toFixed(0)}%)`
                    : log.status === "wrong_shot"
                    ? "Wrong Shot"
                    : "Form Alert"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
