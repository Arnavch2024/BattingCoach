"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { RefreshCw } from "lucide-react";
import {
  OverviewData, ShotDistribution, FlawHotspot, Athlete, RecentSession,
  TimelineDay, HealthTelemetry, TabId
} from "@/types/admin";
import { AdminHeader } from "./components/AdminHeader";
import { AdminLoginModal } from "./components/AdminLoginModal";
import { OverviewTab } from "./components/OverviewTab";
import { ShotAnalyticsTab } from "./components/ShotAnalyticsTab";
import { AthleteRosterTab } from "./components/AthleteRosterTab";
import { RecentSessionsTab } from "./components/RecentSessionsTab";
import { InfrastructureTab } from "./components/InfrastructureTab";

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [health, setHealth] = useState<HealthTelemetry | null>(null);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [shotDist, setShotDist] = useState<ShotDistribution[]>([]);
  const [flaws, setFlaws] = useState<FlawHotspot[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [sessions, setSessions] = useState<RecentSession[]>([]);
  const [timeline, setTimeline] = useState<TimelineDay[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>("Loading...");

  // Security & Authentication State
  const [authToken, setAuthToken] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [inputToken, setInputToken] = useState<string>("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  const apiUrl =
    typeof window !== "undefined"
      ? process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8888"
      : "http://127.0.0.1:8888";

  // Verify token against backend
  const verifyToken = useCallback(
    async (token: string, silent = false) => {
      if (!silent) setIsVerifying(true);
      setAuthError(null);
      try {
        const res = await fetch(`${apiUrl}/api/admin/verify`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token.trim()}`,
            "Content-Type": "application/json",
          },
        });
        const data = await res.json();
        if (res.ok && data.admin) {
          const cleaned = token.trim();
          setAuthToken(cleaned);
          setIsAuthenticated(true);
          if (typeof window !== "undefined") {
            sessionStorage.setItem("batcoach_admin_token", cleaned);
          }
        } else {
          if (!silent) {
            setAuthError(data.error || "Authentication failed. Invalid admin token.");
          }
          setIsAuthenticated(false);
          if (typeof window !== "undefined") {
            sessionStorage.removeItem("batcoach_admin_token");
          }
        }
      } catch {
        if (!silent) {
          setAuthError("Failed to reach backend server at " + apiUrl);
        }
        setIsAuthenticated(false);
      } finally {
        if (!silent) setIsVerifying(false);
      }
    },
    [apiUrl]
  );

  // Check stored token on initial mount
  useEffect(() => {
    const stored =
      typeof window !== "undefined"
        ? sessionStorage.getItem("batcoach_admin_token")
        : null;
    if (stored) {
      verifyToken(stored, true);
    } else {
      setIsAuthenticated(false);
    }
  }, [verifyToken]);

  const handleLogout = () => {
    setAuthToken("");
    setIsAuthenticated(false);
    setInputToken("");
    setAuthError(null);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("batcoach_admin_token");
    }
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputToken.trim()) return;
    verifyToken(inputToken.trim(), false);
  };

  const fetchAll = useCallback(async () => {
    if (!authToken) return;
    setIsRefreshing(true);
    const t0 = performance.now();
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    };
    const opts: RequestInit = { method: "GET", headers, signal: AbortSignal.timeout(8000) };

    try {
      const [
        healthRes,
        overviewRes,
        shotsRes,
        flawsRes,
        athletesRes,
        sessionsRes,
        timelineRes,
      ] = await Promise.allSettled([
        fetch(`${apiUrl}/health`, { method: "GET", signal: AbortSignal.timeout(8000) }),
        fetch(`${apiUrl}/api/admin/overview`, opts),
        fetch(`${apiUrl}/api/admin/shot-distribution`, opts),
        fetch(`${apiUrl}/api/admin/flaw-hotspots`, opts),
        fetch(`${apiUrl}/api/admin/athletes`, opts),
        fetch(`${apiUrl}/api/admin/sessions/recent`, opts),
        fetch(`${apiUrl}/api/admin/timeline`, opts),
      ]);

      const pingMs = Math.round(performance.now() - t0);

      if (healthRes.status === "fulfilled" && healthRes.value.ok) {
        const d = await healthRes.value.json();
        setHealth({ ...d, pingMs });
      } else {
        setHealth({ status: "offline", pingMs });
      }

      if (
        overviewRes.status === "fulfilled" &&
        (overviewRes.value.status === 401 || overviewRes.value.status === 403)
      ) {
        setIsAuthenticated(false);
        setAuthError("Session expired or token rejected. Please re-authenticate.");
        return;
      }

      if (overviewRes.status === "fulfilled" && overviewRes.value.ok) {
        const d = await overviewRes.value.json();
        if (d.overview) setOverview(d.overview);
      }
      if (shotsRes.status === "fulfilled" && shotsRes.value.ok) {
        const d = await shotsRes.value.json();
        if (d.distribution) setShotDist(d.distribution);
      }
      if (flawsRes.status === "fulfilled" && flawsRes.value.ok) {
        const d = await flawsRes.value.json();
        if (d.hotspots) setFlaws(d.hotspots);
      }
      if (athletesRes.status === "fulfilled" && athletesRes.value.ok) {
        const d = await athletesRes.value.json();
        if (d.athletes) setAthletes(d.athletes);
      }
      if (sessionsRes.status === "fulfilled" && sessionsRes.value.ok) {
        const d = await sessionsRes.value.json();
        if (d.sessions) setSessions(d.sessions);
      }
      if (timelineRes.status === "fulfilled" && timelineRes.value.ok) {
        const d = await timelineRes.value.json();
        if (d.timeline) setTimeline(d.timeline);
      }
    } catch {
      setHealth(null);
    } finally {
      setIsRefreshing(false);
      setLastRefreshed(new Date().toLocaleTimeString());
    }
  }, [apiUrl, authToken]);

  useEffect(() => {
    if (isAuthenticated && authToken) {
      fetchAll();
      const interval = setInterval(fetchAll, 15000);
      return () => clearInterval(interval);
    }
  }, [fetchAll, isAuthenticated, authToken]);

  const isOnline = health?.status === "online";
  const dbConnected = health?.database === "connected";

  return (
    <div className="min-h-screen bg-[#08080a] text-zinc-100 font-sans antialiased selection:bg-emerald-500/20 selection:text-emerald-400">
      <AdminHeader
        isOnline={isOnline}
        isAuthenticated={isAuthenticated}
        lastRefreshed={lastRefreshed}
        isRefreshing={isRefreshing}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRefresh={fetchAll}
        onLogout={handleLogout}
      />

      {/* Auth Checking Session Loader */}
      {isAuthenticated === null && (
        <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
          <span className="text-xs font-mono text-zinc-500">
            Checking terminal security session...
          </span>
        </div>
      )}

      {/* Auth Gate When Locked */}
      {isAuthenticated === false && (
        <AdminLoginModal
          inputToken={inputToken}
          setInputToken={setInputToken}
          onSubmit={handleAuthSubmit}
          isVerifying={isVerifying}
          authError={authError}
        />
      )}

      {/* Dashboard When Authenticated */}
      {isAuthenticated === true && (
        <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <OverviewTab
                key="overview"
                overview={overview}
                health={health}
                timeline={timeline}
                shotDist={shotDist}
                flaws={flaws}
              />
            )}
            {activeTab === "shots" && (
              <ShotAnalyticsTab key="shots" shotDist={shotDist} flaws={flaws} />
            )}
            {activeTab === "athletes" && (
              <AthleteRosterTab key="athletes" athletes={athletes} />
            )}
            {activeTab === "sessions" && (
              <RecentSessionsTab key="sessions" sessions={sessions} />
            )}
            {activeTab === "infra" && (
              <InfrastructureTab
                key="infra"
                health={health}
                isOnline={isOnline}
                dbConnected={dbConnected}
              />
            )}
          </AnimatePresence>
        </main>
      )}

      {/* Custom scrollbar styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #3f3f46;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #52525b;
        }
      `}</style>
    </div>
  );
}
