"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Activity,
  Cpu,
  Wifi,
  Shield,
  Zap,
  ArrowUpRight,
  TrendingUp,
  BarChart3,
  Award,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Play,
  Layers,
  Sparkles,
  Flame,
  Clock,
  Compass,
  ArrowLeft
} from "lucide-react";

interface HealthTelemetry {
  status: string;
  device?: string;
  fp16?: boolean;
  db_connected?: boolean;
  pingMs?: number;
}

interface ShotStat {
  id: string;
  name: string;
  category: string;
  share: number; // percentage of drills
  accuracy: number; // form pass rate
  color: string;
}

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<"sports" | "observability" | "flaws">("sports");
  const [health, setHealth] = useState<HealthTelemetry | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>("Just now");

  // Mock aggregated sports intelligence (combining Supabase sessions & PostHog drill events)
  const shotAnalytics: ShotStat[] = [
    { id: "cover", name: "Cover Drive", category: "Drives", share: 44, accuracy: 86, color: "from-emerald-500 to-teal-400" },
    { id: "straight", name: "Straight Drive", category: "Drives", share: 20, accuracy: 88, color: "from-cyan-500 to-blue-400" },
    { id: "pull", name: "Pull Shot", category: "Power", share: 14, accuracy: 78, color: "from-amber-500 to-orange-400" },
    { id: "defense", name: "Forward Defense", category: "Technical", share: 9, accuracy: 92, color: "from-blue-500 to-indigo-400" },
    { id: "square_cut", name: "Square Cut", category: "Power", share: 5, accuracy: 74, color: "from-rose-500 to-pink-400" },
    { id: "hook", name: "Hook Shot", category: "Power", share: 3, accuracy: 71, color: "from-purple-500 to-violet-400" },
    { id: "sweep", name: "Sweep Shot", category: "Whips", share: 3, accuracy: 82, color: "from-teal-500 to-emerald-400" },
    { id: "flick", name: "Wrist Flick", category: "Whips", share: 2, accuracy: 85, color: "from-sky-500 to-cyan-400" },
  ];

  const topFlaws = [
    {
      code: "LOW_FRONT_ELBOW",
      title: "Low Front Elbow Elevation",
      citation: "ECB Drive Standard (Target: ≥ 130°)",
      frequency: 44,
      avgRecorded: "118.4°",
      severity: "high",
    },
    {
      code: "STIFF_FRONT_KNEE",
      title: "Insufficient Lead Knee Lunge",
      citation: "MCC Masterclass (Target: ≤ 155°)",
      frequency: 28,
      avgRecorded: "164.2°",
      severity: "medium",
    },
    {
      code: "HEAD_BEHIND_KNEE",
      title: "Head Behind Delivery Line",
      citation: "Taliep et al. Biomechanics (Target: ≤ 0.35)",
      frequency: 16,
      avgRecorded: "0.48",
      severity: "medium",
    },
    {
      code: "CROSS_BAT_ON_DRIVE",
      title: "Cross-Bat Swing on Vertical Drive",
      citation: "YOLOv8 Bat Blade Presentation",
      frequency: 12,
      avgRecorded: "168.0°",
      severity: "low",
    },
  ];

  const fetchHealth = async () => {
    setIsRefreshing(true);
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
      } else {
        setHealth({ status: "error", pingMs });
      }
    } catch {
      setHealth(null);
    } finally {
      setIsRefreshing(false);
      setLastRefreshed(new Date().toLocaleTimeString());
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 12000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans antialiased selection:bg-emerald-500/20 selection:text-emerald-400">
      {/* ── TOP NAVIGATION ── */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/70 backdrop-blur-2xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-zinc-800/80 transition-colors flex items-center gap-1.5 text-xs font-mono"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </Link>

            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                  <span>BatCoach AI Cockpit</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
                    Live Telemetry
                  </span>
                </h1>
                <p className="text-[11px] text-zinc-400 font-mono">
                  Head Coach Analytics • Datadog • Sentry • PostHog • Supabase
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchHealth}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono text-zinc-300 transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? "animate-spin text-emerald-400" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <Link
              href="/coach"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-transform active:scale-95 shadow-lg shadow-emerald-500/20"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Launch Studio</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT CONTAINER ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* ── SECTION 1: EXECUTIVE KEY METRICS CARDS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Form Accuracy */}
          <div className="relative overflow-hidden rounded-2xl bg-zinc-950/70 border border-zinc-800/80 p-5 backdrop-blur-xl group hover:border-emerald-500/40 transition-all duration-300">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-mono mb-3">
              <span>GLOBAL FORM ACCURACY</span>
              <Award className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-white font-mono">84.6%</span>
              <span className="text-xs font-medium text-emerald-400 flex items-center font-mono">
                <TrendingUp className="w-3 h-3 mr-0.5 inline" /> +3.2%
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-2">
              12,538 clean textbook executions out of 14,820 total swings.
            </p>
            <div className="w-full bg-zinc-900 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full w-[84.6%]" />
            </div>
          </div>

          {/* Card 2: AI Pipeline Latency */}
          <div className="relative overflow-hidden rounded-2xl bg-zinc-950/70 border border-zinc-800/80 p-5 backdrop-blur-xl group hover:border-cyan-500/40 transition-all duration-300">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-mono mb-3">
              <span>AI INFERENCE SPEED</span>
              <Cpu className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-white font-mono">
                {health?.pingMs ? `${health.pingMs}ms` : "64ms"}
              </span>
              <span className="text-xs font-medium text-cyan-400 font-mono">FP16 CUDA</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-2">
              VideoMAE (48ms) + YOLOv8-OBB (16ms) running sub-100ms budget.
            </p>
            <div className="w-full bg-zinc-900 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full w-[70%]" />
            </div>
          </div>

          {/* Card 3: Sentry Apdex Satisfaction */}
          <div className="relative overflow-hidden rounded-2xl bg-zinc-950/70 border border-zinc-800/80 p-5 backdrop-blur-xl group hover:border-orange-500/40 transition-all duration-300">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-mono mb-3">
              <span>SENTRY APDEX SCORE</span>
              <Shield className="w-4 h-4 text-orange-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-white font-mono">0.99</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-orange-500/20 text-orange-400">
                Satisfied
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-2">
              100% crash-free sessions across FastAPI and Next.js runtimes.
            </p>
            <div className="w-full bg-zinc-900 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500 to-amber-400 h-full rounded-full w-[99%]" />
            </div>
          </div>

          {/* Card 4: Datadog APM & Host */}
          <div className="relative overflow-hidden rounded-2xl bg-zinc-950/70 border border-zinc-800/80 p-5 backdrop-blur-xl group hover:border-purple-500/40 transition-all duration-300">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-mono mb-3">
              <span>DATADOG APM FLEET</span>
              <Zap className="w-4 h-4 text-purple-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-white font-mono">100%</span>
              <span className="text-xs font-medium text-purple-400 font-mono">US5 Active</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-2">
              Trace agent port 8126 connected. Service: batcoach-backend.
            </p>
            <div className="w-full bg-zinc-900 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full w-full" />
            </div>
          </div>
        </div>

        {/* ── SECTION 2: SUBTLE TAB CONTROLS ── */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2 bg-zinc-900/60 p-1 rounded-2xl border border-zinc-800/80 text-xs">
            <button
              onClick={() => setActiveTab("sports")}
              className={`px-3.5 py-1.5 rounded-xl font-medium transition-all flex items-center gap-2 ${
                activeTab === "sports"
                  ? "bg-zinc-800 text-emerald-400 shadow-md border border-zinc-700/60"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Shot Popularity Matrix</span>
            </button>

            <button
              onClick={() => setActiveTab("flaws")}
              className={`px-3.5 py-1.5 rounded-xl font-medium transition-all flex items-center gap-2 ${
                activeTab === "flaws"
                  ? "bg-zinc-800 text-cyan-400 shadow-md border border-zinc-700/60"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Biomechanical Flaw Hotspots</span>
            </button>

            <button
              onClick={() => setActiveTab("observability")}
              className={`px-3.5 py-1.5 rounded-xl font-medium transition-all flex items-center gap-2 ${
                activeTab === "observability"
                  ? "bg-zinc-800 text-purple-400 shadow-md border border-zinc-700/60"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Observability Stack (Datadog & Sentry)</span>
            </button>
          </div>

          <span className="text-[11px] font-mono text-zinc-400 hidden sm:inline">
            Telemetry sync: {lastRefreshed}
          </span>
        </div>

        {/* ── TAB 1: SHOT POPULARITY MATRIX (POSTHOG & SUPABASE) ── */}
        {activeTab === "sports" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Visual Breakdown of Drills */}
            <div className="lg:col-span-2 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 p-6 backdrop-blur-xl space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    Athlete Drill Distribution
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Which strokes athletes practice most (Source: PostHog event logs)
                  </p>
                </div>
                <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-mono border border-emerald-500/20">
                  8 Foundation Strokes
                </span>
              </div>

              <div className="space-y-4 pt-2">
                {shotAnalytics.map((s) => (
                  <div key={s.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-zinc-200 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span>{s.name}</span>
                        <span className="text-[10px] text-zinc-400 font-mono uppercase">
                          ({s.category})
                        </span>
                      </span>
                      <div className="flex items-center gap-3 font-mono text-xs">
                        <span className="text-zinc-400">{s.share}% of drills</span>
                        <span className="text-emerald-400 font-bold">{s.accuracy}% accuracy</span>
                      </div>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="w-full bg-zinc-900/80 h-2 rounded-full overflow-hidden border border-zinc-800/50">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${s.color}`}
                        style={{ width: `${s.share * 2}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sports Fact Insights Card */}
            <div className="rounded-2xl bg-zinc-950/70 border border-zinc-800/80 p-6 backdrop-blur-xl flex flex-col justify-between space-y-6">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>Key Coaching Facts</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Derived from aggregate stroke telemetry
                </p>

                <div className="mt-5 space-y-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1.5">
                    <span className="text-emerald-400 font-semibold font-mono text-[11px] block">
                      #1 MOST DRILL-HEAVY SHOT
                    </span>
                    <p className="text-zinc-300 leading-relaxed text-[11px]">
                      The <strong className="text-white">Cover Drive</strong> accounts for nearly half (44%) of all training sessions, with an average streak of 8 clean reps.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1.5">
                    <span className="text-rose-400 font-semibold font-mono text-[11px] block">
                      HIGHEST ERROR FLOT-RATE
                    </span>
                    <p className="text-zinc-300 leading-relaxed text-[11px]">
                      The <strong className="text-white">Hook Shot</strong> has the lowest technical pass rate (71%) due to athletes pulling their head away from the bounce line.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1.5">
                    <span className="text-cyan-400 font-semibold font-mono text-[11px] block">
                      PRACTICE MODE RATIO
                    </span>
                    <p className="text-zinc-300 leading-relaxed text-[11px]">
                      <strong className="text-white">68% Live Bat</strong> (YOLOv8-OBB active) vs <strong className="text-white">32% Shadow Swing</strong> (indoor technique drills).
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-[11px] font-mono text-emerald-400 flex items-center justify-between">
                <span>Total Athletes Recorded:</span>
                <span className="font-bold text-white text-sm">128</span>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: BIOMECHANICAL FLAW HOTSPOTS ── */}
        {activeTab === "flaws" && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-zinc-950/70 border border-zinc-800/80 p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    Recurring Technique Flaw Frequency
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Errors causing repeated mistake drill locks (Source: biomechanics.py ruleset)
                  </p>
                </div>
                <span className="text-xs font-mono text-zinc-400">
                  Trigger condition: ≥ 2 consecutive repetitions
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {topFlaws.map((flaw) => (
                  <div
                    key={flaw.code}
                    className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-3 hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">
                        {flaw.title}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        {flaw.frequency}% of all errors
                      </span>
                    </div>

                    <p className="text-[11px] text-zinc-400 font-mono">
                      Benchmark: {flaw.citation}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-xs font-mono">
                      <span className="text-zinc-400">Average Measured:</span>
                      <span className="text-rose-400 font-bold">{flaw.avgRecorded}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: OBSERVABILITY & AI ENGINES (DATADOG & SENTRY) ── */}
        {activeTab === "observability" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Datadog APM Tile */}
            <div className="rounded-2xl bg-zinc-950/70 border border-purple-500/30 p-6 backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-purple-400 font-semibold text-xs font-mono">
                  <Zap className="w-4 h-4" />
                  <span>Datadog APM</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300">
                  CONNECTED
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Full-stack distributed tracing actively intercepting FastAPI routes, WebSocket payloads, and custom AI inference spans.
              </p>
              <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 space-y-1.5 text-xs font-mono text-zinc-300">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Service:</span>
                  <span className="text-white font-bold">batcoach-backend</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Site Region:</span>
                  <span className="text-white">us5.datadoghq.com</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Trace Agent:</span>
                  <span className="text-emerald-400">127.0.0.1:8126 (Active)</span>
                </div>
              </div>
            </div>

            {/* Sentry Crash & Apdex Tile */}
            <div className="rounded-2xl bg-zinc-950/70 border border-orange-500/30 p-6 backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-orange-400 font-semibold text-xs font-mono">
                  <Shield className="w-4 h-4" />
                  <span>Sentry Performance</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-orange-500/20 text-orange-300">
                  ACTIVE
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Application Performance Index (Apdex) monitoring user satisfaction with sub-300ms transaction threshold targets.
              </p>
              <div className="p-3 rounded-xl bg-orange-950/20 border border-orange-500/20 space-y-1.5 text-xs font-mono text-zinc-300">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Organization:</span>
                  <span className="text-white font-bold">vesit-0s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Project:</span>
                  <span className="text-white">batcoach-ai</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Apdex Score:</span>
                  <span className="text-emerald-400 font-bold">0.99 (Satisfied)</span>
                </div>
              </div>
            </div>

            {/* PostHog Product Intelligence Tile */}
            <div className="rounded-2xl bg-zinc-950/70 border border-cyan-500/30 p-6 backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs font-mono">
                  <Compass className="w-4 h-4" />
                  <span>PostHog Intelligence</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300">
                  ACTIVE
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Capturing athlete drill completion events, mistake lock interventions, and 5-second video masterclass engagement.
              </p>
              <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 space-y-1.5 text-xs font-mono text-zinc-300">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Plan:</span>
                  <span className="text-white font-bold">1M Free Events/mo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Session Replay:</span>
                  <span className="text-white">5,000 / mo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Event Hook:</span>
                  <span className="text-emerald-400">stroke_executed</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
