"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "framer-motion";
import { Sparkles, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

// ──────────────────────────────────────────────────────────────────────────────
// Shared Web Audio API: Authentic English Willow Bat Crack Generator
// ──────────────────────────────────────────────────────────────────────────────

let globalAudioCtx: AudioContext | null = null;

function getSharedAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!globalAudioCtx) {
    globalAudioCtx = new AudioCtx();
  }
  return globalAudioCtx;
}

function playBatCrackSound() {
  try {
    const ctx = getSharedAudioContext();
    if (!ctx) return;

    const executeCrack = () => {
      try {
        const t0 = ctx.currentTime;

        // 1. High-frequency impulse crack (filtered white noise burst)
        const bufferSize = Math.floor(ctx.sampleRate * 0.045);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.12));
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        // Sweet-spot English willow resonance bandpass (1180 Hz)
        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(1180, t0);
        filter.Q.setValueAtTime(4.5, t0);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.85, t0);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.065);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(ctx.destination);

        // 2. Low-frequency solid willow "thump" (185 Hz -> 90 Hz)
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(185, t0);
        osc.frequency.exponentialRampToValueAtTime(90, t0 + 0.055);

        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0.65, t0);
        oscGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.075);

        osc.connect(oscGain);
        oscGain.connect(ctx.destination);

        // 3. Crisp wood grain ping overtone (2400 Hz)
        const pingOsc = ctx.createOscillator();
        pingOsc.type = "triangle";
        pingOsc.frequency.setValueAtTime(2400, t0);
        pingOsc.frequency.exponentialRampToValueAtTime(1500, t0 + 0.03);

        const pingGain = ctx.createGain();
        pingGain.gain.setValueAtTime(0.3, t0);
        pingGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.035);

        pingOsc.connect(pingGain);
        pingGain.connect(ctx.destination);

        noise.start(t0);
        osc.start(t0);
        pingOsc.start(t0);

        noise.stop(t0 + 0.075);
        osc.stop(t0 + 0.08);
        pingOsc.stop(t0 + 0.04);
      } catch (e) {}
    };

    if (ctx.state === "suspended") {
      ctx.resume().then(executeCrack).catch(() => {});
    } else {
      executeCrack();
    }
  } catch (e) {}
}

// ──────────────────────────────────────────────────────────────────────────────
// Vector Graphics: Authentic English Willow Bat & 3D Stitched Leather Ball
// ──────────────────────────────────────────────────────────────────────────────

function CricketBatSVG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 54 180" className={cn("w-11 h-36 drop-shadow-xl select-none", className)} fill="none">
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
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hasHit, setHasHit] = useState(false);
  const [showCrackBadge, setShowCrackBadge] = useState(false);
  const [activeMilestone, setActiveMilestone] = useState(0);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });

  // Prime audio context on any early window interaction
  useEffect(() => {
    setMounted(true);
    setDimensions({ width: window.innerWidth, height: window.innerHeight });

    const onResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", onResize);

    const unlockAudio = () => {
      const ctx = getSharedAudioContext();
      if (ctx && ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }
    };

    window.addEventListener("pointerdown", unlockAudio, { passive: true });
    window.addEventListener("touchstart", unlockAudio, { passive: true });
    window.addEventListener("wheel", unlockAudio, { passive: true });
    window.addEventListener("scroll", unlockAudio, { passive: true });
    window.addEventListener("keydown", unlockAudio, { passive: true });

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
      window.removeEventListener("wheel", unlockAudio);
      window.removeEventListener("scroll", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, []);

  const { scrollYProgress } = useScroll();

  // 100% scroll-dependent progress without laggy or drifting spring inertia
  // Direct binding ensures the ball halts DEAD in its tracks the instant scrolling stops
  const progress = scrollYProgress;

  // 1. VERTICAL POSITION (ballY):
  // Descends smoothly from strike zone (180px) down to bottom of viewport (viewportHeight - 85px)
  const ballY = useTransform(progress, (p) => {
    const startY = 180;
    const endY = Math.max(450, dimensions.height - 85);
    return startY + p * (endY - startY);
  });

  // 2. HORIZONTAL DOMINO TRAVERSAL (ballX):
  // Wide left-to-right, right-to-left traversal across the page like a cascading domino course:
  // - p = 0.00 to 0.02: Resting at bat sweet spot (left side)
  // - p = 0.02 to 0.28: Traverses from Left edge across to Right edge (Hero -> Biomechanics)
  // - p = 0.28 to 0.58: Traverses back from Right edge across to Left edge (Biomechanics -> Stroke Matrix)
  // - p = 0.58 to 0.84: Traverses from Left edge across to Right edge (Stroke Matrix -> Action Replay)
  // - p = 0.84 to 1.00: Descends from Right edge into Center Boundary Rope
  const ballX = useTransform(progress, (p) => {
    const minX = Math.max(28, dimensions.width * 0.04);
    const maxX = Math.max(300, dimensions.width - 80);
    const midX = (minX + maxX) / 2;

    if (p <= 0.02) {
      return minX + 46; // Resting at sweet spot in front of bat
    }
    if (p <= 0.28) {
      // Traverse from Left to Right
      const t = (p - 0.02) / (0.28 - 0.02);
      const ease = 0.5 - 0.5 * Math.cos(t * Math.PI);
      return (minX + 46) + ease * (maxX - (minX + 46));
    }
    if (p <= 0.58) {
      // Traverse from Right to Left
      const t = (p - 0.28) / (0.58 - 0.28);
      const ease = 0.5 - 0.5 * Math.cos(t * Math.PI);
      return maxX - ease * (maxX - minX);
    }
    if (p <= 0.84) {
      // Traverse from Left to Right
      const t = (p - 0.58) / (0.84 - 0.58);
      const ease = 0.5 - 0.5 * Math.cos(t * Math.PI);
      return minX + ease * (maxX - minX);
    }
    // Final roll from Right to Center Boundary
    const t = (p - 0.84) / (1.0 - 0.84);
    const ease = 0.5 - 0.5 * Math.cos(t * Math.PI);
    return maxX - ease * (maxX - midX);
  });

  // 3. PHYSICAL ROLLING SEAM ROTATION:
  // Strictly tied to scroll distance - stops spinning instantly when scroll stops
  const ballRotate = useTransform(progress, [0, 1], [0, 2880]);

  // 4. BAT SWING ARC:
  // Poised in backlift (-14°), executes crisp drive swing (+38° at p=0.015-0.02), then follow-through
  const batRotate = useTransform(progress, [0, 0.015, 0.04, 0.12], [-14, 38, 22, 10]);
  const batScale = useTransform(progress, [0, 0.015, 0.04], [1, 1.12, 1]);
  // Bat gently fades as athlete scrolls down into deeper syllabus sections
  const batOpacity = useTransform(progress, [0, 0.18, 0.35], [1, 0.85, 0.2]);

  // Laser trajectory path calculation
  const trajectoryProgress = useTransform(progress, [0, 1], [0, 1]);

  // Monitor scroll trigger to activate the bat hit and sound
  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      if (latest > 0.015 && !hasHit) {
        setHasHit(true);
        setShowCrackBadge(true);
        if (soundEnabled) {
          playBatCrackSound();
        }
        setTimeout(() => setShowCrackBadge(false), 2200);
      } else if (latest <= 0.005 && hasHit) {
        // Rewound back to top: reset ready stance so user can strike again
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

  // Manual Click on Bat: Plays sound, animates swing, and initiates smooth scroll
  const handleManualBatHit = () => {
    setHasHit(true);
    setShowCrackBadge(true);
    if (soundEnabled) playBatCrackSound();
    setTimeout(() => setShowCrackBadge(false), 2200);

    // Smoothly scroll down so user witnesses the domino launch
    window.scrollBy({ top: 400, behavior: "smooth" });
  };

  // Manual Click on Ball: Plays crisp wood crack
  const handleManualBallClick = () => {
    if (soundEnabled) playBatCrackSound();
    setShowCrackBadge(true);
    setTimeout(() => setShowCrackBadge(false), 1800);
  };

  if (!mounted) return null;

  // Waypoint position calculations for SVG domino track
  const minX = Math.max(28, dimensions.width * 0.04);
  const maxX = Math.max(300, dimensions.width - 80);
  const midX = (minX + maxX) / 2;
  const h = dimensions.height;

  // Domino track waypoints
  const p0 = { x: minX + 46, y: 180 };
  const p1 = { x: maxX, y: 180 + 0.28 * (h - 265) };
  const p2 = { x: minX, y: 180 + 0.58 * (h - 265) };
  const p3 = { x: maxX, y: 180 + 0.84 * (h - 265) };
  const p4 = { x: midX, y: h - 85 };

  const trackPathD = `M ${p0.x} ${p0.y} C ${p0.x + 150} ${p0.y}, ${p1.x - 150} ${p1.y}, ${p1.x} ${p1.y} C ${p1.x - 150} ${p1.y + 40}, ${p2.x + 150} ${p2.y - 40}, ${p2.x} ${p2.y} C ${p2.x + 150} ${p2.y + 40}, ${p3.x - 150} ${p3.y - 40}, ${p3.x} ${p3.y} C ${p3.x - 100} ${p3.y + 30}, ${p4.x + 80} ${p4.y - 30}, ${p4.x} ${p4.y}`;

  return (
    <div
      className={cn(
        "fixed inset-0 z-30 pointer-events-none select-none overflow-hidden",
        "hidden md:block" // Clean, sleek presentation on desktop & tablets
      )}
      aria-hidden="true"
    >
      {/* ── Domino Serpentine Hawk-Eye SVG Track ─────────────────────── */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="dominoNeonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* Faint ambient guide rail */}
        <path
          d={trackPathD}
          fill="none"
          stroke="currentColor"
          className="text-slate-300/40 dark:text-zinc-800/60"
          strokeWidth="1.5"
          strokeDasharray="4 6"
        />

        {/* Neon active tracer following the domino descent */}
        <path
          d={trackPathD}
          fill="none"
          stroke="url(#dominoNeonGradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="filter drop-shadow-[0_0_6px_rgba(16,185,129,0.6)]"
        />
      </svg>

      {/* ── Domino Switchback Waypoint Pips ─────────────────────────── */}
      {[
        { m: MILESTONES[0], pos: p0, side: "left" },
        { m: MILESTONES[1], pos: p1, side: "right" },
        { m: MILESTONES[2], pos: p2, side: "left" },
        { m: MILESTONES[3], pos: p3, side: "right" },
        { m: MILESTONES[4], pos: p4, side: "center" },
      ].map(({ m, pos, side }, idx) => {
        const isPassed = idx <= activeMilestone;
        return (
          <div
            key={m.id}
            style={{ left: pos.x, top: pos.y }}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center group pointer-events-none"
          >
            <div
              className={cn(
                "h-3 w-3 rounded-full transition-all duration-300 shadow-sm",
                isPassed
                  ? "bg-emerald-500 ring-4 ring-emerald-500/25 scale-125"
                  : "bg-slate-300 dark:bg-zinc-700"
              )}
            />

            {/* Waypoint Label Pill */}
            <div
              className={cn(
                "absolute px-2 py-0.5 rounded-md text-[10px] font-mono tracking-tight whitespace-nowrap transition-all duration-300 pointer-events-none shadow-md z-40",
                side === "left" && "left-4",
                side === "right" && "right-4",
                side === "center" && "bottom-5 left-1/2 -translate-x-1/2",
                isPassed
                  ? "bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 opacity-90 scale-100"
                  : "bg-white/90 dark:bg-zinc-900/90 text-slate-500 dark:text-zinc-500 border border-slate-200 dark:border-zinc-800 opacity-60 scale-95"
              )}
            >
              <span>{m.label}</span>{" "}
              <span className="text-[9px] text-emerald-400 font-bold">({m.meter})</span>
            </div>
          </div>
        );
      })}

      {/* ── The Cricket Bat (Stationed at Crease Strike Zone) ───────────── */}
      <motion.div
        style={{
          opacity: batOpacity,
          left: minX,
          top: 88,
        }}
        className="absolute pointer-events-auto cursor-pointer"
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

        {/* Impact Shockwave Ring & Comic Burst upon contact */}
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

              {/* "CRACK!" Comic Badge */}
              <motion.div
                initial={{ scale: 0.2, y: 10, rotate: -15, opacity: 0 }}
                animate={{ scale: 1.15, y: -10, rotate: -6, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", stiffness: 600, damping: 18 }}
                className="absolute left-12 top-16 bg-gradient-to-r from-amber-500 to-red-600 text-white font-black text-xs px-2.5 py-1 rounded-lg shadow-2xl border border-amber-300 pointer-events-none flex items-center gap-1 tracking-wider z-50"
              >
                <Sparkles className="h-3.5 w-3.5 fill-current animate-spin" />
                <span>CRACK! 🏏</span>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── The Cricket Ball (Domino Left-to-Right Cascader) ───────────── */}
      <motion.div
        style={{
          x: ballX,
          y: ballY,
          rotate: ballRotate,
        }}
        className="absolute top-0 left-0 pointer-events-auto cursor-pointer z-40"
        whileHover={{ scale: 1.25 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleManualBallClick}
        title="Cricket Ball: Click to strike! Follows scroll precisely across the domino cascade."
      >
        <div className="relative">
          <CricketBallSVG />

          {/* Atmospheric speed trail glow behind ball */}
          <div className="absolute inset-0 rounded-full bg-red-500/25 blur-md -z-10" />

          {/* Current Depth Badge that hovers alongside the ball */}
          <div className="absolute left-11 top-1/2 -translate-y-1/2 bg-slate-900/90 dark:bg-black/90 text-white text-[9px] font-mono px-2 py-0.5 rounded-full shadow-md border border-slate-700/80 whitespace-nowrap opacity-85 hover:opacity-100 transition-opacity">
            {MILESTONES[activeMilestone]?.meter || "In Play"}
          </div>
        </div>
      </motion.div>

      {/* ── Audio Mute/Unmute Toggle ──────────────────────────────────── */}
      <div className="absolute bottom-6 left-6 pointer-events-auto">
        <button
          onClick={() => {
            const next = !soundEnabled;
            setSoundEnabled(next);
            if (next) playBatCrackSound();
          }}
          className={cn(
            "p-2 rounded-xl border transition-all duration-200 cursor-pointer shadow-sm text-xs flex items-center gap-1 backdrop-blur-md",
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


