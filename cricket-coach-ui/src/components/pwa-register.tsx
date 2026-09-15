"use client";

import React, { useEffect, useState } from "react";
import { Download, Check, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export function PwaRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("[PWA] ServiceWorker registration successful:", registration.scope);
          })
          .catch((err) => {
            console.warn("[PWA] ServiceWorker registration failed:", err);
          });
      });
    }
  }, []);

  return null;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode
    if (
      typeof window !== "undefined" &&
      (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true)
    ) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      console.log("[PWA] App successfully installed!");
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  if (!isInstallable || isDismissed || isInstalled) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-4 right-4 z-50 max-w-sm bg-zinc-950 border border-emerald-500/50 rounded-2xl p-4 shadow-2xl backdrop-blur-xl flex items-center gap-3.5"
      >
        <img
          src="/icons/icon-192x192.png"
          alt="BatCoach App"
          className="h-10 w-10 rounded-xl object-cover border border-emerald-500/40 shadow-sm shrink-0"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-white">Install BatCoach App</span>
            <Sparkles className="h-3 w-3 text-emerald-400" />
          </div>
          <p className="text-[11px] text-zinc-400 leading-tight truncate">
            Add to home screen for fullscreen live coaching
          </p>
        </div>

        <Button
          size="sm"
          onClick={handleInstallClick}
          className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold h-8 px-3 shrink-0"
        >
          <Download className="h-3.5 w-3.5 mr-1" />
          Install
        </Button>

        <button
          onClick={() => setIsDismissed(true)}
          className="text-zinc-500 hover:text-zinc-300 p-1 rounded-md transition-colors"
          aria-label="Dismiss install prompt"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
