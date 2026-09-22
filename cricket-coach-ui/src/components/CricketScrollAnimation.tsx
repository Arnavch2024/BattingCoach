"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "framer-motion";
import { Sparkles, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

// ──────────────────────────────────────────────────────────────────────────────
// Web Audio API: Realistic English Willow Bat Crack Generator
// ──────────────────────────────────────────────────────────────────────────────

function createBatCrack(ctx: AudioContext) {
  try {
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    const t0 = ctx.currentTime;

    // 1. Transient sharp impact crack (filtered noise burst)
    const bufferSize = Math.floor(ctx.sampleRate * 0.045);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.14));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    // High Q Bandpass filter tuned to sweet-spot willow resonance (1150 Hz)
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1150, t0);
    filter.Q.setValueAtTime(4.2, t0);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.85, t0);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.065);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    // 2. Solid sweet-spot low body tone (185 Hz -> 95 Hz)
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(185, t0);
    osc.frequency.exponentialRampToValueAtTime(95, t0 + 0.055);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.65, t0);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.075);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);

    // 3. Crisp secondary wood ping harmonic (2200 Hz)
    const pingOsc = ctx.createOscillator();
    pingOsc.type = "triangle";
    pingOsc.frequency.setValueAtTime(2200, t0);
    pingOsc.frequency.exponentialRampToValueAtTime(1400, t0 + 0.03);

    const pingGain = ctx.createGain();
    pingGain.gain.setValueAtTime(0.25, t0);
    pingGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.035);

    pingOsc.connect(pingGain);
    pingGain.connect(ctx.destination);

    noise.start(t0);
    osc.start(t0);
    pingOsc.start(t0);

    noise.stop(t0 + 0.075);
    osc.stop(t0 + 0.08);
    pingOsc.stop(t0 + 0.04);
  } catch (e) {
    // Autoplay restrictions
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Vector Graphics: Authentic English Willow Bat & 3D Stitched Leather Ball
// ──────────────────────────────────────────────────────────────────────────────

function CricketBatSVG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 54 180" className={cn("w-11 h-36 drop-shadow-lg select-none", className)} fill="none">
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
    <svg viewBox="0 0 48 48" className={cn("w-10 h-10 drop-shadow-xl select-none", className)} fill="none">
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
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="40%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Main Red Leather Sphere */}
      <circle cx="24" cy="24" r="22" fill="url(#leatherShine)" stroke="#7f1d1d" strokeWidth="1" />

      {/* Curving Cricket Seam (White Stitched Core) */}
      <path
        d="M6 14 C12 22, 18 26, 24 24 C30 22, 36 26, 42 34"
        stroke="#ffffff"
        strokeWidth="2.2"
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
  { id: "hero", label: "Strike Zone", scrollRatio: 0.04, meter: "0m" },
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
  const [soundEnabled, setSoundEnabled] = useState(true); // Default ON for rich audio experience
  const [hasHit, setHasHit] = useState(false);
  const [showCrackBadge, setShowCrackBadge] = useState(false);
  const [activeMilestone, setActiveMilestone] = useState(0);

  const audioCtxRef = useRef<AudioContext | null>(null);

  // Safely get or resume the shared AudioContext on user interaction
  const getAudioCtx = useCallback(() => {
    if (typeof window === "undefined") return null;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  }, []);

  // Unlock AudioContext on ANY early user interaction (scroll, touch, click, key)
  useEffect(() => {
    const unlockAudio = () => {
      getAudioCtx();
    };

    window.addEventListener("pointerdown", unlockAudio, { passive: true });
    window.addEventListener("touchstart", unlockAudio, { passive: true });
    window.addEventListener("wheel", unlockAudio, { passive: true });
    window.addEventListener("scroll", unlockAudio, { passive: true });
    window.addEventListener("keydown", unlockAudio, { passive: true });

    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
      window.removeEventListener("wheel", unlockAudio);
      window.removeEventListener("scroll", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, [getAudioCtx]);

  const { scrollYProgress } = useScroll();

  // Responsive physical spring for smooth, aerodynamic momentum
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 22,
    mass: 0.5,
  });

  // 1. VERTICAL POSITION (ballY):
  // Starts at y=188px (directly at the sweet spot of the bat at scroll=0), drops to 88vh
  const ballY = useTransform(smoothProgress, [0, 1], ["188px", "88vh"]);

  // 2. HORIZONTAL POSITION (ballX) - AERODYNAMIC 3D SPIRAL / INSWINGER CURVE:
  // Starts resting at x=54px (right in front of the bat blade).
  // As user scrolls, the ball sweeps across the left gutter in an authentic 3D corkscrew spiral!
  const ballX = useTransform(smoothProgress, (p) => {
    if (p <= 0.015) return 54; // Resting in sweet spot at scroll 0
    const t = (p - 0.015) / (1 - 0.015);
    // 3 full sinusoidal loops oscillating smoothly between 22px and 74px (centered at 48px)
    const spiralOffset = Math.sin(t * Math.PI * 6) * 26;
    return 48 + spiralOffset;
  });

  // 3. 3D DEPTH PULSE (ballScale):
  // Ball pulses closer and further from the viewer in sync with the spiral curve
  const ballScale = useTransform(smoothProgress, (p) => {
    if (p <= 0.015) return 1;
    const t = (p - 0.015) / (1 - 0.015);
    return 1 + 0.16 * Math.cos(t * Math.PI * 6);
  });

  // 4. BALL SEAM ROTATION:
  // Spins continuously as the ball cuts through the air
  const ballRotate = useTransform(smoothProgress, [0, 1], [0, 2520]);

  // 5. BAT SWING ARC:
  // Cocked backlift (-14°) at rest, drives into contact (+38° at p=0.02), then follow-through
  const batRotate = useTransform(smoothProgress, [0, 0.015, 0.04, 0.12], [-14, 38, 22, 10]);
  const batScale = useTransform(smoothProgress, [0, 0.015, 0.04], [1, 1.12, 1]);
  // Bat recedes smoothly as user scrolls deep into page content
  const batOpacity = useTransform(smoothProgress, [0, 0.18, 0.35], [1, 0.85, 0.25]);

  // 6. Laser trajectory glow height
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
          const ctx = getAudioCtx();
          if (ctx) createBatCrack(ctx);
        }
        setTimeout(() => setShowCrackBadge(false), 2200);
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
  }, [scrollYProgress, hasHit, soundEnabled, getAudioCtx]);

  // Manual Click on Bat: Plays sound, animates swing, and initiates scroll
  const handleManualBatHit = () => {
    setHasHit(true);
    setShowCrackBadge(true);
    const ctx = getAudioCtx();
    if (ctx) createBatCrack(ctx);
    setTimeout(() => setShowCrackBadge(false), 2200);

    // Smoothly scroll down so user witnesses the ball launch and spiral
    window.scrollBy({ top: 380, behavior: "smooth" });
  };

  // Manual Click on Ball: Plays crisp wood crack and gives kinetic pulse
  const handleManualBallClick = () => {
    const ctx = getAudioCtx();
    if (ctx) createBatCrack(ctx);
    setShowCrackBadge(true);
    setTimeout(() => setShowCrackBadge(false), 1800);
  };

  if (!mounted) return null;

  return (
    <div
      className={cn(
        "fixed left-3 sm:left-5 md:left-7 lg:left-8 top-0 bottom-0 z-30 pointer-events-none select-none",
        "hidden md:block w-32 lg:w-36" // Responsive width ensuring complete gutter visibility without obscuring text
      )}
      aria-hidden="true"
    >
      {/* ── Vertical Trajectory Guide Track / Hawk-Eye Laser Line ──────── */}
      <div className="absolute left-[48px] top-28 bottom-20 w-0.5 bg-slate-200/80 dark:bg-zinc-800/80 rounded-full overflow-hidden">
        {/* Dynamic neon unrolling tracer that follows the ball */}
        <motion.div
          style={{ height: trajectoryHeight }}
          className="w-full bg-gradient-to-b from-emerald-400 via-teal-400 to-cyan-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
        />
      </div>

      {/* ── Section Waypoint Pips along the trajectory line ────────────── */}
      <div className="absolute left-[43px] top-28 bottom-20 w-3 flex flex-col justify-between items-center py-6 pointer-events-none">
        {MILESTONES.map((m, idx) => {
          const isPassed = idx <= activeMilestone;
          return (
            <div key={m.id} className="relative flex items-center group">
              <div
                className={cn(
                  "h-2.5 w-2.5 rounded-full transition-all duration-300",
                  isPassed
                    ? "bg-emerald-500 ring-4 ring-emerald-500/20 scale-125"
                    : "bg-slate-300 dark:bg-zinc-700"
                )}
              />

              {/* Waypoint Label Badge on Hover or Active */}
              <div
                className={cn(
                  "absolute left-5 px-2 py-0.5 rounded-md text-[10px] font-mono tracking-tight whitespace-nowrap transition-all duration-300 pointer-events-none shadow-sm z-40",
                  isPassed
                    ? "bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 opacity-90 scale-100"
                    : "bg-white/90 dark:bg-zinc-900/90 text-slate-500 dark:text-zinc-500 border border-slate-200 dark:border-zinc-800 opacity-0 group-hover:opacity-100 scale-95"
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
      <motion.div
        style={{
          opacity: batOpacity,
        }}
        className="absolute top-24 left-1 pointer-events-auto cursor-pointer"
        onClick={handleManualBatHit}
        title="Click to strike the ball!"
      >
        <motion.div
          style={{
            rotate: batRotate,
            scale: batScale,
            transformOrigin: "27px 15px", // Pivot around the top of the handle
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
              className="absolute left-14 top-8 bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg whitespace-nowrap flex items-center gap-1 border border-emerald-400/50 z-40"
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
                className="absolute left-6 top-24 h-14 w-14 rounded-full border-2 border-emerald-400 pointer-events-none"
              />

              {/* "CRACK!" Impact Comic Badge */}
              <motion.div
                initial={{ scale: 0.2, y: 10, rotate: -15, opacity: 0 }}
                animate={{ scale: 1.15, y: -10, rotate: -6, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", stiffness: 600, damping: 18 }}
                className="absolute left-10 top-16 bg-gradient-to-r from-amber-500 to-red-600 text-white font-black text-xs px-2.5 py-1 rounded-lg shadow-2xl border border-amber-300 pointer-events-none flex items-center gap-1 tracking-wider z-50"
              >
                <Sparkles className="h-3.5 w-3.5 fill-current animate-spin" />
                <span>CRACK! 🏏</span>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── The Cricket Ball (Visible at Sweet Spot at Top, Spirals on Scroll) ── */}
      <motion.div
        style={{
          top: ballY,
          left: ballX,
          scale: ballScale,
          rotate: ballRotate,
        }}
        className="absolute pointer-events-auto cursor-pointer z-40"
        whileHover={{ scale: 1.25 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleManualBallClick}
        title="Cricket Ball: Click to hit! Corkscrews down through sections as you scroll."
      >
        <motion.div
          animate={{
            y: [0, -3, 0], // Gentle ambient hover float
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
          <div className="absolute inset-0 rounded-full bg-red-500/25 blur-md -z-10 animate-pulse" />

          {/* Current Depth Badge that hovers next to the ball */}
          <div className="absolute left-11 top-1/2 -translate-y-1/2 bg-slate-900/90 dark:bg-black/90 text-white text-[9px] font-mono px-2 py-0.5 rounded-full shadow-md border border-slate-700/80 whitespace-nowrap opacity-80 hover:opacity-100 transition-opacity">
            {MILESTONES[activeMilestone]?.meter || "In Play"}
          </div>
        </motion.div>
      </motion.div>

      {/* ── Audio Mute/Unmute Toggle for Bat Impact Sound ─────────────── */}
      <div className="absolute bottom-6 left-2 pointer-events-auto">
        <button
          onClick={() => {
            const next = !soundEnabled;
            setSoundEnabled(next);
            if (next) {
              const ctx = getAudioCtx();
              if (ctx) createBatCrack(ctx);
            }
          }}
          className={cn(
            "p-2 rounded-xl border transition-all duration-200 cursor-pointer shadow-sm text-xs flex items-center gap-1",
            soundEnabled
              ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
              : "bg-white/80 dark:bg-zinc-900/80 border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white"
          )}
          title={soundEnabled ? "Bat Crack Sound: ON (Click to Mute)" : "Bat Crack Sound: OFF (Click to Enable)"}
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

