"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { motion, useScroll, useTransform, useSpring, useMotionValue, AnimatePresence } from "framer-motion";
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

function playWallThudSound() {
  try {
    const ctx = getSharedAudioContext();
    if (!ctx) return;
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(280, t0);
    osc.frequency.exponentialRampToValueAtTime(85, t0 + 0.05);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.35, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.055);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t0);
    osc.stop(t0 + 0.06);
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
    <svg viewBox="0 0 64 64" className={cn("w-12 h-12 drop-shadow-2xl select-none", className)} fill="none">
      <defs>
        {/* Deep 3D Leather Core with Lacquer Gradient */}
        <radialGradient id="ballLacquer" cx="30%" cy="26%" r="72%">
          <stop offset="0%" stopColor="#ff5252" />
          <stop offset="20%" stopColor="#e51c23" />
          <stop offset="52%" stopColor="#b71c1c" />
          <stop offset="80%" stopColor="#7f0000" />
          <stop offset="100%" stopColor="#2b0004" />
        </radialGradient>

        {/* Primary Stadium Floodlight Specular Flare */}
        <linearGradient id="primaryGlint" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="35%" stopColor="#ffffff" stopOpacity="0.75" />
          <stop offset="70%" stopColor="#ffffff" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>

        {/* Gloss Curved Shield Reflection (Glass Polyurethane Coat) */}
        <linearGradient id="glossArc" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.65" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>

        {/* Bottom Ambient Rim Sheen */}
        <radialGradient id="rimLight" cx="68%" cy="78%" r="45%">
          <stop offset="0%" stopColor="#ff8a80" stopOpacity="0.4" />
          <stop offset="60%" stopColor="#b71c1c" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Ambient Depth Rim */}
      <circle cx="32" cy="32" r="30" fill="url(#ballLacquer)" stroke="#5c0007" strokeWidth="1.2" />
      <circle cx="32" cy="32" r="30" fill="url(#rimLight)" />

      {/* Authentic Raised Cricket Seam (White Wax Stitches + Gold Margin) */}
      {/* Outer seam shadow for 3D depth */}
      <path
        d="M8 18 C16 28, 24 34, 32 32 C40 30, 48 36, 56 46"
        stroke="#3b0004"
        strokeWidth="3.6"
        strokeLinecap="round"
      />
      {/* Golden core welt */}
      <path
        d="M8 18 C16 28, 24 34, 32 32 C40 30, 48 36, 56 46"
        stroke="#d4af37"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      {/* White wax stitched thread dashes */}
      <path
        d="M8 18 C16 28, 24 34, 32 32 C40 30, 48 36, 56 46"
        stroke="#ffffff"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeDasharray="2.5 3"
        strokeOpacity="0.98"
      />

      {/* Gold Crown / Test Stamp Motif */}
      <circle cx="24" cy="44" r="5" fill="#f59e0b" fillOpacity="0.22" stroke="#f59e0b" strokeWidth="0.6" strokeDasharray="1 1" />

      {/* High-Gloss Lacquer Reflection Curved Sheen */}
      <path
        d="M12 24 C14 14, 24 8, 36 8 C44 8, 48 11, 51 16 C42 12, 28 14, 18 22 C15 24, 13 25, 12 24 Z"
        fill="url(#glossArc)"
      />

      {/* Intense Specular Hot-spot Glint */}
      <ellipse cx="22" cy="18" rx="8" ry="4.5" transform="rotate(-32 22 18)" fill="url(#primaryGlint)" />
      <circle cx="19" cy="16" r="2.2" fill="#ffffff" fillOpacity="0.9" />

      {/* Secondary Soft Floodlight Glint */}
      <ellipse cx="38" cy="22" rx="3.5" ry="2" transform="rotate(-15 38 22)" fill="#ffffff" fillOpacity="0.35" />
    </svg>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Section Waypoint Milestones
// ──────────────────────────────────────────────────────────────────────────────

const MILESTONES = [
  { id: "hero", label: "Strike Zone", scrollRatio: 0.02, meter: "0m" },
  { id: "demo-preview", label: "3D Biomechanics", scrollRatio: 0.44, meter: "65m" },
  { id: "modules", label: "Stroke Syllabus", scrollRatio: 0.86, meter: "95m" },
  { id: "athlete-portal", label: "Boundary Rope", scrollRatio: 0.98, meter: "115m 🚀" },
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
  const [dimensions, setDimensions] = useState({ width: 1200, height: 2600 });
  const [sectionLines, setSectionLines] = useState({
    line1: 880,  // Divider line between Overview and Biomechanics Engine
    line2: 1540, // Divider line between Biomechanics Engine and Stroke Syllabus
    line3: 2280, // Divider line / boundary rope at Footer
  });

  // Dynamically measure the exact position of the section divider lines in the home page
  const updateSectionLines = useCallback(() => {
    if (typeof window === "undefined") return;
    const demoEl = document.getElementById("demo-preview");
    const modEl = document.getElementById("modules");
    const footerEl = document.querySelector("footer");

    // Exact offsetTop of the section borders
    const line1 = demoEl ? demoEl.offsetTop : Math.round(window.innerHeight * 0.92);
    const line2 = modEl ? modEl.offsetTop : line1 + 660;
    const line3 = footerEl ? footerEl.offsetTop : line2 + 720;

    setSectionLines({ line1, line2, line3 });
    setDimensions({
      width: window.innerWidth,
      height: Math.max(document.documentElement.scrollHeight, line3 + 300),
    });
  }, []);

  // Prime audio context and track resize/DOM measurements
  useEffect(() => {
    setMounted(true);
    updateSectionLines();

    // Re-check after images/fonts finish settling
    const t1 = setTimeout(updateSectionLines, 400);
    const t2 = setTimeout(updateSectionLines, 1200);

    const onResize = () => {
      updateSectionLines();
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
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
      window.removeEventListener("wheel", unlockAudio);
      window.removeEventListener("scroll", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, [updateSectionLines]);

  const { scrollYProgress } = useScroll();

  // Smooth physical spring binding: removes harsh mouse-wheel stepped jumps,
  // creating a silky, glossy, heavy rolling momentum that halts cleanly when scrolling stops.
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 26,
    mass: 0.7,
    restDelta: 0.0001,
  });

  // Track Dimensions across the screen margins:
  // leftX is stationed in the left margin (at the bat sweet spot)
  const leftX = Math.max(38, dimensions.width * 0.035);
  // rightX extends all the way across the screen to the right margin!
  const rightX = Math.max(leftX + 440, dimensions.width - leftX - 44);
  const reboundDist = 48; // Realistic 48px momentum rollback upon hitting wall

  // Vertical Coordinates Aligned with Section Divider Lines:
  const heroBatY = 160;                   // Bat crease height in Overview
  const y1 = sectionLines.line1;          // Divider Line 1: Between Overview & Biomechanics (#demo-preview)
  const y2 = sectionLines.line2;          // Divider Line 2: Between Biomechanics & Stroke Syllabus (#modules)
  const y3 = sectionLines.line3;          // Boundary Rope at Footer

  // The ball sits on top of the section border lines (ball height is 48px)
  const rollY1 = y1 - 42;
  const rollY2 = y2 - 42;
  const rollY3 = y3 - 42;

  // Chute drop X coordinates (after rebounding backwards from wall)
  const drop1X = rightX - reboundDist;
  const drop2X = leftX + reboundDist;

  // State machine for straight-up ascent when scrolling up from the left side
  const straightUpMotionVal = useMotionValue(0);
  const lastScrollProgressRef = useRef(0);
  const isAscendingStraightUpRef = useRef(false);

  // ────────────────────────────────────────────────────────────────────────────
  // 1. HORIZONTAL POSITION (ballX):
  // Aligned with Section Dividers & Margins:
  // - Starts at Bat Crease in Left Margin (leftX)
  // - Drops down Left Margin to Line 1 (Overview <-> Biomechanics)
  // - Rolls across Line 1 to Right Margin (rightX)
  // - Wall 1 Rebound: Rolls back 48px to drop1X
  // - Drops down Right Margin to Line 2 (Biomechanics <-> Stroke Syllabus)
  // - Rolls across Line 2 to Left Margin (leftX)
  // - Drops down Left Margin to Boundary Rope directly below starting point!
  // - When scrolling UP from left side: moves STRAIGHT UP at leftX!
  // - When scrolling UP from right side: exactly retraces path taken!
  // ────────────────────────────────────────────────────────────────────────────
  const ballX = useTransform([progress, straightUpMotionVal], ([p, s]: number[]) => {
    // When in straight-up ascending mode: strictly locked to left margin directly below starting point!
    if (s >= 0.5) {
      return leftX;
    }

    // Normal downward / right-side retrace trajectory:
    // Phase 0: At Crease (p <= 0.02)
    if (p <= 0.02) {
      return leftX;
    }
    // Phase 0B: Vertical drop down left margin to line 1 (p < 0.10)
    if (p < 0.10) {
      return leftX; // STRICTLY CONSTANT X!
    }
    // Phase 1A: Roll across Line 1 (Overview <-> Biomechanics divider)
    if (p < 0.44) {
      const t = (p - 0.10) / (0.44 - 0.10);
      return leftX + t * (rightX - leftX);
    }
    // Phase 1B: Wall 1 Impact & Momentum Rebound at right edge
    if (p < 0.50) {
      const u = (p - 0.44) / (0.50 - 0.44);
      const ease = 1 - (1 - u) * (1 - u); // Decelerating momentum rebound
      return rightX - ease * reboundDist;
    }
    // Phase 2: Vertical drop down right margin to line 2 (p < 0.60)
    if (p < 0.60) {
      return drop1X; // STRICTLY CONSTANT X!
    }
    // Phase 3A: Roll across Line 2 (Biomechanics <-> Stroke Syllabus divider)
    if (p < 0.88) {
      const t = (p - 0.60) / (0.88 - 0.60);
      return drop1X - t * (drop1X - leftX);
    }
    // Phase 3B: Wall 2 Impact & Momentum Rebound at left edge
    if (p < 0.93) {
      const u = (p - 0.88) / (0.93 - 0.88);
      const bounce = Math.sin(u * Math.PI);
      return leftX + bounce * 24;
    }
    // Phase 4: Vertical drop down left margin to boundary rope, strictly aligned with leftX!
    return leftX;
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 2. VERTICAL POSITION (ballY):
  // - Starts at heroBatY
  // - When in straight-up ascending mode: moves upward in a straight line from rollY3 to heroBatY!
  // - Normal path: follows section lines and margin chutes
  // ────────────────────────────────────────────────────────────────────────────
  const ballY = useTransform([progress, straightUpMotionVal], ([p, s]: number[]) => {
    // When in straight-up ascending mode: moves upward in a continuous straight line!
    if (s >= 0.5) {
      return heroBatY + p * (rollY3 - heroBatY);
    }

    // Normal downward / right-side retrace trajectory:
    // Phase 0: At Crease Strike Zone
    if (p <= 0.02) {
      return heroBatY;
    }
    // Phase 0B: Drop vertically down left margin from bat to Line 1
    if (p < 0.10) {
      const t = (p - 0.02) / (0.10 - 0.02);
      const gravityT = t * t;
      return heroBatY + gravityT * (rollY1 - heroBatY);
    }
    // Phase 1: On Line 1 between Overview and Biomechanics (Roll + Rebound: STRICTLY LEVEL!)
    if (p < 0.50) {
      return rollY1;
    }
    // Phase 2: Drop vertically down right margin from Line 1 to Line 2
    if (p < 0.60) {
      const t = (p - 0.50) / (0.60 - 0.50);
      const gravityT = t * t;
      return rollY1 + gravityT * (rollY2 - rollY1);
    }
    // Phase 3: On Line 2 between Biomechanics and Stroke Syllabus (Roll + Rebound: STRICTLY LEVEL!)
    if (p < 0.93) {
      return rollY2;
    }
    // Phase 4: Drop vertically down left margin from Line 2 to Boundary Rope
    const t = (p - 0.93) / (1.00 - 0.93);
    const gravityT = t * t;
    return rollY2 + gravityT * (rollY3 - rollY2);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 3. PHYSICAL ROLLING SEAM ROTATION:
  // - 12 Complete 360° revolutions (4320°) per section line traverse!
  // - On wall impact, seam reverses spin during the momentum rollback!
  // - When moving straight up, spiraling spin remains active!
  // ────────────────────────────────────────────────────────────────────────────
  const ballRotate = useTransform([progress, straightUpMotionVal], ([p, s]: number[]) => {
    // When ascending straight up: smooth continuous seam spiraling spin!
    if (s >= 0.5) {
      return p * 840;
    }

    if (p <= 0.02) return 0;
    // Initial drop down left margin
    if (p < 0.10) {
      const t = (p - 0.02) / (0.10 - 0.02);
      return t * 360;
    }
    // Roll across Line 1 (12 full clockwise rotations):
    if (p < 0.44) {
      const t = (p - 0.10) / (0.44 - 0.10);
      return 360 + t * 4320;
    }
    // Wall 1 Rebound (backspin rollback):
    if (p < 0.50) {
      const u = (p - 0.44) / (0.50 - 0.44);
      const ease = 1 - (1 - u) * (1 - u);
      return 4680 - ease * 240;
    }
    // Drop 1 down right margin:
    if (p < 0.60) {
      const t = (p - 0.50) / (0.60 - 0.50);
      return 4440 + t * 240;
    }
    // Roll across Line 2 (12 full reverse rotations):
    if (p < 0.88) {
      const t = (p - 0.60) / (0.88 - 0.60);
      return 4680 - t * 4320;
    }
    // Wall 2 Rebound (forward spin rollback):
    if (p < 0.93) {
      const u = (p - 0.88) / (0.93 - 0.88);
      const ease = 1 - (1 - u) * (1 - u);
      return 360 + ease * 240;
    }
    // Drop 2 to boundary rope:
    const t = (p - 0.93) / (1.00 - 0.93);
    return 600 + t * 240;
  });

  // 4. BAT SWING ARC:
  // Primed in backlift (-14°), executes crisp drive swing (+38° at p=0.015-0.03), then follow-through
  const batRotate = useTransform(progress, [0, 0.02, 0.06, 0.16], [-14, 38, 22, 10]);
  const batScale = useTransform(progress, [0, 0.02, 0.06], [1, 1.12, 1]);
  // Bat recedes smoothly as user scrolls deep into content
  const batOpacity = useTransform(progress, [0, 0.12, 0.28], [1, 0.85, 0.2]);

  // Monitor scroll trigger to activate bat hit, wall impacts, and milestones
  useEffect(() => {
    let w1Hit = false;
    let w2Hit = false;

    const unsubscribe = scrollYProgress.on("change", (latest) => {
      const delta = latest - lastScrollProgressRef.current;
      lastScrollProgressRef.current = latest;

      // ── Directional Vertical Ascent Controller ────────────────────────────
      // 1. Reset back to normal trajectory once at top strike zone
      if (latest <= 0.025) {
        if (isAscendingStraightUpRef.current) {
          isAscendingStraightUpRef.current = false;
          straightUpMotionVal.set(0);
        }
      }
      // 2. When ball is at the left side / bottom (p >= 0.88) and user scrolls UP:
      // activate straight-up ascent!
      else if (latest >= 0.88 && delta < -0.0003) {
        if (!isAscendingStraightUpRef.current) {
          isAscendingStraightUpRef.current = true;
          straightUpMotionVal.set(1);
        }
      }

      // Bat Hit Trigger
      if (latest > 0.02 && !hasHit) {
        setHasHit(true);
        setShowCrackBadge(true);
        if (soundEnabled) {
          playBatCrackSound();
        }
        setTimeout(() => setShowCrackBadge(false), 2200);
      } else if (latest <= 0.008 && hasHit) {
        // Rewound back to top: reset ready stance
        setHasHit(false);
      }

      // Wall Impact 1 (at Line 1 right edge: ~0.44)
      if (latest >= 0.435 && latest < 0.50 && !w1Hit) {
        w1Hit = true;
        if (soundEnabled) playWallThudSound();
      } else if (latest < 0.42) {
        w1Hit = false;
      }

      // Wall Impact 2 (at Line 2 left edge: ~0.88)
      if (latest >= 0.875 && latest < 0.93 && !w2Hit) {
        w2Hit = true;
        if (soundEnabled) playWallThudSound();
      } else if (latest < 0.86) {
        w2Hit = false;
      }

      // Update active milestone based on stepped intervals
      if (latest < 0.44) setActiveMilestone(0); // Strike Zone
      else if (latest < 0.88) setActiveMilestone(1); // 3D Biomechanics (Line 1)
      else setActiveMilestone(2); // Boundary Rope (Line 2)
    });

    return () => unsubscribe();
  }, [scrollYProgress, hasHit, soundEnabled]);

  // Manual Click on Bat: Plays sound, animates swing, and initiates smooth scroll
  const handleManualBatHit = () => {
    setHasHit(true);
    setShowCrackBadge(true);
    if (soundEnabled) playBatCrackSound();
    setTimeout(() => setShowCrackBadge(false), 2200);

    window.scrollBy({ top: 400, behavior: "smooth" });
  };

  // Manual Click on Ball: Plays crisp wood crack
  const handleManualBallClick = () => {
    if (soundEnabled) playBatCrackSound();
    setShowCrackBadge(true);
    setTimeout(() => setShowCrackBadge(false), 1800);
  };

  if (!mounted) return null;

  return (
    <div
      className={cn(
        "absolute inset-0 w-full h-full z-30 pointer-events-none select-none overflow-hidden",
        "hidden md:block" // Sleek, non-intrusive presentation on desktop & tablets
      )}
      aria-hidden="true"
    >
      {/* ── Minimalist Athletic Stadium Guide Shelves & Wall Cushions ── */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="shelfAccentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id="wallCushionGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>

        {/* Initial Left Margin Drop Chute: from Bat to Line 1 */}
        <line
          x1={leftX + 24}
          y1={heroBatY + 24}
          x2={leftX + 24}
          y2={y1}
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="3 4"
          className="text-slate-300 dark:text-zinc-700 opacity-60"
        />

        {/* Shelf Line 1: Exact Divider Line between Overview & Biomechanics (#demo-preview) */}
        <line
          x1={leftX}
          y1={y1}
          x2={rightX + 44}
          y2={y1}
          stroke="url(#shelfAccentGrad)"
          strokeWidth="1.5"
          strokeDasharray="4 6"
          className="opacity-40 dark:opacity-30"
        />

        {/* Wall 1 Bumper Cushion (Right Margin Boundary) */}
        <rect
          x={rightX + 42}
          y={y1 - 38}
          width={6}
          height={44}
          rx={3}
          fill="url(#wallCushionGrad)"
          className="opacity-80"
        />
        <circle cx={rightX + 45} cy={y1 - 16} r={14} fill="#06b6d4" fillOpacity={0.15} />

        {/* Right Margin Drop Chute 1: from Line 1 to Line 2 (Outside Biomechanics content) */}
        <line
          x1={drop1X + 24}
          y1={y1}
          x2={drop1X + 24}
          y2={y2}
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="3 4"
          className="text-slate-300 dark:text-zinc-700 opacity-60"
        />

        {/* Shelf Line 2: Exact Divider Line between Biomechanics & Stroke Syllabus (#modules) */}
        <line
          x1={leftX - 16}
          y1={y2}
          x2={drop1X + 24}
          y2={y2}
          stroke="url(#shelfAccentGrad)"
          strokeWidth="1.5"
          strokeDasharray="4 6"
          className="opacity-40 dark:opacity-30"
        />

        {/* Wall 2 Bumper Cushion (Left Margin Boundary) */}
        <rect
          x={leftX - 18}
          y={y2 - 38}
          width={6}
          height={44}
          rx={3}
          fill="#10b981"
          className="opacity-80"
        />
        <circle cx={leftX - 15} cy={y2 - 16} r={14} fill="#10b981" fillOpacity={0.15} />

        {/* Left Margin Drop Chute 2: from Line 2 to Boundary Rope (Outside Syllabus content) */}
        <line
          x1={drop2X + 24}
          y1={y2}
          x2={drop2X + 24}
          y2={y3}
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="3 4"
          className="text-slate-300 dark:text-zinc-700 opacity-60"
        />
      </svg>

      {/* ── Architectural Milestone Waypoints at Section Dividers ─────── */}
      {[
        { m: MILESTONES[0], x: leftX + 24, y: heroBatY + 24, label: "Strike Zone", meter: "0m", align: "left" },
        { m: MILESTONES[1], x: drop1X + 24, y: y1, label: "3D Biomechanics Line", meter: "65m", align: "right" },
        { m: MILESTONES[2], x: drop2X + 24, y: y2, label: "Stroke Syllabus Line", meter: "95m", align: "left" },
        { m: MILESTONES[3], x: drop2X + 24, y: y3, label: "Boundary Rope", meter: "115m 🚀", align: "left" },
      ].map((pt, idx) => {
        if (!pt?.m) return null;
        const isPassed = idx <= activeMilestone;
        return (
          <div
            key={pt.m?.id || idx}
            style={{ left: pt.x, top: pt.y }}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center group pointer-events-none"
          >
            <div
              className={cn(
                "h-2.5 w-2.5 rounded-full transition-all duration-300 shadow-sm",
                isPassed
                  ? "bg-emerald-500 ring-4 ring-emerald-500/25 scale-125"
                  : "bg-slate-300 dark:bg-zinc-700"
              )}
            />

            <div
              className={cn(
                "absolute px-2.5 py-0.5 rounded-md text-[10px] font-mono tracking-tight whitespace-nowrap transition-all duration-300 pointer-events-none shadow-md z-40",
                pt.align === "left" ? "left-4" : "right-4",
                isPassed
                  ? "bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 opacity-90 scale-100"
                  : "bg-white/90 dark:bg-zinc-900/90 text-slate-500 dark:text-zinc-500 border border-slate-200 dark:border-zinc-800 opacity-50 scale-95"
              )}
            >
              <span>{pt.label}</span>{" "}
              <span className="text-[9px] text-emerald-400 font-bold">({pt.meter})</span>
            </div>
          </div>
        );
      })}

      {/* ── The Cricket Bat (Stationed at Crease Strike Zone) ───────────── */}
      <motion.div
        style={{
          opacity: batOpacity,
          left: leftX - 38,
          top: heroBatY - 88,
        }}
        className="absolute pointer-events-auto cursor-pointer"
        onClick={handleManualBatHit}
        title="Click to strike the ball!"
      >
        <motion.div
          style={{
            rotate: batRotate,
            scale: batScale,
            transformOrigin: "27px 15px", // Pivot around top of handle
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

      {/* ── The Cricket Ball (Aligned with Section Divider Lines & Margins) ─ */}
      <motion.div
        style={{
          x: ballX,
          y: ballY,
          rotate: ballRotate,
        }}
        className="absolute top-0 left-0 pointer-events-auto cursor-pointer z-40"
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.94 }}
        onClick={handleManualBallClick}
        title="Cricket Ball: Rolls strictly along section divider lines and rebounds off boundary edges."
      >
        <div className="relative">
          <CricketBallSVG />

          {/* Clean realistic ground contact shadow resting on section divider line */}
          <div className="absolute -bottom-1.5 left-2 right-2 h-2.5 rounded-full bg-black/25 dark:bg-black/60 blur-[3px] -z-10" />

          {/* Current Depth Badge that hovers alongside the ball */}
          <div className="absolute left-14 top-1/2 -translate-y-1/2 bg-slate-900/90 dark:bg-black/90 text-white text-[9px] font-mono px-2.5 py-0.5 rounded-full shadow-lg border border-slate-700/80 whitespace-nowrap opacity-90 hover:opacity-100 transition-opacity">
            {MILESTONES[activeMilestone]?.meter || "In Play"}
          </div>
        </div>
      </motion.div>

      {/* ── Audio Mute/Unmute Toggle (Fixed to Viewport for Ease of Access) ── */}
      <div className="fixed bottom-6 left-6 pointer-events-auto z-50">
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


