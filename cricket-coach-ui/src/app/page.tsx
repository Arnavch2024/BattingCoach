"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  Play, Pause, Target, Volume2, VolumeX, Activity, User, 
  Settings, Zap, CheckCircle2, AlertTriangle, Flame, 
  RotateCcw, Shield, Award, Cpu, Search, Sparkles, SlidersHorizontal,
  ChevronRight, BarChart2, Radio, Info, UserCheck, HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

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
  status: "success" | "improving";
}

export default function BatCoachDashboard() {
  const [targetShot, setTargetShot] = useState<string>("cover");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLive, setIsLive] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showAngles, setShowAngles] = useState<boolean>(true);

  // Live Stream & Telemetry State
  const [streamData, setStreamData] = useState<any>(null);
  const [persistentFeedback, setPersistentFeedback] = useState<any>(null);
  const [sessionLogs, setSessionLogs] = useState<SessionLogItem[]>([]);
  const [repCount, setRepCount] = useState<number>(0);
  const [streakCount, setStreakCount] = useState<number>(0);
  const [sessionSeconds, setSessionSeconds] = useState<number>(0);

  const wsRef = useRef<WebSocket | null>(null);
  const feedbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastProcessedEventIdRef = useRef<string>("");
  const lastSpokenRef = useRef<string>("");

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

  // Text to Speech
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

  // WebSocket Connection Management
  useEffect(() => {
    if (!isLive) {
      wsRef.current?.close();
      setIsConnected(false);
      setStreamData(null);
      return;
    }

    const connect = () => {
      const ws = new WebSocket("ws://127.0.0.1:8888/ws");
      
      ws.onopen = () => {
        setIsConnected(true);
        ws.send(JSON.stringify({ target: targetShot }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setStreamData(data);
          
          // Only process feedback when a genuine NEW event ID is delivered
          if (data.feedback && data.feedback.id && data.feedback.id !== lastProcessedEventIdRef.current) {
            lastProcessedEventIdRef.current = data.feedback.id;
            setPersistentFeedback(data.feedback);
            
            if (data.feedback.status === "success") {
              setStreakCount((c) => c + 1);
              setRepCount((r) => r + 1);
            } else {
              setStreakCount(0);
              setRepCount((r) => r + 1);
            }

            const now = new Date();
            const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
            const p = data.probs?.[targetShot] || 0;
            const newLog: SessionLogItem = {
              id: data.feedback.id,
              time: timeStr,
              shot: currentMetadata.name,
              confidence: p,
              grade: p > 0.7 ? "A+" : p > 0.5 ? "A" : p > 0.3 ? "B" : "C",
              status: data.feedback.status,
            };

            setSessionLogs((prev) => [newLog, ...prev.slice(0, 19)]);

            if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
            feedbackTimerRef.current = setTimeout(() => setPersistentFeedback(null), 6000);
          }
        } catch (e) {
          console.error("WS Parse error", e);
        }
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
    };
  }, [isLive, targetShot, currentMetadata.name]);

  const handleShotChange = (shotId: string) => {
    setTargetShot(shotId);
    setPersistentFeedback(null);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ target: shotId }));
    }
  };

  const bioData = streamData?.biometrics;
  const isBodyDetected = bioData?.body_detected === true;
  const elbowAngle = bioData?.elbow_angle || 0;
  const kneeAngle = bioData?.knee_angle || 0;
  const isElbowGood = elbowAngle >= currentMetadata.targetElbowAngle;
  const isKneeGood = kneeAngle <= currentMetadata.targetKneeAngle;

  return (
    <div className="flex flex-col h-screen w-full bg-[#09090b] text-zinc-100 antialiased select-none overflow-hidden">
      
      {/* ── Top Navigation Header ────────────────────────────────────────────── */}
      <header className="h-14 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md px-6 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <img
            src="/bat-icon.jpg"
            alt="BatCoach Icon"
            className="h-9 w-9 rounded-lg object-cover border border-emerald-500/40 shadow-sm shadow-emerald-500/10"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-white">BatCoach AI Pro</span>
              <Badge variant="secondary" className="text-[10px] font-medium py-0 px-1.5 h-4 bg-zinc-800 text-zinc-400">
                v2.0 FP16
              </Badge>
            </div>
            <p className="text-[11px] text-zinc-500">Real-Time Batting Biomechanics & Stroke AI</p>
          </div>
        </div>

        {/* Telemetry Bar */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-300">
            <span className={cn("h-2 w-2 rounded-full", isConnected ? "bg-emerald-500 animate-pulse" : "bg-zinc-600")} />
            <span className="font-medium text-zinc-200">{isConnected ? "Connected" : "Disconnected"}</span>
            <Separator orientation="vertical" className="h-3 mx-1 bg-zinc-700" />
            <span className="text-zinc-400 mono">FPS: <strong className="text-zinc-200">{streamData?.telemetry?.fps || 0}</strong></span>
            <Separator orientation="vertical" className="h-3 mx-1 bg-zinc-700" />
            <span className="text-zinc-400 mono">Latency: <strong className="text-zinc-200">{streamData?.telemetry?.inference_ms || 12}ms</strong></span>
            {streamData?.telemetry?.fp16 && (
              <>
                <Separator orientation="vertical" className="h-3 mx-1 bg-zinc-700" />
                <Badge variant="cyan" className="text-[9px] py-0 px-1 h-3.5">CUDA FP16</Badge>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs">
            <span className="text-zinc-500">Session:</span>
            <span className="mono font-semibold text-zinc-200">{formatTime(sessionSeconds)}</span>
          </div>

          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setIsMuted(!isMuted)} 
            className="h-8 w-8 text-zinc-400 hover:text-zinc-100"
            title={isMuted ? "Unmute Voice Coach" : "Mute Voice Coach"}
          >
            {isMuted ? <VolumeX className="h-4 w-4 text-red-400" /> : <Volume2 className="h-4 w-4 text-emerald-400" />}
          </Button>

          <Button
            variant={isLive ? "destructive" : "default"}
            size="sm"
            onClick={() => setIsLive(!isLive)}
            className="font-medium gap-1.5"
          >
            {isLive ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current" />}
            {isLive ? "End Session" : "Start Live Feed"}
          </Button>

          <Separator orientation="vertical" className="h-6 bg-zinc-800" />

          {/* User Profile */}
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-sm">
              <div className="h-full w-full rounded-full bg-zinc-900 flex items-center justify-center text-[11px] font-bold text-zinc-200">
                AP
              </div>
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-semibold text-zinc-200 leading-tight">Arnav P.</div>
              <div className="text-[10px] text-zinc-500 leading-tight">Right-Hand Batter</div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Workspace Grid ────────────────────────────────────────────── */}
      <div className="flex-1 grid grid-cols-12 gap-4 p-4 min-h-0">
        
        {/* ── Left Column: Shot Directory & Drills (3 Cols) ──────────────────── */}
        <div className="col-span-3 flex flex-col gap-3 min-h-0">
          <Card className="flex-1 flex flex-col min-h-0 bg-zinc-950/60 border-zinc-800/80">
            <CardHeader className="p-4 pb-3 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold">Shot Modules</CardTitle>
                  <CardDescription className="text-xs text-zinc-400">Select stroke module for feedback</CardDescription>
                </div>
                <Badge variant="outline" className="text-[10px]">{filteredShots.length} Shots</Badge>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search shot..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-900/90 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700"
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
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </CardHeader>

            <Separator className="bg-zinc-800/80" />

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
                      "w-full text-left p-3 rounded-lg border transition-all duration-150 flex flex-col gap-1.5 group cursor-pointer",
                      isActive
                        ? "bg-emerald-950/30 border-emerald-500/50 shadow-sm"
                        : "bg-zinc-900/40 border-zinc-800/60 hover:bg-zinc-900/80 hover:border-zinc-700/60"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className={cn("text-xs font-semibold tracking-tight", isActive ? "text-emerald-400" : "text-zinc-200")}>
                        {shot.name}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Badge 
                          variant={shot.difficulty === "Foundational" ? "secondary" : shot.difficulty === "Intermediate" ? "cyan" : "warning"}
                          className="text-[9px] py-0 px-1.5 h-4"
                        >
                          {shot.difficulty}
                        </Badge>
                        {isActive && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                      </div>
                    </div>

                    <p className="text-[11px] text-zinc-400 leading-snug line-clamp-1">{shot.keyCue}</p>

                    {/* Mini live probability bar when active */}
                    {isLive && (
                      <div className="w-full pt-1">
                        <div className="flex justify-between text-[10px] text-zinc-500 mb-0.5">
                          <span>Match</span>
                          <span className="mono font-medium text-zinc-300">{(matchProb * 100).toFixed(0)}%</span>
                        </div>
                        <Progress value={matchProb * 100} className="h-1 bg-zinc-800" indicatorClassName={isActive ? "bg-emerald-500" : "bg-zinc-600"} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* ── Center Stage: Live Feed & Video Analysis (6 Cols) ──────────────── */}
        <div className="col-span-6 flex flex-col gap-3 min-h-0">
          
          {/* Main Video Card */}
          <Card className="flex-1 flex flex-col min-h-0 bg-zinc-950/80 border-zinc-800/80 overflow-hidden relative">
            <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
              
              {streamData?.frame ? (
                <img
                  src={`data:image/jpeg;base64,${streamData.frame}`}
                  alt="Batting Coach Live Stream"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 text-center p-8">
                  <div className="h-16 w-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                    <Activity className="h-8 w-8 text-zinc-600 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-300">Webcam Feed Standby</h4>
                    <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                      {isLive ? "Initializing camera grabber and VideoMAE neural engine..." : "Click 'Start Live Feed' above to begin real-time stroke analysis."}
                    </p>
                  </div>
                  {!isLive && (
                    <Button onClick={() => setIsLive(true)} size="sm" className="gap-2">
                      <Play className="h-3.5 w-3.5 fill-current" />
                      Start Practice
                    </Button>
                  )}
                </div>
              )}

              {/* AR HUD Overlay Badges */}
              {isLive && streamData && (
                <>
                  <div className="absolute top-3 left-3 flex flex-col gap-2 pointer-events-none">
                    <div className="flex items-center gap-2 bg-zinc-950/80 backdrop-blur-md border border-zinc-800 rounded-lg px-2.5 py-1 text-xs">
                      <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Target:</span>
                      <span className="font-semibold text-emerald-400">{currentMetadata.name}</span>
                    </div>
                  </div>

                  <div className="absolute top-3 right-3 flex flex-col items-end gap-2 pointer-events-none">
                    <div className={cn("px-2.5 py-1 rounded-lg text-xs font-semibold backdrop-blur-md", formRating.gradeColor)}>
                      Grade: {formRating.rating} ({formRating.label})
                    </div>
                  </div>
                </>
              )}

              {/* Stance prompt when sitting close or body out of frame */}
              {isLive && streamData && !isBodyDetected && (
                <div className="absolute top-12 left-1/2 -translate-x-1/2 pointer-events-none">
                  <div className="px-3 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-700/80 text-zinc-300 text-xs flex items-center gap-2 shadow-lg backdrop-blur-md">
                    <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Step back to show full batting stance</span>
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
                    className="absolute bottom-4 inset-x-4 pointer-events-none"
                  >
                    <div className={cn(
                      "p-3.5 rounded-xl backdrop-blur-xl border shadow-xl flex items-start gap-3 text-left",
                      persistentFeedback.status === "success" 
                        ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-100" 
                        : "bg-zinc-900/90 border-amber-500/50 text-zinc-100"
                    )}>
                      <div className={cn(
                        "h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                        persistentFeedback.status === "success" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                      )}>
                        {persistentFeedback.status === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold tracking-tight">{persistentFeedback.message}</span>
                          <Badge variant={persistentFeedback.status === "success" ? "success" : "warning"} className="text-[9px] py-0 px-1.5 h-3.5">
                            {persistentFeedback.tier || "Coaching Tip"}
                          </Badge>
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

            {/* Video Viewport Toolbar Footer */}
            <div className="p-3 bg-zinc-900/90 border-t border-zinc-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="text-zinc-400 font-medium">Detected:</span>
                <Badge variant="secondary" className="font-semibold text-zinc-200">
                  {streamData?.topShot ? streamData.topShot.replace("_", " ").toUpperCase() : "Awaiting Movement"}
                </Badge>
                {streamData?.confidence && (
                  <span className="text-zinc-500 mono text-[11px]">
                    Conf: {(streamData.confidence * 100).toFixed(0)}%
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px]">Cues</span>
                  <Switch checked={showAngles} onCheckedChange={setShowAngles} />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* ── Right Column: Biometrics & Telemetry (3 Cols) ──────────────────── */}
        <div className="col-span-3 flex flex-col gap-3 min-h-0">
          
          {/* Biometrics Card */}
          <Card className="bg-zinc-950/60 border-zinc-800/80">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-emerald-400" />
                  Live Biometrics
                </CardTitle>
                <Badge variant={!isBodyDetected ? "secondary" : bioData?.error_detected ? "destructive" : "success"} className="text-[10px]">
                  {!isBodyDetected ? "Stand in View" : bioData?.error_detected ? "Form Error" : "Form Stable"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-1 space-y-3">
              {!isBodyDetected ? (
                <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/80 text-center space-y-1">
                  <p className="text-xs text-zinc-300 font-medium">No Batter Stance Detected</p>
                  <p className="text-[11px] text-zinc-500 leading-snug">
                    Position your camera ~6-8 feet away so your torso and arms are clearly visible.
                  </p>
                </div>
              ) : (
                <>
                  {/* Elbow Angle */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-400">Front Elbow Angle</span>
                      <span className={cn("mono font-bold", isElbowGood ? "text-emerald-400" : "text-amber-400")}>
                        {elbowAngle}° <span className="text-zinc-500 font-normal">/ ≥{currentMetadata.targetElbowAngle}°</span>
                      </span>
                    </div>
                    <Progress value={Math.min((elbowAngle / 180) * 100, 100)} className="h-1.5 bg-zinc-800" indicatorClassName={isElbowGood ? "bg-emerald-500" : "bg-amber-500"} />
                  </div>

                  {/* Knee Bend Angle */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-400">Front Knee Flexion</span>
                      <span className={cn("mono font-bold", isKneeGood ? "text-emerald-400" : "text-amber-400")}>
                        {kneeAngle}° <span className="text-zinc-500 font-normal">/ ≤{currentMetadata.targetKneeAngle}°</span>
                      </span>
                    </div>
                    <Progress value={Math.min((kneeAngle / 180) * 100, 100)} className="h-1.5 bg-zinc-800" indicatorClassName={isKneeGood ? "bg-emerald-500" : "bg-blue-500"} />
                  </div>

                  {/* Head Tilt */}
                  <div className="flex justify-between items-center pt-1 text-xs">
                    <span className="text-zinc-400">Head Alignment</span>
                    <Badge variant={bioData && bioData.head_tilt < 0.20 ? "secondary" : "destructive"} className="text-[10px]">
                      {bioData ? (bioData.head_tilt < 0.20 ? "Aligned Over Line" : "Head Tilted") : "Analyzing..."}
                    </Badge>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Session Stats & Streak Card */}
          <Card className="bg-zinc-950/60 border-zinc-800/80">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span>Session Performance</span>
                <Flame className="h-4 w-4 text-amber-500" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800 text-center">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Total Reps</div>
                  <div className="text-xl font-bold mono text-zinc-100 mt-0.5">{repCount}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800 text-center">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Clean Streak</div>
                  <div className="flex items-center justify-center gap-1 mt-0.5">
                    <Flame className="h-4 w-4 text-amber-500 fill-amber-500" />
                    <span className="text-xl font-bold mono text-emerald-400">{streakCount}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Stroke History Log */}
          <Card className="flex-1 flex flex-col min-h-0 bg-zinc-950/60 border-zinc-800/80">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Activity Timeline</CardTitle>
                <Badge variant="outline" className="text-[10px]">{sessionLogs.length} Events</Badge>
              </div>
            </CardHeader>
            <Separator className="bg-zinc-800/80" />
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
                    className="p-2 rounded-lg bg-zinc-900/40 border border-zinc-800/60 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "h-2 w-2 rounded-full",
                        log.status === "success" ? "bg-emerald-500" : "bg-amber-500"
                      )} />
                      <div>
                        <div className="font-semibold text-zinc-200">{log.shot}</div>
                        <div className="text-[10px] text-zinc-500 mono">{log.time}</div>
                      </div>
                    </div>
                    <Badge variant={log.status === "success" ? "success" : "secondary"} className="mono text-[10px]">
                      {log.grade} ({(log.confidence * 100).toFixed(0)}%)
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </Card>

        </div>

      </div>

    </div>
  );
}
