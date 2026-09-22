"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "framer-motion";
import { Sparkles, Volume2, VolumeX, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

// ──────────────────────────────────────────────────────────────────────────────
// Web Audio API: Realistic Willow Cricket Bat Crack Generator
// ──────────────────────────────────────────────────────────────────────────────

function playBatCrackSound() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // 1. Transient sharp impact crack (filtered noise burst)
    const bufferSize = ctx.sampleRate * 0.05; // 50ms
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    // Resonant bandpass filter mimicking thick English willow wood resonance (900 Hz)
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(950, ctx.currentTime);
    filter.Q.setValueAtTime(3.5, ctx.currentTime);

    // Gain envelope with sharp attack and rapid decay
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.7, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);

    // 2. Low-frequency solid willow "thud" body tone (160 Hz)
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(175, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.06);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.5, ctx.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);

    noise.start();
    osc.start();
    noise.stop(ctx.currentTime + 0.08);
    osc.stop(ctx.currentTime + 0.08);
  } catch (e) {
    // AudioContext blocked by browser autoplay policy
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Vector Graphics: Authentic English Willow Bat & 3D Stitched Leather Ball
// ──────────────────────────────────────────────────────────────────────────────

function CricketBatSVG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 54 180" className={cn("w-10 h-32 drop-shadow-md select-none", className)} fill="none">
      <defs>
        {/* Willow Wood Texture Gradient */}
        <linearGradient id="willowGrain" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="25%" stopColor="#fde68a" />
          <stop offset="65%" stopColor="#fcd34d" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>

        {/* Handle Rubber Grip Gradient */}
        <linearGradient id="handleGrip" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="50%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>

        {/* Sponsor Brand Stripe */}
        <linearGradient id="brandStripe" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#b91c1c" />
        </linearGradient>
      </defs>

      {/* Bat Handle (Round Cane with Rubber Chevron Texture) */}
      <rect x="23" y="2" width="8" height="52" rx="4" fill="url(#handleGrip)" stroke="#065f46" strokeWidth="1" />
      {/* Handle Spiral Grip Rings */}
      <line x1="23" y1="12" x2="31" y2="12" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.4" />
      <line x1="23" y1="22" x2="31" y2="22" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.4" />
      <line x1="23" y1="32" x2="31" y2="32" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.4" />
      <line x1="23" y1="42" x2="31" y2="42" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.4" />

      {/* Shoulder Transition */}
      <path d="M23 54 C21 58, 14 66, 14 74 L40 74 C40 66, 33 58, 31 54 Z" fill="url(#willowGrain)" stroke="#b45309" strokeWidth="1" />

      {/* Main Willow Blade with Authentic Spine Contour */}
      <path
        d="M14 74 L14 164 C14 172, 20 176, 27 176 C34 176, 40 172, 40 164 L40 74 Z"
        fill="url(#willowGrain)"
        stroke="#b45309"
        strokeWidth="1.2"
      />

      {/* Blade Spine Ridge Shadow */}
      <path d="M27 74 L27 176" stroke="#92400e" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />

      {/* Brand Holographic Sticker */}
      <rect x="18" y="82" width="18" height="26" rx="2" fill="url(#brandStripe)" />
      <text x="27" y="99" fontSize="8" fontWeight="bold" fill="#ffffff" textAnchor="middle" fontFamily="sans-serif">
        AI
      </text>

      {/* Toe Guard Protection */}
      <path d="M14 165 C14 173, 20 176, 27 176 C34 176, 40 173, 40 165 Z" fill="#1e293b" opacity="0.9" />
    </svg>
  );
}

function CricketBallSVG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn("w-9 h-9 drop-shadow-lg select-none", className)} fill="none">
      <defs>
        {/* 3D Curvature Radial Shading */}
        <radialGradient id="leatherShine" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#f87171" />
          <stop offset="30%" stopColor="#dc2626" />
          <stop offset="70%" stopColor="#991b1b" />
          <stop offset="100%" stopColor="#450a0a" />
        </radialGradient>

        {/* Specular Glint Highlight */}
        <linearGradient id="specularGlint" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="40%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Main Red Leather Sphere */}
      <circle cx="24" cy="24" r="22" fill="url(#leatherShine)" stroke="#7f1d1d" strokeWidth="1" />

      {/* Curving Cricket Seam (White Stitched Core) */}
      <path
        d="M6 14 C12 22, 18 26, 24 24 C30 22, 36 26, 42 34"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="2 2.5"
        strokeOpacity="0.95"
      />

      {/* Seam Stitching Margin Borders */}
      <path
        d="M5 12 C11 20, 17 24, 23 22 C29 20, 35 24, 41 32"
        stroke="#fecaca"
        strokeWidth="0.75"
        strokeOpacity="0.6"
      />
      <path
        d="M7 16 C13 24, 19 28, 25 26 C31 24, 37 28, 43 36"
        stroke="#fecaca"
        strokeWidth="0.75"
        strokeOpacity="0.6"
      />

      {/* Gloss Specular Highlight */}
      <ellipse cx="16" cy="14" rx="7" ry="4" transform="rotate(-30 16 14)" fill="url(#specularGlint)" />
    </svg>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Section Waypoint Milestones
// ──────────────────────────────────────────────────────────────────────────────

const MILESTONES = [
  { id: "hero", label: "Strike Zone", scrollRatio: 0.05, meter: "0m" },
  { id: "demo-preview", label: "3D Biomechanics", scrollRatio: 0.32, meter: "45m" },
  { id: "modules", label: "Stroke Matrix", scrollRatio: 0.58, meter: "78m" },
  { id: "how-it-works", label: "Action Replay", scrollRatio: 0.82, meter: "95m" },
  { id: "athlete-portal", label: "Boundary Rope", scrollRatio: 0.96, meter: "115m 🚀" },
];

// ──────────────────────────────────────────────────────────────────────────────
// Main Kinetic Scroll Animation Controller Component
// ──────────────────────────────────────────────────────────────────────────────

export function CricketScrollAnimation() {
  const [mounted, setMounted] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [hasHit, setHasHit] = useState(false);
  const [showCrackBadge, setShowCrackBadge] = useState(false);
  const [activeMilestone, setActiveMilestone] = useState(0);

  const { scrollYProgress, scrollY } = useScroll();

  // Smooth physical spring for the ball's falling trajectory
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 20,
    mass: 0.6,
  });

  // Calculate ball top position across viewport:
  // Starts at top 140px (sweet spot of bat impact) and drops down to 88vh as user scrolls
  const ballY = useTransform(smoothProgress, [0, 1], ["135px", "86vh"]);

  // Realistic seam rotation (spins continuously as ball drops through the air)
  const ballRotate = useTransform(smoothProgress, [0, 1], [0, 2880]);

  // Bat swing arc: stays primed at top until scroll starts, then performs powerful front-foot drive swing
  const batRotate = useTransform(smoothProgress, [0, 0.02, 0.06, 0.15], [-12, -26, 42, 16]);
  const batScale = useTransform(smoothProgress, [0, 0.03, 0.08], [1, 1.1, 1]);

  // Laser trajectory glow height
  const trajectoryHeight = useTransform(smoothProgress, [0, 1], ["0%", "100%"]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Monitor scroll trigger to activate the bat hit and sound
  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      if (latest > 0.015 && !hasHit) {
        setHasHit(true);
        setShowCrackBadge(true);
        if (soundEnabled) {
          playBatCrackSound();
        }
        setTimeout(() => setShowCrackBadge(false), 2400);
      } else if (latest <= 0.005 && hasHit) {
        // Rewound back to top: reset ready stance
        setHasHit(false);
      }

      // Update active waypoint milestone
      const curIndex = MILESTONES.findIndex((m, idx) => {
        const next = MILESTONES[idx + 1];
        return latest >= m.scrollRatio && (!next || latest < next.scrollRatio);
      });
      if (curIndex !== -1) {
        setActiveMilestone(curIndex);
      }
    });

    return () => unsubscribe();
  }, [scrollYProgress, hasHit, soundEnabled]);

  const handleManualHit = () => {
    setHasHit(true);
    setShowCrackBadge(true);
    playBatCrackSound();
    setTimeout(() => setShowCrackBadge(false), 2200);

    // Smoothly scroll down a bit to get the ball rolling
    window.scrollBy({ top: 380, behavior: "smooth" });
  };

  if (!mounted) return null;

  return (
    <div
      className={cn(
        "fixed left-2 sm:left-4 md:left-6 lg:left-8 top-0 bottom-0 z-30 pointer-events-none flex flex-col items-center select-none",
        "hidden md:flex" // Sleek presentation on desktop & tablets; keeps mobile view unobstructed
      )}
      aria-hidden="true"
    >
      {/* ── Vertical Trajectory Track / Hawk-Eye Laser Line ─────────────── */}
      <div className="absolute top-28 bottom-20 w-0.5 bg-slate-200/80 dark:bg-zinc-800/80 rounded-full overflow-hidden">
        {/* Dynamic neon unrolling tracer that follows the ball */}
        <motion.div
          style={{ height: trajectoryHeight }}
          className="w-full bg-gradient-to-b from-emerald-400 via-teal-400 to-cyan-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
        />
      </div>

      {/* ── Section Waypoint Pips along the trajectory line ────────────── */}
      <div className="absolute top-28 bottom-20 w-8 flex flex-col justify-between items-center py-6 pointer-events-none">
        {MILESTONES.map((m, idx) => {
          const isPassed = idx <= activeMilestone;
          return (
            <div key={m.id} className="relative flex items-center group">
              <div
                className={cn(
                  "h-2 w-2 rounded-full transition-all duration-300",
                  isPassed
                    ? "bg-emerald-500 ring-4 ring-emerald-500/20 scale-125"
                    : "bg-slate-300 dark:bg-zinc-700"
                )}
              />

              {/* Waypoint Label Badge on Hover or Active */}
              <div
                className={cn(
                  "absolute left-5 px-2 py-0.5 rounded-md text-[10px] font-mono tracking-tight whitespace-nowrap transition-all duration-300 pointer-events-none shadow-sm",
                  isPassed
                    ? "bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 opacity-90 scale-100"
                    : "bg-white/80 dark:bg-zinc-900/80 text-slate-500 dark:text-zinc-500 border border-slate-200 dark:border-zinc-800 opacity-0 group-hover:opacity-100 scale-95"
                )}
              >
                <span>{m.label}</span>{" "}
                <span className="text-[9px] text-emerald-400 font-bold">({m.meter})</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── The Cricket Bat (Stationed at Crease Strike Zone) ───────────── */}
      <div className="absolute top-24 pointer-events-auto cursor-pointer" onClick={handleManualHit} title="Click to strike the ball!">
        <motion.div
          style={{
            rotate: batRotate,
            scale: batScale,
            transformOrigin: "27px 12px", // Pivot around the top of the handle
          }}
          className="relative filter drop-shadow-xl"
        >
          <CricketBatSVG />

          {/* Prompt tooltip when at the top */}
          {!hasHit && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ repeat: Infinity, repeatType: "reverse", duration: 1.5 }}
              className="absolute -right-28 top-12 bg-emerald-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg whitespace-nowrap flex items-center gap-1 border border-emerald-400/50"
            >
              <span>Scroll to strike!</span>
              <motion.span animate={{ y: [0, 3, 0] }} transition={{ repeat: Infinity, duration: 0.8 }}>
                ↓
              </motion.span>
            </motion.div>
          )}
        </motion.div>

        {/* Impact Shockwave Ring & Particles upon contact */}
        <AnimatePresence>
          {showCrackBadge && (
            <>
              {/* Expanding Kinetic Shockwave */}
              <motion.div
                initial={{ scale: 0.3, opacity: 1 }}
                animate={{ scale: 2.8, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="absolute left-3 top-28 h-12 w-12 rounded-full border-2 border-emerald-400 pointer-events-none"
              />

              {/* "CRACK!" Impact Comic Badge */}
              <motion.div
                initial={{ scale: 0.2, y: 10, rotate: -15, opacity: 0 }}
                animate={{ scale: 1.15, y: -10, rotate: -6, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", stiffness: 600, damping: 18 }}
                className="absolute -right-24 top-20 bg-gradient-to-r from-amber-500 to-red-600 text-white font-black text-xs px-2.5 py-1 rounded-lg shadow-2xl border border-amber-300 pointer-events-none flex items-center gap-1 tracking-wider"
              >
                <Sparkles className="h-3.5 w-3.5 fill-current animate-spin" />
                <span>CRACK! 🏏</span>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* ── The Falling Cricket Ball (Follows Scroll Progress & Pauses) ── */}
      <motion.div
        style={{
          top: ballY,
          rotate: ballRotate,
        }}
        className="absolute pointer-events-auto cursor-pointer"
        whileHover={{ scale: 1.25 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleManualHit}
        title="Cricket Ball: scrolls down through sections and pauses wherever you stop!"
      >
        <motion.div
          animate={{
            y: [0, -3, 0], // Gentle ambient levitation float when paused at section gaps
          }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative"
        >
          <CricketBallSVG />

          {/* Atmospheric speed trail glow behind ball */}
          <div className="absolute inset-0 rounded-full bg-red-500/20 blur-md -z-10 animate-pulse" />

          {/* Current Depth Badge that hovers next to the ball */}
          <div className="absolute left-10 top-1/2 -translate-y-1/2 bg-slate-900/90 dark:bg-black/90 text-white text-[9px] font-mono px-2 py-0.5 rounded-full shadow-md border border-slate-700/80 whitespace-nowrap opacity-75 hover:opacity-100 transition-opacity">
            {MILESTONES[activeMilestone]?.meter || "Shot in Play"}
          </div>
        </motion.div>
      </motion.div>

      {/* ── Audio Mute/Unmute Toggle for Bat Impact Sound ─────────────── */}
      <div className="absolute bottom-6 pointer-events-auto">
        <button
          onClick={() => {
            const next = !soundEnabled;
            setSoundEnabled(next);
            if (next) playBatCrackSound();
          }}
          className={cn(
            "p-2 rounded-xl border transition-all duration-200 cursor-pointer shadow-sm text-xs flex items-center gap-1",
            soundEnabled
              ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
              : "bg-white/80 dark:bg-zinc-900/80 border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white"
          )}
          title={soundEnabled ? "Bat Crack Sound: ON" : "Bat Crack Sound: OFF (Click to Enable)"}
          aria-label="Toggle Bat Crack Sound"
        >
          {soundEnabled ? (
            <Volume2 className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <VolumeX className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}
