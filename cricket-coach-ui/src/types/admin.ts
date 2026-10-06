export interface OverviewData {
  athlete_count: number;
  total_sessions: number;
  total_reps: number;
  successful_reps: number;
  accuracy: number;
  best_streak: number;
  avg_confidence: number;
  total_practice_hours: number;
}

export interface ShotDistribution {
  shot: string;
  sessions: number;
  total_reps: number;
  successful_reps: number;
  accuracy: number;
  avg_confidence: number;
  max_streak: number;
}

export interface FlawHotspot {
  feedback: string;
  status: string;
  shot: string;
  count: number;
  avg_elbow: number;
  avg_knee: number;
}

export interface Athlete {
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

export interface RecentSession {
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

export interface TimelineDay {
  date: string;
  sessions: number;
  reps: number;
  clean_reps: number;
  accuracy: number;
  avg_confidence: number;
}

export interface HealthTelemetry {
  status: string;
  device?: string;
  fp16?: boolean;
  database?: string;
  cuda_available?: boolean;
  pingMs?: number;
}

export type TabId = "overview" | "shots" | "athletes" | "sessions" | "infra";

export const SHOT_DISPLAY_NAMES: Record<string, string> = {
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

export const SHOT_COLORS: Record<string, string> = {
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

export const SHOT_GRADIENT = [
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

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

export function timeAgo(dateStr: string): string {
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now.getTime() - then.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
}
