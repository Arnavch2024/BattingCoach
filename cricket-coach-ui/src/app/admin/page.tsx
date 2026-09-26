"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, Cpu, Wifi, Shield, Zap, ArrowUpRight, TrendingUp, TrendingDown,
  BarChart3, Award, RefreshCw, CheckCircle2, AlertTriangle, Play, Layers,
  Sparkles, Flame, Clock, Compass, ArrowLeft, Users, Calendar, Target,
  ChevronRight, Eye, Hash, Timer, Crosshair, Radio, PieChart, LineChart,
  UserCheck, Brain, Gauge, CircleDot, Dumbbell, Search
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, Cell, PieChart as RechartsPie, Pie
} from "recharts";

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

interface OverviewData {
  athlete_count: number;
  total_sessions: number;
  total_reps: number;
  successful_reps: number;
  accuracy: number;
  best_streak: number;
  avg_confidence: number;
  total_practice_hours: number;
}

interface ShotDistribution {
  shot: string;
  sessions: number;
  total_reps: number;
  successful_reps: number;
  accuracy: number;
  avg_confidence: number;
  max_streak: number;
}

interface FlawHotspot {
  feedback: string;
  status: string;
  shot: string;
  count: number;
  avg_elbow: number;
  avg_knee: number;
}

interface Athlete {
  id: number;
  email: string;
  name: string;
  stance: string;
  experience: string;
  joined: string;
  sessions: number;
  total_reps: number;
  successful_reps: number;
  accuracy: number;
  best_streak: number;
  avg_confidence: number;
  practice_hours: number;
}

interface RecentSession {
  id: number;
  email: string;
  shot: string;
  total_reps: number;
  successful_reps: number;
  accuracy: number;
  best_streak: number;
  avg_confidence: number;
  duration_seconds: number;
  created_at: string;
  athlete_name: string;
}

interface TimelineDay {
  date: string;
  sessions: number;
  reps: number;
  clean_reps: number;
  accuracy: number;
  avg_confidence: number;
}

interface HealthTelemetry {
  status: string;
  device?: string;
  fp16?: boolean;
  database?: string;
  cuda_available?: boolean;
  pingMs?: number;
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

const SHOT_DISPLAY_NAMES: Record<string, string> = {
  cover: "Cover Drive",
  straight: "Straight Drive",
  pull: "Pull Shot",
  hook: "Hook Shot",
  defense: "Forward Defense",
  square_cut: "Square Cut",
  sweep: "Sweep Shot",
  flick: "Wrist Flick",
  lofted: "Lofted Drive",
  late_cut: "Late Cut",
};

const SHOT_COLORS: Record<string, string> = {
  cover: "#10b981",
  straight: "#06b6d4",
  pull: "#f59e0b",
  hook: "#a855f7",
  defense: "#3b82f6",
  square_cut: "#f43f5e",
  sweep: "#14b8a6",
  flick: "#0ea5e9",
  lofted: "#8b5cf6",
  late_cut: "#ec4899",
};

const SHOT_GRADIENT = [
  "from-emerald-500 to-teal-400",
  "from-cyan-500 to-blue-400",
  "from-amber-500 to-orange-400",
  "from-purple-500 to-violet-400",
  "from-blue-500 to-indigo-400",
  "from-rose-500 to-pink-400",
  "from-teal-500 to-emerald-400",
  "from-sky-500 to-cyan-400",
  "from-violet-500 to-purple-400",
  "from-pink-500 to-rose-400",
];

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now.getTime() - then.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

// ──────────────────────────────────────────────────────────────────────────────
// Custom Recharts Tooltip
// ──────────────────────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-zinc-900/95 border border-zinc-700/60 px-4 py-3 backdrop-blur-xl shadow-2xl">
      <p className="text-[11px] font-mono text-zinc-400 mb-1.5">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-zinc-300 capitalize">{entry.name}:</span>
          <span className="font-bold text-white font-mono">{typeof entry.value === 'number' && entry.name.includes('ccuracy') ? `${entry.value}%` : entry.value}</span>
        </div>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Animated Counter
// ──────────────────────────────────────────────────────────────────────────────

function AnimatedNumber({ value, suffix = "", decimals = 0 }: { value: number; suffix?: string; decimals?: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const duration = 800;
    const start = performance.now();
    const startVal = display;

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(startVal + (value - startVal) * eased);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <>{decimals > 0 ? display.toFixed(decimals) : Math.round(display)}{suffix}</>;
}

// ──────────────────────────────────────────────────────────────────────────────
// Page Component
// ──────────────────────────────────────────────────────────────────────────────

type TabId = "overview" | "shots" | "athletes" | "sessions" | "infra";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <Gauge className="w-3.5 h-3.5" /> },
  { id: "shots", label: "Shot Analytics", icon: <Target className="w-3.5 h-3.5" /> },
  { id: "athletes", label: "Athletes", icon: <Users className="w-3.5 h-3.5" /> },
  { id: "sessions", label: "Sessions", icon: <Calendar className="w-3.5 h-3.5" /> },
  { id: "infra", label: "Infrastructure", icon: <Layers className="w-3.5 h-3.5" /> },
];

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [health, setHealth] = useState<HealthTelemetry | null>(null);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [shotDist, setShotDist] = useState<ShotDistribution[]>([]);
  const [flaws, setFlaws] = useState<FlawHotspot[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [sessions, setSessions] = useState<RecentSession[]>([]);
  const [timeline, setTimeline] = useState<TimelineDay[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>("Loading...");
  const [athleteSearch, setAthleteSearch] = useState("");

  const apiUrl = typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8888")
    : "http://127.0.0.1:8888";

  const fetchAll = useCallback(async () => {
    setIsRefreshing(true);
    const t0 = performance.now();
    const headers = { "Content-Type": "application/json" };
    const opts: RequestInit = { method: "GET", headers, signal: AbortSignal.timeout(8000) };

    try {
      const [healthRes, overviewRes, shotsRes, flawsRes, athletesRes, sessionsRes, timelineRes] = await Promise.allSettled([
        fetch(`${apiUrl}/health`, opts),
        fetch(`${apiUrl}/api/admin/overview`, opts),
        fetch(`${apiUrl}/api/admin/shot-distribution`, opts),
        fetch(`${apiUrl}/api/admin/flaw-hotspots`, opts),
        fetch(`${apiUrl}/api/admin/athletes`, opts),
        fetch(`${apiUrl}/api/admin/sessions/recent`, opts),
        fetch(`${apiUrl}/api/admin/timeline`, opts),
      ]);

      const pingMs = Math.round(performance.now() - t0);

      if (healthRes.status === "fulfilled" && healthRes.value.ok) {
        const d = await healthRes.value.json();
        setHealth({ ...d, pingMs });
      } else {
        setHealth({ status: "offline", pingMs });
      }

      if (overviewRes.status === "fulfilled" && overviewRes.value.ok) {
        const d = await overviewRes.value.json();
        if (d.overview) setOverview(d.overview);
      }
      if (shotsRes.status === "fulfilled" && shotsRes.value.ok) {
        const d = await shotsRes.value.json();
        if (d.distribution) setShotDist(d.distribution);
      }
      if (flawsRes.status === "fulfilled" && flawsRes.value.ok) {
        const d = await flawsRes.value.json();
        if (d.hotspots) setFlaws(d.hotspots);
      }
      if (athletesRes.status === "fulfilled" && athletesRes.value.ok) {
        const d = await athletesRes.value.json();
        if (d.athletes) setAthletes(d.athletes);
      }
      if (sessionsRes.status === "fulfilled" && sessionsRes.value.ok) {
        const d = await sessionsRes.value.json();
        if (d.sessions) setSessions(d.sessions);
      }
      if (timelineRes.status === "fulfilled" && timelineRes.value.ok) {
        const d = await timelineRes.value.json();
        if (d.timeline) setTimeline(d.timeline);
      }
    } catch {
      setHealth(null);
    } finally {
      setIsRefreshing(false);
      setLastRefreshed(new Date().toLocaleTimeString());
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 15000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const isOnline = health?.status === "online";
  const dbConnected = health?.database === "connected";
  const ov = overview || {
    athlete_count: 0, total_sessions: 0, total_reps: 0, successful_reps: 0,
    accuracy: 0, best_streak: 0, avg_confidence: 0, total_practice_hours: 0,
  };

  // Filtered athletes
  const filteredAthletes = athletes.filter(a =>
    a.name.toLowerCase().includes(athleteSearch.toLowerCase()) ||
    a.email.toLowerCase().includes(athleteSearch.toLowerCase())
  );

  // Radar data for shot distribution
  const radarData = shotDist.map(s => ({
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
    <div className="min-h-screen bg-[#08080a] text-zinc-100 font-sans antialiased selection:bg-emerald-500/20 selection:text-emerald-400">
      {/* ── HEADER ── */}
      <header className="border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-2xl sticky top-0 z-50">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 border border-zinc-800/60 transition-all flex items-center gap-1.5 text-xs font-mono"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Back</span>
            </Link>

            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/20 text-emerald-400">
                <Brain className="w-4 h-4" />
              </span>
              <div>
                <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                  <span>Head Coach Command Center</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border ${
                    isOnline
                      ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/50"
                      : "bg-red-950/60 text-red-400 border-red-800/50"
                  }`}>
                    {isOnline ? "● Live" : "○ Offline"}
                  </span>
                </h1>
                <p className="text-[11px] text-zinc-500 font-mono">
                  Supabase • Datadog APM • Sentry Apdex • PostHog Analytics
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-zinc-500 hidden lg:inline">
              Last sync: {lastRefreshed}
            </span>
            <button
              onClick={fetchAll}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800/60 text-xs font-mono text-zinc-300 transition-all active:scale-95"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? "animate-spin text-emerald-400" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <Link
              href="/coach"
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-bold text-xs transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Launch Studio</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── TAB NAVIGATION ── */}
      <div className="border-b border-zinc-800/40 bg-zinc-950/50 backdrop-blur-xl sticky top-16 z-40">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 py-2 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-zinc-800/80 text-white shadow-lg border border-zinc-700/50"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.id === "athletes" && athletes.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-mono">
                  {athletes.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── MAIN ── */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <AnimatePresence mode="wait">
          {/* ═══════════════════════════════════════════════════════════════
               TAB 1: OVERVIEW - Executive KPIs + Timeline Chart
             ═══════════════════════════════════════════════════════════════ */}
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* KPI Cards Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Global Accuracy */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900/80 to-zinc-950/90 border border-zinc-800/60 p-5 group hover:border-emerald-500/40 transition-all duration-300">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl" />
                  <div className="flex items-center justify-between text-zinc-400 text-[10px] font-mono mb-3 uppercase tracking-wider">
                    <span>Global Accuracy</span>
                    <Award className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold tracking-tight text-white font-mono">
                      <AnimatedNumber value={ov.accuracy} decimals={1} suffix="%" />
                    </span>
                    {ov.accuracy > 0 && (
                      <span className="text-xs font-medium text-emerald-400 flex items-center font-mono">
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
                      animate={{ width: health?.pingMs ? `${Math.max(10, 100 - health.pingMs / 2)}%` : "0%" }}
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
                          tick={{ fontSize: 10, fill: '#71717a' }}
                          tickFormatter={(v: string) => new Date(v).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                          stroke="#27272a"
                        />
                        <YAxis
                          yAxisId="acc"
                          tick={{ fontSize: 10, fill: '#71717a' }}
                          domain={[0, 100]}
                          stroke="#27272a"
                          tickFormatter={(v: number) => `${v}%`}
                        />
                        <YAxis
                          yAxisId="sessions"
                          orientation="right"
                          tick={{ fontSize: 10, fill: '#71717a' }}
                          stroke="#27272a"
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                          wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }}
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
                        <p className="text-[10px] text-zinc-600">Sessions will appear here as athletes practice</p>
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
                          <strong className="text-white">{SHOT_DISPLAY_NAMES[shotDist[0].shot] || shotDist[0].shot}</strong> with{" "}
                          <strong className="text-white">{shotDist[0].sessions}</strong> sessions and{" "}
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
                          <strong className="text-white">{flaws[0].feedback.substring(0, 60)}</strong> on{" "}
                          <strong className="text-white">{SHOT_DISPLAY_NAMES[flaws[0].shot] || flaws[0].shot}</strong> — {flaws[0].count} occurrences.
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
          )}

          {/* ═══════════════════════════════════════════════════════════════
               TAB 2: SHOT ANALYTICS - Distribution + Radar + Bar Chart
             ═══════════════════════════════════════════════════════════════ */}
          {activeTab === "shots" && (
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
                <div className="lg:col-span-2 rounded-2xl bg-gradient-to-br from-zinc-900/60 to-zinc-950/80 border border-zinc-800/60 p-6 backdrop-blur-xl">
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
                                  style={{ background: SHOT_COLORS[s.shot] || '#10b981' }}
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
                                className={`h-full rounded-full bg-gradient-to-r ${SHOT_GRADIENT[i % SHOT_GRADIENT.length]}`}
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
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
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
                        <PolarAngleAxis
                          dataKey="shot"
                          tick={{ fontSize: 9, fill: '#a1a1aa' }}
                        />
                        <PolarRadiusAxis
                          angle={30}
                          domain={[0, 100]}
                          tick={{ fontSize: 8, fill: '#52525b' }}
                        />
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
                          wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }}
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
                              {flaw.feedback.length > 80 ? flaw.feedback.substring(0, 80) + "..." : flaw.feedback}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex-shrink-0">
                              {flaw.count}×
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-400">
                            <span>Shot: <strong className="text-zinc-300">{SHOT_DISPLAY_NAMES[flaw.shot] || flaw.shot}</strong></span>
                            {flaw.avg_elbow > 0 && <span>Elbow: <strong className="text-zinc-300">{flaw.avg_elbow}°</strong></span>}
                            {flaw.avg_knee > 0 && <span>Knee: <strong className="text-zinc-300">{flaw.avg_knee}°</strong></span>}
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
          )}

          {/* ═══════════════════════════════════════════════════════════════
               TAB 3: ATHLETES - Roster Table
             ═══════════════════════════════════════════════════════════════ */}
          {activeTab === "athletes" && (
            <motion.div
              key="athletes"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="rounded-2xl bg-gradient-to-br from-zinc-900/60 to-zinc-950/80 border border-zinc-800/60 p-6 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                      <Users className="w-4 h-4 text-cyan-400" />
                      Athlete Roster
                    </h3>
                    <p className="text-[11px] text-zinc-500 mt-0.5">All registered athletes with aggregated practice stats</p>
                  </div>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      value={athleteSearch}
                      onChange={(e) => setAthleteSearch(e.target.value)}
                      placeholder="Search athletes..."
                      className="pl-9 pr-3 py-2 rounded-xl bg-zinc-900/80 border border-zinc-800/60 text-xs text-zinc-200 placeholder:text-zinc-500 font-mono focus:outline-none focus:border-cyan-500/50 w-48 transition-colors"
                    />
                  </div>
                </div>

                {filteredAthletes.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-zinc-800/60">
                          <th className="text-left py-3 px-3 font-mono text-zinc-400 uppercase tracking-wider text-[10px]">Athlete</th>
                          <th className="text-left py-3 px-3 font-mono text-zinc-400 uppercase tracking-wider text-[10px]">Stance</th>
                          <th className="text-center py-3 px-3 font-mono text-zinc-400 uppercase tracking-wider text-[10px]">Sessions</th>
                          <th className="text-center py-3 px-3 font-mono text-zinc-400 uppercase tracking-wider text-[10px]">Total Reps</th>
                          <th className="text-center py-3 px-3 font-mono text-zinc-400 uppercase tracking-wider text-[10px]">Accuracy</th>
                          <th className="text-center py-3 px-3 font-mono text-zinc-400 uppercase tracking-wider text-[10px]">Best Streak</th>
                          <th className="text-center py-3 px-3 font-mono text-zinc-400 uppercase tracking-wider text-[10px]">Confidence</th>
                          <th className="text-center py-3 px-3 font-mono text-zinc-400 uppercase tracking-wider text-[10px]">Hours</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAthletes.map((a, i) => (
                          <motion.tr
                            key={a.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="border-b border-zinc-800/30 hover:bg-zinc-800/20 transition-colors"
                          >
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-zinc-700/50 flex items-center justify-center text-[10px] font-bold text-emerald-400 font-mono">
                                  {a.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <span className="font-medium text-white text-xs">{a.name}</span>
                                  <p className="text-[10px] text-zinc-500 font-mono">{a.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-zinc-300 font-mono text-[11px]">{a.stance}</td>
                            <td className="py-3 px-3 text-center">
                              <span className="px-2 py-0.5 rounded-lg bg-cyan-500/10 text-cyan-400 font-mono text-[11px] font-bold">
                                {a.sessions}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center text-zinc-300 font-mono">{a.total_reps}</td>
                            <td className="py-3 px-3 text-center">
                              <span className={`font-mono font-bold ${
                                a.accuracy >= 80 ? "text-emerald-400" :
                                a.accuracy >= 60 ? "text-amber-400" : "text-rose-400"
                              }`}>
                                {a.accuracy}%
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center text-zinc-300 font-mono">{a.best_streak}</td>
                            <td className="py-3 px-3 text-center text-zinc-300 font-mono">{(a.avg_confidence * 100).toFixed(0)}%</td>
                            <td className="py-3 px-3 text-center text-zinc-300 font-mono">{a.practice_hours}</td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-48 text-zinc-500 text-sm font-mono">
                    <div className="text-center space-y-2">
                      <Users className="w-8 h-8 mx-auto text-zinc-600" />
                      <p>{athleteSearch ? "No athletes match your search" : "No athletes registered yet"}</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
               TAB 4: SESSIONS - Recent Session Feed + Bar Chart
             ═══════════════════════════════════════════════════════════════ */}
          {activeTab === "sessions" && (
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
                <div className="rounded-2xl bg-gradient-to-br from-zinc-900/60 to-zinc-950/80 border border-zinc-800/60 p-6 backdrop-blur-xl">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2 mb-4">
                    <BarChart3 className="w-4 h-4 text-amber-400" />
                    Session Accuracy Comparison (Last 20)
                  </h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={sessions.slice(0, 20).reverse()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis
                        dataKey="athlete_name"
                        tick={{ fontSize: 9, fill: '#71717a' }}
                        angle={-25}
                        textAnchor="end"
                        height={50}
                      />
                      <YAxis
                        tick={{ fontSize: 9, fill: '#71717a' }}
                        domain={[0, 100]}
                        tickFormatter={(v: number) => `${v}%`}
                        stroke="#27272a"
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="accuracy" name="Accuracy" radius={[4, 4, 0, 0]} animationDuration={600}>
                        {sessions.slice(0, 20).reverse().map((s, i) => (
                          <Cell
                            key={i}
                            fill={s.accuracy >= 80 ? '#10b981' : s.accuracy >= 60 ? '#f59e0b' : '#f43f5e'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Session Feed */}
              <div className="rounded-2xl bg-gradient-to-br from-zinc-900/60 to-zinc-950/80 border border-zinc-800/60 p-6 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
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
                        className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50 hover:border-zinc-700/60 transition-all group"
                      >
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-zinc-700/50 flex items-center justify-center text-xs font-bold text-purple-400 font-mono flex-shrink-0">
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
                              <CircleDot className="w-3 h-3" style={{ color: SHOT_COLORS[s.shot] || '#10b981' }} />
                              {SHOT_DISPLAY_NAMES[s.shot] || s.shot}
                            </span>
                            <span>{s.total_reps} reps</span>
                            <span>{formatDuration(s.duration_seconds)}</span>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-4 text-[11px] font-mono flex-shrink-0">
                          <div className="text-center">
                            <span className={`font-bold block ${
                              s.accuracy >= 80 ? "text-emerald-400" :
                              s.accuracy >= 60 ? "text-amber-400" : "text-rose-400"
                            }`}>
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
          )}

          {/* ═══════════════════════════════════════════════════════════════
               TAB 5: INFRASTRUCTURE - Observability Stack Status
             ═══════════════════════════════════════════════════════════════ */}
          {activeTab === "infra" && (
            <motion.div
              key="infra"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Status Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Backend Health */}
                <div className={`rounded-2xl bg-gradient-to-br from-zinc-900/60 to-zinc-950/80 border p-5 backdrop-blur-xl space-y-3 ${
                  isOnline ? "border-emerald-500/30" : "border-red-500/30"
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-mono font-semibold">
                      <Activity className={`w-4 h-4 ${isOnline ? "text-emerald-400" : "text-red-400"}`} />
                      <span className={isOnline ? "text-emerald-400" : "text-red-400"}>FastAPI Backend</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      isOnline ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"
                    }`}>
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
                <div className={`rounded-2xl bg-gradient-to-br from-zinc-900/60 to-zinc-950/80 border p-5 backdrop-blur-xl space-y-3 ${
                  dbConnected ? "border-teal-500/30" : "border-orange-500/30"
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-mono font-semibold">
                      <Layers className={`w-4 h-4 ${dbConnected ? "text-teal-400" : "text-orange-400"}`} />
                      <span className={dbConnected ? "text-teal-400" : "text-orange-400"}>Supabase PostgreSQL</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      dbConnected ? "bg-teal-500/20 text-teal-300" : "bg-orange-500/20 text-orange-300"
                    }`}>
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
                      TRACING
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/15 space-y-1.5 text-[11px] font-mono text-zinc-300">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Service:</span>
                      <span className="text-white font-bold">batcoach-backend</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Site:</span>
                      <span className="text-white">us5.datadoghq.com</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Spans:</span>
                      <span className="text-purple-400">ai.inference, ai.yolo</span>
                    </div>
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
                      APDEX 0.99
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-orange-950/20 border border-orange-500/15 space-y-1.5 text-[11px] font-mono text-zinc-300">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Org:</span>
                      <span className="text-white font-bold">vesit-0s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Project:</span>
                      <span className="text-white">batcoach-ai</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Sample Rate:</span>
                      <span className="text-orange-400">100%</span>
                    </div>
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
                      CAPTURING
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Tracking <strong className="text-cyan-300">stroke_executed</strong>, <strong className="text-cyan-300">drill_locked_intervention</strong>,{" "}
                    <strong className="text-cyan-300">practice_mode_switched</strong>, and <strong className="text-cyan-300">practice_session_completed</strong> events.
                  </p>
                  <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/15 space-y-1.5 text-[11px] font-mono text-zinc-300">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Plan:</span>
                      <span className="text-white font-bold">1M Free Events/mo</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Session Replay:</span>
                      <span className="text-white">5,000/mo</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Custom Events:</span>
                      <span className="text-cyan-400">4 event types</span>
                    </div>
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
                    Fine-tuned <strong className="text-white">VideoMAE</strong> for 10-class shot classification +{" "}
                    <strong className="text-white">YOLOv8-OBB</strong> for bat blade orientation +{" "}
                    <strong className="text-white">MediaPipe Pose</strong> for biomechanical joint angles.
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
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Custom scrollbar styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #3f3f46;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #52525b;
        }
      `}</style>
    </div>
  );
}
