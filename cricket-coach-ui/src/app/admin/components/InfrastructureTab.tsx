"use client";

import React from "react";
import { motion } from "framer-motion";
import { Activity, Layers, Zap, Shield, Compass, Brain, ShieldCheck } from "lucide-react";
import { HealthTelemetry } from "@/types/admin";

interface InfrastructureTabProps {
  health: HealthTelemetry | null;
  isOnline: boolean;
  dbConnected: boolean;
}

export function InfrastructureTab({
  health,
  isOnline,
  dbConnected,
}: InfrastructureTabProps) {
  return (
    <motion.div
      key="infra"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Status Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Backend Health */}
        <div
          className={`rounded-2xl bg-gradient-to-br from-zinc-900/60 to-zinc-950/80 border p-5 backdrop-blur-xl space-y-3 ${
            isOnline ? "border-emerald-500/30" : "border-red-500/30"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold">
              <Activity className={`w-4 h-4 ${isOnline ? "text-emerald-400" : "text-red-400"}`} />
              <span className={isOnline ? "text-emerald-400" : "text-red-400"}>FastAPI Backend</span>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                isOnline ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"
              }`}
            >
              {isOnline ? "ONLINE" : "OFFLINE"}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/40 space-y-1.5 text-[11px] font-mono text-zinc-300">
            <div className="flex justify-between">
              <span className="text-zinc-500">Latency:</span>
              <span className="text-white font-bold">{health?.pingMs ?? "—"}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Device:</span>
              <span className="text-white">{health?.device || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">CUDA:</span>
              <span className={health?.cuda_available ? "text-emerald-400" : "text-zinc-400"}>
                {health?.cuda_available ? "Active" : "CPU Mode"}
              </span>
            </div>
          </div>
        </div>

        {/* Supabase DB */}
        <div
          className={`rounded-2xl bg-gradient-to-br from-zinc-900/60 to-zinc-950/80 border p-5 backdrop-blur-xl space-y-3 ${
            dbConnected ? "border-teal-500/30" : "border-orange-500/30"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold">
              <Layers className={`w-4 h-4 ${dbConnected ? "text-teal-400" : "text-orange-400"}`} />
              <span className={dbConnected ? "text-teal-400" : "text-orange-400"}>
                Supabase PostgreSQL
              </span>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                dbConnected ? "bg-teal-500/20 text-teal-300" : "bg-orange-500/20 text-orange-300"
              }`}
            >
              {dbConnected ? "CONNECTED" : "DOWN"}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/40 space-y-1.5 text-[11px] font-mono text-zinc-300">
            <div className="flex justify-between">
              <span className="text-zinc-500">Tables:</span>
              <span className="text-white">athletes, sessions, logs, schedules</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Pool:</span>
              <span className="text-white">1-10 connections</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">SSL:</span>
              <span className="text-emerald-400">Enforced</span>
            </div>
          </div>
        </div>

        {/* Datadog */}
        <div className="rounded-2xl bg-gradient-to-br from-zinc-900/60 to-zinc-950/80 border border-purple-500/30 p-5 backdrop-blur-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-purple-400 font-semibold text-xs font-mono">
              <Zap className="w-4 h-4" />
              <span>Datadog APM</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300">
              VIEW IN MONITORING
            </span>
          </div>
          <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/15 space-y-1.5 text-[11px] font-mono text-zinc-300">
            <p className="text-zinc-300">Recent Datadog events and provider status are shown in the Monitoring tab.</p>
          </div>
        </div>

        {/* Sentry */}
        <div className="rounded-2xl bg-gradient-to-br from-zinc-900/60 to-zinc-950/80 border border-orange-500/30 p-5 backdrop-blur-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-orange-400 font-semibold text-xs font-mono">
              <Shield className="w-4 h-4" />
              <span>Sentry Performance</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-orange-500/20 text-orange-300">
              VIEW IN MONITORING
            </span>
          </div>
          <div className="p-3 rounded-xl bg-orange-950/20 border border-orange-500/15 space-y-1.5 text-[11px] font-mono text-zinc-300">
            <p className="text-zinc-300">Recent Sentry issues and provider status are shown in the Monitoring tab.</p>
          </div>
        </div>
      </div>

      {/* PostHog + System Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PostHog */}
        <div className="rounded-2xl bg-gradient-to-br from-zinc-900/60 to-zinc-950/80 border border-cyan-500/30 p-6 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs font-mono">
              <Compass className="w-4 h-4" />
              <span>PostHog Product Analytics</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300">
              VIEW IN MONITORING
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">Recent PostHog events are shown in the Monitoring tab when read API credentials are configured.</p>
          <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/15 space-y-1.5 text-[11px] font-mono text-zinc-300">
            <p className="text-zinc-300">PostHog feed status and recent events are shown in the Monitoring tab.</p>
          </div>
        </div>

        {/* AI Pipeline Info */}
        <div className="rounded-2xl bg-gradient-to-br from-zinc-900/60 to-zinc-950/80 border border-zinc-800/60 p-6 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-semibold text-xs font-mono">
              <Brain className="w-4 h-4 text-emerald-400" />
              <span>AI Model Pipeline</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300">
              {health?.fp16 ? "FP16 CUDA" : "READY"}
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Fine-tuned <strong className="text-white">VideoMAE</strong> for 10-class shot
            classification + <strong className="text-white">YOLOv8-OBB</strong> for bat blade
            orientation + <strong className="text-white">MediaPipe Pose</strong> for biomechanical
            joint angles.
          </p>
          <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/40 space-y-1.5 text-[11px] font-mono text-zinc-300">
            <div className="flex justify-between">
              <span className="text-zinc-500">Shot Classes:</span>
              <span className="text-white font-bold">10 (cover, straight, pull, hook...)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Frame Window:</span>
              <span className="text-white">16 frames @ 24 FPS</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">HF Model:</span>
              <span className="text-emerald-400">Arnav2005/cricket-videomae-classifier</span>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Access Controls & Zero-Trust Security */}
      <div className="rounded-2xl bg-gradient-to-br from-zinc-900/60 to-zinc-950/80 border border-emerald-500/30 p-6 backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs font-mono">
            <ShieldCheck className="w-4 h-4" />
            <span>Zero-Trust API Security</span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300">
            ENFORCED
          </span>
        </div>
        <p className="text-[11px] text-zinc-400 leading-relaxed">
          Protected with <strong className="text-white">Bearer Token Authentication</strong>,{" "}
          <strong className="text-white">constant-time cryptographic comparison</strong> (anti-timing
          attacks), and <strong className="text-white">5-attempt sliding rate limiting</strong> with
          automated IP lockout.
        </p>
        <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/40 space-y-1.5 text-[11px] font-mono text-zinc-300">
          <div className="flex justify-between">
            <span className="text-zinc-500">Auth Method:</span>
            <span className="text-white font-bold">256-bit URL-Safe Bearer Token</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Brute-Force Guard:</span>
            <span className="text-emerald-400">5-attempt rolling window / 5m lockout</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Timing Protection:</span>
            <span className="text-emerald-400">secrets.compare_digest</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Credential Storage:</span>
            <span className="text-zinc-400">Ephemeral sessionStorage (cleared on close)</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
