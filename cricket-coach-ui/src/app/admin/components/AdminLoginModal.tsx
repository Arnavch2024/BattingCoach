"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Key, Eye, EyeOff, ShieldCheck, ShieldAlert, RefreshCw } from "lucide-react";

interface AdminLoginModalProps {
  inputToken: string;
  setInputToken: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isVerifying: boolean;
  authError: string | null;
}

export function AdminLoginModal({
  inputToken,
  setInputToken,
  onSubmit,
  isVerifying,
  authError,
}: AdminLoginModalProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle Cyber Glowing Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="rounded-3xl bg-zinc-950/80 border border-zinc-800/80 p-8 shadow-2xl shadow-black/80 backdrop-blur-2xl space-y-6">
          {/* Crest / Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/10">
              <Lock className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-[10px] font-mono text-emerald-400 uppercase tracking-wider">
                <ShieldCheck className="w-3 h-3" />
                <span>Protected Admin Terminal</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white">
                Head Coach Authentication
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">
                Enter the 256-bit cryptographic API secret to decrypt athlete records, flaw telemetry, and APM metrics.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-zinc-400 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Key className="w-3 h-3 text-emerald-400" />
                  <span>Admin Access Key</span>
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">Bearer Secret</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={inputToken}
                  onChange={(e) => setInputToken(e.target.value)}
                  placeholder="Paste your ADMIN_API_TOKEN..."
                  className="w-full px-4 py-3 pr-10 rounded-xl bg-zinc-900/80 border border-zinc-800 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40 text-xs font-mono text-white placeholder:text-zinc-600 outline-none transition-all"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {authError && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-red-950/40 border border-red-800/50 flex items-start gap-2.5 text-xs text-red-300 font-mono"
              >
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{authError}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isVerifying || !inputToken.trim()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 font-bold text-xs tracking-wide transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying Cryptographic Digest...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Authenticate & Decrypt</span>
                </>
              )}
            </button>
          </form>

          {/* Security Specs Pill Row */}
          <div className="pt-2 border-t border-zinc-900 grid grid-cols-2 gap-2 text-[10px] font-mono text-zinc-500">
            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-zinc-900/40 border border-zinc-800/40">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Rate-Limit Guard</span>
            </div>
            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-zinc-900/40 border border-zinc-800/40">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Timing-Safe Hash</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
