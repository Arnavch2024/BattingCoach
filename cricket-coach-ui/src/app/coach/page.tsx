"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { 
  Play, Pause, Target, Volume2, VolumeX, Activity, User, 
  Settings, Zap, CheckCircle2, AlertTriangle, Flame, 
  RotateCcw, Shield, Award, Cpu, Search, Sparkles, SlidersHorizontal,
  ChevronRight, BarChart2, Radio, Info, UserCheck, HelpCircle, ArrowLeft, Home,
  Crosshair, Layers, Compass
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { cn } from "../../lib/utils";

// ──────────────────────────────────────────────────────────────────────────────
// Shot Catalog & Metadata
// ──────────────────────────────────────────────────────────────────────────────

interface ShotMetadata {
  id: string;
  name: string;
  category: "Drives" | "Power & Cross-Bat" | "Defensive & Technical" | "Whips & Sweeps";
  difficulty: "Foundational" | "Intermediate" | "Advanced";
  keyCue: string;
  targetElbowAngle: number;
  targetKneeAngle: number;
}

const SHOT_CATALOG: ShotMetadata[] = [
  {
    id: "cover",
    name: "Cover Drive",
    category: "Drives",
    difficulty: "Intermediate",
    keyCue: "Lead with high elbow, head over front knee",
    targetElbowAngle: 130,
    targetKneeAngle: 155,
  },
  {
    id: "straight",
    name: "Straight Drive",
    category: "Drives",
    difficulty: "Foundational",
    keyCue: "Full bat face presentation down the ground",
    targetElbowAngle: 135,
    targetKneeAngle: 155,
  },
  {
    id: "pull",
    name: "Pull Shot",
    category: "Power & Cross-Bat",
    difficulty: "Intermediate",
    keyCue: "Weight on back foot, full arm extension",
    targetElbowAngle: 120,
    targetKneeAngle: 160,
  },
  {
    id: "hook",
    name: "Hook Shot",
    category: "Power & Cross-Bat",
    difficulty: "Advanced",
    keyCue: "Pivot front hip, roll wrists over top",
    targetElbowAngle: 115,
    targetKneeAngle: 165,
  },
  {
    id: "square_cut",
    name: "Square Cut",
    category: "Power & Cross-Bat",
    difficulty: "Intermediate",
    keyCue: "Back & across, slice through point",
    targetElbowAngle: 125,
    targetKneeAngle: 160,
  },
  {
    id: "lofted",
    name: "Lofted Drive",
    category: "Power & Cross-Bat",
    difficulty: "Advanced",
    keyCue: "Vertical swing plane with clean extension",
    targetElbowAngle: 140,
    targetKneeAngle: 150,
  },
  {
    id: "defense",
    name: "Forward Defense",
    category: "Defensive & Technical",
    difficulty: "Foundational",
    keyCue: "Soft hands, bat beside front pad",
    targetElbowAngle: 110,
    targetKneeAngle: 150,
  },
  {
    id: "late_cut",
    name: "Late Cut",
    category: "Defensive & Technical",
    difficulty: "Advanced",
    keyCue: "Guide ball late with relaxed wrists",
    targetElbowAngle: 115,
    targetKneeAngle: 160,
  },
  {
    id: "flick",
    name: "Wrist Flick",
    category: "Whips & Sweeps",
    difficulty: "Intermediate",
    keyCue: "Snap wrists through mid-wicket line",
    targetElbowAngle: 125,
    targetKneeAngle: 155,
  },
  {
    id: "sweep",
    name: "Sweep Shot",
    category: "Whips & Sweeps",
    difficulty: "Intermediate",
    keyCue: "Drop back knee, horizontal blade sweep",
    targetElbowAngle: 120,
    targetKneeAngle: 140,
  },
];

const CATEGORIES = ["All", "Drives", "Power & Cross-Bat", "Defensive & Technical", "Whips & Sweeps"] as const;

interface SessionLogItem {
  id: string;
  time: string;
  shot: string;
  confidence: number;
  grade: string;
  status: "success" | "wrong_shot" | "form_error" | "improving";
  message?: string;
}

export default function BatCoachDashboard() {
  const [targetShot, setTargetShot] = useState<string>("cover");
  const [practiceMode, setPracticeMode] = useState<"no_bat" | "with_bat">("no_bat");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLive, setIsLive] = useState<boolean>(false);
  const [hasLocalCamera, setHasLocalCamera] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showAngles, setShowAngles] = useState<boolean>(true);

  // Live Stream & Telemetry State
  const [streamData, setStreamData] = useState<any>(null);
  const [persistentFeedback, setPersistentFeedback] = useState<any>(null);
  const [sessionLogs, setSessionLogs] = useState<SessionLogItem[]>([]);
  const [repCount, setRepCount] = useState<number>(0); // Clean, verified reps
  const [totalSwings, setTotalSwings] = useState<number>(0); // All physical attempts
  const [streakCount, setStreakCount] = useState<number>(0);
  const [sessionSeconds, setSessionSeconds] = useState<number>(0);
  const [userProfile, setUserProfile] = useState<{ name: string; email: string; stance: string }>({
    name: "Arnav P.",
    email: "athlete@cricketcoach.ai",
    stance: "Right-Hand Batter",
  });

  // Supabase Database Sync State
  const [isSavingDb, setIsSavingDb] = useState<boolean>(false);
  const [dbSavedMessage, setDbSavedMessage] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const feedbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const streamIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastProcessedEventIdRef = useRef<string>("");
  const lastSpokenRef = useRef<string>("");

  const targetShotRef = useRef<string>(targetShot);
  useEffect(() => {
    targetShotRef.current = targetShot;
  }, [targetShot]);

  const practiceModeRef = useRef<"no_bat" | "with_bat">(practiceMode);
  useEffect(() => {
    practiceModeRef.current = practiceMode;
  }, [practiceMode]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("batcoach_user");
      if (stored) {
        setUserProfile(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Session elapsed timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLive) {
      timer = setInterval(() => setSessionSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isLive]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const getInitials = (name: string) => {
    return (
      name
        .split(" ")
        .map((n) => n[0])
        .filter(Boolean)
        .join("")
        .slice(0, 2)
        .toUpperCase() || "BC"
    );
  };

  const currentMetadata = useMemo(() => {
    return SHOT_CATALOG.find((s) => s.id === targetShot) || SHOT_CATALOG[0];
  }, [targetShot]);

  const filteredShots = useMemo(() => {
    return SHOT_CATALOG.filter((shot) => {
      const matchesCat = selectedCategory === "All" || shot.category === selectedCategory;
      const matchesSearch = shot.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Dynamic Rating Logic
  const formRating = useMemo(() => {
    if (!streamData?.probs) return { label: "Awaiting Data", rating: "--", gradeColor: "bg-zinc-800 text-zinc-400" };
    
    const p = streamData.probs[targetShot] || 0;
    if (p > 0.75) return { label: "Elite Mastery", rating: "A+", gradeColor: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" };
    if (p > 0.55) return { label: "Good Technique", rating: "A", gradeColor: "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" };
    if (p > 0.35) return { label: "Solid Foundation", rating: "B", gradeColor: "bg-blue-500/20 text-blue-400 border border-blue-500/30" };
    if (p > 0.20) return { label: "Needs Polish", rating: "C", gradeColor: "bg-amber-500/20 text-amber-400 border border-amber-500/30" };
    return { label: "Form Adjustment", rating: "D", gradeColor: "bg-red-500/20 text-red-400 border border-red-500/30" };
  }, [streamData, targetShot]);

  // Text to Speech Voice Coach
  useEffect(() => {
    if (persistentFeedback && !isMuted && typeof window !== "undefined" && "speechSynthesis" in window) {
      const tipText = persistentFeedback.tips?.[0] || "";
      const textToSpeak = `${persistentFeedback.message}. ${tipText}`;
      if (textToSpeak !== lastSpokenRef.current) {
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.rate = 1.05;
        utterance.pitch = 1.0;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
        lastSpokenRef.current = textToSpeak;
      }
    }
  }, [persistentFeedback, isMuted]);

  // WebSocket Connection & Dual-Mode Camera Streaming
  useEffect(() => {
    if (!isLive) {
      wsRef.current?.close();
      setIsConnected(false);
      setStreamData(null);
      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      return;
    }

    let localStream: MediaStream | null = null;

    const connect = () => {
      const defaultWsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://127.0.0.1:8888/ws";
      const ws = new WebSocket(defaultWsUrl);

      ws.onopen = () => {
        setIsConnected(true);
        ws.send(JSON.stringify({ 
          target: targetShotRef.current,
          practice_mode: practiceModeRef.current
        }));

        // Start Browser Camera capture if supported
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          navigator.mediaDevices
            .getUserMedia({
              video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
              audio: false,
            })
            .then((stream) => {
              localStream = stream;
              setHasLocalCamera(true);
              if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play().catch(console.error);
              }

              // Send lightweight downscaled frames (320x240) only when network buffer is clear
              if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
              streamIntervalRef.current = setInterval(() => {
                if (
                  ws.readyState === WebSocket.OPEN &&
                  ws.bufferedAmount === 0 &&
                  videoRef.current &&
                  canvasRef.current &&
                  videoRef.current.videoWidth > 0
                ) {
                  const canvas = canvasRef.current;
                  canvas.width = 320;
                  canvas.height = 240;
                  const ctx = canvas.getContext("2d");
                  if (ctx) {
                    ctx.drawImage(videoRef.current, 0, 0, 320, 240);
                    const base64Img = canvas.toDataURL("image/jpeg", 0.55);
                    ws.send(JSON.stringify({ 
                      image: base64Img, 
                      target: targetShotRef.current,
                      practice_mode: practiceModeRef.current
                    }));
                  }
                }
              }, 40); // ~25 FPS
            })
            .catch((err) => {
              console.log("[Browser Camera Notice]: Using backend camera grabber:", err);
              setHasLocalCamera(false);
            });
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setStreamData(data);
          
          // Only process feedback when a genuine NEW event ID is delivered
          if (data.feedback && data.feedback.id && data.feedback.id !== lastProcessedEventIdRef.current) {
            lastProcessedEventIdRef.current = data.feedback.id;
            setPersistentFeedback(data.feedback);
            
            // Increment total physical swing attempts
            setTotalSwings((s) => s + 1);

            // ONLY increment valid reps and streak when the shot is a genuine SUCCESS
            if (data.feedback.status === "success") {
              setStreakCount((c) => c + 1);
              setRepCount((r) => r + 1);
            } else {
              // Wrong shot or form error resets streak and DOES NOT count towards clean reps!
              setStreakCount(0);
            }

            const now = new Date();
            const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
            const p = data.probs?.[targetShotRef.current] || 0;
            const newLog: SessionLogItem = {
              id: data.feedback.id,
              time: timeStr,
              shot: currentMetadata.name,
              confidence: p,
              grade: data.feedback.status === "success" ? (p > 0.7 ? "A+" : "A") : data.feedback.status === "wrong_shot" ? "Wrong" : "Alert",
              status: data.feedback.status,
              message: data.feedback.message,
            };

            setSessionLogs((prev) => [newLog, ...prev.slice(0, 19)]);

            if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
            feedbackTimerRef.current = setTimeout(() => setPersistentFeedback(null), 6000);
          }
        } catch (e) {
          console.error("WS Parse error", e);
        }
      };

      ws.onerror = (err) => {
        console.error("WebSocket connection error:", err);
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (isLive) setTimeout(connect, 2000);
      };

      wsRef.current = ws;
    };

    connect();
    return () => {
      wsRef.current?.close();
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isLive]);

  const handleShotChange = (shotId: string) => {
    setTargetShot(shotId);
    targetShotRef.current = shotId;
    setPersistentFeedback(null);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ 
        target: shotId,
        practice_mode: practiceModeRef.current
      }));
    }
  };

  const handleModeChange = (mode: "no_bat" | "with_bat") => {
    setPracticeMode(mode);
    practiceModeRef.current = mode;
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ 
        target: targetShotRef.current,
        practice_mode: mode
      }));
    }
  };

  const saveSessionToDatabase = async () => {
    if (sessionLogs.length === 0 && sessionSeconds < 5) return;
    setIsSavingDb(true);
    try {
      const successfulReps = sessionLogs.filter((l) => l.status === "success").length;
      const avgConf =
        sessionLogs.length > 0
          ? sessionLogs.reduce((acc, l) => acc + l.confidence, 0) / sessionLogs.length
          : 0;

      const payload = {
        athlete_email: userProfile.email || "athlete@cricketcoach.ai",
        session_duration_seconds: sessionSeconds,
        target_shot: currentMetadata.name,
        total_reps: repCount,
        successful_reps: successfulReps,
        best_streak: streakCount,
        avg_confidence: avgConf,
        practice_mode: practiceMode,
        strokes: sessionLogs.map((l) => ({
          shot_name: l.shot,
          status: l.status,
          confidence: l.confidence,
          elbow_angle: streamData?.biometrics?.elbow_angle || 0,
          knee_angle: streamData?.biometrics?.knee_angle || 0,
          blade_angle: streamData?.bat?.blade_angle || null,
          coach_feedback: `${l.grade} Grade performance`,
        })),
      };

      const res = await fetch("http://127.0.0.1:8888/api/sessions/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        setDbSavedMessage(`Session #${json.session_id} synced to Supabase DB!`);
        setTimeout(() => setDbSavedMessage(null), 4000);
      }
    } catch (err) {
      console.error("Failed to sync session with Supabase:", err);
    } finally {
      setIsSavingDb(false);
    }
  };

  const handleToggleLive = () => {
    if (isLive) {
      saveSessionToDatabase();
      setIsLive(false);
    } else {
      setIsLive(true);
    }
  };

  const bioData = streamData?.biometrics;
  const batData = streamData?.bat;
  const isBodyDetected = bioData?.body_detected === true;
  const elbowAngle = bioData?.elbow_angle || 0;
  const kneeAngle = bioData?.knee_angle || 0;
  const isElbowGood = elbowAngle >= currentMetadata.targetElbowAngle;
  const isKneeGood = kneeAngle <= currentMetadata.targetKneeAngle;

  return (
    <div className="flex flex-col h-screen w-full bg-[#09090b] text-zinc-100 antialiased select-none overflow-hidden relative font-sans">
      
      {/* ── Top DB Sync Banner ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {dbSavedMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-950/95 border border-emerald-500/60 text-emerald-300 text-xs px-4 py-2 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span className="font-semibold">{dbSavedMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Studio Navigation Header ────────────────────────────────────────── */}
      <header className="h-14 border-b border-zinc-800 bg-zinc-950 px-6 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-4">
          <Link 
            href="/"
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-zinc-900 border border-zinc-800/80 transition-all font-medium"
            title="Back to Home"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Home</span>
          </Link>

          <Separator orientation="vertical" className="h-5 bg-zinc-800" />

          <div className="flex items-center gap-2.5">
            <img
              src="/bat-icon.jpg"
              alt="BatCoach Icon"
              className="h-8 w-8 rounded-lg object-cover border border-emerald-500/40 shadow-sm"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">BatCoach AI Pro</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 text-emerald-400 border border-zinc-800">
                  v2.0 Dual-Mode
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 leading-tight">VideoMAE + MediaPipe 3D + YOLOv8-OBB Bat Tracking</p>
            </div>
          </div>
        </div>

        {/* Practice Mode Selector Segmented Pill */}
        <div className="flex items-center bg-zinc-900/90 border border-zinc-800 rounded-xl p-0.5 shadow-inner">
          <button
            onClick={() => handleModeChange("no_bat")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.2 rounded-lg text-xs font-bold transition-all cursor-pointer",
              practiceMode === "no_bat"
                ? "bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            )}
            title="Shadow Practice: 0% YOLO overhead, pure 3D biomechanics & VideoMAE"
          >
            <span>🥋 Shadow Practice</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30 font-mono font-normal">
              No Bat (Light)
            </span>
          </button>

          <button
            onClick={() => handleModeChange("with_bat")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.2 rounded-lg text-xs font-bold transition-all cursor-pointer",
              practiceMode === "with_bat"
                ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            )}
            title="Live Willow Practice: Real-time YOLOv8-OBB bat orientation & blade angle analysis"
          >
            <span>🏏 Live Willow</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30 font-mono font-normal">
              With Bat (YOLO-OBB)
            </span>
          </button>
        </div>

        {/* Telemetry Bar */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 bg-zinc-900/90 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-300">
            <span className={cn("h-2 w-2 rounded-full", isConnected ? "bg-emerald-500 animate-pulse" : "bg-zinc-600")} />
            <span className="font-medium">{isConnected ? "Connected" : "Standby"}</span>
            <Separator orientation="vertical" className="h-3 mx-1 bg-zinc-800" />
            <span className="text-zinc-400 mono">FPS: <strong className="text-white">{streamData?.telemetry?.fps || 0}</strong></span>
            <Separator orientation="vertical" className="h-3 mx-1 bg-zinc-800" />
            <span className="text-zinc-400 mono">Latency: <strong className="text-white">{streamData?.telemetry?.inference_ms || 12}ms</strong></span>
            {practiceMode === "with_bat" && (
              <>
                <Separator orientation="vertical" className="h-3 mx-1 bg-zinc-800" />
                <span className="text-[10px] font-mono text-emerald-400 font-bold">OBB Active</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 bg-zinc-900/90 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs">
            <span className="text-zinc-500">Session:</span>
            <span className="mono font-bold text-white">{formatTime(sessionSeconds)}</span>
          </div>

          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setIsMuted(!isMuted)} 
            className="h-8 w-8 text-zinc-400 hover:text-white border-zinc-800"
            title={isMuted ? "Unmute Voice Coach" : "Mute Voice Coach"}
          >
            {isMuted ? <VolumeX className="h-4 w-4 text-red-400" /> : <Volume2 className="h-4 w-4 text-emerald-400" />}
          </Button>

          <Button
            variant={isLive ? "destructive" : "default"}
            size="sm"
            onClick={handleToggleLive}
            className={cn(
              "font-bold text-xs gap-1.5 h-8",
              isLive ? "bg-red-600 hover:bg-red-700" : "bg-emerald-500 hover:bg-emerald-600 text-white"
            )}
          >
            {isLive ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current" />}
            {isLive ? "End Session" : "Start Live Feed"}
          </Button>

          {sessionLogs.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={saveSessionToDatabase}
              disabled={isSavingDb}
              className="text-xs h-8 bg-zinc-900 border-zinc-800 text-zinc-200 hover:text-white"
              title="Save Session to Supabase PostgreSQL"
            >
              <Shield className="h-3.5 w-3.5 mr-1 text-emerald-400" />
              {isSavingDb ? "Syncing..." : "Sync DB"}
            </Button>
          )}

          <Separator orientation="vertical" className="h-6 bg-zinc-800" />

          {/* User Profile */}
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
              {getInitials(userProfile.name)}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-semibold text-zinc-200 leading-tight truncate max-w-[120px]">
                {userProfile.name}
              </div>
              <div className="text-[10px] text-zinc-500 leading-tight truncate max-w-[120px]">
                {userProfile.stance}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Workspace Grid ────────────────────────────────────────────── */}
      <div className="flex-1 grid grid-cols-12 gap-4 p-4 min-h-0">
        
        {/* ── Left Column: Shot Directory & Drills (3 Cols) ──────────────────── */}
        <div className="col-span-3 flex flex-col gap-3 min-h-0">
          <div className="flex-1 flex flex-col min-h-0 bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
            
            {/* Search & Header */}
            <div className="p-4 pb-3 space-y-3 border-b border-zinc-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Shot Syllabus</h3>
                  <p className="text-[11px] text-zinc-400">Target stroke to evaluate</p>
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                  {filteredShots.length} Drills
                </span>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search strokes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Category Pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer",
                      selectedCategory === cat
                        ? "bg-emerald-500 text-white font-semibold"
                        : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Shot List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
              {filteredShots.map((shot) => {
                const isActive = targetShot === shot.id;
                const matchProb = streamData?.probs?.[shot.id] || 0;
                return (
                  <button
                    key={shot.id}
                    onClick={() => handleShotChange(shot.id)}
                    className={cn(
                      "w-full text-left p-3 rounded-xl border transition-all duration-150 flex flex-col gap-1.5 group cursor-pointer",
                      isActive
                        ? "bg-emerald-950/40 border-emerald-500/60 shadow-md"
                        : "bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-900/80 hover:border-zinc-700"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className={cn("text-xs font-bold", isActive ? "text-emerald-400" : "text-white")}>
                        {shot.name}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                          {shot.difficulty}
                        </span>
                        {isActive && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                      </div>
                    </div>

                    <p className="text-[11px] text-zinc-400 leading-snug line-clamp-1">{shot.keyCue}</p>

                    {/* Live probability indicator */}
                    {isLive && (
                      <div className="w-full pt-1">
                        <div className="flex justify-between text-[10px] text-zinc-500 mb-0.5">
                          <span>Match Confidence</span>
                          <span className="mono font-bold text-zinc-300">{(matchProb * 100).toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all duration-200", isActive ? "bg-emerald-500" : "bg-zinc-600")}
                            style={{ width: `${matchProb * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

          </div>
        </div>

        {/* ── Center Stage: Live Feed & Video Analysis (6 Cols) ──────────────── */}
        <div className="col-span-6 flex flex-col gap-3 min-h-0">
          
          <div className="flex-1 flex flex-col min-h-0 bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl relative">
            
            {/* Viewport Frame */}
            <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
              
              {/* Live Browser Camera feed with 0ms visual latency */}
              <video
                ref={videoRef}
                className={cn(
                  "w-full h-full object-contain -scale-x-100",
                  (!isLive || !hasLocalCamera) && "hidden"
                )}
                playsInline
                muted
                autoPlay
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Fallback image stream for backend hardware camera grabber */}
              {isLive && !hasLocalCamera && streamData?.frame && (
                <img
                  src={`data:image/jpeg;base64,${streamData.frame}`}
                  alt="Batting Coach Live Stream"
                  className="w-full h-full object-contain"
                />
              )}

              {/* YOLOv8-OBB Bat Tracking AR Overlay */}
              {isLive && practiceMode === "with_bat" && batData?.detected && showAngles && batData?.polygon && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <polygon
                    points={batData.polygon.map((pt: [number, number]) => {
                      const x = hasLocalCamera ? (1.0 - pt[0]) * 100 : pt[0] * 100;
                      const y = pt[1] * 100;
                      return `${x},${y}`;
                    }).join(" ")}
                    fill={batData.alignment_match ? "rgba(16, 185, 129, 0.18)" : "rgba(245, 158, 11, 0.18)"}
                    stroke={batData.alignment_match ? "#10b981" : "#f59e0b"}
                    strokeWidth="0.8"
                    strokeDasharray="2,1"
                  />
                  {batData.center && (
                    <circle
                      cx={hasLocalCamera ? (1.0 - batData.center[0]) * 100 : batData.center[0] * 100}
                      cy={batData.center[1] * 100}
                      r="1.2"
                      fill={batData.alignment_match ? "#10b981" : "#f59e0b"}
                    />
                  )}
                </svg>
              )}

              {(!isLive || (!hasLocalCamera && !streamData?.frame)) && (
                <div className="flex flex-col items-center justify-center gap-4 text-center p-8">
                  <div className="h-16 w-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600">
                    <Activity className="h-8 w-8 animate-pulse text-emerald-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Camera Standby</h4>
                    <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                      {isLive 
                        ? `Connecting to AI backend (${practiceMode === "with_bat" ? "YOLO-OBB + VideoMAE" : "Shadow Biomechanics + VideoMAE"})...` 
                        : "Click 'Start Live Feed' to begin real-time stroke analysis."}
                    </p>
                  </div>
                  {!isLive && (
                    <Button onClick={() => setIsLive(true)} size="sm" className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs">
                      <Play className="h-3.5 w-3.5 fill-current" />
                      Start Practice
                    </Button>
                  )}
                </div>
              )}

              {/* AR HUD Overlay Badges */}
              {isLive && streamData && (
                <>
                  <div className="absolute top-3 left-3 flex flex-col gap-2 pointer-events-none z-20">
                    <div className="flex items-center gap-2 bg-zinc-950/90 backdrop-blur-md border border-zinc-800 rounded-lg px-3 py-1.5 text-xs shadow-lg">
                      <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Drill:</span>
                      <span className="font-bold text-emerald-400">{currentMetadata.name}</span>
                    </div>

                    {/* Active Mode HUD Pill */}
                    <div className={cn(
                      "flex items-center gap-2 backdrop-blur-md border rounded-lg px-3 py-1 text-xs shadow-md font-semibold",
                      practiceMode === "with_bat"
                        ? batData?.detected
                          ? "bg-emerald-950/85 border-emerald-500/50 text-emerald-300"
                          : "bg-zinc-950/85 border-amber-500/40 text-amber-300"
                        : "bg-cyan-950/85 border-cyan-500/40 text-cyan-300"
                    )}>
                      {practiceMode === "with_bat" ? (
                        <>
                          <span>🏏</span>
                          <span>
                            {batData?.detected 
                              ? `Blade: ${batData.blade_angle}° (${batData.is_vertical ? "Vertical Face" : "Cross-Bat"})` 
                              : "Willow Tracking: Hold bat in frame"}
                          </span>
                        </>
                      ) : (
                        <>
                          <span>🥋</span>
                          <span>Shadow Form (Lightweight Biomechanics)</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="absolute top-3 right-3 flex flex-col items-end gap-2 pointer-events-none z-20">
                    <div className={cn("px-3 py-1.5 rounded-lg text-xs font-bold backdrop-blur-md shadow-lg", formRating.gradeColor)}>
                      Form Rating: {formRating.rating}
                    </div>
                  </div>
                </>
              )}

              {/* Stance prompt when body not in frame */}
              {isLive && streamData && !isBodyDetected && (
                <div className="absolute top-12 left-1/2 -translate-x-1/2 pointer-events-none z-20">
                  <div className="px-3.5 py-1.5 rounded-full bg-zinc-950/90 border border-emerald-500/50 text-zinc-200 text-xs flex items-center gap-2 shadow-2xl backdrop-blur-md">
                    <UserCheck className="h-4 w-4 text-emerald-400" />
                    <span>Step back ~6–8 ft to frame full stance</span>
                  </div>
                </div>
              )}

              {/* Instant Coaching Alert Banner */}
              <AnimatePresence>
                {persistentFeedback && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute bottom-4 inset-x-4 pointer-events-none z-30"
                  >
                    <div className={cn(
                      "p-4 rounded-xl backdrop-blur-xl border shadow-2xl flex items-start gap-3.5 text-left",
                      persistentFeedback.status === "success" 
                        ? "bg-emerald-950/95 border-emerald-500/70 text-emerald-100" 
                        : "bg-zinc-950/95 border-amber-500/70 text-zinc-100"
                    )}>
                      <div className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                        persistentFeedback.status === "success" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                      )}>
                        {persistentFeedback.status === "success" ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold tracking-tight">{persistentFeedback.message}</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                            {persistentFeedback.tier || "Coaching Cue"}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                          {persistentFeedback.tips?.[0]}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Viewport Toolbar Footer */}
            <div className="p-3 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="text-zinc-400 font-semibold">Detected Action:</span>
                <span className="font-bold text-white px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                  {streamData?.topShot ? streamData.topShot.replace("_", " ").toUpperCase() : "Awaiting Movement"}
                </span>
                {streamData?.confidence && (
                  <span className="text-emerald-400 mono font-bold text-xs">
                    {(streamData.confidence * 100).toFixed(0)}%
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span className="text-[11px] font-medium">AR Telemetry Overlay</span>
                <Switch checked={showAngles} onCheckedChange={setShowAngles} />
              </div>
            </div>

          </div>
        </div>

        {/* ── Right Column: Biometrics & Telemetry (3 Cols) ──────────────────── */}
        <div className="col-span-3 flex flex-col gap-3 min-h-0">
          
          {/* Biometrics & Angles Card */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 shadow-lg space-y-4">
            
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Live Biometrics</h3>
              </div>
              <span className={cn(
                "text-[10px] font-semibold px-2 py-0.5 rounded border",
                !isBodyDetected ? "bg-zinc-900 border-zinc-800 text-zinc-500" : isElbowGood && isKneeGood ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-amber-500/10 border-amber-500/30 text-amber-400"
              )}>
                {!isBodyDetected ? "No Stance" : isElbowGood && isKneeGood ? "Optimal Shape" : "Form Adjustment"}
              </span>
            </div>

            {!isBodyDetected ? (
              <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80 text-center space-y-1">
                <p className="text-xs text-zinc-300 font-bold">No Batter Stance Detected</p>
                <p className="text-[11px] text-zinc-500 leading-snug">
                  Stand in frame with your torso and arms visible to stream live joint angles.
                </p>
              </div>
            ) : (
              <div className={cn("grid gap-3", practiceMode === "with_bat" ? "grid-cols-3" : "grid-cols-2")}>
                
                {/* Lead Elbow Metric Gauge */}
                <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center flex flex-col items-center gap-1.5">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Lead Elbow</span>
                  <div className={cn("text-xl font-black mono", isElbowGood ? "text-emerald-400" : "text-amber-400")}>
                    {elbowAngle.toFixed(0)}°
                  </div>
                  <span className={cn(
                    "text-[8px] font-bold px-1.5 py-0.5 rounded",
                    isElbowGood ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                  )}>
                    ≥{currentMetadata.targetElbowAngle}°
                  </span>
                </div>

                {/* Lead Knee Metric Gauge */}
                <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center flex flex-col items-center gap-1.5">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Lead Knee</span>
                  <div className={cn("text-xl font-black mono", isKneeGood ? "text-teal-400" : "text-amber-400")}>
                    {kneeAngle.toFixed(0)}°
                  </div>
                  <span className={cn(
                    "text-[8px] font-bold px-1.5 py-0.5 rounded",
                    isKneeGood ? "bg-teal-500/20 text-teal-400" : "bg-amber-500/20 text-amber-400"
                  )}>
                    ≤{currentMetadata.targetKneeAngle}°
                  </span>
                </div>

                {/* Bat Blade Angle Gauge (In With Bat mode) */}
                {practiceMode === "with_bat" && (
                  <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center flex flex-col items-center gap-1.5">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Blade Angle</span>
                    <div className={cn(
                      "text-xl font-black mono", 
                      batData?.detected 
                        ? batData.alignment_match ? "text-emerald-400" : "text-amber-400" 
                        : "text-zinc-500"
                    )}>
                      {batData?.detected ? `${batData.blade_angle}°` : "--"}
                    </div>
                    <span className={cn(
                      "text-[8px] font-bold px-1.5 py-0.5 rounded",
                      batData?.detected 
                        ? batData.alignment_match ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400" 
                        : "bg-zinc-800 text-zinc-500"
                    )}>
                      {batData?.detected ? (batData.is_vertical ? "Vertical" : "Cross-Bat") : "No Bat"}
                    </span>
                  </div>
                )}

              </div>
            )}

          </div>

          {/* YOLOv8-OBB Bat Tracking Telemetry Card (Only in With-Bat Mode) */}
          {practiceMode === "with_bat" && (
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 shadow-lg space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-emerald-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">YOLO-OBB Bat Telemetry</h3>
                </div>
                <span className={cn(
                  "text-[9px] font-semibold px-2 py-0.5 rounded border font-mono",
                  batData?.detected
                    ? batData.alignment_match
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                    : "bg-zinc-900 border-zinc-800 text-zinc-500"
                )}>
                  {batData?.detected ? (batData.alignment_match ? "Optimal Plane ✓" : "Angle Alert ⚠️") : "Standby"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center flex flex-col items-center">
                  <span className="text-[9px] text-zinc-500 uppercase font-semibold">Face Alignment</span>
                  <div className="text-sm font-bold text-zinc-200 mt-1">
                    {batData?.detected ? (batData.is_vertical ? "Vertical Face" : "Horizontal Blade") : "No Bat"}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center flex flex-col items-center">
                  <span className="text-[9px] text-zinc-500 uppercase font-semibold">OBB Confidence</span>
                  <div className="text-sm font-bold text-cyan-400 mt-1 mono">
                    {batData?.detected ? `${(batData.confidence * 100).toFixed(0)}%` : "--"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Session Performance Card */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 shadow-lg space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Session Performance</span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-zinc-400 font-mono">
                  {totalSwings > 0 ? `${((repCount / totalSwings) * 100).toFixed(0)}% Accuracy` : "0% Accuracy"}
                </span>
                <Flame className="h-4 w-4 text-amber-500" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center">
                <div className="text-[9px] text-zinc-500 uppercase font-semibold">Clean Reps</div>
                <div className="text-xl font-black mono text-emerald-400 mt-0.5">{repCount}</div>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center">
                <div className="text-[9px] text-zinc-500 uppercase font-semibold">Total Swings</div>
                <div className="text-xl font-black mono text-zinc-300 mt-0.5">{totalSwings}</div>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center">
                <div className="text-[9px] text-zinc-500 uppercase font-semibold">Streak</div>
                <div className="flex items-center justify-center gap-0.5 mt-0.5">
                  <Flame className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  <span className="text-xl font-black mono text-emerald-400">{streakCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Stroke History Log */}
          <div className="flex-1 flex flex-col min-h-0 bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Activity Timeline</h4>
              <span className="text-[10px] font-mono text-zinc-400">{sessionLogs.length} Events</span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
              {sessionLogs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 text-zinc-500 text-xs">
                  <Info className="h-5 w-5 mb-2 text-zinc-600" />
                  No stroke events recorded yet. Perform shots in stance to log feedback.
                </div>
              ) : (
                sessionLogs.map((log) => (
                  <div
                    key={log.id}
                    className={cn(
                      "p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all",
                      log.status === "success" 
                        ? "bg-zinc-900/60 border-zinc-800" 
                        : log.status === "wrong_shot"
                        ? "bg-red-950/20 border-red-500/30"
                        : "bg-amber-950/20 border-amber-500/30"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "h-2 w-2 rounded-full",
                        log.status === "success" ? "bg-emerald-500" : log.status === "wrong_shot" ? "bg-red-500" : "bg-amber-500"
                      )} />
                      <div>
                        <div className="font-bold text-white leading-tight">{log.shot}</div>
                        <div className="text-[10px] text-zinc-500 mono">{log.time}</div>
                      </div>
                    </div>
                    <span className={cn(
                      "font-mono text-[10px] font-bold px-2 py-0.5 rounded",
                      log.status === "success" 
                        ? "bg-emerald-500/20 text-emerald-400" 
                        : log.status === "wrong_shot"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-amber-500/20 text-amber-400"
                    )}>
                      {log.status === "success" ? `${log.grade} (${(log.confidence * 100).toFixed(0)}%)` : log.status === "wrong_shot" ? "Wrong Shot" : "Form Alert"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

