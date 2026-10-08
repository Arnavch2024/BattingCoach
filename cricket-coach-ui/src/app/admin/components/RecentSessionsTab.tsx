"use client";

import React from "react";
import { motion } from "framer-motion";
import { Calendar, BarChart3, CircleDot } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Cell
} from "recharts";
import {
  RecentSession, SHOT_DISPLAY_NAMES, SHOT_COLORS, formatDuration, timeAgo
} from "@/types/admin";
import { CustomTooltip } from "./CustomTooltip";

interface RecentSessionsTabProps {
  sessions: RecentSession[];
}

export function RecentSessionsTab({ sessions }: RecentSessionsTabProps) {
  return (
    <motion.div
      key="sessions"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Session Bar Chart */}
      {sessions.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-br from-zinc-900/60 to-zinc-950/80 border border-zinc-800/60 p-4 sm:p-6 backdrop-blur-xl">
          <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-amber-400" />
            Session Accuracy Comparison (Last 20)
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={sessions.slice(0, 20).reverse()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis
                dataKey="athlete_name"
                tick={{ fontSize: 9, fill: "#71717a" }}
                angle={-25}
                textAnchor="end"
                height={50}
              />
              <YAxis
                tick={{ fontSize: 9, fill: "#71717a" }}
                domain={[0, 100]}
                tickFormatter={(v: number) => `${v}%`}
                stroke="#27272a"
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="accuracy" name="Accuracy" radius={[4, 4, 0, 0]} animationDuration={600}>
                {sessions
                  .slice(0, 20)
                  .reverse()
                  .map((s, i) => (
                    <Cell
                      key={i}
                      fill={s.accuracy >= 80 ? "#10b981" : s.accuracy >= 60 ? "#f59e0b" : "#f43f5e"}
                    />
                  ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Session Feed */}
      <div className="rounded-2xl bg-gradient-to-br from-zinc-900/60 to-zinc-950/80 border border-zinc-800/60 p-4 sm:p-6 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-400" />
              Recent Sessions Feed
            </h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">Latest practice sessions across all athletes</p>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-400 text-[10px] font-mono border border-purple-500/20">
            {sessions.length} sessions
          </span>
        </div>

        {sessions.length > 0 ? (
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
            {sessions.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50 hover:border-zinc-700/60 transition-all group"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Avatar */}
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-zinc-700/50 flex items-center justify-center text-xs font-bold text-purple-400 font-mono flex-shrink-0">
                    {s.athlete_name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white text-xs truncate">{s.athlete_name}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">•</span>
                      <span className="text-[10px] text-zinc-400 font-mono">{timeAgo(s.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[10px] font-mono text-zinc-400">
                      <span className="flex items-center gap-1">
                        <CircleDot className="w-3 h-3" style={{ color: SHOT_COLORS[s.shot] || "#10b981" }} />
                        {SHOT_DISPLAY_NAMES[s.shot] || s.shot}
                      </span>
                      <span>{s.total_reps} reps</span>
                      <span>{formatDuration(s.duration_seconds)}</span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-end sm:justify-center gap-4 text-[11px] font-mono flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-zinc-800/50">
                  <div className="text-center">
                    <span
                      className={`font-bold block ${
                        s.accuracy >= 80
                          ? "text-emerald-400"
                          : s.accuracy >= 60
                          ? "text-amber-400"
                          : "text-rose-400"
                      }`}
                    >
                      {s.accuracy}%
                    </span>
                    <span className="text-[9px] text-zinc-500 uppercase">Accuracy</span>
                  </div>
                  <div className="text-center">
                    <span className="font-bold text-white block">{s.best_streak}</span>
                    <span className="text-[9px] text-zinc-500 uppercase">Streak</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-48 text-zinc-500 text-sm font-mono">
            <div className="text-center space-y-2">
              <Calendar className="w-8 h-8 mx-auto text-zinc-600" />
              <p>No sessions recorded yet</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
