"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "./theme-provider";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.94 }}
      onClick={toggleTheme}
      className={cn(
        "relative flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer select-none",
        "bg-white/80 hover:bg-slate-100 text-slate-700 border-slate-200/90 shadow-sm",
        "dark:bg-zinc-900/80 dark:hover:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-800",
        className
      )}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label="Toggle theme"
    >
      <div className="relative h-4 w-4 flex items-center justify-center overflow-hidden">
        <motion.div
          key={theme}
          initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          exit={{ rotate: 90, scale: 0.5, opacity: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 25 }}
          className="flex items-center justify-center"
        >
          {isDark ? (
            <Moon className="h-4 w-4 text-cyan-400 fill-cyan-400/20" />
          ) : (
            <Sun className="h-4 w-4 text-amber-500 fill-amber-500/20" />
          )}
        </motion.div>
      </div>

      {showLabel && (
        <span className="text-xs font-semibold tracking-tight">
          {isDark ? "Dark" : "Light"}
        </span>
      )}
    </motion.button>
  );
}
