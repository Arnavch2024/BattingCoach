"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Play, Activity, Zap, CheckCircle2, Shield, Award, Cpu, 
  ArrowRight, Sparkles, ChevronLeft, ChevronRight, User, 
  LogIn, X, Lock, Mail, Video, Eye, EyeOff, Dumbbell, Compass,
  Volume2, Flame, BarChart3, Layers, Check, LogOut, ArrowUpRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// ──────────────────────────────────────────────────────────────────────────────
// Background Unsplash Cricket Images Slider Data
// ──────────────────────────────────────────────────────────────────────────────

const HERO_SLIDES = [
  {
    url: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=1920&auto=format&fit=crop",
    title: "Floodlit Cricket Arena",
    subtitle: "Professional sports biomechanics powered by VideoMAE & MediaPipe 3D",
  },
  {
    url: "https://images.unsplash.com/photo-1531415074868-036b1c5d53ec?q=80&w=1920&auto=format&fit=crop",
    title: "Precision Stroke Execution",
    subtitle: "Real-time front elbow angle, lead knee flexion, and head alignment analysis",
  },
  {
    url: "https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?q=80&w=1920&auto=format&fit=crop",
    title: "Elite Batting Performance",
    subtitle: "10-stroke neural classifier with instant audio coaching feedback",
  },
  {
    url: "https://images.unsplash.com/photo-1593341646782-e0b495cff86d?q=80&w=1920&auto=format&fit=crop",
    title: "Zero Hardware Sensors Required",
    subtitle: "Transform any standard webcam into an Olympic-grade batting laboratory",
  }
];

// ──────────────────────────────────────────────────────────────────────────────
// Stroke Directory Data
// ──────────────────────────────────────────────────────────────────────────────

const SHOT_MODULES = [
  { name: "Cover Drive", category: "Drives", angle: "Elbow ≥ 130°", difficulty: "Intermediate", cue: "Head positioned over front knee with high lead elbow finish." },
  { name: "Straight Drive", category: "Drives", angle: "Elbow ≥ 135°", difficulty: "Foundational", cue: "Full vertical bat blade presentation directly down the line." },
  { name: "Pull Shot", category: "Power", angle: "Arm Ext ≥ 120°", difficulty: "Intermediate", cue: "Back foot pivot with full horizontal arm extension." },
  { name: "Hook Shot", category: "Power", angle: "Arm Ext ≥ 115°", difficulty: "Advanced", cue: "Torso hip rotation with downward wrist roll over impact." },
  { name: "Square Cut", category: "Power", angle: "Elbow ≥ 125°", difficulty: "Intermediate", cue: "Step back and across, sharp slice behind point region." },
  { name: "Lofted Drive", category: "Power", angle: "Elbow ≥ 140°", difficulty: "Advanced", cue: "Clean vertical acceleration into explosive follow-through." },
  { name: "Forward Defense", category: "Technical", angle: "Elbow ~ 110°", difficulty: "Foundational", cue: "Soft impact hands, solid bat face adjacent to front pad." },
  { name: "Late Cut", category: "Technical", angle: "Elbow ~ 115°", difficulty: "Advanced", cue: "Feather touch guidance past slips with supple wrists." },
  { name: "Wrist Flick", category: "Whips", angle: "Elbow ≥ 125°", difficulty: "Intermediate", cue: "Snappy forearm roll through the mid-wicket corridor." },
  { name: "Sweep Shot", category: "Sweeps", angle: "Elbow ≥ 120°", difficulty: "Intermediate", cue: "Deep back-knee crouch with flat horizontal blade sweep." },
];

interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
  provider: "google" | "email";
  stance: "Right-Hand Batter" | "Left-Hand Batter";
}

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  // Form State
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authStance, setAuthStance] = useState<"Right-Hand Batter" | "Left-Hand Batter">("Right-Hand Batter");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load user from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("batcoach_user");
      if (stored) {
        setUserProfile(JSON.parse(stored));
      } else {
        // Default demo athlete
        const defaultUser: UserProfile = {
          name: "Arnav P.",
          email: "athlete@cricketcoach.ai",
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
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const syncUserToSupabase = async (user: UserProfile) => {
    try {
      await fetch("http://127.0.0.1:8888/api/athlete/sync", {
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
      console.error("Supabase athlete sync notice:", e);
    }
  };

  // Direct Google Sign In
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

  // Standard Email/Password Sign In / Up
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

  return (
    <div className="min-h-screen w-full bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-emerald-500/30">
      
      {/* ── Top Header Navigation ────────────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 h-16 bg-zinc-950/70 backdrop-blur-xl border-b border-zinc-800/80 z-50 px-6 lg:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/bat-icon.jpg"
            alt="BatCoach Logo"
            className="h-9 w-9 rounded-lg object-cover border border-emerald-500/40 shadow-sm shadow-emerald-500/10"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white">BatCoach AI Pro</span>
              <Badge variant="secondary" className="text-[10px] font-medium py-0 px-1.5 h-4 bg-zinc-800 text-zinc-400">
                v2.0
              </Badge>
            </div>
            <p className="text-[10px] text-zinc-400 hidden sm:block">AI Batting Biomechanics & Audio Coaching</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs text-zinc-400 font-medium">
          <a href="#features" className="hover:text-zinc-100 transition-colors">Features</a>
          <a href="#modules" className="hover:text-zinc-100 transition-colors">Shot Modules</a>
          <a href="#how-it-works" className="hover:text-zinc-100 transition-colors">How It Works</a>
        </nav>

        {/* Right CTA / Auth Profile */}
        <div className="flex items-center gap-3">
          {userProfile ? (
            <div className="flex items-center gap-2 bg-zinc-900/90 border border-zinc-800 rounded-lg p-1 pr-3 text-xs">
              <div className="h-7 w-7 rounded-md bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center font-bold text-white text-[11px] shadow-sm">
                {userProfile.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="text-left hidden sm:block leading-tight">
                <div className="text-xs font-semibold text-zinc-200">{userProfile.name}</div>
                <div className="text-[10px] text-zinc-500">{userProfile.email}</div>
              </div>
              <button 
                onClick={handleSignOut}
                title="Sign Out"
                className="ml-2 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setAuthMode("signin"); setIsSignInOpen(true); }}
              className="text-zinc-200 border-zinc-800 hover:bg-zinc-800 text-xs gap-1.5 font-medium"
            >
              <LogIn className="h-3.5 w-3.5" />
              Sign In
            </Button>
          )}

          <Link href="/coach">
            <Button size="sm" className="gap-1.5 font-medium text-xs shadow-md shadow-emerald-600/20">
              <Play className="h-3 w-3 fill-current" />
              Launch Live Coach
            </Button>
          </Link>
        </div>
      </header>

      {/* ── Hero Section with Background Slider ─────────────────────────────── */}
      <section className="relative min-h-[90vh] lg:min-h-screen flex items-center justify-center pt-24 pb-16 px-6 overflow-hidden">
        
        {/* Unsplash Background Image Carousel */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${HERO_SLIDES[currentSlide].url})` }}
            />
          </AnimatePresence>

          {/* Cinematic Dark Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/85 to-[#09090b]/60" />
          <div className="absolute inset-0 bg-radial from-transparent via-[#09090b]/50 to-[#09090b]" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center gap-6 mt-6">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-medium backdrop-blur-md shadow-lg"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Next-Gen Cricket Batting Intelligence</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15]"
          >
            Master Your Batting Stroke with <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
              Real-Time AI Biomechanics
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-sm sm:text-base text-zinc-300 max-w-2xl leading-relaxed"
          >
            Powered by <strong>VideoMAE video transformers</strong> and <strong>MediaPipe 3D world pose tracking</strong>. Measure lead elbow elevation, knee flexion, and receive instant verbal coaching cues directly through your webcam.
          </motion.p>

          {/* Action CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4 mt-2 w-full sm:w-auto"
          >
            <Link href="/coach" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto gap-2 text-sm font-semibold h-11 px-8 shadow-xl shadow-emerald-600/25">
                <Play className="h-4 w-4 fill-current" />
                Start Live Coaching Session
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>

            <Button 
              variant="outline" 
              size="lg" 
              onClick={() => { setAuthMode("signin"); setIsSignInOpen(true); }}
              className="w-full sm:w-auto text-sm font-medium h-11 px-6 bg-zinc-900/60 border-zinc-700/80 backdrop-blur-md"
            >
              Sign In with Google / Email
            </Button>
          </motion.div>

          {/* Feature Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8 w-full max-w-3xl"
          >
            <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800/80 backdrop-blur-md text-left">
              <div className="text-emerald-400 font-bold text-lg mono">3D Metric</div>
              <div className="text-[11px] text-zinc-400 mt-0.5">Perspective-Free Angles</div>
            </div>
            <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800/80 backdrop-blur-md text-left">
              <div className="text-cyan-400 font-bold text-lg mono">10 Strokes</div>
              <div className="text-[11px] text-zinc-400 mt-0.5">VideoMAE Classification</div>
            </div>
            <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800/80 backdrop-blur-md text-left">
              <div className="text-teal-400 font-bold text-lg mono">&lt; 15ms</div>
              <div className="text-[11px] text-zinc-400 mt-0.5">FP16 CUDA Acceleration</div>
            </div>
            <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800/80 backdrop-blur-md text-left">
              <div className="text-amber-400 font-bold text-lg mono">Voice Coach</div>
              <div className="text-[11px] text-zinc-400 mt-0.5">Real-Time Audio Corrections</div>
            </div>
          </motion.div>

          {/* Slider Pagination Controls */}
          <div className="flex items-center gap-2 mt-6">
            {HERO_SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300 cursor-pointer",
                  currentSlide === idx ? "w-8 bg-emerald-400" : "w-2 bg-zinc-700 hover:bg-zinc-500"
                )}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>

        </div>

      </section>

      {/* ── Key Features Section ────────────────────────────────────────────── */}
      <section id="features" className="py-20 px-6 lg:px-12 bg-zinc-950 border-t border-zinc-900">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-500/30">
              Elite Sports Science
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Engineered for Modern Cricket Batsmen
            </h2>
            <p className="text-sm text-zinc-400">
              Experience laboratory-grade biomechanics analysis in your living room or practice nets using your standard camera.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <Card className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors">
              <CardHeader className="p-6 pb-4">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2">
                  <Activity className="h-5 w-5" />
                </div>
                <CardTitle className="text-base font-semibold">3D Joint Angle Telemetry</CardTitle>
                <CardDescription className="text-xs text-zinc-400">
                  Measures front elbow elevation ($\ge 130^\circ$) and lead knee flexion in true Euclidean 3D space, independent of camera tilt.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors">
              <CardHeader className="p-6 pb-4">
                <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-2">
                  <Cpu className="h-5 w-5" />
                </div>
                <CardTitle className="text-base font-semibold">VideoMAE Action Transformer</CardTitle>
                <CardDescription className="text-xs text-zinc-400">
                  Custom fine-tuned Vision Transformer analyzes 16-frame spatiotemporal motion vectors to classify strokes with high confidence.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors">
              <CardHeader className="p-6 pb-4">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-2">
                  <Volume2 className="h-5 w-5" />
                </div>
                <CardTitle className="text-base font-semibold">Real-Time Voice Coaching</CardTitle>
                <CardDescription className="text-xs text-zinc-400">
                  Instant text-to-speech audio coach delivers tiered technical corrections (Foundational, Intermediate, Elite) the moment a stroke completes.
                </CardDescription>
              </CardHeader>
            </Card>

          </div>
        </div>
      </section>

      {/* ── Supported Shot Modules ─────────────────────────────────────────── */}
      <section id="modules" className="py-20 px-6 lg:px-12 bg-[#09090b] border-t border-zinc-900">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <Badge variant="outline" className="text-xs text-cyan-400 border-cyan-500/30">
                10 Practice Modules
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight text-white">Supported Stroke Directory</h2>
              <p className="text-xs text-zinc-400">Select any stroke to train specific biomechanical angles.</p>
            </div>
            <Link href="/coach">
              <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                Launch All Modules <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SHOT_MODULES.map((shot) => (
              <div
                key={shot.name}
                className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80 hover:border-emerald-500/40 transition-all flex flex-col justify-between gap-3 group"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-zinc-200 group-hover:text-emerald-400 transition-colors">
                      {shot.name}
                    </span>
                    <Badge variant={shot.difficulty === "Foundational" ? "secondary" : shot.difficulty === "Intermediate" ? "cyan" : "warning"} className="text-[9px] py-0 px-1.5">
                      {shot.difficulty}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">{shot.cue}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 text-[10px]">
                  <span className="text-zinc-500 uppercase tracking-wider">{shot.category}</span>
                  <span className="mono font-semibold text-emerald-400">{shot.angle}</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── How It Works Section ────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 px-6 lg:px-12 bg-zinc-950 border-t border-zinc-900">
        <div className="max-w-5xl mx-auto space-y-12">
          
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold tracking-tight text-white">How It Works in 3 Steps</h2>
            <p className="text-xs text-zinc-400">Zero special equipment. Works with your webcam or mobile camera.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div className="flex flex-col items-center text-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg mono">
                1
              </div>
              <h3 className="font-semibold text-sm text-zinc-200">Position Camera</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Place your laptop or camera 6–8 feet away so your full batting stance and arms are visible in frame.
              </p>
            </div>

            <div className="flex flex-col items-center text-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-lg mono">
                2
              </div>
              <h3 className="font-semibold text-sm text-zinc-200">Select Shot & Play</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Choose your target stroke module (e.g. Cover Drive) and execute your shots in front of the live AI feed.
              </p>
            </div>

            <div className="flex flex-col items-center text-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold text-lg mono">
                3
              </div>
              <h3 className="font-semibold text-sm text-zinc-200">Instant Audio & Angle Cues</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Receive live verbal coaching corrections, biometric angle ratings ($A+$, $A$, $B$), and rep streaks.
              </p>
            </div>

          </div>

          <div className="pt-8 text-center">
            <Link href="/coach">
              <Button size="lg" className="gap-2 text-sm font-semibold h-11 px-8 shadow-lg shadow-emerald-600/20">
                <Play className="h-4 w-4 fill-current" />
                Launch Live Coach Now
              </Button>
            </Link>
          </div>

        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="mt-auto border-t border-zinc-800 bg-zinc-950 py-12 px-6 lg:px-12 text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="flex items-center gap-3">
            <img
              src="/bat-icon.jpg"
              alt="BatCoach Logo"
              className="h-7 w-7 rounded-lg object-cover border border-emerald-500/40"
            />
            <div>
              <span className="font-bold text-sm text-zinc-200">BatCoach AI Pro</span>
              <p className="text-[10px] text-zinc-500">Synthetic Cricket Biomechanics Intelligence</p>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-xs text-zinc-400">
            <Link href="/coach" className="hover:text-zinc-100 transition-colors">Coaching Dashboard</Link>
            <a href="#features" className="hover:text-zinc-100 transition-colors">Features</a>
            <a href="#modules" className="hover:text-zinc-100 transition-colors">Shot Catalog</a>
            <a href="#how-it-works" className="hover:text-zinc-100 transition-colors">How it Works</a>
          </div>

          <div className="text-[11px] text-zinc-500">
            © 2026 BatCoach AI Pro. All rights reserved.
          </div>

        </div>
      </footer>

      {/* ── Interactive Sign In Modal with Direct Google Gmail & Email Auth ──── */}
      <AnimatePresence>
        {isSignInOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSignInOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-zinc-950 border border-zinc-800/90 rounded-2xl p-7 shadow-2xl z-10 space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img src="/bat-icon.jpg" alt="Logo" className="h-8 w-8 rounded-lg object-cover border border-emerald-500/40 shadow-sm" />
                  <div>
                    <h3 className="font-bold text-base text-white">Athlete Portal</h3>
                    <p className="text-[11px] text-zinc-400">Sign in to sync your batting reps & stats</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsSignInOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Direct Google Gmail Sign In Button */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl bg-white text-zinc-900 hover:bg-zinc-100 font-semibold text-xs transition-all shadow-md active:scale-[0.99] cursor-pointer"
                >
                  {/* Official Google G SVG */}
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Continue with Google / Gmail</span>
                </button>

                <div className="relative flex items-center justify-center py-1">
                  <div className="border-t border-zinc-800 w-full" />
                  <span className="bg-zinc-950 px-3 text-[10px] text-zinc-500 uppercase tracking-widest font-medium shrink-0">
                    Or sign in with email
                  </span>
                </div>
              </div>

              {/* Email Form */}
              <form onSubmit={handleEmailAuthSubmit} className="space-y-3.5">
                {authMode === "signup" && (
                  <div className="space-y-1 text-left">
                    <label className="text-[11px] font-medium text-zinc-300">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                      <input
                        type="text"
                        required
                        placeholder="Arnav P."
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1 text-left">
                  <label className="text-[11px] font-medium text-zinc-300">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                    <input
                      type="email"
                      required
                      placeholder="athlete@cricketcoach.ai"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-1 text-left">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-medium text-zinc-300">Password</label>
                    {authMode === "signin" && (
                      <span className="text-[10px] text-emerald-400 hover:underline cursor-pointer">
                        Forgot password?
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••••••"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-9 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300"
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                {authMode === "signup" && (
                  <div className="space-y-1 text-left">
                    <label className="text-[11px] font-medium text-zinc-300">Batting Stance</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["Right-Hand Batter", "Left-Hand Batter"] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setAuthStance(s)}
                          className={cn(
                            "py-1.5 px-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer",
                            authStance === s
                              ? "bg-emerald-600/20 border-emerald-500/50 text-emerald-400"
                              : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800"
                          )}
                        >
                          {s === "Right-Hand Batter" ? "Right-Hand (RHB)" : "Left-Hand (LHB)"}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <Button type="submit" disabled={isSubmitting} className="w-full text-xs font-semibold h-9 mt-2">
                  {isSubmitting ? "Authenticating..." : authMode === "signin" ? "Sign In with Email" : "Create Athlete Account"}
                </Button>
              </form>

              {/* Mode Toggle Switcher */}
              <div className="pt-2 border-t border-zinc-800/80 text-center text-xs text-zinc-400">
                {authMode === "signin" ? (
                  <span>
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setAuthMode("signup")}
                      className="text-emerald-400 font-semibold hover:underline ml-1 cursor-pointer"
                    >
                      Create Account
                    </button>
                  </span>
                ) : (
                  <span>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setAuthMode("signin")}
                      className="text-emerald-400 font-semibold hover:underline ml-1 cursor-pointer"
                    >
                      Sign In
                    </button>
                  </span>
                )}
              </div>

            </motion.div>

          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
