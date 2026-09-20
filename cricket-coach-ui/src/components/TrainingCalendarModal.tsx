"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Calendar as CalendarIcon, Clock, Plus, CheckCircle2, 
  ExternalLink, Download, Trash2, MapPin, Target, Sparkles, 
  ChevronRight, X, AlertCircle, ShieldCheck, Flame, Play,
  Check, Filter, RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { 
  TrainingEvent, 
  SessionType, 
  SESSION_TYPE_CONFIG, 
  buildGoogleCalendarUrl, 
  downloadIcsFile, 
  loadTrainingSchedule, 
  saveTrainingSchedule,
  requestGoogleCalendarAuth,
  insertEventToGoogleCalendar
} from "@/lib/googleCalendar";

interface TrainingCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchShot?: (shotId: string) => void;
  currentActiveShot?: string;
  userEmail?: string;
  userName?: string;
}

const AVAILABLE_SHOTS = [
  { id: "cover", name: "Cover Drive", category: "Drives" },
  { id: "straight", name: "Straight Drive", category: "Drives" },
  { id: "pull", name: "Pull Shot", category: "Power & Cross-Bat" },
  { id: "hook", name: "Hook Shot", category: "Power & Cross-Bat" },
  { id: "square_cut", name: "Square Cut", category: "Power & Cross-Bat" },
  { id: "lofted", name: "Lofted Drive", category: "Power & Cross-Bat" },
  { id: "defense", name: "Forward Defense", category: "Defensive & Technical" },
  { id: "late_cut", name: "Late Cut", category: "Defensive & Technical" },
  { id: "flick", name: "Wrist Flick", category: "Whips & Sweeps" },
  { id: "sweep", name: "Sweep Shot", category: "Whips & Sweeps" },
];

export function TrainingCalendarModal({
  isOpen,
  onClose,
  onLaunchShot,
  currentActiveShot = "cover",
  userEmail,
  userName,
}: TrainingCalendarModalProps) {
  const [events, setEvents] = useState<TrainingEvent[]>([]);
  const [filterType, setFilterType] = useState<string>("all");
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [googleAuthStatus, setGoogleAuthStatus] = useState<"idle" | "authenticating" | "connected">("idle");
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // Form State for New Session
  const [formData, setFormData] = useState({
    title: "",
    shotId: currentActiveShot,
    sessionType: "net_session" as SessionType,
    date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    startTime: "17:00",
    durationMinutes: 45,
    targetReps: 30,
    location: "Turf Nets / Academy",
    notes: "",
  });

  // Load existing events isolated specifically for this user
  useEffect(() => {
    if (isOpen) {
      // 1. Load from user-specific local storage immediately
      const loaded = loadTrainingSchedule(userEmail);
      setEvents(loaded);

      // 2. Fetch from backend DB for this user if available
      const activeEmail = userEmail || "athlete@cricketcoach.ai";
      fetch(`http://127.0.0.1:8888/api/schedule/list?email=${encodeURIComponent(activeEmail)}`)
        .then(res => res.json())
        .then(data => {
          if (data?.success && Array.isArray(data.schedules) && data.schedules.length > 0) {
            setEvents(data.schedules);
            saveTrainingSchedule(data.schedules, userEmail);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, userEmail]);

  // Update target shot default when modal opens
  useEffect(() => {
    if (currentActiveShot) {
      setFormData(prev => ({ ...prev, shotId: currentActiveShot }));
    }
  }, [currentActiveShot]);

  // Handle Quick Presets
  const applyPreset = (preset: {
    title: string;
    sessionType: SessionType;
    duration: number;
    reps: number;
    shotId: string;
    notes: string;
  }) => {
    setFormData(prev => ({
      ...prev,
      title: preset.title,
      sessionType: preset.sessionType,
      durationMinutes: preset.duration,
      targetReps: preset.reps,
      shotId: preset.shotId,
      notes: preset.notes,
    }));
  };

  // Filtered Events
  const filteredEvents = useMemo(() => {
    if (filterType === "all") return events;
    if (filterType === "completed") return events.filter(e => e.completed);
    if (filterType === "upcoming") return events.filter(e => !e.completed);
    return events.filter(e => e.sessionType === filterType);
  }, [events, filterType]);

  // Stats calculation
  const totalRepsBooked = useMemo(() => {
    return events.reduce((acc, ev) => acc + (ev.targetReps || 0), 0);
  }, [events]);

  const completedCount = useMemo(() => {
    return events.filter(e => e.completed).length;
  }, [events]);

  // Save new session handler
  const handleCreateSession = (andSyncGoogle: boolean = false) => {
    if (!formData.title.trim()) {
      alert("Please enter a practice session title.");
      return;
    }

    const shotMeta = AVAILABLE_SHOTS.find(s => s.id === formData.shotId) || AVAILABLE_SHOTS[0];

    const activeEmail = userEmail || "athlete@cricketcoach.ai";

    const newEvent: TrainingEvent = {
      id: `sched_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: formData.title.trim(),
      shotId: formData.shotId,
      shotName: shotMeta.name,
      sessionType: formData.sessionType,
      date: formData.date,
      startTime: formData.startTime,
      durationMinutes: formData.durationMinutes,
      targetReps: formData.targetReps,
      location: formData.location.trim() || "Cricket Nets",
      notes: formData.notes.trim(),
      completed: false,
      syncedToGoogle: andSyncGoogle,
      athleteEmail: activeEmail,
      createdAt: new Date().toISOString(),
    };

    const updated = [newEvent, ...events];
    setEvents(updated);
    saveTrainingSchedule(updated, userEmail);
    setIsCreating(false);

    // Sync to backend if running
    try {
      fetch("http://127.0.0.1:8888/api/schedule/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newEvent, athlete_email: activeEmail }),
      }).catch(() => {});
    } catch (_) {}

    if (andSyncGoogle) {
      // 1-Click direct Google Calendar Web Intent
      const gcalUrl = buildGoogleCalendarUrl(newEvent);
      window.open(gcalUrl, "_blank", "noopener,noreferrer");
      setSyncNotice(`📅 Added "${newEvent.title}" to your schedule and opened Google Calendar!`);
    } else {
      setSyncNotice(`✅ Practice session "${newEvent.title}" scheduled successfully!`);
    }

    setTimeout(() => setSyncNotice(null), 5000);
  };

  // Toggle completion
  const handleToggleComplete = (id: string) => {
    const updated = events.map(e => {
      if (e.id === id) {
        return { ...e, completed: !e.completed };
      }
      return e;
    });
    setEvents(updated);
    saveTrainingSchedule(updated, userEmail);

    // Sync toggle to backend
    const activeEmail = userEmail || "athlete@cricketcoach.ai";
    const target = updated.find(e => e.id === id);
    if (target) {
      try {
        fetch("http://127.0.0.1:8888/api/schedule/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...target, athlete_email: activeEmail }),
        }).catch(() => {});
      } catch (_) {}
    }
  };

  // Delete session
  const handleDeleteEvent = (id: string) => {
    const updated = events.filter(e => e.id !== id);
    setEvents(updated);
    saveTrainingSchedule(updated, userEmail);

    // Delete from backend for this user
    const activeEmail = userEmail || "athlete@cricketcoach.ai";
    try {
      fetch(`http://127.0.0.1:8888/api/schedule/${id}?email=${encodeURIComponent(activeEmail)}`, {
        method: "DELETE",
      }).catch(() => {});
    } catch (_) {}
  };

  // Direct 1-Click Sync to Google Calendar for existing event
  const handleSyncToGoogle = (event: TrainingEvent) => {
    const url = buildGoogleCalendarUrl(event);
    window.open(url, "_blank", "noopener,noreferrer");
    
    const updated = events.map(e => e.id === event.id ? { ...e, syncedToGoogle: true } : e);
    setEvents(updated);
    saveTrainingSchedule(updated, userEmail);
    
    setSyncNotice(`📅 Google Calendar opened for "${event.title}". Click "Save" in Google Calendar!`);
    setTimeout(() => setSyncNotice(null), 4000);
  };

  // Connect Google Account via GIS OAuth (user-scoped)
  const handleConnectGoogleOAuth = () => {
    setGoogleAuthStatus("authenticating");
    requestGoogleCalendarAuth(
      (token) => {
        setGoogleAuthStatus("connected");
        setSyncNotice("✨ Google Calendar API connected for your account! Direct API sync enabled.");
        setTimeout(() => setSyncNotice(null), 4000);
      },
      (err) => {
        setGoogleAuthStatus("idle");
        alert("Google authorization popup closed or blocked. You can still use the 1-click 'Add to Google Calendar' button anytime!");
      },
      userEmail
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 dark:bg-black/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800/90 rounded-2xl shadow-2xl overflow-hidden my-auto"
        >
          {/* Header */}
          <div className="px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-zinc-800 bg-gradient-to-r from-slate-50 via-white to-slate-100 dark:from-zinc-900 dark:via-zinc-900/90 dark:to-zinc-950 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-md">
                <CalendarIcon className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    Athlete Training Calendar
                  </h2>
                  <Badge className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30 text-[10px] font-mono">
                    Google Calendar Sync
                  </Badge>
                  {userEmail && (
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-2 py-0.5 rounded-full">
                      👤 {userName ? `${userName} (${userEmail})` : userEmail}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Schedule batting practices, net sessions, and match days with 1-click Google Calendar sync.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => setIsCreating(!isCreating)}
                className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-bold text-xs gap-1.5 h-8 shadow-md"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{isCreating ? "View Schedule" : "Schedule Practice"}</span>
              </Button>

              <button
                onClick={onClose}
                className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white flex items-center justify-center border border-slate-200 dark:border-zinc-800 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Quick Stats & Notification Strip */}
          {syncNotice && (
            <div className="px-6 py-2 bg-emerald-50 dark:bg-emerald-950/60 border-b border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{syncNotice}</span>
            </div>
          )}

          <div className="px-5 sm:px-6 py-2.5 bg-slate-50/80 dark:bg-zinc-900/40 border-b border-slate-200 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4 text-slate-600 dark:text-zinc-400">
              <span>📅 Total: <strong className="text-slate-900 dark:text-white">{events.length}</strong></span>
              <span>✅ Completed: <strong className="text-emerald-600 dark:text-emerald-400">{completedCount}</strong></span>
              <span>🎯 Target Reps: <strong className="text-cyan-600 dark:text-cyan-400">{totalRepsBooked}</strong></span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-zinc-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                <span>Google Calendar Ready</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleConnectGoogleOAuth}
                className="h-6 text-[10px] px-2 border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white"
                title="Connect OAuth for automated direct calendar sync"
              >
                {googleAuthStatus === "connected" ? "✓ GCal Connected" : "Connect Google Account"}
              </Button>
            </div>
          </div>

          {/* Modal Body: Either Create Form or Calendar List */}
          <div className="p-5 sm:p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-4">
            {isCreating ? (
              /* ── Create New Practice Session Form ───────────────────────── */
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Presets Strip */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-2">
                    ⚡ Quick Presets (Click to Auto-Fill):
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => applyPreset({
                        title: "Cover Drive High-Elbow Net Practice",
                        sessionType: "net_session",
                        duration: 45,
                        reps: 35,
                        shotId: "cover",
                        notes: "Focus on knee bend ≤ 155° and vertical blade presentation.",
                      })}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/60 hover:border-emerald-500/40 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 text-left transition-all group cursor-pointer"
                    >
                      <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300">🏏 45m Net Session</div>
                      <div className="text-[10px] text-slate-500 dark:text-zinc-400">Cover Drive • 35 Reps</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => applyPreset({
                        title: "Cross-Bat Power Pull Calibration",
                        sessionType: "technique_calibration",
                        duration: 30,
                        reps: 25,
                        shotId: "pull",
                        notes: "Weight transfer to back foot with horizontal wrist roll.",
                      })}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/60 hover:border-cyan-500/40 hover:bg-cyan-50/50 dark:hover:bg-cyan-950/20 text-left transition-all group cursor-pointer"
                    >
                      <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300">🎯 Power Pull Drill</div>
                      <div className="text-[10px] text-slate-500 dark:text-zinc-400">Pull Shot • 25 Reps</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => applyPreset({
                        title: "Morning Shadow Biomechanics Drill",
                        sessionType: "shadow_drill",
                        duration: 25,
                        reps: 20,
                        shotId: "straight",
                        notes: "Zero bat overhead, pure 3D MediaPipe posture calibration.",
                      })}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/60 hover:border-violet-500/40 hover:bg-violet-50/50 dark:hover:bg-violet-950/20 text-left transition-all group cursor-pointer"
                    >
                      <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-300">🥋 Shadow Form</div>
                      <div className="text-[10px] text-slate-500 dark:text-zinc-400">Straight Drive • 20 Reps</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => applyPreset({
                        title: "Weekend Tournament Match Fixture",
                        sessionType: "match_day",
                        duration: 180,
                        reps: 15,
                        shotId: "cover",
                        notes: "Match fixture day. Pre-game batting warmup and focus.",
                      })}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/60 hover:border-amber-500/40 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 text-left transition-all group cursor-pointer"
                    >
                      <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-300">🏆 Match Day</div>
                      <div className="text-[10px] text-slate-500 dark:text-zinc-400">Fixture • Match Prep</div>
                    </button>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/70 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 p-4 rounded-xl">
                  {/* Session Title */}
                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                      Practice Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Cover Drive High-Elbow Net Practice"
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                    />
                  </div>

                  {/* Target Shot */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                      Focus Stroke / Shot
                    </label>
                    <select
                      value={formData.shotId}
                      onChange={(e) => setFormData({ ...formData, shotId: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                    >
                      {AVAILABLE_SHOTS.map(shot => (
                        <option key={shot.id} value={shot.id} className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">
                          {shot.name} ({shot.category})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Session Type */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                      Session Type
                    </label>
                    <select
                      value={formData.sessionType}
                      onChange={(e) => setFormData({ ...formData, sessionType: e.target.value as SessionType })}
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                    >
                      {Object.entries(SESSION_TYPE_CONFIG).map(([key, config]) => (
                        <option key={key} value={key} className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">
                          {config.icon} {config.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                      Practice Date *
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                    />
                  </div>

                  {/* Start Time */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                      Start Time (24h) *
                    </label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                    />
                  </div>

                  {/* Duration & Target Reps */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                      Duration: <strong className="text-emerald-600 dark:text-emerald-400">{formData.durationMinutes} mins</strong>
                    </label>
                    <div className="flex items-center gap-2">
                      {[20, 30, 45, 60, 90].map(mins => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setFormData({ ...formData, durationMinutes: mins })}
                          className={cn(
                            "flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer",
                            formData.durationMinutes === mins
                              ? "bg-emerald-600 dark:bg-emerald-500 text-white border-emerald-500 dark:border-emerald-400 font-bold"
                              : "bg-white dark:bg-zinc-950 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800 hover:text-slate-900 dark:hover:text-white"
                          )}
                        >
                          {mins}m
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                      Target Reps: <strong className="text-cyan-600 dark:text-cyan-400">{formData.targetReps} Reps</strong>
                    </label>
                    <div className="flex items-center gap-2">
                      {[15, 25, 35, 50, 75].map(reps => (
                        <button
                          key={reps}
                          type="button"
                          onClick={() => setFormData({ ...formData, targetReps: reps })}
                          className={cn(
                            "flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer",
                            formData.targetReps === reps
                              ? "bg-cyan-600 dark:bg-cyan-500 text-white border-cyan-500 dark:border-cyan-400 font-bold"
                              : "bg-white dark:bg-zinc-950 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800 hover:text-slate-900 dark:hover:text-white"
                          )}
                        >
                          {reps}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Location */}
                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                      Location / Net Bay
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g. Academy Turf Bay #2, Home Practice Studio"
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                    />
                  </div>

                  {/* Notes / Technique Focus */}
                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                      Technique Focus & Coach Notes
                    </label>
                    <textarea
                      rows={2}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="e.g. High lead elbow, head still, vertical blade presentation down the ground."
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white text-xs h-9"
                  >
                    Cancel
                  </Button>

                  <Button
                    type="button"
                    onClick={() => handleCreateSession(false)}
                    className="bg-slate-800 hover:bg-slate-900 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-semibold text-xs h-9 gap-1.5"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Save to BatCoach</span>
                  </Button>

                  <Button
                    type="button"
                    onClick={() => handleCreateSession(true)}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-500 dark:to-teal-500 hover:from-emerald-700 hover:to-teal-700 dark:hover:from-emerald-600 dark:hover:to-teal-600 text-white font-bold text-xs h-9 gap-1.5 shadow-lg"
                  >
                    <CalendarIcon className="h-4 w-4" />
                    <span>Save & Add to Google Calendar</span>
                    <ExternalLink className="h-3.5 w-3.5 opacity-80" />
                  </Button>
                </div>
              </motion.div>
            ) : (
              /* ── Schedule Timeline & Event Cards List ───────────────────── */
              <div className="space-y-4">
                {/* Filter Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  <span className="text-slate-400 dark:text-zinc-500 flex items-center gap-1 text-[11px] mr-1">
                    <Filter className="h-3 w-3" /> Filter:
                  </span>
                  {[
                    { id: "all", label: "All Sessions" },
                    { id: "upcoming", label: "Upcoming" },
                    { id: "net_session", label: "🏏 Nets" },
                    { id: "shadow_drill", label: "🥋 Shadow" },
                    { id: "match_day", label: "🏆 Matches" },
                    { id: "completed", label: "✓ Done" },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setFilterType(tab.id)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer",
                        filterType === tab.id
                          ? "bg-slate-900 dark:bg-zinc-800 text-white border border-slate-800 dark:border-zinc-700 font-bold shadow-sm"
                          : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-900/60"
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Event Cards */}
                {filteredEvents.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl bg-slate-50 dark:bg-zinc-900/20">
                    <CalendarIcon className="h-10 w-10 text-slate-400 dark:text-zinc-600 mx-auto mb-3" />
                    <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-300 mb-1">No Practice Sessions Found</h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-500 mb-4 max-w-sm mx-auto">
                      Schedule batting sessions to stay consistent and sync practice dates to your Google Calendar.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => setIsCreating(true)}
                      className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white text-xs gap-1.5 font-bold shadow-md"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Schedule First Session</span>
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {filteredEvents.map(event => {
                      const typeConfig = SESSION_TYPE_CONFIG[event.sessionType] || SESSION_TYPE_CONFIG.net_session;
                      const isPast = new Date(`${event.date}T${event.startTime}`) < new Date();

                      return (
                        <motion.div
                          key={event.id}
                          layout
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            "p-4 rounded-xl border transition-all relative overflow-hidden group",
                            event.completed 
                              ? "bg-slate-50/70 dark:bg-zinc-900/30 border-slate-200 dark:border-zinc-800/60 opacity-75" 
                              : "bg-white dark:bg-zinc-900/70 border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 shadow-sm"
                          )}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            {/* Left: Type, Title, Details */}
                            <div className="flex items-start gap-3">
                              <button
                                onClick={() => handleToggleComplete(event.id)}
                                title={event.completed ? "Mark as Upcoming" : "Mark as Completed"}
                                className={cn(
                                  "mt-0.5 h-6 w-6 rounded-full border flex items-center justify-center transition-colors cursor-pointer shrink-0",
                                  event.completed
                                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                                    : "border-slate-300 dark:border-zinc-700 text-transparent hover:border-slate-400 dark:hover:border-zinc-500"
                                )}
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>

                              <div>
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", typeConfig.bgBadge, typeConfig.borderBadge)}>
                                    {typeConfig.icon} {typeConfig.label}
                                  </span>

                                  <Badge variant="outline" className="text-[10px] text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 font-mono">
                                    🎯 {event.shotName}
                                  </Badge>

                                  {event.completed && (
                                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-300 dark:border-emerald-500/30">
                                      Completed
                                    </span>
                                  )}
                                </div>

                                <h4 className={cn(
                                  "text-sm font-bold text-slate-900 dark:text-white leading-tight",
                                  event.completed && "line-through text-slate-400 dark:text-zinc-500"
                                )}
                                >
                                  {event.title}
                                </h4>

                                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500 dark:text-zinc-400">
                                  <div className="flex items-center gap-1 font-mono">
                                    <CalendarIcon className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
                                    <span>{event.date}</span>
                                  </div>

                                  <div className="flex items-center gap-1 font-mono">
                                    <Clock className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
                                    <span>{event.startTime} ({event.durationMinutes}m)</span>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    <Flame className="h-3.5 w-3.5 text-amber-500" />
                                    <span className="font-semibold text-slate-700 dark:text-zinc-300">{event.targetReps} Reps</span>
                                  </div>

                                  {event.location && (
                                    <div className="flex items-center gap-1">
                                      <MapPin className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
                                      <span className="truncate max-w-[150px]">{event.location}</span>
                                    </div>
                                  )}
                                </div>

                                {event.notes && (
                                  <p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-1.5 italic bg-slate-50 dark:bg-zinc-950/40 px-2 py-1 rounded border border-slate-200 dark:border-zinc-800/40">
                                    "{event.notes}"
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Right: Actions */}
                            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                              {/* 1-Click Google Calendar Sync */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSyncToGoogle(event)}
                                className="h-8 text-xs border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 hover:text-emerald-900 dark:hover:text-white gap-1"
                                title="Open in Google Calendar (1-click)"
                              >
                                <CalendarIcon className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
                                <span className="hidden md:inline">Add to</span> Google
                                <ExternalLink className="h-3 w-3 opacity-70" />
                              </Button>

                              {/* Download .ICS file */}
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => downloadIcsFile(event)}
                                className="h-8 w-8 border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-zinc-950"
                                title="Download .ICS Calendar File (Apple / Outlook / Phone)"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </Button>

                              {/* Direct Launch in Coach */}
                              {onLaunchShot && (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    onLaunchShot(event.shotId);
                                    onClose();
                                  }}
                                  className="h-8 bg-slate-900 hover:bg-emerald-600 dark:bg-zinc-800 dark:hover:bg-emerald-600 text-white font-semibold text-xs gap-1 shadow-sm"
                                  title="Launch this drill in BatCoach AI now"
                                >
                                  <Play className="h-3 w-3 fill-current" />
                                  <span>Start Drill</span>
                                </Button>
                              )}

                              {/* Delete */}
                              <button
                                onClick={() => handleDeleteEvent(event.id)}
                                className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center transition-colors cursor-pointer"
                                title="Delete session"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-zinc-500 gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
              <span>Synced locally & ready for Google Calendar, Apple Calendar, and iCal.</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="h-7 text-xs border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
              >
                Done
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
