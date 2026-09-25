"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Activity,
  Cpu,
  Wifi,
  WifiOff,
  ChevronDown,
  Layers,
  Crosshair,
  ShieldCheck,
  Zap,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Info
} from "lucide-react";

interface HealthData {
  status: string;
  device?: string;
  fp16?: boolean;
  db_connected?: boolean;
  pingMs?: number;
}

export function TelemetryFloatingWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"system" | "biomechanics" | "ai">("system");
  const [fps, setFps] = useState<number>(60);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [isBackendOnline, setIsBackendOnline] = useState<boolean | null>(null);
  const [isPinging, setIsPinging] = useState(false);
  const [memoryUsage, setMemoryUsage] = useState<string | null>(null);

  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const reqAnimRef = useRef<number | null>(null);

  // 1. Live Client FPS calculation
  useEffect(() => {
    const calcFps = () => {
      frameCountRef.current++;
      const now = performance.now();
      const delta = now - lastTimeRef.current;
      if (delta >= 1000) {
        setFps(Math.round((frameCountRef.current * 1000) / delta));
        frameCountRef.current = 0;
        lastTimeRef.current = now;

        // Check performance memory if available (Chrome/Edge)
        if ("memory" in performance) {
          const mem = (performance as any).memory;
          if (mem && mem.usedJSHeapSize) {
            setMemoryUsage(`${Math.round(mem.usedJSHeapSize / 1048576)} MB`);
          }
        }
      }
      reqAnimRef.current = requestAnimationFrame(calcFps);
    };

    reqAnimRef.current = requestAnimationFrame(calcFps);
    return () => {
      if (reqAnimRef.current) cancelAnimationFrame(reqAnimRef.current);
    };
  }, []);

  // 2. Poll Backend /health for live latency and AI engine status
  const checkHealth = async () => {
    setIsPinging(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8888";
    const t0 = performance.now();
    try {
      const res = await fetch(`${apiUrl}/health`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(3500),
      });
      const pingMs = Math.round(performance.now() - t0);
      if (res.ok) {
        const data = await res.json();
        setHealth({ ...data, pingMs });
        setIsBackendOnline(true);
      } else {
        setIsBackendOnline(false);
        setHealth({ status: "error", pingMs });
      }
    } catch {
      setIsBackendOnline(false);
      setHealth(null);
    } finally {
      setIsPinging(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside aria-label="System Telemetry Monitor" className="fixed bottom-5 left-5 z-40 font-sans select-none">
      {/* ── EXPANDED MONITOR PANEL ── */}
      {isOpen && (
        <div
          id="telemetry-expanded-panel"
          className="mb-3 w-80 sm:w-96 rounded-2xl bg-zinc-950/90 border border-zinc-800/90 backdrop-blur-2xl shadow-2xl shadow-black/60 overflow-hidden transition-all duration-200 animate-in fade-in slide-in-from-bottom-4"
        >
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-zinc-900/80 via-zinc-900/40 to-zinc-950 border-b border-zinc-800/70 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isBackendOnline ? "bg-emerald-400" : "bg-amber-400"
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    isBackendOnline ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                />
              </span>
              <div>
                <h3 className="text-xs font-semibold text-zinc-100 flex items-center gap-1.5 tracking-wide uppercase">
                  <span>BatCoach Telemetry</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Datadog Pro
                  </span>
                </h3>
                <p className="text-[10px] text-zinc-400 font-mono">
                  Site: us5.datadoghq.com • APM Active
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 transition-colors"
              title="Minimize Telemetry"
              aria-label="Minimize Telemetry Panel"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="grid grid-cols-3 p-1.5 gap-1 bg-zinc-900/40 border-b border-zinc-800/50 text-xs">
            <button
              onClick={() => setActiveTab("system")}
              className={`py-1.5 px-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 text-[11px] ${
                activeTab === "system"
                  ? "bg-zinc-800/90 text-emerald-400 shadow-sm border border-zinc-700/60"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              <Activity className="w-3 h-3" />
              <span>System</span>
            </button>
            <button
              onClick={() => setActiveTab("biomechanics")}
              className={`py-1.5 px-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 text-[11px] ${
                activeTab === "biomechanics"
                  ? "bg-zinc-800/90 text-cyan-400 shadow-sm border border-zinc-700/60"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              <Crosshair className="w-3 h-3" />
              <span>Biometrics</span>
            </button>
            <button
              onClick={() => setActiveTab("ai")}
              className={`py-1.5 px-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 text-[11px] ${
                activeTab === "ai"
                  ? "bg-zinc-800/90 text-purple-400 shadow-sm border border-zinc-700/60"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              <Cpu className="w-3 h-3" />
              <span>AI Stack</span>
            </button>
          </div>

          {/* Tab Contents */}
          <div className="p-3.5 max-h-72 overflow-y-auto space-y-2.5 text-xs text-zinc-300">
            {/* TAB 1: SYSTEM & OBSERVABILITY */}
            {activeTab === "system" && (
              <div className="space-y-2.5">
                {/* Datadog Card */}
                <div className="p-2.5 rounded-xl bg-purple-950/20 border border-purple-500/20 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-purple-300 flex items-center gap-1.5">
                      <Zap className="w-3 h-3 text-purple-400" />
                      Datadog APM & Tracing
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-purple-500/20 text-purple-300 font-bold">
                      CONNECTED
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[10px] text-zinc-400 font-mono">
                    <div>Service: <span className="text-zinc-200">batcoach-backend</span></div>
                    <div>Region: <span className="text-zinc-200">US5 (Iowa)</span></div>
                    <div>RUM Client: <span className="text-zinc-200">batcoach-ui</span></div>
                    <div>Sampling: <span className="text-zinc-200">100% Traces</span></div>
                  </div>
                </div>

                {/* Backend FastAPI Link */}
                <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-zinc-300 flex items-center gap-1.5">
                      {isBackendOnline ? (
                        <Wifi className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <WifiOff className="w-3 h-3 text-rose-400" />
                      )}
                      FastAPI AI Backend
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                        isBackendOnline
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-rose-500/20 text-rose-300"
                      }`}
                    >
                      {isBackendOnline ? `ONLINE (${health?.pingMs || 0}ms)` : "OFFLINE"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[10px] text-zinc-400 font-mono">
                    <div>Device: <span className="text-zinc-200">{health?.device || "cuda / cpu"}</span></div>
                    <div>FP16 Precision: <span className="text-zinc-200">{health?.fp16 ? "Active" : "Disabled"}</span></div>
                    <div>PostgreSQL: <span className="text-zinc-200">{health?.db_connected ? "Pooled" : "Standby"}</span></div>
                    <div>Port: <span className="text-zinc-200">:8888</span></div>
                  </div>
                </div>

                {/* Client Performance */}
                <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-zinc-300 flex items-center gap-1.5">
                      <Activity className="w-3 h-3 text-emerald-400" />
                      Client Web Vitals
                    </span>
                    <span className="text-[10px] font-mono font-semibold text-emerald-400">
                      {fps} FPS
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[10px] text-zinc-400 font-mono">
                    <div>Heap: <span className="text-zinc-200">{memoryUsage || "Dynamic"}</span></div>
                    <div>Render Engine: <span className="text-zinc-200">Next.js 16</span></div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: BIOMECHANICAL MONITORED POINTS */}
            {activeTab === "biomechanics" && (
              <div className="space-y-2">
                <div className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/70 text-[10px] text-zinc-400 leading-relaxed flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                  <span>
                    Standards codified in <span className="text-cyan-300 font-mono">biomechanics.py</span> from ECB coaching guidelines & MCC masterclasses:
                  </span>
                </div>

                <div className="space-y-1.5 font-mono text-[10px]">
                  <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800/60 flex items-center justify-between">
                    <div>
                      <span className="text-zinc-200 font-semibold">Lead Elbow Elevation</span>
                      <span className="block text-[9px] text-zinc-400">ECB Cover/Straight Drive</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/50 text-cyan-300 font-bold">
                      ≥ 130.0°
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800/60 flex items-center justify-between">
                    <div>
                      <span className="text-zinc-200 font-semibold">Lead Knee Lunge</span>
                      <span className="block text-[9px] text-zinc-400">MCC Drive Flexion</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/50 text-cyan-300 font-bold">
                      ≤ 155.0°
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800/60 flex items-center justify-between">
                    <div>
                      <span className="text-zinc-200 font-semibold">Head-over-Knee Balance</span>
                      <span className="block text-[9px] text-zinc-400">Torso-Normalized Euclidean</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/50 text-cyan-300 font-bold">
                      ≤ 0.35
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800/60 flex items-center justify-between">
                    <div>
                      <span className="text-zinc-200 font-semibold">Spine Forward Lean</span>
                      <span className="block text-[9px] text-zinc-400">Delivery Line Trunk Angle</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/50 text-cyan-300 font-bold">
                      ≤ 170.0°
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800/60 flex items-center justify-between">
                    <div>
                      <span className="text-zinc-200 font-semibold">Blade Face Presentation</span>
                      <span className="block text-[9px] text-zinc-400">YOLOv8-OBB vs Spine</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 font-bold">
                      40° – 140°
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800/60 flex items-center justify-between">
                    <div>
                      <span className="text-zinc-200 font-semibold">Bat-to-Pad Gap</span>
                      <span className="block text-[9px] text-zinc-400">Defense & Drive Tolerance</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/50 text-cyan-300 font-bold">
                      ≤ 0.12
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: AI STACK */}
            {activeTab === "ai" && (
              <div className="space-y-2">
                <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-200 text-[11px]">VideoMAE Shot Classifier</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-purple-500/20 text-purple-300">
                      10 Classes
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-normal">
                    16-frame rolling temporal window @ 24 FPS sampling. Real-time classification for Cover, Defense, Pull, Hook, Sweep, Flick, etc.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-200 text-[11px]">Ultralytics YOLOv8-OBB</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-cyan-500/20 text-cyan-300">
                      Oriented Bat
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-normal">
                    Real-time bounding polygon tracking for cricket bat blade. Calculates rotational vector relative to body stance.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-200 text-[11px]">Google MediaPipe</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-300">
                      3D World Pose
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-normal">
                    33 skeletal landmarks in 3D Euclidean space. Automatically determines lead-side handedness via geometric fallbacks.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Status Bar */}
          <div className="px-3.5 py-2 bg-zinc-900/90 border-t border-zinc-800/70 flex items-center justify-between text-[10px] font-mono text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>WebSocket :8888/ws</span>
            </span>
            <button
              onClick={checkHealth}
              disabled={isPinging}
              className="text-[10px] text-emerald-400 hover:text-emerald-300 underline font-medium"
            >
              {isPinging ? "Pinging..." : "Refresh"}
            </button>
          </div>
        </div>
      )}

      {/* ── FLOATING TRIGGER PILL / BUTTON ── */}
      <button
        id="telemetry-pill-toggle"
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center gap-2.5 px-3 py-2 rounded-full bg-zinc-950/85 hover:bg-zinc-900 border border-zinc-800/90 hover:border-emerald-500/50 backdrop-blur-xl shadow-xl shadow-black/40 text-xs font-mono text-zinc-200 transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
        title="Click to view live AI & Biomechanical Telemetry"
      >
        {/* Glowing Radar Dot */}
        <span className="relative flex h-2 w-2">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isBackendOnline ? "bg-emerald-400" : "bg-amber-400"
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isBackendOnline ? "bg-emerald-500" : "bg-amber-500"
            }`}
          />
        </span>

        {/* Text and FPS */}
        <span className="font-semibold text-zinc-100 flex items-center gap-1">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>TELEMETRY</span>
        </span>

        <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800/80 text-emerald-400 border border-zinc-700/60">
          {fps} FPS
        </span>

        {health?.pingMs && (
          <span className="text-[10px] text-zinc-400 hidden sm:inline">
            {health.pingMs}ms
          </span>
        )}

        <ChevronDown
          className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
    </aside>
  );
}
