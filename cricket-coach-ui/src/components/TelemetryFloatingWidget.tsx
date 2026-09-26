"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Activity, Wifi, WifiOff, ExternalLink, X, Shield, Cpu } from "lucide-react";

export function TelemetryFloatingWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [fps, setFps] = useState<number>(60);
  const [pingMs, setPingMs] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const reqAnimRef = useRef<number | null>(null);

  // 1. Live Client FPS calculation
  useEffect(() => {
    const calcFps = () => {
      frameCountRef.current++;
      const now = performance.now();
      const delta = now - lastTimeRef.current;
      if (delta >= 1000) {
        setFps(Math.round((frameCountRef.current * 1000) / delta));
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }
      reqAnimRef.current = requestAnimationFrame(calcFps);
    };

    reqAnimRef.current = requestAnimationFrame(calcFps);
    return () => {
      if (reqAnimRef.current) cancelAnimationFrame(reqAnimRef.current);
    };
  }, []);

  // 2. Lightweight Server & Network Ping
  const pingServer = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8888";
    const t0 = performance.now();
    try {
      const res = await fetch(`${apiUrl}/health`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(3000),
      });
      const duration = Math.round(performance.now() - t0);
      if (res.ok) {
        setPingMs(duration);
        setIsOnline(true);
      } else {
        setIsOnline(false);
      }
    } catch {
      setIsOnline(false);
      setPingMs(null);
    }
  };

  useEffect(() => {
    pingServer();
    const interval = setInterval(pingServer, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside aria-label="Live System HUD" className="fixed bottom-4 left-4 z-40 select-none font-sans">
      {/* ── SUBTLE POPUP MINI-CARD ── */}
      {isOpen && (
        <div
          id="athlete-hud-card"
          className="mb-2.5 w-64 rounded-2xl bg-zinc-950/90 border border-zinc-800/90 backdrop-blur-2xl p-3.5 shadow-2xl shadow-black/80 animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800/80">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isOnline ? "bg-emerald-400" : "bg-rose-400"
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    isOnline ? "bg-emerald-500" : "bg-rose-500"
                  }`}
                />
              </span>
              <span className="text-[11px] font-semibold tracking-wider uppercase text-zinc-200">
                Network & Engine
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-zinc-500 hover:text-zinc-300 p-0.5 rounded transition-colors"
              aria-label="Close HUD"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between p-1.5 rounded-lg bg-zinc-900/60 border border-zinc-800/60">
              <span className="text-zinc-400 text-[11px] flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                Render Speed
              </span>
              <span className="text-emerald-400 font-bold text-[11px]">
                {fps} FPS
              </span>
            </div>

            <div className="flex items-center justify-between p-1.5 rounded-lg bg-zinc-900/60 border border-zinc-800/60">
              <span className="text-zinc-400 text-[11px] flex items-center gap-1.5">
                {isOnline ? (
                  <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                ) : (
                  <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                )}
                AI Engine Latency
              </span>
              <span
                className={`font-bold text-[11px] ${
                  isOnline ? "text-cyan-400" : "text-rose-400"
                }`}
              >
                {isOnline && pingMs !== null ? `${pingMs}ms` : "Offline"}
              </span>
            </div>
          </div>

          {/* Link to Dedicated Visual Admin Cockpit */}
          <Link
            href="/admin"
            className="mt-3 w-full py-1.5 px-2.5 rounded-xl bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-transparent hover:from-emerald-500/20 hover:via-cyan-500/20 border border-emerald-500/20 text-emerald-300 text-[11px] font-medium flex items-center justify-between transition-all group"
          >
            <span className="flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-emerald-400" />
              <span>Head Coach Cockpit</span>
            </span>
            <ExternalLink className="w-3 h-3 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      )}

      {/* ── ULTRA-MINIMAL HUD PILL TRIGGER ── */}
      <button
        id="athlete-telemetry-pill"
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-800/90 hover:border-emerald-500/40 backdrop-blur-xl shadow-lg shadow-black/50 text-[11px] font-mono text-zinc-300 transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none"
        title="Network & FPS Telemetry"
      >
        <span className="relative flex h-2 w-2">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isOnline ? "bg-emerald-400" : "bg-amber-400"
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isOnline ? "bg-emerald-500" : "bg-amber-500"
            }`}
          />
        </span>

        <span className="font-semibold text-emerald-400">{fps} FPS</span>
        <span className="text-zinc-600">•</span>
        <span className="text-zinc-400">
          {isOnline && pingMs !== null ? `${pingMs}ms` : "Standby"}
        </span>
      </button>
    </aside>
  );
}
