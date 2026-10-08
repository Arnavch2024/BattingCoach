"use client";

import React from "react";
import Link from "next/link";
import { Play, ArrowRight, Calendar, Target, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { HeroSlide } from "@/types/landing";

interface HeroSectionProps {
  slides: HeroSlide[];
  currentSlide: number;
  onSelectSlide: (idx: number) => void;
  onPrevSlide: () => void;
  onNextSlide: () => void;
  onOpenCalendar: () => void;
  onOpenSignIn: () => void;
}

export function HeroSection({
  slides,
  currentSlide,
  onSelectSlide,
  onPrevSlide,
  onNextSlide,
  onOpenCalendar,
  onOpenSignIn,
}: HeroSectionProps) {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <section
      id="hero"
      className="relative min-h-[88dvh] sm:min-h-[92dvh] flex items-center justify-center pt-20 sm:pt-24 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-12 overflow-hidden"
    >
      {/* Dynamic Stadium Background Slider */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-slate-100 dark:bg-zinc-950">
        <AnimatePresence>
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1 }}
            animate={{ opacity: 1, scale: isMobile ? 1.025 : 1.055 }}
            exit={{ opacity: 0, scale: isMobile ? 1.035 : 1.065 }}
            transition={{
              opacity: { duration: 1.2, ease: "easeInOut" },
              scale: { duration: 8, ease: "easeOut" },
            }}
            className="absolute inset-0"
          >
            <img
              src={slides[currentSlide].url}
              alt={slides[currentSlide].title}
              className="w-full h-full object-cover object-[center_32%] sm:object-center opacity-85 dark:opacity-75 saturate-115 contrast-[1.05]"
              loading="eager"
            />
          </motion.div>
        </AnimatePresence>

        {/* Athletic stadium lighting / subtle glow */}
        <div className="absolute -top-20 -right-20 w-80 sm:w-96 h-80 sm:h-96 bg-emerald-500/15 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Uniform ambient cinematic base tint - ensures 100% consistent exposure across the whole image */}
        <div className="absolute inset-0 bg-slate-900/20 dark:bg-[#09090b]/45 pointer-events-none" />

        {/* Feather-soft, full-bleed reading scrim - zero visible seam or cutoff line */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/75 via-white/30 to-transparent sm:bg-gradient-to-r sm:from-white/80 sm:via-white/35 sm:to-transparent dark:from-[#09090b]/75 dark:via-[#09090b]/35 dark:to-transparent pointer-events-none" />

        {/* Soft top header blend */}
        <div className="absolute top-0 inset-x-0 h-16 sm:h-20 bg-gradient-to-b from-white/60 to-transparent dark:from-[#09090b]/60 dark:to-transparent pointer-events-none" />

        {/* Soft bottom blend into next section */}
        <div className="absolute bottom-0 inset-x-0 h-20 sm:h-28 bg-gradient-to-t from-slate-50 via-slate-50/50 to-transparent dark:from-[#09090b] dark:via-[#09090b]/50 dark:to-transparent pointer-events-none" />
      </div>

      {/* Hero Content Container */}
      <div className="relative z-10 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center mt-4 sm:mt-6">
        {/* Left Column: Value Proposition */}
        <div className="lg:col-span-7 flex flex-col items-start text-left gap-4 sm:gap-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-400 text-[11px] sm:text-xs font-semibold backdrop-blur-md shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span>3D Euclidean Pose & VideoMAE Vision Transformer</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15] sm:leading-[1.1]">
            Textbook Batting Form. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 dark:from-emerald-400 dark:via-teal-300 dark:to-cyan-300">
              Zero Body Sensors.
            </span>
          </h1>

          <p className="text-xs sm:text-base text-slate-600 dark:text-zinc-200 max-w-xl leading-relaxed">
            Transform any standard laptop or webcam into an Olympic-grade batting laboratory. Measures{" "}
            <strong className="text-slate-900 dark:text-white">3D front elbow elevation</strong>,{" "}
            <strong className="text-slate-900 dark:text-white">lead knee flexion</strong>, and
            classifies 10 cricket stroke mechanics with instant spoken feedback.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3.5 pt-1 sm:pt-2 w-full sm:w-auto">
            <Link href="/coach" className="w-full sm:w-auto">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="w-full">
                <Button
                  size="lg"
                  className="w-full sm:w-auto gap-2 text-xs sm:text-sm font-bold h-11 sm:h-12 px-6 sm:px-7 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 rounded-xl cursor-pointer"
                >
                  <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-current" />
                  Start Live Session
                  <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-0.5" />
                </Button>
              </motion.div>
            </Link>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                onClick={onOpenCalendar}
                className="w-full sm:w-auto text-xs sm:text-sm font-semibold h-11 sm:h-12 px-5 sm:px-6 bg-white hover:bg-slate-100 text-slate-800 border-slate-200 dark:bg-emerald-950/40 dark:border-emerald-500/40 dark:text-emerald-300 dark:hover:bg-emerald-900/50 backdrop-blur-md gap-2 shadow-sm rounded-xl cursor-pointer"
              >
                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600 dark:text-emerald-400" />
                Training Schedule
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                onClick={onOpenSignIn}
                className="w-full sm:w-auto text-xs sm:text-sm font-semibold h-11 sm:h-12 px-5 sm:px-6 bg-white hover:bg-slate-100 text-slate-700 border-slate-200 dark:bg-zinc-900/80 dark:border-zinc-700 dark:text-zinc-200 backdrop-blur-md rounded-xl shadow-sm cursor-pointer"
              >
                Athlete Portal
              </Button>
            </motion.div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-3 sm:pt-4 w-full max-w-lg border-t border-slate-200 dark:border-zinc-800/80 mt-1 sm:mt-2">
            <div>
              <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mono">24 FPS</div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-zinc-400">Stream Rate</div>
            </div>
            <div>
              <div className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400 mono">&lt; 15ms</div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-zinc-400">CUDA Latency</div>
            </div>
            <div>
              <div className="text-lg sm:text-xl font-bold text-teal-600 dark:text-cyan-400 mono">10 Strokes</div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-zinc-400">Classified Live</div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Biometrics Radar Preview */}
        <div className="lg:col-span-5 flex flex-col gap-3 sm:gap-4">
          <div className="relative rounded-2xl bg-white/95 dark:bg-zinc-950/90 border border-slate-200/90 dark:border-zinc-800/90 p-3.5 sm:p-5 shadow-xl shadow-slate-200/50 dark:shadow-2xl backdrop-blur-xl space-y-3 sm:space-y-4 transition-colors">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-2.5 sm:pb-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Live Biometrics Radar
                </span>
              </div>
              <Badge
                variant="outline"
                className="text-[9px] sm:text-[10px] font-mono py-0 px-2 bg-slate-100 dark:bg-cyan-950 text-slate-700 dark:text-cyan-300 border-slate-200 dark:border-cyan-500/30"
              >
                Active Stance Check
              </Badge>
            </div>

            {/* Simulated Skeleton & Angle HUD */}
            <div className="relative h-48 sm:h-56 rounded-xl bg-slate-100/80 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 overflow-hidden flex items-center justify-center p-3 sm:p-4 transition-colors">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#64748b15_1px,transparent_1px),linear-gradient(to_bottom,#64748b15_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#27272a15_1px,transparent_1px),linear-gradient(to_bottom,#27272a15_1px,transparent_1px)] bg-[size:24px_24px]" />

              <div className="relative z-10 w-full flex items-center justify-between px-1 sm:px-2 gap-1.5">
                {/* Lead Elbow Gauge */}
                <div className="flex flex-col items-center gap-0.5 sm:gap-1 bg-white/95 dark:bg-zinc-950/90 border border-emerald-500/40 rounded-xl p-2 sm:p-3 shadow-md flex-1">
                  <div className="text-[9px] sm:text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-semibold">
                    Lead Elbow
                  </div>
                  <div className="text-lg sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mono">
                    134.2°
                  </div>
                  <div className="text-[8px] sm:text-[9px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-500/10 px-1 py-0.5 rounded">
                    ≥ 130° (PASS)
                  </div>
                </div>

                {/* Dynamic Pose Icon */}
                <div className="flex flex-col items-center gap-1 sm:gap-2 px-1">
                  <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <Target className="h-5 w-5 sm:h-7 sm:w-7 animate-pulse" />
                  </div>
                  <span className="text-[9px] sm:text-[11px] font-semibold text-slate-700 dark:text-zinc-300 text-center leading-tight">
                    Cover Drive
                  </span>
                </div>

                {/* Lead Knee Gauge */}
                <div className="flex flex-col items-center gap-0.5 sm:gap-1 bg-white/95 dark:bg-zinc-950/90 border border-teal-500/40 rounded-xl p-2 sm:p-3 shadow-md flex-1">
                  <div className="text-[9px] sm:text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-semibold">
                    Lead Knee
                  </div>
                  <div className="text-lg sm:text-2xl font-black text-teal-600 dark:text-teal-400 mono">
                    148.6°
                  </div>
                  <div className="text-[8px] sm:text-[9px] text-teal-700 dark:text-teal-400 font-bold bg-teal-50 dark:bg-teal-500/10 px-1 py-0.5 rounded">
                    ≤ 155° (PASS)
                  </div>
                </div>
              </div>

              {/* Bottom Overlay Toast */}
              <div className="absolute bottom-2 inset-x-2 bg-white/95 dark:bg-zinc-950/90 border border-slate-200 dark:border-zinc-800 rounded-lg py-1 px-2 sm:px-3 flex items-center justify-between text-[10px] sm:text-[11px] shadow-sm">
                <span className="text-slate-500 dark:text-zinc-400">Form Rating:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 mono truncate">
                  A+ (Elite Follow-Through)
                </span>
              </div>
            </div>

            {/* Shot Probabilities Simulation */}
            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex justify-between text-[11px] sm:text-xs text-slate-700 dark:text-zinc-300 font-medium">
                <span>
                  Detected:{" "}
                  <strong className="text-slate-900 dark:text-white">Cover Drive</strong>
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 mono font-bold">
                  94.8%
                </span>
              </div>
              <div className="h-1.5 sm:h-2 w-full bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full w-[94.8%]" />
              </div>
            </div>
          </div>

          {/* Slider Switcher & Thumbnail Indicator */}
          <div className="flex items-center justify-between bg-white/95 dark:bg-zinc-950/90 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 sm:p-3 px-3 sm:px-4 shadow-sm backdrop-blur-md transition-colors">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider shrink-0">
                Slide:
              </span>
              <span className="text-[11px] sm:text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[130px] sm:max-w-none">
                {slides[currentSlide].title}
              </span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <span className="sm:hidden text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/20">
                {currentSlide + 1}/{slides.length}
              </span>

              <div className="hidden sm:flex items-center gap-1 sm:gap-1.5 mr-1">
                {slides.map((slide, idx) => (
                  <button
                    key={slide.id}
                    onClick={() => onSelectSlide(idx)}
                    className={cn(
                      "h-1.5 sm:h-2 rounded-full transition-all cursor-pointer",
                      currentSlide === idx
                        ? "w-4 sm:w-5 bg-emerald-600 dark:bg-emerald-400"
                        : "w-1.5 sm:w-2 bg-slate-300 dark:bg-zinc-700 hover:bg-slate-400 dark:hover:bg-zinc-600"
                    )}
                    aria-label={`Jump to slide ${idx + 1}`}
                    title={slide.title}
                  />
                ))}
              </div>

              <button
                onClick={onPrevSlide}
                className="p-1 sm:p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer"
                aria-label="Previous Slide"
              >
                <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
              <button
                onClick={onNextSlide}
                className="p-1 sm:p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer"
                aria-label="Next Slide"
              >
                <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
