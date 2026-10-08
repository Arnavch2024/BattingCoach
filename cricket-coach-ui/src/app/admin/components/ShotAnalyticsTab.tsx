"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  BarChart3, Target, PieChart, Crosshair, AlertTriangle, CheckCircle2
} from "lucide-react";
import {
  ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, Tooltip,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend
} from "recharts";
import {
  ShotDistribution, FlawHotspot, SHOT_DISPLAY_NAMES, SHOT_COLORS, SHOT_GRADIENT
} from "@/types/admin";
import { CustomTooltip } from "./CustomTooltip";

interface ShotAnalyticsTabProps {
  shotDist: ShotDistribution[];
  flaws: FlawHotspot[];
}

export function ShotAnalyticsTab({ shotDist, flaws }: ShotAnalyticsTabProps) {
  // Radar data for shot distribution
  const radarData = shotDist.map((s) => ({
    shot: SHOT_DISPLAY_NAMES[s.shot] || s.shot,
    sessions: s.sessions,
    accuracy: s.accuracy,
    confidence: s.avg_confidence * 100,
  }));

  // Pie data for shot distribution
  const pieData = shotDist.map((s, i) => ({
    name: SHOT_DISPLAY_NAMES[s.shot] || s.shot,
    value: s.sessions,
    color: SHOT_COLORS[s.shot] || `hsl(${i * 40}, 70%, 55%)`,
  }));

  return (
    <motion.div
      key="shots"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Shot Distribution Bars + Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar breakdown */}
        <div className="lg:col-span-2 rounded-2xl bg-gradient-to-br from-zinc-900/60 to-zinc-950/80 border border-zinc-800/60 p-4 sm:p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                Drill Distribution Matrix
              </h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">Real session data from Supabase</p>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/20">
              {shotDist.length} shot types
            </span>
          </div>

          {shotDist.length > 0 ? (
            <div className="space-y-4">
              {shotDist.map((s, i) => {
                const maxSessions = shotDist[0]?.sessions || 1;
                const barWidth = (s.sessions / maxSessions) * 100;
                return (
                  <motion.div
                    key={s.shot}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-zinc-200 flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ background: SHOT_COLORS[s.shot] || "#10b981" }}
                        />
                        <span>{SHOT_DISPLAY_NAMES[s.shot] || s.shot}</span>
                      </span>
                      <div className="flex items-center gap-4 font-mono text-[11px]">
                        <span className="text-zinc-400">{s.sessions} sessions</span>
                        <span className="text-zinc-400">{s.total_reps} reps</span>
                        <span className="text-emerald-400 font-bold">{s.accuracy}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-zinc-800/60 h-2.5 rounded-full overflow-hidden border border-zinc-800/40">
                      <motion.div
                        className={`h-full rounded-full bg-gradient-to-r ${
                          SHOT_GRADIENT[i % SHOT_GRADIENT.length]
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${barWidth}%` }}
                        transition={{ duration: 0.8, delay: i * 0.05 }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-zinc-500 text-sm font-mono">
              <div className="text-center space-y-2">
                <Target className="w-8 h-8 mx-auto text-zinc-600" />
                <p>No shot data yet</p>
              </div>
            </div>
          )}
        </div>

        {/* Pie Chart */}
        <div className="rounded-2xl bg-gradient-to-br from-zinc-900/60 to-zinc-950/80 border border-zinc-800/60 p-6 backdrop-blur-xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2 mb-4">
            <PieChart className="w-4 h-4 text-cyan-400" />
            Session Share
          </h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <RechartsPie>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  animationBegin={100}
                  animationDuration={800}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </RechartsPie>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-zinc-500 text-xs font-mono">
              No data
            </div>
          )}
          {/* Legend */}
          <div className="mt-4 grid grid-cols-2 gap-1.5">
            {pieData.slice(0, 8).map((p) => (
              <div key={p.name} className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: p.color }}
                />
                <span className="truncate">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Radar Chart + Flaw Hotspots */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar */}
        <div className="rounded-2xl bg-gradient-to-br from-zinc-900/60 to-zinc-950/80 border border-zinc-800/60 p-6 backdrop-blur-xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2 mb-4">
            <Crosshair className="w-4 h-4 text-purple-400" />
            Shot Proficiency Radar
          </h3>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#27272a" />
                <PolarAngleAxis dataKey="shot" tick={{ fontSize: 9, fill: "#a1a1aa" }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8, fill: "#52525b" }} />
                <Radar
                  name="Accuracy"
                  dataKey="accuracy"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <Radar
                  name="Confidence"
                  dataKey="confidence"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
                <Legend
                  wrapperStyle={{ fontSize: "10px", fontFamily: "monospace" }}
                  iconType="circle"
                  iconSize={6}
                />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-zinc-500 text-xs font-mono">
              No data available
            </div>
          )}
        </div>

        {/* Flaw Hotspots */}
        <div className="rounded-2xl bg-gradient-to-br from-zinc-900/60 to-zinc-950/80 border border-zinc-800/60 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Biomechanical Flaw Hotspots
              </h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">Most frequent technique errors</p>
            </div>
          </div>

          {flaws.length > 0 ? (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
              {flaws.map((flaw, i) => (
                <motion.div
                  key={`${flaw.feedback}-${i}`}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/60 space-y-2 hover:border-rose-500/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium text-white text-xs leading-snug flex-1">
                      {flaw.feedback.length > 80
                        ? flaw.feedback.substring(0, 80) + "..."
                        : flaw.feedback}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex-shrink-0">
                      {flaw.count}×
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-400">
                    <span>
                      Shot:{" "}
                      <strong className="text-zinc-300">
                        {SHOT_DISPLAY_NAMES[flaw.shot] || flaw.shot}
                      </strong>
                    </span>
                    {flaw.avg_elbow > 0 && (
                      <span>
                        Elbow: <strong className="text-zinc-300">{flaw.avg_elbow}°</strong>
                      </span>
                    )}
                    {flaw.avg_knee > 0 && (
                      <span>
                        Knee: <strong className="text-zinc-300">{flaw.avg_knee}°</strong>
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-zinc-500 text-sm font-mono">
              <div className="text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-600" />
                <p>No flaw data recorded yet</p>
                <p className="text-[10px] text-zinc-600">Biomechanical errors will appear here</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
