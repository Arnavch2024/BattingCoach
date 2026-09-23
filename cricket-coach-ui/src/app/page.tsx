"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { 
  Play, Activity, Zap, CheckCircle2, Shield, Award, Cpu, 
  ArrowRight, ChevronLeft, ChevronRight, User, 
  LogIn, X, Lock, Mail, Video, Eye, EyeOff, Dumbbell, Compass,
  Volume2, Flame, BarChart3, Layers, Check, LogOut, ArrowUpRight,
  TrendingUp, Radio, Target, Sparkles, SlidersHorizontal, RefreshCw, Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "../lib/utils";
import { TrainingCalendarModal } from "@/components/TrainingCalendarModal";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CricketScrollAnimation } from "@/components/CricketScrollAnimation";
import { API_BASE_URL } from "@/lib/api-config";

// ──────────────────────────────────────────────────────────────────────────────
// High-Definition Cricket Stadium & Match Photography
// ──────────────────────────────────────────────────────────────────────────────

const HERO_SLIDES = [
  {
    id: 1,
    url: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=2000&q=85",
    tag: "STADIUM SENSORS",
    title: "Floodlit Cricket Arena",
    subtitle: "Real-time 3D skeletal posture tracking with zero physical body sensors.",
  },
  {
    id: 2,
    url: "/images/front-elbow-alignment.jpg",
    tag: "DRIVE PRECISION",
    title: "Front Elbow Alignment",
    subtitle: "Instant lead elbow elevation measurement ensuring textbook vertical presentation.",
  },
  {
    id: 3,
    url: "https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?auto=format&fit=crop&w=2000&q=85",
    tag: "POWER & CROSS-BAT",
    title: "Kinematic Weight Transfer",
    subtitle: "Measure back-foot load and hip pivot during pull and hook execution.",
  },
  {
    id: 4,
    url: "https://images.unsplash.com/photo-1593341646782-e0b495cff86d?auto=format&fit=crop&w=2000&q=85",
    tag: "NEURAL CLASSIFIER",
    title: "VideoMAE Spatiotemporal AI",
    subtitle: "Deep 16-frame action recognition model fine-tuned on professional stroke footage.",
  },
  {
    id: 5,
    url: "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=2000&q=85",
    tag: "SEAM & ROTATION",
    title: "Ball Spin & Trajectory Telemetry",
    subtitle: "High-precision rotational ball tracking, seam orientation analysis, and dynamic trajectory prediction.",
  }
];

// ──────────────────────────────────────────────────────────────────────────────
// Stroke Directory Data
// ──────────────────────────────────────────────────────────────────────────────

const SHOT_MODULES = [
  { id: "cover", name: "Cover Drive", category: "Drives", targetElbow: "≥ 130°", targetKnee: "≤ 155°", difficulty: "Intermediate", cue: "Head over lead knee with high elbow extension." },
  { id: "straight", name: "Straight Drive", category: "Drives", targetElbow: "≥ 135°", targetKnee: "≤ 155°", difficulty: "Foundational", cue: "Full vertical blade presentation straight down the line." },
  { id: "pull", name: "Pull Shot", category: "Power", targetElbow: "≥ 120°", targetKnee: "≤ 160°", difficulty: "Intermediate", cue: "Back foot pivot with full horizontal arm extension." },
  { id: "hook", name: "Hook Shot", category: "Power", targetElbow: "≥ 115°", targetKnee: "≤ 165°", difficulty: "Advanced", cue: "Torso hip rotation with downward wrist roll over impact." },
  { id: "square_cut", name: "Square Cut", category: "Power", targetElbow: "≥ 125°", targetKnee: "≤ 160°", difficulty: "Intermediate", cue: "Step back & across, sharp blade slice behind point." },
  { id: "lofted", name: "Lofted Drive", category: "Power", targetElbow: "≥ 140°", targetKnee: "≤ 150°", difficulty: "Advanced", cue: "Vertical swing plane with clean extension and high finish." },
  { id: "defense", name: "Forward Defense", category: "Technical", targetElbow: "110°", targetKnee: "≤ 150°", difficulty: "Foundational", cue: "Soft impact hands, solid bat face adjacent to front pad." },
  { id: "late_cut", name: "Late Cut", category: "Technical", targetElbow: "115°", targetKnee: "≤ 160°", difficulty: "Advanced", cue: "Feather touch guidance past slips with supple wrists." },
  { id: "flick", name: "Wrist Flick", category: "Whips", targetElbow: "≥ 125°", targetKnee: "≤ 155°", difficulty: "Intermediate", cue: "Snappy forearm roll through the mid-wicket corridor." },
  { id: "sweep", name: "Sweep Shot", category: "Sweeps", targetElbow: "≥ 120°", targetKnee: "≤ 145°", difficulty: "Intermediate", cue: "Deep back-knee crouch with flat horizontal blade sweep." },
];

interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
  provider: "google" | "email";
  stance: "Right-Hand Batter" | "Left-Hand Batter";
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

// Decode JWT token from Google Identity Services
const parseJwt = (token: string) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("JWT Decode error:", e);
    return null;
  }
};

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedShotCategory, setSelectedShotCategory] = useState<string>("All");

  // Form State
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authStance, setAuthStance] = useState<"Right-Hand Batter" | "Left-Hand Batter">("Right-Hand Batter");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load user from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("batcoach_user");
      if (stored) {
        setUserProfile(JSON.parse(stored));
      } else {
        const defaultUser: UserProfile = {
          name: "Arnav P.",
          email: "arnav.player@gmail.com",
          provider: "google",
          stance: "Right-Hand Batter"
        };
        setUserProfile(defaultUser);
        localStorage.setItem("batcoach_user", JSON.stringify(defaultUser));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Background Slider Auto-cycle
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  const syncUserToSupabase = async (user: UserProfile) => {
    try {
      await fetch(`${API_BASE_URL}/api/athlete/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          name: user.name,
          stance: user.stance,
          experience_level: "Club Cricketer",
        }),
      });
    } catch (e) {
      console.error("Supabase sync notice:", e);
    }
  };

  const handleCredentialResponse = async (response: any) => {
    if (response?.credential) {
      const payload = parseJwt(response.credential);
      if (payload) {
        const googleUser: UserProfile = {
          name: payload.name || payload.given_name || "Athlete",
          email: payload.email,
          avatar: payload.picture,
          provider: "google",
          stance: authStance,
        };
        setUserProfile(googleUser);
        localStorage.setItem("batcoach_user", JSON.stringify(googleUser));
        await syncUserToSupabase(googleUser);
        setIsSignInOpen(false);
      }
    }
  };

  // Initialize Google GSI Button
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).google && isSignInOpen) {
      try {
        (window as any).google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
        });
        const btnContainer = document.getElementById("googleOfficialButton");
        if (btnContainer) {
          btnContainer.innerHTML = "";
          (window as any).google.accounts.id.renderButton(btnContainer, {
            theme: "outline",
            size: "large",
            shape: "rectangular",
            width: 320,
            text: "continue_with",
          });
        }
      } catch (err) {
        console.error("Google Sign-In initialization:", err);
      }
    }
  }, [isSignInOpen, authStance]);

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    const googleUser: UserProfile = {
      name: authName.trim() || "Arnav P.",
      email: authEmail.includes("@") ? authEmail : "arnav.player@gmail.com",
      provider: "google",
      stance: authStance,
    };
    setUserProfile(googleUser);
    localStorage.setItem("batcoach_user", JSON.stringify(googleUser));
    await syncUserToSupabase(googleUser);
    setIsSubmitting(false);
    setIsSignInOpen(false);
  };

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const emailUser: UserProfile = {
      name: authName.trim() || (authEmail.split("@")[0].toUpperCase() || "Athlete"),
      email: authEmail || "athlete@batcoach.ai",
      provider: "email",
      stance: authStance,
    };
    setUserProfile(emailUser);
    localStorage.setItem("batcoach_user", JSON.stringify(emailUser));
    await syncUserToSupabase(emailUser);
    setIsSubmitting(false);
    setIsSignInOpen(false);
  };

  const handleSignOut = () => {
    setUserProfile(null);
    localStorage.removeItem("batcoach_user");
  };

  const filteredShots = useMemo(() => {
    if (selectedShotCategory === "All") return SHOT_MODULES;
    return SHOT_MODULES.filter((s) => s.category === selectedShotCategory);
  }, [selectedShotCategory]);

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 dark:bg-[#09090b] dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200 selection:bg-emerald-500/20 selection:text-emerald-700 dark:selection:text-emerald-300 relative">
      
      {/* ── Left Corner Kinetic Cricket Bat & Dropping Ball Scroll Animation ── */}
      <CricketScrollAnimation />

      {/* ── Fixed Studio Navigation Bar ──────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 h-16 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-xl border-b border-slate-200/90 dark:border-zinc-800/80 z-50 px-6 lg:px-12 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-3">
          <img
            src="/bat-icon.jpg"
            alt="BatCoach Logo"
            className="h-9 w-9 rounded-xl object-cover border border-emerald-500/40 shadow-sm shadow-emerald-500/10"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">BatCoach AI Pro</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                v2.0
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-zinc-400 hidden sm:block">Olympic-Grade Batting Biomechanics & Stroke AI</p>
          </div>
        </div>

        {/* Center Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-xs text-slate-600 dark:text-zinc-300 font-medium">
          <a href="#hero" className="hover:text-emerald-600 dark:hover:text-white transition-colors">Overview</a>
          <a href="#demo-preview" className="hover:text-emerald-600 dark:hover:text-white transition-colors">Biomechanics Engine</a>
          <a href="#modules" className="hover:text-emerald-600 dark:hover:text-white transition-colors">Stroke Syllabus</a>
        </nav>

        {/* Right CTA / Athlete Profile / Theme Toggle */}
        <div className="flex items-center gap-2.5">
          <ThemeToggle />

          {userProfile ? (
            <div className="flex items-center gap-2 bg-slate-100/90 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 rounded-xl p-1 pr-3 text-xs transition-colors">
              <div className="h-7 w-7 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white text-[11px] shadow-sm">
                {userProfile.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="text-left hidden sm:block leading-tight">
                <div className="text-xs font-semibold text-slate-900 dark:text-zinc-200">{userProfile.name}</div>
                <div className="text-[10px] text-slate-500 dark:text-zinc-500">{userProfile.stance}</div>
              </div>
              <button 
                onClick={handleSignOut}
                title="Sign Out"
                className="ml-2 text-slate-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400 transition-colors cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setAuthMode("signin"); setIsSignInOpen(true); }}
              className="text-slate-700 dark:text-zinc-200 border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs gap-1.5 font-medium rounded-xl"
            >
              <LogIn className="h-3.5 w-3.5" />
              Sign In
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCalendarOpen(true)}
            className="text-xs border-emerald-500/30 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60 dark:hover:text-white gap-1.5 font-medium rounded-xl transition-all"
          >
            <Calendar className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Training Schedule</span>
            <span className="sm:hidden">Calendar</span>
          </Button>

          <Link href="/coach">
            <Button size="sm" className="gap-1.5 font-semibold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 hover:shadow-emerald-600/30 rounded-xl transition-all">
              <Play className="h-3 w-3 fill-current" />
              Launch Live Coach
            </Button>
          </Link>
        </div>
      </header>

      {/* ── Dynamic Hero with Active Image Slider ─────────────────────── */}
      <section id="hero" className="relative min-h-[92vh] flex items-center justify-center pt-24 pb-16 px-6 lg:px-12 overflow-hidden">
        
        {/* Dynamic Stadium Background Slider */}
        <div className="absolute inset-0 z-0 overflow-hidden bg-slate-100 dark:bg-zinc-950">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <img
                src={HERO_SLIDES[currentSlide].url}
                alt={HERO_SLIDES[currentSlide].title}
                className="w-full h-full object-cover object-center opacity-70 sm:opacity-85 dark:opacity-40 saturate-125 contrast-[1.03]"
              />
            </motion.div>
          </AnimatePresence>

          {/* Athletic stadium lighting / subtle glow */}
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-emerald-400/25 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Left reading scrim: ensures crystal-clear text contrast while stadium shines through */}
          <div className="absolute inset-y-0 left-0 w-full lg:w-[60%] bg-gradient-to-r from-white/95 via-white/85 to-transparent dark:from-[#09090b]/95 dark:via-[#09090b]/80 dark:to-transparent pointer-events-none" />

          {/* Subtle top nav blur transition */}
          <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-white/80 via-white/30 to-transparent dark:from-[#09090b]/80 dark:via-[#09090b]/20 dark:to-transparent pointer-events-none" />

          {/* Bottom seamless blend into next section */}
          <div className="absolute bottom-0 inset-x-0 h-36 bg-gradient-to-t from-slate-50 via-slate-50/70 to-transparent dark:from-[#09090b] dark:via-[#09090b]/80 dark:to-transparent pointer-events-none" />
        </div>

        {/* Hero Content Container */}
        <div className="relative z-10 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center mt-6">
          
          {/* Left Column: Value Proposition */}
          <div className="lg:col-span-7 flex flex-col items-start text-left gap-5">
            
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-400 text-xs font-semibold backdrop-blur-md shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span>3D Euclidean Pose & VideoMAE Vision Transformer</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]">
              Textbook Batting Form. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 dark:from-emerald-400 dark:via-teal-300 dark:to-cyan-300">
                Zero Body Sensors.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-200 max-w-xl leading-relaxed">
              Transform any standard laptop or webcam into an Olympic-grade batting laboratory. Measures <strong className="text-slate-900 dark:text-white">3D front elbow elevation</strong>, <strong className="text-slate-900 dark:text-white">lead knee flexion</strong>, and classifies 10 cricket stroke mechanics with instant spoken feedback.
            </p>

            {/* CTA Buttons with Spring Micro-Animations */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2 w-full sm:w-auto">
              <Link href="/coach">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                  <Button size="lg" className="gap-2 text-sm font-bold h-12 px-7 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 rounded-xl cursor-pointer">
                    <Play className="h-4 w-4 fill-current" />
                    Start Live Session
                    <ArrowRight className="h-4 w-4 ml-0.5" />
                  </Button>
                </motion.div>
              </Link>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={() => setIsCalendarOpen(true)}
                  className="text-sm font-semibold h-12 px-6 bg-white hover:bg-slate-100 text-slate-800 border-slate-200 dark:bg-emerald-950/40 dark:border-emerald-500/40 dark:text-emerald-300 dark:hover:bg-emerald-900/50 backdrop-blur-md gap-2 shadow-sm rounded-xl cursor-pointer"
                >
                  <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Training Schedule
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={() => { setAuthMode("signin"); setIsSignInOpen(true); }}
                  className="text-sm font-semibold h-12 px-6 bg-white hover:bg-slate-100 text-slate-700 border-slate-200 dark:bg-zinc-900/80 dark:border-zinc-700 dark:text-zinc-200 backdrop-blur-md rounded-xl shadow-sm cursor-pointer"
                >
                  Athlete Portal
                </Button>
              </motion.div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 pt-4 w-full max-w-lg border-t border-slate-200 dark:border-zinc-800/80 mt-2">
              <div>
                <div className="text-xl font-bold text-slate-900 dark:text-white mono">24 FPS</div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400">Locked Stream Rate</div>
              </div>
              <div>
                <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mono">&lt; 15ms</div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400">FP16 CUDA Latency</div>
              </div>
              <div>
                <div className="text-xl font-bold text-teal-600 dark:text-cyan-400 mono">10 Strokes</div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400">Classified Live</div>
              </div>
            </div>

          </div>

          {/* Right Column: Interactive Biomechanics Radar Preview */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            
            <div className="relative rounded-2xl bg-white/95 dark:bg-zinc-950/90 border border-slate-200/90 dark:border-zinc-800/90 p-5 shadow-xl shadow-slate-200/50 dark:shadow-2xl backdrop-blur-xl space-y-4 transition-colors">
              
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Live Biometrics Radar</span>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono py-0 px-2 bg-slate-100 dark:bg-cyan-950 text-slate-700 dark:text-cyan-300 border-slate-200 dark:border-cyan-500/30">
                  Active Stance Check
                </Badge>
              </div>

              {/* Simulated Skeleton & Angle HUD */}
              <div className="relative h-56 rounded-xl bg-slate-100/80 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 overflow-hidden flex items-center justify-center p-4 transition-colors">
                
                {/* Visual Grid Lines */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#64748b15_1px,transparent_1px),linear-gradient(to_bottom,#64748b15_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#27272a15_1px,transparent_1px),linear-gradient(to_bottom,#27272a15_1px,transparent_1px)] bg-[size:24px_24px]" />
                
                {/* Biomechanics Vectors Visual */}
                <div className="relative z-10 w-full flex items-center justify-between px-2">
                  
                  {/* Lead Elbow Gauge */}
                  <div className="flex flex-col items-center gap-1 bg-white/95 dark:bg-zinc-950/90 border border-emerald-500/40 rounded-xl p-3 shadow-md">
                    <div className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-semibold">Lead Elbow</div>
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mono">134.2°</div>
                    <div className="text-[9px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      TARGET: ≥ 130° (PASS)
                    </div>
                  </div>

                  {/* Dynamic Pose Icon */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-16 w-16 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <Target className="h-8 w-8 animate-pulse" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300">Cover Drive Stance</span>
                  </div>

                  {/* Lead Knee Gauge */}
                  <div className="flex flex-col items-center gap-1 bg-white/95 dark:bg-zinc-950/90 border border-teal-500/40 rounded-xl p-3 shadow-md">
                    <div className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-semibold">Lead Knee</div>
                    <div className="text-2xl font-black text-teal-600 dark:text-teal-400 mono">148.6°</div>
                    <div className="text-[9px] text-teal-700 dark:text-teal-400 font-bold bg-teal-50 dark:bg-teal-500/10 px-1.5 py-0.5 rounded">
                      TARGET: ≤ 155° (PASS)
                    </div>
                  </div>

                </div>

                {/* Bottom Overlay Toast */}
                <div className="absolute bottom-2 inset-x-2 bg-white/95 dark:bg-zinc-950/90 border border-slate-200 dark:border-zinc-800 rounded-lg py-1.5 px-3 flex items-center justify-between text-[11px] shadow-sm">
                  <span className="text-slate-500 dark:text-zinc-400">Form Rating:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 mono">A+ (Elite Technical Follow-Through)</span>
                </div>

              </div>

              {/* Shot Probabilities Simulation */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-700 dark:text-zinc-300 font-medium">
                  <span>Detected Stroke: <strong className="text-slate-900 dark:text-white">Cover Drive</strong></span>
                  <span className="text-emerald-600 dark:text-emerald-400 mono">94.8% Confidence</span>
                </div>
                <div className="h-2 w-full bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full w-[94.8%]" />
                </div>
              </div>

            </div>

            {/* Slider Switcher & Thumbnail Indicator */}
            <div className="flex items-center justify-between bg-white/95 dark:bg-zinc-950/90 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 px-4 shadow-sm backdrop-blur-md transition-colors">
              <div className="flex items-center gap-2.5">
                <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Slide:</span>
                <span className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[130px] sm:max-w-none">{HERO_SLIDES[currentSlide].title}</span>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Dots indicator */}
                <div className="flex items-center gap-1.5 mr-1.5">
                  {HERO_SLIDES.map((slide, idx) => (
                    <button
                      key={slide.id}
                      onClick={() => setCurrentSlide(idx)}
                      className={cn(
                        "h-2 rounded-full transition-all cursor-pointer",
                        currentSlide === idx 
                          ? "w-5 bg-emerald-600 dark:bg-emerald-400" 
                          : "w-2 bg-slate-300 dark:bg-zinc-700 hover:bg-slate-400 dark:hover:bg-zinc-600"
                      )}
                      aria-label={`Jump to slide ${idx + 1}`}
                      title={slide.title}
                    />
                  ))}
                </div>

                <button
                  onClick={() => setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer"
                  aria-label="Previous Slide"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer"
                  aria-label="Next Slide"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

          </div>

        </div>

      </section>

      {/* ── Biomechanics Engine & Technical Architecture ─────────────────────── */}
      <section id="demo-preview" className="py-20 px-6 lg:px-12 bg-white dark:bg-zinc-950 border-t border-slate-200 dark:border-zinc-800 transition-colors">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Engineering Specs</span>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Why 3D Metric Space Replaces 2D Screen Landmark Tracking
            </h2>
            <p className="text-sm text-slate-600 dark:text-zinc-400">
              Traditional computer vision calculates 2D pixel angles that distort whenever the camera tilts. BatCoach AI computes true Euclidean metric vectors in meters.
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
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Perspective-Invariant Vectors</h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                Utilizes MediaPipe <code>pose_world_landmarks</code> to reconstruct the athlete's 3D skeletal frame in physical meter coordinates, ensuring identical angle accuracy regardless of camera height.
              </p>
            </motion.div>

            <motion.div 
              whileHover={{ y: -4, transition: { type: "spring", stiffness: 350, damping: 20 } }}
              className="p-6 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/90 dark:border-zinc-800 hover:border-cyan-500/40 hover:shadow-md transition-all space-y-3"
            >
              <div className="h-10 w-10 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Kinetic Swing Motion State Machine</h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                Tracks wrist acceleration and follow-through deceleration (<code>IDLE</code> $\rightarrow$ <code>SWINGING</code> $\rightarrow$ <code>COMPLETED</code>). Reps and audio tips are only triggered on actual physical bat strokes.
              </p>
            </motion.div>

            <motion.div 
              whileHover={{ y: -4, transition: { type: "spring", stiffness: 350, damping: 20 } }}
              className="p-6 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/90 dark:border-zinc-800 hover:border-teal-500/40 hover:shadow-md transition-all space-y-3"
            >
              <div className="h-10 w-10 rounded-xl bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-400">
                <Database className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Supabase PostgreSQL Sync</h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                Persists athlete records, practice session duration, accuracy rate, best streak, and individual stroke biomechanics directly into PostgreSQL tables.
              </p>
            </motion.div>

          </div>

        </div>
      </section>

      {/* ── Supported Stroke Syllabus ────────────────────────────────────────── */}
      <section id="modules" className="py-20 px-6 lg:px-12 bg-slate-50 dark:bg-[#09090b] border-t border-slate-200 dark:border-zinc-800 transition-colors">
        <div className="max-w-6xl mx-auto space-y-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">10-Stroke Syllabus</span>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Supported Stroke Directory</h2>
              <p className="text-xs text-slate-600 dark:text-zinc-400">Select any category to inspect target technical angles.</p>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-200/80 dark:bg-zinc-900 border border-slate-300/80 dark:border-zinc-800 p-1 rounded-xl text-xs">
              {["All", "Drives", "Power", "Technical", "Whips"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedShotCategory(cat)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer",
                    selectedShotCategory === cat 
                      ? "bg-white dark:bg-emerald-500 text-slate-900 dark:text-white font-bold shadow-sm" 
                      : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredShots.map((shot) => (
              <motion.div
                key={shot.id}
                whileHover={{ y: -4, transition: { type: "spring", stiffness: 400, damping: 20 } }}
                className="p-5 rounded-2xl bg-white dark:bg-zinc-950 border border-slate-200/90 dark:border-zinc-800/90 hover:border-emerald-500/50 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4 group cursor-pointer"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {shot.name}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400">
                      {shot.difficulty}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">{shot.cue}</p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-zinc-800/80 text-[11px]">
                  <span className="text-slate-500 dark:text-zinc-500 uppercase font-semibold">{shot.category}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600 dark:text-zinc-400">Elbow: <strong className="text-emerald-600 dark:text-emerald-400 mono">{shot.targetElbow}</strong></span>
                    <span className="text-slate-600 dark:text-zinc-400">Knee: <strong className="text-teal-600 dark:text-teal-400 mono">{shot.targetKnee}</strong></span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="mt-auto border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-12 px-6 lg:px-12 text-xs text-slate-500 dark:text-zinc-500 transition-colors">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="flex items-center gap-3">
            <img
              src="/bat-icon.jpg"
              alt="BatCoach Logo"
              className="h-7 w-7 rounded-lg object-cover border border-emerald-500/40"
            />
            <div>
              <span className="font-bold text-sm text-slate-900 dark:text-zinc-200">BatCoach AI Pro</span>
              <p className="text-[10px] text-slate-500 dark:text-zinc-500">Real-Time Batting Biomechanics & Stroke Intelligence</p>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-xs text-slate-600 dark:text-zinc-400">
            <Link href="/coach" className="hover:text-emerald-600 dark:hover:text-white transition-colors">Launch Coaching Session</Link>
            <a href="#hero" className="hover:text-emerald-600 dark:hover:text-white transition-colors">Overview</a>
            <a href="#modules" className="hover:text-emerald-600 dark:hover:text-white transition-colors">Stroke Syllabus</a>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-zinc-500">
            © 2026 BatCoach AI Pro. Built with VideoMAE & MediaPipe.
          </div>

        </div>
      </footer>

      {/* ── Athlete Sign In Modal with Direct Google & Email Auth ───────────── */}
      <AnimatePresence>
        {isSignInOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSignInOpen(false)}
              className="absolute inset-0 bg-black/60 dark:bg-black/85 backdrop-blur-md"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl p-7 shadow-2xl z-10 space-y-6 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img src="/bat-icon.jpg" alt="Logo" className="h-8 w-8 rounded-lg object-cover border border-emerald-500/40 shadow-sm" />
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">Athlete Portal</h3>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">Sign in to sync your batting reps & stats</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsSignInOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Direct Google Gmail Sign In Button */}
              <div className="space-y-3">
                {/* Official Google Identity Services One-Tap / Standard Button */}
                <div id="googleOfficialButton" className="flex justify-center w-full min-h-[40px]" />

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-white text-slate-900 dark:text-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-100 font-bold text-xs transition-all shadow-sm active:scale-[0.99] cursor-pointer"
                >
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>1-Click Google Sign In</span>
                </button>

                <div className="relative flex items-center justify-center my-3">
                  <div className="border-t border-slate-200 dark:border-zinc-800 w-full" />
                  <span className="bg-white dark:bg-zinc-950 px-3 text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-widest font-bold">
                    Or Athlete Email
                  </span>
                  <div className="border-t border-slate-200 dark:border-zinc-800 w-full" />
                </div>
              </div>

              {/* Email Form */}
              <form onSubmit={handleEmailAuthSubmit} className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 block mb-1">Athlete Name</label>
                  <input
                    type="text"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder="e.g. Virat Kohli"
                    required
                    className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="athlete@cricketcoach.ai"
                    required
                    className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 block mb-1">Batting Stance</label>
                  <select
                    value={authStance}
                    onChange={(e: any) => setAuthStance(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Right-Hand Batter">Right-Hand Batter</option>
                    <option value="Left-Hand Batter">Left-Hand Batter</option>
                  </select>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-10 mt-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold"
                >
                  {isSubmitting ? "Signing In..." : "Save Athlete Profile & Enter"}
                </Button>
              </form>

            </motion.div>

          </div>
        )}
      </AnimatePresence>

      {/* ── Athlete Training Calendar & Google Calendar Modal ───────────────── */}
      <TrainingCalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        userEmail={userProfile?.email}
        userName={userProfile?.name}
        onLaunchShot={(shotId) => {
          window.location.href = `/coach?shot=${shotId}`;
        }}
      />

    </div>
  );
}

function Database(props: React.SVGProps<SVGSVGElement>) {
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
