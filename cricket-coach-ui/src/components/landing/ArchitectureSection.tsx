"use client";

import React from "react";
import { Compass, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

function DatabaseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5V19A9 3 0 0 0 21 19V5" />
      <path d="M3 12A9 3 0 0 0 21 12" />
    </svg>
  );
}

export function ArchitectureSection() {
  return (
    <section
      id="demo-preview"
      className="py-20 px-6 lg:px-12 bg-white dark:bg-zinc-950 border-t border-slate-200 dark:border-zinc-800 transition-colors"
    >
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Engineering Specs
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Why 3D Metric Space Replaces 2D Screen Landmark Tracking
          </h2>
          <p className="text-sm text-slate-600 dark:text-zinc-400">
            Traditional computer vision calculates 2D pixel angles that distort whenever the camera
            tilts. BatCoach AI computes true Euclidean metric vectors in meters.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            whileHover={{ y: -4, transition: { type: "spring", stiffness: 350, damping: 20 } }}
            className="p-6 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/90 dark:border-zinc-800 hover:border-emerald-500/40 hover:shadow-md transition-all space-y-3"
          >
            <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Compass className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Perspective-Invariant Vectors
            </h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              Utilizes MediaPipe <code>pose_world_landmarks</code> to reconstruct the athlete's 3D
              skeletal frame in physical meter coordinates, ensuring identical angle accuracy
              regardless of camera height.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -4, transition: { type: "spring", stiffness: 350, damping: 20 } }}
            className="p-6 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/90 dark:border-zinc-800 hover:border-cyan-500/40 hover:shadow-md transition-all space-y-3"
          >
            <div className="h-10 w-10 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Kinetic Swing Motion State Machine
            </h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              Tracks wrist acceleration and follow-through deceleration (
              <code>IDLE</code> &rarr; <code>SWINGING</code> &rarr; <code>COMPLETED</code>). Reps and audio
              tips are only triggered on actual physical bat strokes.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -4, transition: { type: "spring", stiffness: 350, damping: 20 } }}
            className="p-6 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/90 dark:border-zinc-800 hover:border-teal-500/40 hover:shadow-md transition-all space-y-3"
          >
            <div className="h-10 w-10 rounded-xl bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <DatabaseIcon className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Supabase PostgreSQL Sync
            </h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              Persists athlete records, practice session duration, accuracy rate, best streak, and
              individual stroke biomechanics directly into PostgreSQL tables.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
