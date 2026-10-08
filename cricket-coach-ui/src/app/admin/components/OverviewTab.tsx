"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Award, TrendingUp, Users, Cpu, Timer, LineChart, Activity, Flame
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, Legend
} from "recharts";
import { OverviewData, TimelineDay, ShotDistribution, FlawHotspot, HealthTelemetry, SHOT_DISPLAY_NAMES } from "@/types/admin";
import { AnimatedNumber } from "./AnimatedNumber";
import { CustomTooltip } from "./CustomTooltip";

interface OverviewTabProps {
  overview: OverviewData | null;
  health: HealthTelemetry | null;
  timeline: TimelineDay[];
  shotDist: ShotDistribution[];
  flaws: FlawHotspot[];
}

export function OverviewTab({
  overview,
  health,
  timeline,
  shotDist,
  flaws,
}: OverviewTabProps) {
  const ov = overview || {
    athlete_count: 0,
    total_sessions: 0,
    total_reps: 0,
    successful_reps: 0,
    accuracy: 0,
    best_streak: 0,
    avg_confidence: 0,
    total_practice_hours: 0,
  };
  const dbConnected = health?.database === "connected";

  return (
    <motion.div
      key="overview"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Global Accuracy */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900/80 to-zinc-950/90 border border-zinc-800/60 p-3.5 sm:p-5 group hover:border-emerald-500/40 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl" />
          <div className="flex items-center justify-between text-zinc-400 text-[10px] font-mono mb-2 sm:mb-3 uppercase tracking-wider">
            <span>Global Accuracy</span>
            <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-mono">
              <AnimatedNumber value={ov.accuracy} decimals={1} suffix="%" />
            </span>
            {ov.accuracy > 0 && (
              <span className="text-[11px] sm:text-xs font-medium text-emerald-400 flex items-center font-mono">
                <TrendingUp className="w-3 h-3 mr-0.5" />
                Live
              </span>
            )}
          </div>
          <p className="text-[10px] text-zinc-500 mt-2 font-mono">
            {ov.successful_reps.toLocaleString()} clean / {ov.total_reps.toLocaleString()} total
          </p>
          <div className="w-full bg-zinc-800/80 h-1.5 rounded-full mt-3 overflow-hidden">
            <motion.div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(ov.accuracy, 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Total Athletes */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900/80 to-zinc-950/90 border border-zinc-800/60 p-5 group hover:border-cyan-500/40 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl" />
          <div className="flex items-center justify-between text-zinc-400 text-[10px] font-mono mb-3 uppercase tracking-wider">
            <span>Registered Athletes</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-white font-mono">
              <AnimatedNumber value={ov.athlete_count} />
            </span>
            <span className="text-xs font-medium text-cyan-400 font-mono">active</span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-2 font-mono">
            {ov.total_sessions.toLocaleString()} total sessions logged
          </p>
          <div className="w-full bg-zinc-800/80 h-1.5 rounded-full mt-3 overflow-hidden">
            <motion.div
              className="bg-gradient-to-r from-cyan-500 to-blue-400 h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(ov.athlete_count * 10, 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* AI Inference Speed */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900/80 to-zinc-950/90 border border-zinc-800/60 p-5 group hover:border-purple-500/40 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl" />
          <div className="flex items-center justify-between text-zinc-400 text-[10px] font-mono mb-3 uppercase tracking-wider">
            <span>AI Pipeline Latency</span>
            <Cpu className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-white font-mono">
              {health?.pingMs ? `${health.pingMs}` : "—"}
            </span>
            <span className="text-xs font-medium text-purple-400 font-mono">ms</span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-2 font-mono">
            {health?.fp16 ? "FP16 CUDA" : health?.device || "CPU"} • VideoMAE + YOLOv8-OBB
          </p>
          <div className="w-full bg-zinc-800/80 h-1.5 rounded-full mt-3 overflow-hidden">
            <motion.div
              className="bg-gradient-to-r from-purple-500 to-violet-400 h-full rounded-full"
              initial={{ width: 0 }}
              animate={{
                width: health?.pingMs ? `${Math.max(10, 100 - health.pingMs / 2)}%` : "0%",
              }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Practice Hours */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900/80 to-zinc-950/90 border border-zinc-800/60 p-5 group hover:border-amber-500/40 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl" />
          <div className="flex items-center justify-between text-zinc-400 text-[10px] font-mono mb-3 uppercase tracking-wider">
            <span>Total Practice Time</span>
            <Timer className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-white font-mono">
              <AnimatedNumber value={ov.total_practice_hours} decimals={1} />
            </span>
            <span className="text-xs font-medium text-amber-400 font-mono">hours</span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-2 font-mono">
            Best streak: {ov.best_streak} clean reps
          </p>
          <div className="w-full bg-zinc-800/80 h-1.5 rounded-full mt-3 overflow-hidden">
            <motion.div
              className="bg-gradient-to-r from-amber-500 to-orange-400 h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(ov.total_practice_hours * 5, 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* Timeline Chart + Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area Chart: Accuracy Trend */}
        <div className="lg:col-span-2 rounded-2xl bg-gradient-to-br from-zinc-900/60 to-zinc-950/80 border border-zinc-800/60 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <LineChart className="w-4 h-4 text-emerald-400" />
                30-Day Performance Trend
              </h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">Daily accuracy & session volume</p>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/20">
              {timeline.length} days tracked
            </span>
          </div>

          {timeline.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={timeline}>
                <defs>
                  <linearGradient id="accuracyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="sessionsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "#71717a" }}
                  tickFormatter={(v: string) =>
                    new Date(v).toLocaleDateString("en", { month: "short", day: "numeric" })
                  }
                  stroke="#27272a"
                />
                <YAxis
                  yAxisId="acc"
                  tick={{ fontSize: 10, fill: "#71717a" }}
                  domain={[0, 100]}
                  stroke="#27272a"
                  tickFormatter={(v: number) => `${v}%`}
                />
                <YAxis
                  yAxisId="sessions"
                  orientation="right"
                  tick={{ fontSize: 10, fill: "#71717a" }}
                  stroke="#27272a"
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: "10px", fontFamily: "monospace" }}
                  iconType="circle"
                  iconSize={6}
                />
                <Area
                  yAxisId="acc"
                  type="monotone"
                  dataKey="accuracy"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#accuracyGrad)"
                  name="Accuracy %"
                />
                <Area
                  yAxisId="sessions"
                  type="monotone"
                  dataKey="sessions"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fill="url(#sessionsGrad)"
                  name="Sessions"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[260px] text-zinc-500 text-sm font-mono">
              <div className="text-center space-y-2">
                <Activity className="w-8 h-8 mx-auto text-zinc-600" />
                <p>No timeline data yet</p>
                <p className="text-[10px] text-zinc-600">
                  Sessions will appear here as athletes practice
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Key Coaching Facts */}
        <div className="rounded-2xl bg-gradient-to-br from-zinc-900/60 to-zinc-950/80 border border-zinc-800/60 p-6 backdrop-blur-xl flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              Coaching Intelligence
            </h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">Live aggregate insights</p>
          </div>

          <div className="space-y-3 flex-1">
            {shotDist.length > 0 && (
              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/60 space-y-1">
                <span className="text-emerald-400 font-semibold font-mono text-[10px] uppercase tracking-wider">
                  #1 Most Practiced Shot
                </span>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  <strong className="text-white">
                    {SHOT_DISPLAY_NAMES[shotDist[0].shot] || shotDist[0].shot}
                  </strong>{" "}
                  with <strong className="text-white">{shotDist[0].sessions}</strong> sessions and{" "}
                  <strong className="text-emerald-400">{shotDist[0].accuracy}%</strong> accuracy.
                </p>
              </div>
            )}

            {flaws.length > 0 && (
              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/60 space-y-1">
                <span className="text-rose-400 font-semibold font-mono text-[10px] uppercase tracking-wider">
                  Top Biomechanical Flaw
                </span>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  <strong className="text-white">
                    {flaws[0].feedback.substring(0, 60)}
                  </strong>{" "}
                  on{" "}
                  <strong className="text-white">
                    {SHOT_DISPLAY_NAMES[flaws[0].shot] || flaws[0].shot}
                  </strong>{" "}
                  — {flaws[0].count} occurrences.
                </p>
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/60 space-y-1">
              <span className="text-cyan-400 font-semibold font-mono text-[10px] uppercase tracking-wider">
                System Confidence
              </span>
              <p className="text-[11px] text-zinc-300 leading-relaxed">
                Average AI confidence across all strokes:{" "}
                <strong className="text-white">{(ov.avg_confidence * 100).toFixed(1)}%</strong>
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-[11px] font-mono text-emerald-400 flex items-center justify-between">
            <span>Database:</span>
            <span className={`font-bold ${dbConnected ? "text-emerald-400" : "text-red-400"}`}>
              {dbConnected ? "✓ Supabase Connected" : "✗ Disconnected"}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
