"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  Play, Pause, Award, Target, Info, MessageSquare, 
  ChevronRight, RefreshCw, Activity, User, ShieldCheck,
  Cpu, BarChart3, Settings, HelpCircle, Triangle,
  Volume2, VolumeX
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// ──────────────────────────────────────────────────────────────────────────────
// Utilities
// ──────────────────────────────────────────────────────────────────────────────

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CLASS_NAMES = [
  "cover", "defense", "flick", "hook", "late_cut",
  "lofted", "pull", "square_cut", "straight", "sweep",
];

// ──────────────────────────────────────────────────────────────────────────────
// Components
// ──────────────────────────────────────────────────────────────────────────────

const HexButton = ({ name, active, onClick }: { name: string, active: boolean, onClick: () => void }) => (
  <motion.button
    whileHover={{ scale: 1.02, x: 5 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={cn(
      "w-full group relative flex items-center justify-between p-4 rounded-lg border transition-all duration-300 font-technical",
      active 
        ? "bg-emerald-500/10 border-emerald-500/60 text-emerald-400 glow-cyan shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]" 
        : "bg-white/[0.02] border-white/5 text-white/40 hover:border-white/20 hover:text-white/60"
    )}
  >
    <div className="flex items-center gap-4">
      <div className={cn(
        "w-2 h-2 rotate-45 transition-all duration-500",
        active ? "bg-emerald-400 scale-125" : "bg-white/10"
      )} />
      <span className="uppercase text-[11px] font-bold tracking-widest">{name.replace("_", " ")}</span>
    </div>
    {active && (
      <motion.div layoutId="active-indicator" className="absolute left-0 w-1 h-2/3 bg-emerald-500 rounded-full" />
    )}
  </motion.button>
);

const MetricGauge = ({ label, value, rating, color }: { label: string, value: string, rating: string, color: string }) => (
  <div className={cn("telemetry-border p-5 rounded-lg glass-obsidian flex flex-col gap-1", color)}>
    <span className="text-[10px] font-technical text-white/30 uppercase">{label}</span>
    <div className="flex items-baseline justify-between">
      <span className="text-2xl font-black italic tracking-tighter text-white">{value}</span>
      <span className={cn("text-xs font-technical border px-2 py-0.5 rounded", color)}>{rating}</span>
    </div>
  </div>
);

// ──────────────────────────────────────────────────────────────────────────────
// Main Dashboard
// ──────────────────────────────────────────────────────────────────────────────

export default function ObsidianCoachDashboard() {
  const [targetShot, setTargetShot] = useState("cover");
  const [streamData, setStreamData] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [persistentFeedback, setPersistentFeedback] = useState<any>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const feedbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSpokenRef = useRef<string>("");

  // Dynamic Rating Logic
  const formRating = useMemo(() => {
    if (!streamData?.probs) return { label: "N/A", rating: "--", color: "text-white/20 border-white/10" };
    
    const p = streamData.probs[targetShot] || 0;
    
    if (p > 0.8) return { label: "EXCELLENT", rating: "A+", color: "text-emerald-400 border-emerald-500/30" };
    if (p > 0.6) return { label: "PROFESSIONAL", rating: "A", color: "text-cyan-400 border-cyan-500/30" };
    if (p > 0.4) return { label: "GOOD FORM", rating: "B", color: "text-lime-400 border-lime-500/30" };
    if (p > 0.2) return { label: "IMPROVING", rating: "C", color: "text-amber-400 border-amber-500/30" };
    return { label: "TECHNICAL ERROR", rating: "F", color: "text-red-500 border-red-500/30" };
  }, [streamData, targetShot]);

  useEffect(() => {
    if (persistentFeedback && !isMuted) {
      const textToSpeak = `${persistentFeedback.message}. ${persistentFeedback.tips[0]}`;
      if (textToSpeak !== lastSpokenRef.current) {
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.cancel(); // Stop current speech
        window.speechSynthesis.speak(utterance);
        lastSpokenRef.current = textToSpeak;
      }
    }
  }, [persistentFeedback, isMuted]);

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
        const data = JSON.parse(event.data);
        setStreamData(data);
        
        if (data.feedback) {
          setPersistentFeedback(data.feedback);
          if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
          feedbackTimerRef.current = setTimeout(() => setPersistentFeedback(null), 8000);
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
  }, [isLive]);

  const handleShotChange = (shot: string) => {
    console.log("Shot selected:", shot);
    setTargetShot(shot);
    
    // Clear old feedback so the advisor refreshes immediately
    setPersistentFeedback(null);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    
    // Ensure isLive is true to initiate connection
    if (!isLive) {
      setIsLive(true);
    } else if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ target: shot }));
    }
  };

  return (
    <div className="h-screen w-full flex bg-[#030303] text-white p-4 gap-4 overflow-hidden selection:bg-emerald-500/30">
      
      {/* ── Left Sidebar: Mission Control ────────────────────────────────────── */}
      <aside className="w-80 flex flex-col gap-4 h-full">
        <div className="px-4 py-6 glass-obsidian rounded-2xl flex flex-col gap-6 items-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center glow-cyan">
            <Cpu className="w-10 h-10 text-black stroke-[2.5]" />
          </div>
          <div className="text-center">
            <h1 className="font-technical text-sm font-black tracking-[0.3em] uppercase mb-1">C.O.A.C.H</h1>
            <p className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-medium">Synthetic Intelligence Link</p>
          </div>
        </div>

        <div className="flex-1 glass-obsidian rounded-2xl p-4 overflow-y-auto space-y-2 custom-scrollbar">
          <div className="flex items-center gap-2 mb-4 px-2">
            <Target className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] font-technical text-white/30 uppercase">Practice Modules</span>
          </div>
          {CLASS_NAMES.map((shot) => (
            <HexButton 
              key={shot} 
              name={shot} 
              active={targetShot === shot} 
              onClick={() => handleShotChange(shot)} 
            />
          ))}
        </div>
        
        <div className="flex justify-between px-2">
           <div className="flex gap-4">
              <Settings className="w-4 h-4 text-white/20 cursor-pointer hover:text-white/60 transition-colors" />
              <HelpCircle className="w-4 h-4 text-white/20 cursor-pointer hover:text-white/60 transition-colors" />
           </div>
           <span className="text-[9px] font-technical text-white/10 uppercase">System v4.2.1-OBB</span>
        </div>
      </aside>

      {/* ── Main Operations Feed ────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col gap-4 h-full relative">
        
        {/* Cinematic Video Layer */}
        <div className="flex-1 relative glass-obsidian rounded-[2rem] overflow-hidden group shadow-[0_0_100px_rgba(0,0,0,1)] border border-white/5">
          <div className="scanline" />
          
          {streamData?.frame ? (
            <img 
              src={`data:image/jpeg;base64,${streamData.frame}`} 
              alt="Live Feed"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-8 bg-black">
               <motion.div 
                 animate={{ rotate: 360 }} 
                 transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                 className="relative w-32 h-32"
               >
                 <div className="absolute inset-0 border-2 border-emerald-500/20 rounded-full" />
                 <div className="absolute inset-0 border-t-2 border-emerald-500 rounded-full" />
               </motion.div>
               <div className="text-center space-y-2">
                 <p className="text-xs font-technical text-white/40 uppercase tracking-[0.3em]">Awaiting Visual Input</p>
                 <p className="text-[10px] text-emerald-400 alpha-pulse uppercase font-medium">Link Established: Port 8888</p>
               </div>
            </div>
          )}

          {/* Holographic Overlays */}
          <div className="absolute inset-x-8 top-8 flex justify-between pointer-events-none">
             <div className="flex flex-col gap-4">
                <MetricGauge 
                  label="Dynamic Form Rating" 
                  value={formRating.label} 
                  rating={formRating.rating}
                  color={formRating.color}
                />
                <div className="flex gap-2">
                   <div className="px-3 py-1 bg-white/5 backdrop-blur-md rounded border border-white/10 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,1)]" />
                      <span className="text-[9px] font-technical uppercase">Live Telemetry</span>
                   </div>
                   <div className="px-3 py-1 bg-white/5 backdrop-blur-md rounded border border-white/10">
                      <span className="text-[9px] font-technical uppercase text-white/40">FPS: 30.0</span>
                   </div>
                </div>
             </div>
             
             <div className="flex flex-col items-end gap-4">
                <div className="telemetry-border p-4 glass-obsidian rounded-lg flex flex-col items-end">
                   <span className="text-[10px] font-technical text-white/30 uppercase mb-1">Target Efficiency</span>
                   <span className="text-lg font-black text-emerald-400 text-glow">{(streamData?.probs?.[targetShot] * 100 || 0).toFixed(1)}%</span>
                </div>
                <div className="w-48 p-2 glass-obsidian rounded-lg border border-white/5">
                   <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        animate={{ width: `${(streamData?.probs?.[targetShot] * 100 || 0)}%` }}
                        className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
                      />
                   </div>
                </div>
             </div>
          </div>

          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-[500px] pointer-events-none">
            <AnimatePresence mode="wait">
              {persistentFeedback && (
                <motion.div
                  key={persistentFeedback.message}
                  initial={{ opacity: 0, scale: 0.95, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -20 }}
                  className={cn(
                    "p-6 rounded-2xl glass-obsidian border-t-2 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] transition-colors duration-500",
                    persistentFeedback.status === "success" ? "border-emerald-500/40" : "border-amber-500/40"
                  )}
                >
                  <p className="text-xs font-bold text-white mb-2 uppercase tracking-wide">{persistentFeedback.message}</p>
                  <div className="flex items-start gap-4 p-3 bg-white/[0.03] rounded-lg">
                    <div className="w-1 h-full bg-emerald-500/50 rounded-full mt-1" />
                    <p className="text-[11px] text-white/50 leading-relaxed italic">{persistentFeedback.tips[0]}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Action Bar */}
        <div className="h-24 px-8 glass-obsidian rounded-3xl flex items-center justify-between border border-white/5">
           <div className="flex gap-16">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-technical text-white/30 uppercase">Neural Stream</span>
                <div className="flex items-center gap-2">
                   <span className={cn("w-1.5 h-1.5 rounded-full transition-all duration-300", isConnected ? "bg-emerald-500 glow-cyan" : "bg-red-500")} />
                   <span className="text-xs font-bold font-technical tracking-widest">{isConnected ? "ONLINE" : "LINK TERMINATED"}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-technical text-white/30 uppercase">Detected Action</span>
                <span className="text-xs font-bold text-white font-technical">{streamData?.topShot?.replace("_", " ") || "---"}</span>
              </div>
           </div>

           <div className="flex items-center gap-6">
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className={cn(
                  "p-3 rounded-full border transition-all",
                  isMuted ? "border-red-500/30 text-red-500" : "border-white/10 text-white/40 hover:text-white"
                )}
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>

              <button 
                onClick={() => setIsLive(!isLive)}
                className={cn(
                  "relative group px-10 py-3 rounded-full font-technical text-[11px] font-black tracking-[0.2em] transition-all",
                  isLive 
                    ? "bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500/20" 
                    : "bg-emerald-500 text-black hover:scale-105 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                )}
              >
                {isLive ? "TERMINATE" : "INITIATE COACH"}
              </button>
              
              <div className="w-px h-8 bg-white/10" />
              
              <div className="flex items-center gap-4">
                 <div className="flex flex-col items-end">
                    <span className="text-[9px] font-technical text-white/20 uppercase">Athlete</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest">ARNAV_P</span>
                 </div>
                 <div className="w-10 h-10 rounded-full border border-white/10 p-0.5">
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-emerald-500/20 to-transparent flex items-center justify-center">
                       <User className="w-5 h-5 text-white/40" />
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </main>

      {/* ── Right Panel: Performance Analytics ───────────────────────────────── */}
      <aside className="w-96 flex flex-col gap-4">
        
        <div className="glass-obsidian rounded-[2rem] p-6 flex flex-col gap-8 h-1/2">
          <div className="flex justify-between items-center">
            <h3 className="text-[10px] font-technical uppercase tracking-[0.2em] text-white/30">System Analytics</h3>
            <BarChart3 className="w-4 h-4 text-emerald-500/40" />
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto custom-scrollbar pr-4">
             {CLASS_NAMES.map((shot) => (
                <div key={shot} className="space-y-2">
                   <div className="flex justify-between text-[9px] font-technical uppercase">
                      <span className={shot === targetShot ? "text-emerald-400" : "text-white/40"}>{shot}</span>
                      <span className="text-white/20">{(streamData?.probs?.[shot] * 100 || 0).toFixed(0)}%</span>
                   </div>
                   <div className="h-0.5 w-full bg-white/[0.02] rounded-full overflow-hidden">
                      <motion.div 
                        animate={{ width: `${(streamData?.probs?.[shot] * 100 || 0)}%` }}
                        className={cn("h-full transition-all duration-700", shot === targetShot ? "bg-emerald-500" : "bg-white/10")} 
                      />
                   </div>
                </div>
             ))}
          </div>
        </div>

        <div className="glass-obsidian rounded-[2rem] flex-1 p-6 flex flex-col gap-6 relative overflow-hidden">
           <div className="flex justify-between items-center">
            <h3 className="text-[10px] font-technical uppercase tracking-[0.2em] text-white/30">Advisory Feed</h3>
            <MessageSquare className="w-4 h-4 text-emerald-500/40" />
          </div>

          <div className="flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2">
             {!persistentFeedback ? (
               <div className="h-full flex flex-col items-center justify-center text-center p-8 gap-4">
                  <div className="w-12 h-12 rounded-full border border-white/5 flex items-center justify-center">
                    <Activity className="w-6 h-6 text-white/5" />
                  </div>
                  <p className="text-[10px] font-technical text-white/20 uppercase tracking-widest leading-loose">Awaiting sufficient frame data for technical feedback</p>
               </div>
             ) : (
               persistentFeedback.tips.map((tip: string, i: number) => (
                 <motion.div 
                   key={i}
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex gap-4 group"
                 >
                    <div className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0 text-[10px] font-black border border-emerald-500/20">
                      {i + 1}
                    </div>
                    <p className="text-[11px] leading-relaxed text-white/60 tracking-tight font-medium uppercase">{tip}</p>
                 </motion.div>
               ))
             )}
          </div>
          
          <div className="pt-6 border-t border-white/5">
             <div className="flex justify-between items-center px-2">
                <span className="text-[10px] font-technical text-white/20 uppercase">Confidence</span>
                <span className="text-[10px] font-technical text-emerald-400">OPTIMIZIED</span>
             </div>
          </div>
        </div>

      </aside>
    </div>
  );
}
