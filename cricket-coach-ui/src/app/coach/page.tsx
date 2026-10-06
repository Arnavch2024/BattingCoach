"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { TrainingCalendarModal } from "@/components/TrainingCalendarModal";
import { API_BASE_URL, WS_BASE_URL } from "@/lib/api-config";
import { PracticeMode, SessionLogItem, SHOT_CATALOG } from "@/types/coach";

import { CoachHeader } from "./components/CoachHeader";
import { ShotCatalogSidebar } from "./components/ShotCatalogSidebar";
import { CameraViewport } from "./components/CameraViewport";
import { LiveBiometricsCard } from "./components/LiveBiometricsCard";
import { SessionPerformanceCard } from "./components/SessionPerformanceCard";
import { MasterclassModal } from "./components/MasterclassModal";

export default function BatCoachDashboard() {
  const [targetShot, setTargetShot] = useState<string>("cover");
  const [practiceMode, setPracticeMode] = useState<PracticeMode>("no_bat");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLive, setIsLive] = useState<boolean>(false);
  const [hasLocalCamera, setHasLocalCamera] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showAngles, setShowAngles] = useState<boolean>(true);

  // Video Tutorial Masterclass State
  const [seenTutorials, setSeenTutorials] = useState<Record<string, boolean>>({});
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);
  const [tutorialShotId, setTutorialShotId] = useState<string>("cover");
  const [tutorialPlaybackSpeed, setTutorialPlaybackSpeed] = useState<number>(0.5);
  const [isFirstTimeTutorial, setIsFirstTimeTutorial] = useState<boolean>(false);
  const [tutorialHighlightedMistake, setTutorialHighlightedMistake] = useState<string | null>(null);
  const [tutorialCorrectionCue, setTutorialCorrectionCue] = useState<string | null>(null);

  // Live Stream & Telemetry State
  const [streamData, setStreamData] = useState<any>(null);
  const [persistentFeedback, setPersistentFeedback] = useState<any>(null);
  const [sessionLogs, setSessionLogs] = useState<SessionLogItem[]>([]);
  const [repCount, setRepCount] = useState<number>(0);
  const [totalSwings, setTotalSwings] = useState<number>(0);
  const [streakCount, setStreakCount] = useState<number>(0);
  const [sessionSeconds, setSessionSeconds] = useState<number>(0);

  // Repeated Error & Rep Locking State
  const [repeatErrorCount, setRepeatErrorCount] = useState<number>(0);
  const [isDrillLocked, setIsDrillLocked] = useState<boolean>(false);
  const [lockedErrorTitle, setLockedErrorTitle] = useState<string | null>(null);
  const [lockedCorrectionCue, setLockedCorrectionCue] = useState<string | null>(null);
  const lastErrorCodeRef = useRef<string>("");

  const [userProfile, setUserProfile] = useState<{ name: string; email: string; stance: string }>({
    name: "Arnav P.",
    email: "athlete@cricketcoach.ai",
    stance: "Right-Hand Batter",
  });

  // Supabase Database Sync State
  const [isSavingDb, setIsSavingDb] = useState<boolean>(false);
  const [dbSavedMessage, setDbSavedMessage] = useState<string | null>(null);

  // Training Schedule & Google Calendar Modal State
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);

  const wsRef = useRef<WebSocket | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const feedbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const streamIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastProcessedEventIdRef = useRef<string>("");
  const lastSpokenRef = useRef<string>("");
  const repeatErrorCountRef = useRef<number>(repeatErrorCount);
  const isDrillLockedRef = useRef<boolean>(isDrillLocked);
  const isLiveRef = useRef<boolean>(isLive);

  const targetShotRef = useRef<string>(targetShot);
  useEffect(() => {
    targetShotRef.current = targetShot;
    repeatErrorCountRef.current = 0;
    isDrillLockedRef.current = false;
    setRepeatErrorCount(0);
    setIsDrillLocked(false);
    setLockedErrorTitle(null);
    setLockedCorrectionCue(null);
    lastErrorCodeRef.current = "";
  }, [targetShot]);

  const practiceModeRef = useRef<PracticeMode>(practiceMode);
  useEffect(() => {
    practiceModeRef.current = practiceMode;
  }, [practiceMode]);

  useEffect(() => {
    repeatErrorCountRef.current = repeatErrorCount;
  }, [repeatErrorCount]);

  useEffect(() => {
    isDrillLockedRef.current = isDrillLocked;
  }, [isDrillLocked]);

  useEffect(() => {
    isLiveRef.current = isLive;
  }, [isLive]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("batcoach_user");
      if (stored) {
        setUserProfile(JSON.parse(stored));
      }
      const storedSeen = localStorage.getItem("batcoach_seen_tutorials");
      if (storedSeen) {
        setSeenTutorials(JSON.parse(storedSeen));
      }

      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const urlShot = params.get("shot");
        if (urlShot && SHOT_CATALOG.some((s) => s.id === urlShot)) {
          setTargetShot(urlShot);
        }
        if (params.get("calendar") === "true") {
          setIsCalendarOpen(true);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const openTutorialModal = (
    shotId: string,
    isFirstTime: boolean = false,
    mistakeTitle: string | null = null,
    correctionCue: string | null = null
  ) => {
    setTutorialShotId(shotId);
    setIsFirstTimeTutorial(isFirstTime);
    setTutorialHighlightedMistake(mistakeTitle);
    setTutorialCorrectionCue(correctionCue);
    setTutorialPlaybackSpeed(mistakeTitle ? 0.25 : 0.5);
    setIsTutorialOpen(true);
  };

  const handleStartFromTutorial = () => {
    const updated = { ...seenTutorials, [tutorialShotId]: true };
    setSeenTutorials(updated);
    try {
      localStorage.setItem("batcoach_seen_tutorials", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    setIsTutorialOpen(false);
    if (isDrillLocked) {
      setIsDrillLocked(false);
      setRepeatErrorCount(0);
      lastErrorCodeRef.current = "";
    }
    if (!isLive) {
      setIsLive(true);
    }
  };

  // Session elapsed timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLive) {
      timer = setInterval(() => setSessionSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isLive]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const currentMetadata = useMemo(() => {
    return SHOT_CATALOG.find((s) => s.id === targetShot) || SHOT_CATALOG[0];
  }, [targetShot]);

  const filteredShots = useMemo(() => {
    return SHOT_CATALOG.filter((shot) => {
      const matchesCat = selectedCategory === "All" || shot.category === selectedCategory;
      const matchesSearch = shot.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Dynamic Rating Logic
  const formRating = useMemo(() => {
    if (!streamData?.probs) return { label: "Awaiting Data", rating: "--", gradeColor: "bg-zinc-800 text-zinc-400" };

    const p = streamData.probs[targetShot] || 0;
    if (p > 0.75) return { label: "Elite Mastery", rating: "A+", gradeColor: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" };
    if (p > 0.55) return { label: "Good Technique", rating: "A", gradeColor: "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" };
    if (p > 0.35) return { label: "Solid Foundation", rating: "B", gradeColor: "bg-blue-500/20 text-blue-400 border border-blue-500/30" };
    if (p > 0.20) return { label: "Needs Polish", rating: "C", gradeColor: "bg-amber-500/20 text-amber-400 border border-amber-500/30" };
    return { label: "Form Adjustment", rating: "D", gradeColor: "bg-red-500/20 text-red-400 border border-red-500/30" };
  }, [streamData, targetShot]);

  // Text to Speech Voice Coach with Intervention Cue Priority
  useEffect(() => {
    if (persistentFeedback && !isMuted && typeof window !== "undefined" && "speechSynthesis" in window) {
      let textToSpeak = "";
      if (isDrillLocked && lockedCorrectionCue) {
        textToSpeak = `Drill paused. Repeated error detected: ${lockedErrorTitle}. Action: ${lockedCorrectionCue}`;
      } else {
        const tipText = persistentFeedback.correction_cue || persistentFeedback.tips?.[0] || "";
        textToSpeak = `${persistentFeedback.message}. ${tipText}`;
      }

      if (textToSpeak && textToSpeak !== lastSpokenRef.current) {
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.rate = 1.05;
        utterance.pitch = 1.0;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
        lastSpokenRef.current = textToSpeak;
      }
    }
  }, [persistentFeedback, isMuted, isDrillLocked, lockedCorrectionCue, lockedErrorTitle]);

  // WebSocket Connection & Dual-Mode Camera Streaming
  useEffect(() => {
    if (!isLive) {
      wsRef.current?.close();
      setIsConnected(false);
      setStreamData(null);
      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      return;
    }

    let localStream: MediaStream | null = null;

    const connect = () => {
      const defaultWsUrl = WS_BASE_URL;
      const ws = new WebSocket(defaultWsUrl);

      ws.onopen = () => {
        setIsConnected(true);
        ws.send(JSON.stringify({
          target: targetShotRef.current,
          practice_mode: practiceModeRef.current,
        }));

        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          navigator.mediaDevices
            .getUserMedia({
              video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
              audio: false,
            })
            .then((stream) => {
              localStream = stream;
              setHasLocalCamera(true);
              if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play().catch(console.error);
              }

              if (canvasRef.current) {
                canvasRef.current.width = 320;
                canvasRef.current.height = 240;
              }
              if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
              streamIntervalRef.current = setInterval(() => {
                if (
                  ws.readyState === WebSocket.OPEN &&
                  ws.bufferedAmount === 0 &&
                  videoRef.current &&
                  canvasRef.current &&
                  videoRef.current.videoWidth > 0
                ) {
                  const canvas = canvasRef.current;
                  const ctx = canvas.getContext("2d", { willReadFrequently: true });
                  if (ctx) {
                    ctx.drawImage(videoRef.current, 0, 0, 320, 240);
                    const base64Img = canvas.toDataURL("image/jpeg", 0.5);
                    ws.send(JSON.stringify({
                      image: base64Img,
                      target: targetShotRef.current,
                      practice_mode: practiceModeRef.current,
                    }));
                  }
                }
              }, 55);
            })
            .catch((err) => {
              console.log("[Browser Camera Notice]: Using backend camera grabber:", err);
              setHasLocalCamera(false);
            });
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setStreamData(data);

          if (data.feedback && data.feedback.id && data.feedback.id !== lastProcessedEventIdRef.current) {
            lastProcessedEventIdRef.current = data.feedback.id;
            setPersistentFeedback(data.feedback);
            setTotalSwings((s) => s + 1);

            if (data.feedback.status === "success") {
              if (isDrillLockedRef.current) {
                isDrillLockedRef.current = false;
                repeatErrorCountRef.current = 0;
                setIsDrillLocked(false);
                setRepeatErrorCount(0);
                setLockedErrorTitle(null);
                setLockedCorrectionCue(null);
                lastErrorCodeRef.current = "";
              }
              setStreakCount((c) => c + 1);
              setRepCount((r) => r + 1);
            } else {
              setStreakCount(0);
              const currentErrCode = data.feedback.error_code || data.feedback.message || "FORM_ERROR";
              let nextRepeat = 1;
              if (currentErrCode === lastErrorCodeRef.current && currentErrCode !== "NONE") {
                nextRepeat = repeatErrorCountRef.current + 1;
              }
              lastErrorCodeRef.current = currentErrCode;
              repeatErrorCountRef.current = nextRepeat;
              setRepeatErrorCount(nextRepeat);

              if (nextRepeat >= 2) {
                isDrillLockedRef.current = true;
                setIsDrillLocked(true);
                setLockedErrorTitle(`Repeated Mistake (${nextRepeat}x): ${data.feedback.message}`);
                setLockedCorrectionCue(
                  data.feedback.correction_cue ||
                    data.feedback.tips?.[0] ||
                    "Correct your technique before attempting another rep."
                );
              }
            }

            const now = new Date();
            const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
            const p = data.probs?.[targetShotRef.current] || 0;
            const newLog: SessionLogItem = {
              id: data.feedback.id,
              time: timeStr,
              shot: (SHOT_CATALOG.find((s) => s.id === targetShotRef.current) || SHOT_CATALOG[0]).name,
              confidence: p,
              grade: data.feedback.status === "success" ? (p > 0.7 ? "A+" : "A") : data.feedback.status === "wrong_shot" ? "Wrong" : "Alert",
              status: data.feedback.status,
              message: data.feedback.message,
            };

            setSessionLogs((prev) => [newLog, ...prev.slice(0, 19)]);

            if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
            feedbackTimerRef.current = setTimeout(() => setPersistentFeedback(null), 7000);
          }
        } catch (e) {
          console.error("WS Parse error", e);
        }
      };

      ws.onerror = (err) => {
        console.error("WebSocket connection error:", err);
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (isLiveRef.current) setTimeout(connect, 2000);
      };

      wsRef.current = ws;
    };

    connect();
    return () => {
      wsRef.current?.close();
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isLive]);

  const handleShotChange = (shotId: string) => {
    setTargetShot(shotId);
    targetShotRef.current = shotId;
    repeatErrorCountRef.current = 0;
    isDrillLockedRef.current = false;
    setPersistentFeedback(null);
    setRepeatErrorCount(0);
    setIsDrillLocked(false);
    setLockedErrorTitle(null);
    setLockedCorrectionCue(null);
    lastErrorCodeRef.current = "";
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        target: shotId,
        practice_mode: practiceModeRef.current,
      }));
    }

    if (!seenTutorials[shotId]) {
      openTutorialModal(shotId, true);
    }
  };

  const handleManualUnlockDrill = () => {
    isDrillLockedRef.current = false;
    repeatErrorCountRef.current = 0;
    setIsDrillLocked(false);
    setRepeatErrorCount(0);
    setLockedErrorTitle(null);
    setLockedCorrectionCue(null);
    lastErrorCodeRef.current = "";
  };

  const handleModeChange = (mode: PracticeMode) => {
    setPracticeMode(mode);
    practiceModeRef.current = mode;
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        target: targetShotRef.current,
        practice_mode: mode,
      }));
    }
  };

  const saveSessionToDatabase = async () => {
    if (sessionLogs.length === 0 && sessionSeconds < 5) return;
    setIsSavingDb(true);
    try {
      const successfulReps = sessionLogs.filter((l) => l.status === "success").length;
      const avgConf =
        sessionLogs.length > 0
          ? sessionLogs.reduce((acc, l) => acc + l.confidence, 0) / sessionLogs.length
          : 0;

      const payload = {
        athlete_email: userProfile.email || "athlete@cricketcoach.ai",
        session_duration_seconds: sessionSeconds,
        target_shot: currentMetadata.name,
        total_reps: repCount,
        successful_reps: successfulReps,
        best_streak: streakCount,
        avg_confidence: avgConf,
        practice_mode: practiceMode,
        strokes: sessionLogs.map((l) => ({
          shot_name: l.shot,
          status: l.status,
          confidence: l.confidence,
          elbow_angle: streamData?.biometrics?.elbow_angle || 0,
          knee_angle: streamData?.biometrics?.knee_angle || 0,
          blade_angle: streamData?.bat?.blade_angle || null,
          coach_feedback: `${l.grade} Grade performance`,
        })),
      };

      const res = await fetch(`${API_BASE_URL}/api/sessions/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Athlete-Email": userProfile.email,
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        setDbSavedMessage(`Session #${json.session_id} synced to Supabase DB!`);
        setTimeout(() => setDbSavedMessage(null), 4000);
      }
    } catch (err) {
      console.error("Failed to sync session with Supabase:", err);
    } finally {
      setIsSavingDb(false);
    }
  };

  const handleToggleLive = () => {
    if (isLive) {
      saveSessionToDatabase();
      setIsLive(false);
    } else {
      if (!seenTutorials[targetShot]) {
        openTutorialModal(targetShot, true);
      } else {
        setIsLive(true);
      }
    }
  };

  const bioData = streamData?.biometrics;
  const batData = streamData?.bat;
  const isBodyDetected = bioData?.body_detected === true;
  const elbowAngle = bioData?.elbow_angle || 0;
  const kneeAngle = bioData?.knee_angle || 0;
  const isElbowGood = elbowAngle >= currentMetadata.targetElbowAngle;
  const isKneeGood = kneeAngle <= currentMetadata.targetKneeAngle;
  const liveChecklist = bioData?.live_checklist || {
    elbow_ok: isElbowGood,
    knee_ok: isKneeGood,
    head_ok: bioData?.head_over_knee ?? true,
    blade_ok: batData?.alignment_match ?? true,
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-zinc-100 antialiased select-none overflow-hidden relative font-sans transition-colors duration-200">
      {/* Top DB Sync Banner */}
      <AnimatePresence>
        {dbSavedMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-950/95 border border-emerald-500/60 text-emerald-300 text-xs px-4 py-2 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span className="font-semibold">{dbSavedMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Studio Navigation Header */}
      <CoachHeader
        practiceMode={practiceMode}
        onModeChange={handleModeChange}
        isConnected={isConnected}
        streamData={streamData}
        sessionSeconds={sessionSeconds}
        formatTime={formatTime}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted(!isMuted)}
        isLive={isLive}
        onToggleLive={handleToggleLive}
        onOpenCalendar={() => setIsCalendarOpen(true)}
        onOpenFormGuide={() => openTutorialModal(targetShot, false)}
        hasLogs={sessionLogs.length > 0}
        onSaveDb={saveSessionToDatabase}
        isSavingDb={isSavingDb}
        userProfile={userProfile}
      />

      {/* Main Workspace Grid */}
      <div className="flex-1 grid grid-cols-12 gap-4 p-4 min-h-0">
        {/* Left Column: Shot Directory & Drills (3 Cols) */}
        <ShotCatalogSidebar
          filteredShots={filteredShots}
          targetShot={targetShot}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          onSelectShot={handleShotChange}
          onOpenTutorial={(shotId) => openTutorialModal(shotId, false)}
          isLive={isLive}
          streamData={streamData}
        />

        {/* Center Stage: Live Feed & Video Analysis (6 Cols) */}
        <CameraViewport
          videoRef={videoRef}
          canvasRef={canvasRef}
          isLive={isLive}
          hasLocalCamera={hasLocalCamera}
          streamData={streamData}
          practiceMode={practiceMode}
          batData={batData}
          showAngles={showAngles}
          onToggleShowAngles={setShowAngles}
          onStartPractice={() => setIsLive(true)}
          currentMetadata={currentMetadata}
          formRating={formRating}
          isBodyDetected={isBodyDetected}
          liveChecklist={liveChecklist}
          elbowAngle={elbowAngle}
          kneeAngle={kneeAngle}
          isDrillLocked={isDrillLocked}
          repeatErrorCount={repeatErrorCount}
          lockedErrorTitle={lockedErrorTitle || ""}
          lockedCorrectionCue={lockedCorrectionCue || ""}
          onOpenTutorialModal={openTutorialModal}
          onManualUnlockDrill={handleManualUnlockDrill}
          targetShot={targetShot}
          persistentFeedback={persistentFeedback}
        />

        {/* Right Column: Biometrics & Telemetry (3 Cols) */}
        <div className="col-span-3 flex flex-col gap-3 min-h-0">
          <LiveBiometricsCard
            isBodyDetected={isBodyDetected}
            isElbowGood={isElbowGood}
            isKneeGood={isKneeGood}
            elbowAngle={elbowAngle}
            kneeAngle={kneeAngle}
            currentMetadata={currentMetadata}
            practiceMode={practiceMode}
            bioData={bioData}
            batData={batData}
          />

          <SessionPerformanceCard
            repCount={repCount}
            totalSwings={totalSwings}
            streakCount={streakCount}
            isDrillLocked={isDrillLocked}
            sessionLogs={sessionLogs}
          />
        </div>
      </div>

      {/* 5-Second Video Tutorial Masterclass Modal */}
      <AnimatePresence>
        {isTutorialOpen && (
          <MasterclassModal
            shot={SHOT_CATALOG.find((s) => s.id === tutorialShotId) || SHOT_CATALOG[0]}
            isOpen={isTutorialOpen}
            onClose={() => setIsTutorialOpen(false)}
            onStartPractice={handleStartFromTutorial}
            isFirstTime={isFirstTimeTutorial}
            playbackSpeed={tutorialPlaybackSpeed}
            onSpeedChange={setTutorialPlaybackSpeed}
            highlightedMistake={tutorialHighlightedMistake}
            correctionCue={tutorialCorrectionCue}
          />
        )}
      </AnimatePresence>

      {/* Athlete Training Calendar & Google Calendar Modal */}
      <TrainingCalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        currentActiveShot={targetShot}
        userEmail={userProfile.email}
        userName={userProfile.name}
        onLaunchShot={(shotId) => {
          handleShotChange(shotId);
        }}
      />
    </div>
  );
}
