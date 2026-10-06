"use client";

import React from "react";
import Link from "next/link";
import {
  Brain, ArrowLeft, ShieldCheck, Lock, RefreshCw, LogOut, Play,
  Gauge, Target, Users, Calendar, Layers
} from "lucide-react";
import { TabId } from "@/types/admin";

export const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <Gauge className="w-3.5 h-3.5" /> },
  { id: "shots", label: "Shot Analytics", icon: <Target className="w-3.5 h-3.5" /> },
  { id: "athletes", label: "Athletes", icon: <Users className="w-3.5 h-3.5" /> },
  { id: "sessions", label: "Sessions", icon: <Calendar className="w-3.5 h-3.5" /> },
  { id: "infra", label: "Infrastructure", icon: <Layers className="w-3.5 h-3.5" /> },
];

interface AdminHeaderProps {
  isOnline: boolean;
  isAuthenticated: boolean | null;
  lastRefreshed: string;
  isRefreshing: boolean;
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  onRefresh: () => void;
  onLogout: () => void;
}

export function AdminHeader({
  isOnline,
  isAuthenticated,
  lastRefreshed,
  isRefreshing,
  activeTab,
  setActiveTab,
  onRefresh,
  onLogout,
}: AdminHeaderProps) {
  return (
    <>
      <header className="border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-2xl sticky top-0 z-50">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 border border-zinc-800/60 transition-all flex items-center gap-1.5 text-xs font-mono"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Back</span>
            </Link>

            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/20 text-emerald-400">
                <Brain className="w-4 h-4" />
              </span>
              <div>
                <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                  <span>Head Coach Command Center</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border ${
                      isOnline
                        ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/50"
                        : "bg-red-950/60 text-red-400 border-red-800/50"
                    }`}
                  >
                    {isOnline ? "● Live" : "○ Offline"}
                  </span>
                </h1>
                <p className="text-[11px] text-zinc-500 font-mono">
                  Supabase • Datadog APM • Sentry Apdex • PostHog Analytics
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {isAuthenticated ? (
              <>
                <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Authorized</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-500 hidden lg:inline">
                  Sync: {lastRefreshed}
                </span>
                <button
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800/60 text-xs font-mono text-zinc-300 transition-all active:scale-95"
                >
                  <RefreshCw
                    className={`w-3 h-3 ${isRefreshing ? "animate-spin text-emerald-400" : ""}`}
                  />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
                <button
                  onClick={onLogout}
                  title="Lock terminal and clear credentials"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/80 hover:bg-red-950/40 border border-zinc-800/60 hover:border-red-500/30 text-xs font-mono text-zinc-400 hover:text-red-300 transition-all active:scale-95"
                >
                  <LogOut className="w-3 h-3" />
                  <span className="hidden sm:inline">Lock</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/40 border border-amber-500/20 text-amber-400 text-[11px] font-mono">
                <Lock className="w-3.5 h-3.5" />
                <span>Terminal Locked</span>
              </div>
            )}
            <Link
              href="/coach"
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-bold text-xs transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Launch Studio</span>
            </Link>
          </div>
        </div>
      </header>

      {isAuthenticated === true && (
        <div className="border-b border-zinc-800/40 bg-zinc-950/50 backdrop-blur-xl sticky top-16 z-40">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 py-2 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition-all shrink-0 ${
                  activeTab === tab.id
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/10"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
