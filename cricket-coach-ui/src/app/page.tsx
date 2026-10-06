"use client";

import React, { useState, useEffect, useMemo } from "react";
import { CricketScrollAnimation } from "@/components/CricketScrollAnimation";
import { TrainingCalendarModal } from "@/components/TrainingCalendarModal";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { HeroSection } from "@/components/landing/HeroSection";
import { ArchitectureSection } from "@/components/landing/ArchitectureSection";
import { StrokeDirectorySection } from "@/components/landing/StrokeDirectorySection";
import { AthleteAuthModal } from "@/components/landing/AthleteAuthModal";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { API_BASE_URL } from "@/lib/api-config";
import { HERO_SLIDES, SHOT_MODULES, UserProfile } from "@/types/landing";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

const parseJwt = (token: string) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("JWT Decode error:", e);
    return null;
  }
};

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedShotCategory, setSelectedShotCategory] = useState<string>("All");

  // Form State
  const [authEmail, setAuthEmail] = useState("");
  const [authName, setAuthName] = useState("");
  const [authStance, setAuthStance] = useState<"Right-Hand Batter" | "Left-Hand Batter">("Right-Hand Batter");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load user from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("batcoach_user");
      if (stored) {
        setUserProfile(JSON.parse(stored));
      } else {
        const defaultUser: UserProfile = {
          name: "Arnav P.",
          email: "arnav.player@gmail.com",
          provider: "google",
          stance: "Right-Hand Batter",
        };
        setUserProfile(defaultUser);
        localStorage.setItem("batcoach_user", JSON.stringify(defaultUser));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Background Slider Auto-cycle
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  const syncUserToSupabase = async (user: UserProfile) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/athlete/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Athlete-Email": user.email,
        },
        body: JSON.stringify({
          email: user.email,
          name: user.name,
          stance: user.stance,
          experience_level: "Club Cricketer",
        }),
      });
      if (!res.ok) {
        console.warn(`Supabase sync HTTP ${res.status}, profile retained locally.`);
      }
    } catch {
      console.warn("Supabase sync notice: Backend offline or unreachable, profile retained locally.");
    }
  };

  const handleCredentialResponse = async (response: any) => {
    if (response?.credential) {
      const payload = parseJwt(response.credential);
      if (payload) {
        const googleUser: UserProfile = {
          name: payload.name || payload.given_name || "Athlete",
          email: payload.email,
          avatar: payload.picture,
          provider: "google",
          stance: authStance,
        };
        setUserProfile(googleUser);
        localStorage.setItem("batcoach_user", JSON.stringify(googleUser));
        await syncUserToSupabase(googleUser);
        setIsSignInOpen(false);
      }
    }
  };

  // Initialize Google GSI Button
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).google && isSignInOpen) {
      try {
        (window as any).google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
        });
        const btnContainer = document.getElementById("googleOfficialButton");
        if (btnContainer) {
          btnContainer.innerHTML = "";
          (window as any).google.accounts.id.renderButton(btnContainer, {
            theme: "outline",
            size: "large",
            shape: "rectangular",
            width: 320,
            text: "continue_with",
          });
        }
      } catch (err) {
        console.error("Google Sign-In initialization:", err);
      }
    }
  }, [isSignInOpen, authStance]);

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    const googleUser: UserProfile = {
      name: authName.trim() || "Arnav P.",
      email: authEmail.includes("@") ? authEmail : "arnav.player@gmail.com",
      provider: "google",
      stance: authStance,
    };
    setUserProfile(googleUser);
    localStorage.setItem("batcoach_user", JSON.stringify(googleUser));
    await syncUserToSupabase(googleUser);
    setIsSubmitting(false);
    setIsSignInOpen(false);
  };

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const emailUser: UserProfile = {
      name: authName.trim() || (authEmail.split("@")[0].toUpperCase() || "Athlete"),
      email: authEmail || "athlete@batcoach.ai",
      provider: "email",
      stance: authStance,
    };
    setUserProfile(emailUser);
    localStorage.setItem("batcoach_user", JSON.stringify(emailUser));
    await syncUserToSupabase(emailUser);
    setIsSubmitting(false);
    setIsSignInOpen(false);
  };

  const handleSignOut = () => {
    setUserProfile(null);
    localStorage.removeItem("batcoach_user");
  };

  const filteredShots = useMemo(() => {
    if (selectedShotCategory === "All") return SHOT_MODULES;
    return SHOT_MODULES.filter((s) => s.category === selectedShotCategory);
  }, [selectedShotCategory]);

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 dark:bg-[#09090b] dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200 selection:bg-emerald-500/20 selection:text-emerald-700 dark:selection:text-emerald-300 relative">
      {/* Kinetic Cricket Bat & Dropping Ball Scroll Animation */}
      <CricketScrollAnimation />

      {/* Navigation Header */}
      <LandingHeader
        userProfile={userProfile}
        onOpenSignIn={() => setIsSignInOpen(true)}
        onOpenCalendar={() => setIsCalendarOpen(true)}
        onSignOut={handleSignOut}
      />

      {/* Hero Section with Dynamic Slider */}
      <HeroSection
        slides={HERO_SLIDES}
        currentSlide={currentSlide}
        onSelectSlide={setCurrentSlide}
        onPrevSlide={() => setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
        onNextSlide={() => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)}
        onOpenCalendar={() => setIsCalendarOpen(true)}
        onOpenSignIn={() => setIsSignInOpen(true)}
      />

      {/* Biomechanics Engine & Technical Architecture */}
      <ArchitectureSection />

      {/* Supported Stroke Syllabus */}
      <StrokeDirectorySection
        shots={filteredShots}
        selectedCategory={selectedShotCategory}
        onSelectCategory={setSelectedShotCategory}
      />

      {/* Footer */}
      <LandingFooter />

      {/* Athlete Sign In Modal */}
      <AthleteAuthModal
        isOpen={isSignInOpen}
        onClose={() => setIsSignInOpen(false)}
        onGoogleSignIn={handleGoogleSignIn}
        onEmailSubmit={handleEmailAuthSubmit}
        authName={authName}
        onNameChange={setAuthName}
        authEmail={authEmail}
        onEmailChange={setAuthEmail}
        authStance={authStance}
        onStanceChange={setAuthStance}
        isSubmitting={isSubmitting}
      />

      {/* Athlete Training Calendar Modal */}
      <TrainingCalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        userEmail={userProfile?.email}
        userName={userProfile?.name}
        onLaunchShot={(shotId) => {
          window.location.href = `/coach?shot=${shotId}`;
        }}
      />
    </div>
  );
}
